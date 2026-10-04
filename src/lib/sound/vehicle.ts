type Voice = { source: AudioBufferSourceNode; gain: GainNode; retiring: boolean };

/** A lazy, bounded vehicle lane on the site's existing audio context and master fader. */
export class VehicleSound {
  private readonly abort = new AbortController();
  private readonly voices = new Set<Voice>();
  private buffers: AudioBuffer[] = [];
  private loading: Promise<void> | undefined;
  private starter: Voice | undefined;
  private running: Voice | undefined;
  private moving = false;
  private available = false;
  private started = false;
  private disposed = false;
  private failed = false;
  private speed = 1;

  constructor(
    private readonly context: AudioContext,
    private readonly destination: AudioNode,
  ) {}

  request(moving: boolean, speed = 1) {
    this.moving = moving;
    this.speed = Math.max(1, Math.min(2, speed));
    this.sync();
  }

  setAvailable(available: boolean) {
    this.available = available;
    if (!available) this.stop(true);
    else this.sync();
  }

  dispose() {
    this.disposed = true;
    this.abort.abort();
    this.stop(true);
    this.buffers = [];
  }

  private sync() {
    if (this.disposed || this.failed) return;
    if (!this.moving) {
      this.stop(false);
      return;
    }
    if (!this.available || this.context.state !== "running") return;
    if (!this.buffers.length) {
      this.loading ??= Promise.all(
        ["start", "engine"].map(async (name) => {
          const response = await fetch(`/audio/delivery/${name}.mp3`, {
            signal: this.abort.signal,
          });
          if (!response.ok) throw new Error("Missing vehicle sound");
          return this.context.decodeAudioData(await response.arrayBuffer());
        }),
      )
        .then((buffers) => {
          if (this.disposed) return;
          this.buffers = buffers;
          this.sync(); // Recheck movement/mute after the asynchronous load.
        })
        .catch(() => {
          this.failed = true;
        });
      return;
    }
    if (!this.started) {
      this.started = true;
      this.starter = this.voice(this.buffers[0]!, false, 0.3);
      return;
    }
    if (this.starter) return;
    this.running ??= this.voice(this.buffers[1]!, true, 0.2);
    this.running.source.playbackRate.setTargetAtTime(
      1 + (this.speed - 1) * 0.18,
      this.context.currentTime,
      0.3,
    );
  }

  private voice(buffer: AudioBuffer, loop: boolean, level: number) {
    // Rapid stop/start gestures must not accumulate fading tails.
    if (this.voices.size >= 3) this.finish(this.voices.values().next().value!);
    const source = this.context.createBufferSource(),
      gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = loop;
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(level, this.context.currentTime + (loop ? 0.45 : 0.06));
    source.connect(gain);
    gain.connect(this.destination);
    const voice: Voice = { source, gain, retiring: false };
    this.voices.add(voice);
    source.onended = () => {
      const startLoop = voice === this.starter && !voice.retiring;
      if (voice === this.starter) this.starter = undefined;
      if (voice === this.running) this.running = undefined;
      this.finish(voice, false);
      if (startLoop) this.sync();
    };
    source.start();
    return voice;
  }

  private finish(voice: Voice, stop = true) {
    voice.source.onended = null;
    if (stop) voice.source.stop();
    voice.source.disconnect();
    voice.gain.disconnect();
    this.voices.delete(voice);
  }

  private stop(immediate: boolean) {
    for (const voice of this.voices) {
      if (immediate) this.finish(voice);
      else if (!voice.retiring) {
        voice.retiring = true;
        const now = this.context.currentTime,
          gain = voice.gain.gain;
        if (typeof gain.cancelAndHoldAtTime === "function") gain.cancelAndHoldAtTime(now);
        else {
          const value = gain.value;
          gain.cancelScheduledValues(now);
          gain.setValueAtTime(value, now);
        }
        gain.linearRampToValueAtTime(0, now + 0.28);
        voice.source.stop(now + 0.3);
      }
    }
    this.starter = this.running = undefined;
  }
}
