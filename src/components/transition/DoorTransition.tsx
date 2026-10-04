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
 * Leaving one location through its door: the door's light floods the screen, then the next
 * page opens and the light clears from it (see DoorArrival). A location is a page; its door is
 * a link, so the same move works by scroll, click, keyboard or without the effect at all.
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
        // Without storage the next page simply opens without its light.
      }
      play("transition");
      setLeaving(true);
      timer.current = setTimeout(() => router.push(href), reduced ? 0 : FLOOD_MS);
    },
    [play, reduced, router],
  );
  return { go, leaving };
}

/** The light the visitor walks into. */
export function DoorFlood({ active }: { active: boolean }) {
  return <div className="door-flood" data-state={active ? "in" : "out"} aria-hidden="true" />;
}

/** On the page behind the door: arrive in its light, which then clears. */
export function DoorArrival() {
  const flood = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = flood.current;
    let arrived = false;
    try {
      arrived = sessionStorage.getItem(ARRIVAL) === "door";
      sessionStorage.removeItem(ARRIVAL);
    } catch {
      // No storage, no arrival light.
    }
    // Strict Mode runs this twice; the second run finds the light already up.
    if (!element || !(arrived || element.dataset.state === "in")) return;
    // Set before the first paint, then cleared on the frame after, so the fade runs.
    element.dataset.state = "in";
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        element.dataset.state = "out";
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div
      ref={flood}
      className="door-flood door-flood--arrival"
      data-state="out"
      aria-hidden="true"
    />
  );
}
