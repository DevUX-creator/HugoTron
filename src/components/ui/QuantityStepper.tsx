"use client";

import { useTranslations } from "next-intl";
import "./quantityStepper.css";

type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  /** `sm` for a card's footer, `md` where it stands on its own. */
  size?: "sm" | "md";
};

/**
 * Quantity, as two buttons and a live value.
 *
 * EXTRACTED because this is the one control the shop needs in three places —
 * a card, a product page and the cart — and it had already been written twice
 * with the states drifting between copies. Everything commerce-shaped that
 * repeats belongs here rather than inside whichever section needed it first.
 *
 * Not an `<input type="number">`: the value only ever changes through these
 * two buttons, spinners are unstyleable across browsers, and a text field
 * invites a keyboard entry this has no validation for. The live region is what
 * a screen reader needs instead.
 */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}: QuantityStepperProps) {
  const t = useTranslations("cart");
  const step = (by: number) => onChange(Math.min(max, Math.max(min, value + by)));

  return (
    <div className={`qty qty--${size}`}>
      <button
        type="button"
        className="qty__step"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label={t("decrease")}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M3.5 8h9" />
        </svg>
      </button>

      <span className="qty__value" aria-live="polite" aria-atomic="true">
        <span className="visually-hidden">{t("quantity")}: </span>
        {value}
      </span>

      <button
        type="button"
        className="qty__step"
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label={t("increase")}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M8 3.5v9M3.5 8h9" />
        </svg>
      </button>
    </div>
  );
}
