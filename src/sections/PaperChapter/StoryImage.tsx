"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function StoryImage({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import("@/lib/gsap").then(({ gsap, registerGsapPlugins }) => {
      if (cancelled || !ref.current) return;
      registerGsapPlugins();
      const tween = gsap.fromTo(
        ref.current,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
      // The horizontal range above changes the document height after resize.
      // Remeasure after layout settles so the drift stays aligned on mobile too.
      let refreshFrame = 0;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => tween.scrollTrigger?.refresh());
      });
      observer.observe(document.body);
      if (ref.current.parentElement) observer.observe(ref.current.parentElement);
      cleanup = () => {
        cancelAnimationFrame(refreshFrame);
        observer.disconnect();
        tween.scrollTrigger?.kill();
        tween.revert();
      };
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced]);
  return (
    <div ref={ref} className="story-image">
      <Image src={src} alt={alt} fill sizes={sizes} />
    </div>
  );
}
