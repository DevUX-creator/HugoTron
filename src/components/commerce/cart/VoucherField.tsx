"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useVoucher } from "./useVoucher";
import "./summary.css";

/** Enter, apply and remove a voucher code. */
export default function VoucherField() {
  const t = useTranslations("commerce.cart");
  const errors = useTranslations("commerce.errors");
  const voucher = useVoucher();
  const [draft, setDraft] = useState("");
  const id = useId();
  if (voucher.code && !voucher.error) {
    return (
      <div className="voucher voucher--applied">
        <span>
          {t("voucherApplied")} <strong>{voucher.code}</strong>
          {voucher.voucher ? ` · ${voucher.voucher.label}` : ""}
        </span>
        <button type="button" className="commerce-link" onClick={voucher.remove}>
          {t("voucherRemove")}
        </button>
      </div>
    );
  }
  return (
    <form
      className="voucher"
      onSubmit={(event) => {
        event.preventDefault();
        if (draft.trim()) voucher.apply(draft);
      }}
    >
      <label htmlFor={id} className="voucher__label">
        {t("voucherLabel")}
      </label>
      <div className="voucher__row">
        <input
          id={id}
          value={draft || voucher.code}
          onChange={(event) => {
            setDraft(event.target.value);
            if (voucher.error) voucher.remove();
          }}
          autoComplete="off"
          aria-invalid={voucher.error ? true : undefined}
          aria-describedby={voucher.error ? `${id}-error` : undefined}
        />
        <button type="submit" className="commerce-button commerce-button--ghost">
          {t("voucherApply")}
        </button>
      </div>
      {voucher.error && (
        <p id={`${id}-error`} className="voucher__error" role="alert">
          {errors(voucher.error as Parameters<typeof errors>[0])}
        </p>
      )}
    </form>
  );
}
