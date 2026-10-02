"use client";

import { useLayoutEffect } from "react";

/** Keep the story's layout steady when an in-app browser resizes its whole webview. */
export function useHomeViewport() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const measure = document.createElement("div");
    measure.style.cssText =
      "position:fixed;inset:0 auto auto 0;width:0;height:100svh;visibility:hidden;pointer-events:none";
    measure.setAttribute("aria-hidden", "true");
    document.body.append(measure);
    let width = -1;
    const resize = () => {
      // Mobile browser bars can change even svh in an embedded webview. Only a
      // real width/orientation change should reflow thousands of pixels of story.
      if (innerWidth === width) return;
      width = innerWidth;
      if (width < 768) root.style.setProperty("--home-vh", `${measure.clientHeight / 100}px`);
      else root.style.removeProperty("--home-vh");
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      root.style.removeProperty("--home-vh");
      measure.remove();
    };
  }, []);
}
