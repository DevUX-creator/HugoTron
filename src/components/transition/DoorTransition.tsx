"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSound } from "@/components/sound/SoundProvider";
import { useReducedMotion } from "@/lib/useReducedMotion";
import "./doorTransition.css";

type Href = Parameters<ReturnType<typeof useRouter>["push"]>[0];

const ARRIVAL = "hugo:arrival";
const FLOOD_MS = 750;

/**
 * The dark doorway conceals the route change, then clears onto the next location.
 * Call after the scene has reached the threshold; links retain their native fallback.
 */
export function useDoorTransition() {
  const router = useRouter();
  const { play } = useSound();
  const reduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const go = useCallback(
    (href: Href) => {
      if (busy.current) return;
      busy.current = true;
      try {
        sessionStorage.setItem(ARRIVAL, "door");
      } catch {
        // Without storage the next page simply opens without the arrival fade.
      }
      play("transition");
      setLeaving(true);
      timer.current = setTimeout(() => router.push(href), reduced ? 0 : FLOOD_MS);
    },
    [play, reduced, router],
  );
  return { go, leaving };
}

/** The dark interior the visitor walks into. */
export function DoorFlood({ active }: { active: boolean }) {
  return <div className="door-flood" data-state={active ? "in" : "out"} aria-hidden="true" />;
}

/** On the page behind the door: the dark passage clears onto the new scene. */
export function DoorArrival({ ready = true }: { ready?: boolean }) {
  const flood = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = flood.current;
    let arrived = false;
    try {
      arrived = sessionStorage.getItem(ARRIVAL) === "door";
      sessionStorage.removeItem(ARRIVAL);
    } catch {
      // No storage, no arrival fade.
    }
    // Strict Mode runs this twice; the second run finds the overlay already up.
    if (!element || !(arrived || element.dataset.state === "in")) return;
    // Set before the first paint, then cleared on the frame after, so the fade runs.
    element.dataset.state = "in";
    if (!ready) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        element.dataset.state = "out";
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready]);
  return (
    <div
      ref={flood}
      className="door-flood door-flood--arrival"
      data-state="out"
      aria-hidden="true"
    />
  );
}
