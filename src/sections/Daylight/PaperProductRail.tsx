"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getProducts } from "@/lib/catalogue";
import RangeProductCard from "@/components/products/RangeProductCard";
import ArrowIcon from "@/components/ui/ArrowIcon";

const PRODUCTS = getProducts();

/** Native touch/trackpad scrolling, with mouse drag and keyboard-accessible paging. */
export default function PaperProductRail() {
  const t = useTranslations("paperStory.range");
  const rail = useRef<HTMLDivElement>(null);
  const id = useId();
  const [ends, setEnds] = useState({ start: true, end: false });
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    let frame = 0;
    let drag: { pointer: number; x: number; left: number; moved: boolean } | undefined;
    let suppressClick = false;
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
      if (
        event.pointerType !== "mouse" ||
        event.button !== 0 ||
        (event.target as HTMLElement).closest("button, a, input")
      )
        return;
      suppressClick = false;
      drag = { pointer: event.pointerId, x: event.clientX, left: element.scrollLeft, moved: false };
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
      element.scrollLeft = drag.left - distance;
    };
    const up = () => {
      if (drag?.moved) suppressClick = true;
      if (drag && element.hasPointerCapture(drag.pointer))
        element.releasePointerCapture(drag.pointer);
      drag = undefined;
      delete element.dataset.dragging;
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
    schedule();
    return () => {
      cancelAnimationFrame(frame);
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
    };
  }, []);
  const page = (direction: number) => {
    const element = rail.current;
    if (!element) return;
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
        role="region"
        aria-label={t("railLabel")}
        tabIndex={0}
      >
        {PRODUCTS.map((product, index) => (
          <RangeProductCard key={product.slug} product={product} index={index} />
        ))}
      </div>
    </>
  );
}
