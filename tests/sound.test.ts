import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SoundEngine } from "../src/lib/sound/engine";
import { SOUND_MIX } from "../src/lib/sound/manifest";

function fakeSource() {
  return {
    buffer: null,
    loop: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  };
}

function fakeGain() {
  return {
    gain: {
      value: 0,
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

class FakeContext {
  static current: FakeContext;
  state = "suspended";
  currentTime = 10;
  destination = {};
  sources: ReturnType<typeof fakeSource>[] = [];
  gains: ReturnType<typeof fakeGain>[] = [];
  constructor() {
    FakeContext.current = this;
  }
  resume = vi.fn(async () => {
    this.state = "running";
  });
  suspend = vi.fn(async () => {
    this.state = "suspended";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });
  decodeAudioData = vi.fn(async () => ({}));
  createGain() {
    const node = fakeGain();
    this.gains.push(node);
    return node;
  }
  createBufferSource() {
    const source = fakeSource();
    this.sources.push(source);
    return source;
  }
}

const response = () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
let engine: SoundEngine;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => response()),
  );
  engine = new SoundEngine(vi.fn());
});
afterEach(() => {
  engine.dispose();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("sound lifecycle", () => {
  it("downloads nothing and ignores cues before enable, then reuses decoded assets", async () => {
    engine.play("product");
    expect(fetch).not.toHaveBeenCalled();
    expect(FakeContext.current.sources).toHaveLength(0);
    await engine.enable();
    expect(fetch).toHaveBeenCalledTimes(5);
    expect(FakeContext.current.decodeAudioData).toHaveBeenCalledTimes(5);
    expect(FakeContext.current.sources.filter((source) => source.loop)).toHaveLength(1);
    engine.disable();
    await vi.advanceTimersByTimeAsync(160);
    expect(FakeContext.current.state).toBe("suspended");
    await engine.enable();
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it("fades in gradually but lets mute interrupt the entrance immediately", async () => {
    await engine.enable();
    const master = FakeContext.current.gains[0]!;
    expect(master.gain.value).toBe(0);
    expect(master.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      SOUND_MIX.level,
      10 + SOUND_MIX.fadeIn,
    );
    FakeContext.current.currentTime += 0.5;
    master.gain.value = 0.1;
    engine.disable();
    expect(master.gain.setValueAtTime).toHaveBeenLastCalledWith(0.1, 10.5);
    expect(master.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      0,
      10.5 + SOUND_MIX.fadeOut,
    );
    await vi.advanceTimersByTimeAsync(160);
    expect(FakeContext.current.sources[0]!.stop).toHaveBeenCalledOnce();
    expect(FakeContext.current.state).toBe("suspended");
  });

  it("does not start delayed sounds when muted during loading", async () => {
    let release!: (value: ReturnType<typeof response>) => void;
    const pending = new Promise<ReturnType<typeof response>>((resolve) => {
      release = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => pending),
    );
    const enabling = engine.enable();
    engine.disable();
    release(response());
    expect(await enabling).toBe(false);
    await vi.advanceTimersByTimeAsync(160);
    expect(FakeContext.current.sources).toHaveLength(0);
    expect(FakeContext.current.state).toBe("suspended");
  });

  it("pauses hidden tabs and never restores audio after the user mutes", async () => {
    await engine.enable();
    engine.setVisible(false);
    expect(FakeContext.current.state).toBe("suspended");
    const count = FakeContext.current.sources.length;
    engine.play("product");
    expect(FakeContext.current.sources).toHaveLength(count);
    engine.setVisible(true);
    await Promise.resolve();
    expect(FakeContext.current.state).toBe("running");
    engine.disable();
    await vi.advanceTimersByTimeAsync(160);
    engine.setVisible(false);
    engine.setVisible(true);
    expect(FakeContext.current.state).toBe("suspended");
  });

  it("limits rapid previews and suppresses a redundant hover after a product change", async () => {
    await engine.enable();
    engine.play("product");
    engine.play("product");
    engine.play("hover");
    expect(FakeContext.current.sources).toHaveLength(2);
    FakeContext.current.currentTime += 0.6;
    engine.play("hover");
    expect(FakeContext.current.sources).toHaveLength(3);
  });

  it("can retry a failed download without leaving sound enabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false })),
    );
    await expect(engine.enable()).rejects.toThrow();
    expect(engine.enabled).toBe(false);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response()),
    );
    expect(await engine.enable()).toBe(true);
  });

  it("prioritizes cart confirmation over effect tails and keeps it silent while muted", async () => {
    await engine.enable();
    engine.play("product");
    engine.play("click");
    engine.play("transition");
    expect(FakeContext.current.sources).toHaveLength(4);
    engine.play("cart");
    expect(FakeContext.current.sources).toHaveLength(5);
    expect(FakeContext.current.sources[1]!.stop).toHaveBeenCalledOnce();
    expect(FakeContext.current.sources[0]!.stop).not.toHaveBeenCalled();
    engine.play("cart");
    engine.play("hover");
    expect(FakeContext.current.sources).toHaveLength(5);
    engine.disable();
    FakeContext.current.currentTime += 1;
    engine.play("click");
    engine.play("cart");
    expect(FakeContext.current.sources).toHaveLength(5);
  });

  it("closes and aborts cleanly when disposed during loading", async () => {
    let release!: (value: ReturnType<typeof response>) => void;
    const pending = new Promise<ReturnType<typeof response>>((resolve) => {
      release = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => pending),
    );
    const enabling = engine.enable();
    engine.dispose();
    release(response());
    expect(await enabling).toBe(false);
    expect(FakeContext.current.state).toBe("closed");
    expect(FakeContext.current.sources).toHaveLength(0);
    engine.dispose();
    expect(FakeContext.current.close).toHaveBeenCalledTimes(1);
  });
});
