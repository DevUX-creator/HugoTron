"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useEngraving } from "@/components/media/useEngraving";

/** Decorative living engraving. No download or decoding until this chapter is nearby. */
export default function HarbourFilm({ ink }: { ink: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // A lighter engraving than the range film: finer, airier strokes and no cross-hatching.
  useEngraving(frame, "video", { weight: 0.62, cross: 0, pitchPx: 4.4 });
  useEffect(() => {
    const media = video.current;
    const group = media?.closest<HTMLElement>("[data-story-group]");
    if (!media || !group) return;
    const sync = () => {
      if (group.dataset.active === "true" && !document.hidden && !reduced) {
        if (!media.getAttribute("src")) media.src = "/videos/paper-hamburg.mp4";
        if (media.paused) void media.play().catch(() => {});
      } else media.pause();
    };
    const observer = new MutationObserver(sync);
    observer.observe(group, { attributes: true, attributeFilter: ["data-active"] });
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      media.pause();
      media.removeAttribute("src");
      media.load();
    };
  }, [reduced]);
  return (
    <div className="story-harbour-film story-layer in-up out-left story-layer--depart-left">
      <div ref={frame} className="story-layer__motion engraved-film">
        <video
          ref={video}
          muted
          loop
          playsInline
          preload="none"
          poster="/images/paper-world/hamburg-film.webp"
          style={{ filter: `url(#${ink})` }}
        />
      </div>
    </div>
  );
}
