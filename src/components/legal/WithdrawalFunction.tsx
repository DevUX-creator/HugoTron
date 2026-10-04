"use client";

import { useId, useState, useTransition } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { submitWithdrawal } from "@/commerce/withdrawal/actions";
import type { WithdrawalReceipt } from "@/commerce/types";
import StatusMessage from "@/components/commerce/feedback/StatusMessage";

/**
 * „Vertrag widerrufen“ (§ 356a BGB): name, order and email, then a review with the
 * „Widerruf bestätigen“ button, then the receipt with date and time on screen. The backend
 * sends the same receipt by email (the durable medium the law requires).
 */
export default function WithdrawalFunction({
  orderReference,
  email,
  name,
}: {
  orderReference: string;
  email: string;
  name: string;
}) {
  const t = useTranslations("withdrawalFunction");
  const format = useFormatter();
  const locale = useLocale();
  const id = useId();
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const [values, setValues] = useState({ name, email, orderReference, scope: "all", items: "" });
  const [error, setError] = useState<"invalid" | "rateLimited" | "generic" | null>(null);
  const [receipt, setReceipt] = useState<WithdrawalReceipt | null>(null);
  const [pending, start] = useTransition();
  const set = (key: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));
  const declaration = {
    name: values.name.trim(),
    email: values.email.trim(),
    orderReference: values.orderReference.trim(),
    items: values.scope === "all" ? "" : values.items.trim(),
    locale,
  };
  const facts = (data: { name: string; email: string; orderReference: string; items: string }) => (
    <dl className="withdrawal__facts">
      <dt>{t("name")}</dt>
      <dd>{data.name}</dd>
      <dt>{t("order")}</dt>
      <dd>{data.orderReference}</dd>
      <dt>{t("scope")}</dt>
      <dd>{data.items || t("scopeAll")}</dd>
      <dt>{t("email")}</dt>
      <dd>{data.email}</dd>
    </dl>
  );

  if (step === "done" && receipt) {
    return (
      <div className="withdrawal commerce-panel">
        <StatusMessage tone="success" compact title={t("doneTitle")}>
          <p>
            {t("done", {
              date: format.dateTime(new Date(receipt.receivedAt), {
                dateStyle: "long",
                timeStyle: "medium",
              }),
              email: receipt.email,
            })}
          </p>
        </StatusMessage>
        <p className="withdrawal__statement">{t("statement")}</p>
        {facts(receipt)}
        <button
          type="button"
          className="commerce-button commerce-button--ghost"
          onClick={() => window.print()}
        >
          {t("print")}
        </button>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="withdrawal commerce-panel">
        <p className="withdrawal__statement">{t("statement")}</p>
        {facts(declaration)}
        {error && <StatusMessage tone="error" compact title={t(`errors.${error}`)} />}
        <div className="withdrawal__actions">
          <button
            type="button"
            className="commerce-button"
            disabled={pending}
            aria-busy={pending}
            onClick={() =>
              start(async () => {
                setError(null);
                const result = await submitWithdrawal(declaration);
                if (result.ok) {
                  setReceipt(result.receipt);
                  setStep("done");
                } else setError(result.error);
              })
            }
          >
            {t("confirm")}
          </button>
          <button
            type="button"
            className="commerce-link withdrawal__back"
            onClick={() => setStep("form")}
          >
            {t("back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="withdrawal commerce-panel"
      onSubmit={(event) => {
        event.preventDefault();
        setStep("review");
      }}
    >
      <p>{t("intro")}</p>
      <div className="commerce-fields">
        <div className="commerce-field">
          <label htmlFor={`${id}-name`}>{t("name")}</label>
          <input
            id={`${id}-name`}
            required
            autoComplete="name"
            value={values.name}
            onChange={set("name")}
          />
        </div>
        <div className="commerce-field">
          <label htmlFor={`${id}-order`}>{t("order")}</label>
          <input
            id={`${id}-order`}
            required
            value={values.orderReference}
            onChange={set("orderReference")}
            aria-describedby={`${id}-order-hint`}
          />
          <span id={`${id}-order-hint`} className="commerce-field__hint">
            {t("orderHint")}
          </span>
        </div>
        <div className="commerce-field commerce-field--wide">
          <label htmlFor={`${id}-email`}>{t("email")}</label>
          <input
            id={`${id}-email`}
            type="email"
            required
            autoComplete="email"
            value={values.email}
            onChange={set("email")}
            aria-describedby={`${id}-email-hint`}
          />
          <span id={`${id}-email-hint`} className="commerce-field__hint">
            {t("emailHint")}
          </span>
        </div>
      </div>
      <fieldset className="withdrawal__scope">
        <legend>{t("scope")}</legend>
        <label className="commerce-check">
          <input
            type="radio"
            name="scope"
            value="all"
            checked={values.scope === "all"}
            onChange={set("scope")}
          />
          {t("scopeAll")}
        </label>
        <label className="commerce-check">
          <input
            type="radio"
            name="scope"
            value="part"
            checked={values.scope === "part"}
            onChange={set("scope")}
          />
          {t("scopePart")}
        </label>
        {values.scope === "part" && (
          <div className="commerce-field">
            <label htmlFor={`${id}-items`}>{t("items")}</label>
            <textarea id={`${id}-items`} required value={values.items} onChange={set("items")} />
          </div>
        )}
      </fieldset>
      <button type="submit" className="commerce-button">
        {t("start")}
      </button>
    </form>
  );
}
