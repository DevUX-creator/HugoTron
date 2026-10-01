"use client";

import { useEffect } from "react";
import "./cursor.css";

/** Resting diameter of the circle, in px. */
const SIZE = 26;
/** How much of the remaining distance is covered each frame. 1 = no lag. */
const EASE = 0.18;
/** Breathing room the pill leaves around a word it wraps, in px. */
const PAD_X = 14;
const PAD_Y = 8;

/** Anything carrying this attribute is wrapped instead of followed. */
const TARGET = "[data-cursor='wrap']";

/**
 * The pointer, as a circle — and as a pill around whatever it is over.
 *
 * Free, it is a small circle trailing the pointer by a frame or two. Over an
 * element marked `data-cursor="wrap"` it stops following and becomes that
 * element's own shape: it takes the label's box plus a little air, so the word
 * sits inside it. Leaving, it collapses back to a circle wherever the pointer
 * now is.
 *
 * IT DOES NOT REPLACE THE POINTER, IT JOINS IT. The native cursor stays
 * visible. Hiding it is the convention, and it is a bad one: a 26px circle
 * lagging two frames behind is a worse aiming device than the arrow the
 * operating system drew, and on a page whose links are 12px tall that costs
 * real clicks. The circle is decoration around the pointer, not a stand-in
 * for it.
 *
 * MOUSE ONLY. A touch screen has no hover and no persistent pointer, so the
 * whole thing is gated on a fine pointer — see cursor.css, which also carries
 * the reduced-motion branch that removes the lag.
 *
 * The element is `aria-hidden` and never focusable: there is nothing here for
 * a screen reader, and it is not a control.
 */
export default function Cursor() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;

    const node = document.createElement("div");
    node.className = "cursor";
    node.setAttribute("aria-hidden", "true");
    document.body.appendChild(node);

    /* Where the pointer is, and where the circle has got to. They are separate
       on purpose — the gap between them IS the lag. */
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let x = pointerX;
    let y = pointerY;

    let target: HTMLElement | null = null;
    let frame = 0;
    let visible = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    /** The box the circle is currently heading for. */
    const goal = () => {
      if (!target) {
        return { cx: pointerX, cy: pointerY, w: SIZE, h: SIZE };
      }
      const rect = target.getBoundingClientRect();
      return {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
        w: rect.width + PAD_X * 2,
        h: rect.height + PAD_Y * 2,
      };
    };

    const render = () => {
      frame = 0;
      const { cx, cy, w, h } = goal();

      /* Position is eased every frame; SIZE is not — the stretch into a pill
         is a CSS transition, so the shape change has its own curve and does
         not have to be reimplemented here. */
      const ease = reduced.matches ? 1 : EASE;
      x += (cx - x) * ease;
      y += (cy - y) * ease;

      node.style.setProperty("--cursor-x", `${x}px`);
      node.style.setProperty("--cursor-y", `${y}px`);
      node.style.setProperty("--cursor-w", `${w}px`);
      node.style.setProperty("--cursor-h", `${h}px`);

      /* Keep going while there is distance to close, or while wrapped — a
         wrapped target can move under the page's own scroll. */
      if (target || Math.abs(cx - x) > 0.1 || Math.abs(cy - y) > 0.1) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!visible) {
        visible = true;
        node.classList.add("is-visible");
        /* Jump to the pointer the first time rather than sweeping in from the
           middle of the screen. */
        x = pointerX;
        y = pointerY;
      }
      wake();
    };

    /* `pointerover`/`pointerout` bubble, so one listener covers every target
       on the page — including ones added later, which a per-element listener
       would miss. */
    const onOver = (event: PointerEvent) => {
      const hit = (event.target as Element | null)?.closest?.(TARGET);
      if (!(hit instanceof HTMLElement) || hit === target) return;
      target = hit;
      node.classList.add("is-wrapping");
      wake();
    };

    const onOut = (event: PointerEvent) => {
      if (!target) return;
      const to = event.relatedTarget as Element | null;
      /* Moving between children of the same target is not leaving it. */
      if (to?.closest?.(TARGET) === target) return;
      target = null;
      node.classList.remove("is-wrapping");
      wake();
    };

    const onLeave = () => {
      visible = false;
      target = null;
      node.classList.remove("is-visible", "is-wrapping");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    document.addEventListener("pointerleave", onLeave, { passive: true });
    /* A wrapped pill has to keep up with the element under it. */
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      if (frame) window.cancelAnimationFrame(frame);
      node.remove();
    };
  }, []);

  return null;
}
