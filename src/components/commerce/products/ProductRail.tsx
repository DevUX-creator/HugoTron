"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import ArrowIcon from "@/components/ui/ArrowIcon";

/** Native touch/trackpad scrolling, with mouse drag and keyboard-accessible paging. */
export default function ProductRail({ items }: { items: readonly ReactNode[] }) {
  const t = useTranslations("paperStory.range");
  const rail = useRef<HTMLDivElement>(null);
  const cancelGlide = useRef(() => {});
  const id = useId();
  const [ends, setEnds] = useState({ start: true, end: false });
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    let frame = 0;
    let glide = 0;
    let drag:
      | {
          pointer: number;
          x: number;
          left: number;
          moved: boolean;
          lastX: number;
          time: number;
          velocity: number;
        }
      | undefined;
    let suppressClick = false;
    const stopGlide = () => {
      cancelAnimationFrame(glide);
      glide = 0;
    };
    cancelGlide.current = stopGlide;
    const coast = (speed: number) => {
      let previous = performance.now();
      let velocity = Math.max(-2.4, Math.min(2.4, speed));
      const tick = (now: number) => {
        glide = 0;
        if (document.hidden) return;
        const delta = Math.min(now - previous, 32);
        previous = now;
        const before = element.scrollLeft;
        element.scrollLeft += velocity * delta;
        velocity *= Math.exp(-delta / 220);
        if (Math.abs(velocity) > 0.02 && Math.abs(element.scrollLeft - before) > 0.1)
          glide = requestAnimationFrame(tick);
      };
      glide = requestAnimationFrame(tick);
    };
    const update = () => {
      frame = 0;
      const start = element.scrollLeft < 2;
      const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
      setEnds((previous) =>
        previous.start === start && previous.end === end ? previous : { start, end },
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const down = (event: PointerEvent) => {
      stopGlide();
      if (
        event.pointerType !== "mouse" ||
        event.button !== 0 ||
        (event.target as HTMLElement).closest("button, a, input")
      )
        return;
      suppressClick = false;
      drag = {
        pointer: event.pointerId,
        x: event.clientX,
        left: element.scrollLeft,
        moved: false,
        lastX: event.clientX,
        time: event.timeStamp,
        velocity: 0,
      };
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const distance = event.clientX - drag.x;
      if (!drag.moved && Math.abs(distance) < 5) return;
      if (!drag.moved) {
        drag.moved = true;
        element.setPointerCapture(event.pointerId);
        element.dataset.dragging = "true";
      }
      event.preventDefault();
      const velocity = (drag.lastX - event.clientX) / Math.max(8, event.timeStamp - drag.time);
      drag.velocity = drag.velocity * 0.3 + velocity * 0.7;
      drag.lastX = event.clientX;
      drag.time = event.timeStamp;
      element.scrollLeft = drag.left - distance;
    };
    const up = (event?: PointerEvent) => {
      const released = drag;
      drag = undefined;
      if (released?.moved) suppressClick = true;
      if (released && element.hasPointerCapture(released.pointer))
        element.releasePointerCapture(released.pointer);
      delete element.dataset.dragging;
      if (
        released?.moved &&
        event?.type === "pointerup" &&
        event.timeStamp - released.time < 100 &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        coast(released.velocity);
    };
    const click = (event: MouseEvent) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    };
    const preventImageDrag = (event: DragEvent) => event.preventDefault();
    const leave = () => {
      if (!drag?.moved) up();
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    element.addEventListener("scroll", schedule, { passive: true });
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("lostpointercapture", up);
    element.addEventListener("click", click, true);
    element.addEventListener("dragstart", preventImageDrag);
    element.addEventListener("wheel", stopGlide, { passive: true });
    document.addEventListener("visibilitychange", stopGlide);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      stopGlide();
      cancelGlide.current = () => {};
      resize.disconnect();
      element.removeEventListener("scroll", schedule);
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("lostpointercapture", up);
      element.removeEventListener("click", click, true);
      element.removeEventListener("dragstart", preventImageDrag);
      element.removeEventListener("wheel", stopGlide);
      document.removeEventListener("visibilitychange", stopGlide);
    };
  }, []);
  const page = (direction: number) => {
    const element = rail.current;
    if (!element) return;
    cancelGlide.current();
    const card = element.querySelector<HTMLElement>(".range-product");
    const step = (card?.offsetWidth ?? 320) + parseFloat(getComputedStyle(element).columnGap);
    element.scrollBy({
      left: direction * step * Math.max(1, Math.floor(element.clientWidth / step) - 1),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };
  return (
    <>
      <div className="paper-range__navigation">
        <p className="paper-caption">{t("note")}</p>
        <div>
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              aria-label={t(direction === -1 ? "previous" : "next")}
              aria-controls={id}
              disabled={direction === -1 ? ends.start : ends.end}
              onClick={() => page(direction)}
            >
              <span style={{ rotate: direction === -1 ? "180deg" : undefined }}>
                <ArrowIcon />
              </span>
            </button>
          ))}
        </div>
      </div>
      <div
        ref={rail}
        id={id}
        className="paper-range__rail"
        data-lenis-prevent-touch
        data-lenis-prevent-horizontal
        role="region"
        aria-label={t("railLabel")}
        tabIndex={0}
      >
        {items}
      </div>
    </>
  );
}
