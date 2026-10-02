"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** A small window back into the World, created only when the footer approaches. */
export default function PaperPortal() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let cancelled = false;
    let visible = false;
    let starting = false;
    let scene:
      Awaited<ReturnType<(typeof import("./portalScene"))["createPortalScene"]>> | undefined;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible && !scene && !starting) {
          starting = true;
          try {
            const { createPortalScene } = await import("./portalScene");
            if (cancelled) return;
            scene = await createPortalScene(element, reduced);
            if (cancelled) {
              scene?.dispose();
              return;
            }
          } catch {
            /* The CSS cube remains when WebGL is unavailable. */
            if (!cancelled) element.dataset.fallback = "true";
          }
        }
        scene?.setVisible(visible);
      },
      { rootMargin: "120px" },
    );
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
      scene?.dispose();
      delete element.dataset.fallback;
    };
  }, [reduced]);
  return (
    <div className="paper-portal" ref={root} aria-hidden="true">
      <div className="paper-portal__opening">
        <div className="paper-portal__fallback">
          <span>HUGO TRON</span>
        </div>
        <div className="paper-portal__canvas" />
      </div>
    </div>
  );
}
