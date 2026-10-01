"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SoundEngine } from "@/lib/sound/engine";
import type { SoundCue } from "@/lib/sound/manifest";
import {
  readSoundPreference,
  subscribeSoundPreference,
  writeSoundPreference,
} from "@/lib/sound/preference";

type Status = "off" | "armed" | "loading" | "on" | "unavailable";
type Playback = "idle" | "loading" | "on" | "unavailable";
type SoundContextValue = { status: Status; toggle: () => void; play: (cue: SoundCue) => void };
const SoundContext = createContext<SoundContextValue | null>(null);
const serverPreference = () => true;

/** Default-on sound waits for a trusted gesture; explicit mute is remembered. */
export default function SoundProvider({ children }: { children: ReactNode }) {
  const engine = useRef<SoundEngine | null>(null);
  const automaticAttempted = useRef(false);
  const preferred = useSyncExternalStore(
    subscribeSoundPreference,
    readSoundPreference,
    serverPreference,
  );
  const [playback, setPlayback] = useState<Playback>("idle");
  const status: Status = !preferred ? "off" : playback === "idle" ? "armed" : playback;
  const play = useCallback((cue: SoundCue) => engine.current?.play(cue), []);
  const start = useCallback(() => {
    try {
      engine.current ??= new SoundEngine(() => setPlayback("unavailable"));
      const current = engine.current;
      if (current.enabled) return;
      current.setVisible(!document.hidden);
      setPlayback("loading");
      void current
        .enable()
        .then((started) => {
          if (engine.current === current && started) setPlayback("on");
        })
        .catch(() => {
          if (engine.current === current) setPlayback("unavailable");
        });
    } catch {
      setPlayback("unavailable");
    }
  }, []);
  const toggle = useCallback(() => {
    if (readSoundPreference() && playback !== "unavailable") {
      writeSoundPreference(false);
      engine.current?.disable();
      setPlayback("idle");
      return;
    }
    writeSoundPreference(true);
    automaticAttempted.current = true;
    start();
  }, [playback, start]);

  useEffect(() => {
    const activate = (event: PointerEvent | KeyboardEvent) => {
      if (!event.isTrusted || !readSoundPreference() || automaticAttempted.current) return;
      if (event instanceof PointerEvent && (!event.isPrimary || event.button !== 0)) return;
      if (event instanceof KeyboardEvent && (event.repeat || !["Enter", " "].includes(event.key)))
        return;
      // The mute button's first interaction must silence the preference, never start playback.
      if (event.target instanceof Element && event.target.closest(".sound-toggle")) return;
      automaticAttempted.current = true;
      start();
    };
    const unsubscribe = subscribeSoundPreference(() => {
      if (!readSoundPreference()) {
        automaticAttempted.current = false;
        engine.current?.disable();
        setPlayback("idle");
      }
    });
    document.addEventListener("pointerup", activate);
    document.addEventListener("keydown", activate);
    return () => {
      unsubscribe();
      document.removeEventListener("pointerup", activate);
      document.removeEventListener("keydown", activate);
    };
  }, [start]);

  useEffect(() => {
    const visibility = () => engine.current?.setVisible(!document.hidden);
    const hide = () => engine.current?.setVisible(false);
    const hover = (event: PointerEvent | FocusEvent) => {
      if (event instanceof PointerEvent && event.pointerType === "touch") return;
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest("[data-sound-hover]");
      if (!target || target.matches(":disabled, [aria-disabled='true']")) return;
      if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;
      play("hover");
    };
    const click = (event: MouseEvent) => {
      if (!event.isTrusted || !(event.target instanceof Element)) return;
      const target = event.target.closest("button, a[href], summary, [role='button']");
      if (
        !target ||
        target.matches(":disabled, [aria-disabled='true'], .sound-toggle") ||
        target.closest("[inert], [data-sound-click='none']")
      )
        return;
      play("click");
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", visibility);
    document.addEventListener("pointerover", hover);
    document.addEventListener("focusin", hover);
    // Check the enabled state before React handlers can disable a completed control.
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", visibility);
      document.removeEventListener("pointerover", hover);
      document.removeEventListener("focusin", hover);
      document.removeEventListener("click", click, true);
      engine.current?.dispose();
      engine.current = null;
    };
  }, [play]);

  const value = useMemo(() => ({ status, toggle, play }), [status, toggle, play]);
  return <SoundContext value={value}>{children}</SoundContext>;
}

export function useSound() {
  const value = useContext(SoundContext);
  if (!value) throw new Error("useSound must be used within SoundProvider");
  return value;
}
