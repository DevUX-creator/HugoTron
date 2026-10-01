"use client";

import { useEffect, type RefObject } from "react";
import { useSound } from "./SoundProvider";

/** One quiet cue when a new chapter enters; never on mount, resize or every scroll tick. */
export function useChapterSound(ref: RefObject<HTMLElement | null>) {
  const { play } = useSound();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let initial = true;
    let scrolled = false;
    const scroll = () => {
      scrolled = true;
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          if (!initial && scrolled) play("transition");
          observer.disconnect();
          window.removeEventListener("scroll", scroll);
        }
        initial = false;
      },
      { rootMargin: "0px 0px -25% 0px", threshold: 0 },
    );
    observer.observe(element);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scroll);
    };
  }, [ref, play]);
}
