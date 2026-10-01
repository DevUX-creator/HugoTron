"use client";

import { useEffect, useRef, type CSSProperties, type ElementType } from "react";
import "./scrollWords.css";

/**
 * Text that inks in word by word as it scrolls through the viewport, then stays.
 * One custom property drives every word, so scrolling costs a single style write per frame.
 * `controlled`: a pinned stage sets `--reveal` on an ancestor instead (the text never moves).
 */
export default function ScrollWords({
  text,
  as: Tag = "p",
  className,
  id,
  controlled = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
  controlled?: boolean;
}) {
  const element = useRef<HTMLElement>(null);
  const words = text.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const node = element.current;
    if (!node || controlled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      const height = window.innerHeight;
      // From the moment its top passes 85% of the viewport until its bottom reaches 55%.
      const progress = (height * 0.85 - box.top) / (box.height + height * 0.3);
      node.style.setProperty("--reveal", String(Math.max(0, Math.min(1, progress))));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [controlled]);

  return (
    <Tag
      ref={element}
      id={id}
      className={["scroll-words", className].filter(Boolean).join(" ")}
      style={{ "--count": words.length } as CSSProperties}
    >
      {words.map((word, index) => (
        <span key={index} style={{ "--i": index } as CSSProperties}>
          {word}{" "}
        </span>
      ))}
    </Tag>
  );
}
