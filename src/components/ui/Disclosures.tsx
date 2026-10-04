"use client";

import { useId, useState } from "react";
import "./disclosures.css";

type Item = { question: string; answer: string };

/**
 * Questions that open smoothly: each heading holds a button that expands its answer by easing
 * the panel's height (grid rows), rather than snapping as <details> does. Closed answers stay
 * in the HTML for search, and are inert so keyboard and screen readers skip them.
 */
export default function Disclosures({ items }: { items: readonly Item[] }) {
  const id = useId();
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(index)) next.add(index);
      return next;
    });
  return (
    <div className="disclosures">
      {items.map((item, index) => {
        const expanded = open.has(index);
        return (
          <div key={index} className="disclosure" data-open={expanded || undefined}>
            <h3>
              <button
                type="button"
                id={`${id}-q${index}`}
                aria-expanded={expanded}
                aria-controls={`${id}-a${index}`}
                onClick={() => toggle(index)}
              >
                <span>{item.question}</span>
                <span className="disclosure__icon" aria-hidden="true" />
              </button>
            </h3>
            <div
              className="disclosure__panel"
              id={`${id}-a${index}`}
              role="region"
              aria-labelledby={`${id}-q${index}`}
              inert={!expanded}
            >
              <div>
                <p>{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
