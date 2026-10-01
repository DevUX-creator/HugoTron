import { SOUND_ASSETS, SOUND_MIX, type SoundCue } from "./manifest";

type Voice = { source: AudioBufferSourceNode; gain: GainNode };

/** One context per document. No audio downloads or processing before a trusted gesture. */
export class SoundEngine {
  private readonly context: AudioContext;
  private readonly master: GainNode;
  private readonly abort = new AbortController();
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly voices = new Set<Voice>();
  private readonly lastPlayed = new Map<SoundCue, number>();
  private loading: Promise<void> | undefined;
  private ambient: Voice | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private visible = true;
  private disposed = false;
  private revision = 0;
  enabled = false;

  constructor(private readonly onError: () => void) {
    // Constructed synchronously inside a trusted gesture, including on iOS.
    this.context = new AudioContext({ latencyHint: "interactive" });
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.context.destination);
  }

  async enable() {
    if (this.disposed) return false;
    const revision = ++this.revision;
    this.enabled = true;
    clearTimeout(this.timer);
    // Resume immediately in the trusted gesture, before awaiting network/decode work.
    const resumed = this.context.resume();
    try {
      await Promise.all([resumed, this.load()]);
      if (this.disposed || revision !== this.revision || !this.enabled) return false;
      if (this.visible) this.start();
      else this.silence(true);
      return true;
    } catch {
      if (this.disposed || revision !== this.revision) return false;
      this.disable();
      throw new Error("Sound could not start");
    }
  }

  disable() {
    this.enabled = false;
    ++this.revision;
    this.silence();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (this.disposed || !this.enabled) return;
    if (!visible) {
      this.silence(true);
      return;
    }
    clearTimeout(this.timer);
    void this.context
      .resume()
      .then(() => {
        if (this.enabled && this.visible && !this.disposed) this.start();
      })
      .catch(() => {
        if (this.disposed || !this.enabled) return;
        this.disable();
        this.onError();
      });
  }

  play(cue: SoundCue) {
    if (!this.enabled || !this.visible || this.disposed || this.context.state !== "running") return;
    const buffer = this.buffers.get(cue);
    if (!buffer) return; // Never queue stale interactions while assets load.
    const now = this.context.currentTime;
    const config = SOUND_ASSETS[cue];
    if (now - (this.lastPlayed.get(cue) ?? -Infinity) < config.cooldown) return;
    // Don't add a hover tail immediately after an action's own feedback.
    if (
      cue === "hover" &&
      (["product", "click", "cart"] as const).some(
        (action) => now - (this.lastPlayed.get(action) ?? -Infinity) < 0.5,
      )
    )
      return;
    // At most three effect tails in addition to the ambient bed.
    if (this.voices.size >= 4) {
      if (cue !== "cart") return;
      // A successful purchase action takes priority over a lingering interaction effect.
      const oldest = [...this.voices].find((voice) => voice !== this.ambient);
      if (oldest) {
        oldest.source.onended = null;
        oldest.source.stop();
        oldest.source.disconnect();
        oldest.gain.disconnect();
        this.voices.delete(oldest);
      }
    }
    this.lastPlayed.set(cue, now);
    this.voice(buffer, config.gain);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.enabled = false;
    ++this.revision;
    this.abort.abort();
    clearTimeout(this.timer);
    this.stopVoices();
    this.buffers.clear();
    this.master.disconnect();
    void this.context.close().catch(() => {});
  }

  private load() {
    const downloads = new Map<string, Promise<AudioBuffer>>();
    this.loading ??= Promise.all(
      Object.entries(SOUND_ASSETS).map(async ([name, config]) => {
        if (this.buffers.has(name)) return;
        let download = downloads.get(config.src);
        if (!download) {
          download = fetch(config.src, { signal: this.abort.signal }).then(async (response) => {
            if (!response.ok) throw new Error("Missing sound asset");
            return this.context.decodeAudioData(await response.arrayBuffer());
          });
          downloads.set(config.src, download);
        }
        const buffer = await download;
        if (!this.disposed) this.buffers.set(name, buffer);
      }),
    )
      .then(() => {})
      .catch((error: unknown) => {
        this.loading = undefined;
        throw error;
      });
    return this.loading;
  }

  private voice(buffer: AudioBuffer, level: number, loop = false) {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = loop;
    gain.gain.value = level;
    source.connect(gain);
    gain.connect(this.master);
    const voice = { source, gain };
    this.voices.add(voice);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.voices.delete(voice);
    };
    source.start();
    return voice;
  }

  private start() {
    const buffer = this.buffers.get("ambience");
    if (!buffer) return;
    if (!this.ambient) this.ambient = this.voice(buffer, SOUND_ASSETS.ambience.gain, true);
    this.fade(SOUND_MIX.level, SOUND_MIX.fadeIn);
  }

  private fade(level: number, duration: number) {
    const { gain } = this.master;
    const now = this.context.currentTime;
    if (typeof gain.cancelAndHoldAtTime === "function") gain.cancelAndHoldAtTime(now);
    else {
      const current = gain.value;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(current, now);
    }
    gain.linearRampToValueAtTime(level, now + duration);
  }

  private silence(immediate = false) {
    clearTimeout(this.timer);
    if (this.disposed) return;
    this.fade(0, immediate ? 0 : SOUND_MIX.fadeOut);
    const stop = () => {
      if (this.disposed || (this.enabled && this.visible)) return;
      this.stopVoices();
      void this.context.suspend().catch(() => {});
    };
    if (immediate) stop();
    else this.timer = setTimeout(stop, 150);
  }

  private stopVoices() {
    for (const { source, gain } of this.voices) {
      source.onended = null;
      source.stop();
      source.disconnect();
      gain.disconnect();
    }
    this.voices.clear();
    this.ambient = undefined;
  }
}
