"use client";

import { useActionState, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import { CONTACT } from "@/content/site";
import {
  ENQUIRY_INITIAL_STATE,
  submitEnquiry,
  type EnquiryState,
} from "@/app/[locale]/enquiry/actions";
import Field from "./Field";
import "./form.css";

/** The five details the FAQ already tells a buyer to send. */
const ORDER_FIELDS = [
  { name: "product", hint: true },
  { name: "quantity", hint: true },
  { name: "packSize", hint: true },
  { name: "postcode", hint: true },
  { name: "date", hint: false, type: "date" },
] as const;

const PURPOSES = ["quote", "sample", "label", "other"] as const;

/**
 * The enquiry form.
 *
 * IT EXISTS BECAUSE THE FAQ ALREADY SPECIFIED IT. "Send the product, quantity,
 * preferred pack size, delivery postcode and target date" was a form written
 * out as prose, sitting next to a `mailto:` that made the buyer retype it from
 * memory into a blank window. Those five fields are the ones below, in that
 * order, and the rest of the form is just how to reach them afterwards.
 *
 * `useActionState` keeps the whole thing working before hydration: the
 * `<form action>` posts to the Server Action either way, so a visitor on a
 * slow connection who submits early gets a full page round-trip instead of an
 * error. Pending state and inline errors are the enhancement, not the
 * mechanism.
 */
export default function EnquiryForm({
  initialProduct = "",
  initialPackSize = "",
}: {
  initialProduct?: string;
  initialPackSize?: string;
}) {
  const t = useTranslations("enquiry");
  const locale = useLocale();
  const uid = useId();
  const optional = { text: t("optional"), required: false };

  const [state, formAction, pending] = useActionState<EnquiryState, FormData>(
    submitEnquiry,
    ENQUIRY_INITIAL_STATE,
  );
  const typed = (name: string, fallback = "") => ({
    defaultValue: state.values?.[name] ?? fallback,
  });

  if (state.ok) {
    return (
      <div className="form__done" role="status">
        <Heading as={2} size="title-xl">
          {t("successTitle")}
        </Heading>
        <p>{t("successBody", { phone: CONTACT.phoneDisplay })}</p>
      </div>
    );
  }

  return (
    <form className="form" action={formAction} noValidate>
      <input type="hidden" name="locale" value={locale} />

      <fieldset className="form__purpose">
        <legend>{t("purposeLegend")}</legend>
        <div className="form__choices">
          {PURPOSES.map((purpose, i) => (
            <label className="form__choice" key={purpose}>
              <input
                type="radio"
                name="purpose"
                value={purpose}
                defaultChecked={state.values ? state.values.purpose === purpose : i === 0}
              />
              <span>
                {t(
                  purpose === "quote"
                    ? "purposeQuote"
                    : purpose === "sample"
                      ? "purposeSample"
                      : purpose === "label"
                        ? "purposeLabel"
                        : "purposeOther",
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="form__group">
        <legend>{t("groupOrder")}</legend>
        <div className="form__grid">
          {ORDER_FIELDS.map((field) => (
            <Field
              key={field.name}
              id={`${uid}-${field.name}`}
              name={field.name}
              label={t(field.name)}
              requirement={optional}
              {...(field.hint ? { hint: t(`${field.name}Hint`) } : {})}
              {...typed(
                field.name,
                field.name === "product"
                  ? initialProduct
                  : field.name === "packSize"
                    ? initialPackSize
                    : "",
              )}
              type={"type" in field ? field.type : "text"}
              autoComplete="off"
            />
          ))}
        </div>

        <Field
          id={`${uid}-message`}
          name="message"
          {...typed("message")}
          label={t("message")}
          requirement={optional}
          hint={t("messageHint")}
          multiline
        />
      </fieldset>

      <fieldset className="form__group">
        <legend>{t("groupYou")}</legend>
        <div className="form__grid">
          <Field
            id={`${uid}-email`}
            name="email"
            {...typed("email")}
            label={t("email")}
            requirement={{ text: t("required"), required: true }}
            type="email"
            inputMode="email"
            autoComplete="email"
            invalid={state.error === "errorEmail"}
            errorId={`${uid}-error`}
          />
          <Field
            id={`${uid}-name`}
            name="name"
            {...typed("name")}
            label={t("name")}
            requirement={optional}
            type="text"
            autoComplete="name"
          />
          <Field
            id={`${uid}-company`}
            name="company"
            {...typed("company")}
            label={t("company")}
            requirement={optional}
            type="text"
            autoComplete="organization"
          />
          <Field
            id={`${uid}-phone`}
            name="phone"
            {...typed("phone")}
            label={t("phone")}
            requirement={optional}
            type="tel"
            autoComplete="tel"
          />
        </div>
      </fieldset>

      {/* THE BOT TRAP. Off-screen rather than `display: none`, which some
          fillers skip, and never focusable or announced.

          Its label is the one string on the page not taken from `messages`,
          and deliberately: it is addressed to a form-filler, not to a reader.
          A translated decoy is a decoy that changes between locales, which
          makes the field easier to fingerprint and skip — and no human ever
          sees it, so there is nothing to translate. */}
      <p className="form__trap" aria-hidden="true">
        <label htmlFor={`${uid}-company-website`}>Website</label>
        <input
          id={`${uid}-company-website`}
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </p>

      {/* `aria-live` is on a container that is always present — a region added
          to the DOM at the same moment its text appears is not reliably
          announced. */}
      <p className="form__error" id={`${uid}-error`} role="alert" aria-live="polite">
        {state.error ? t(state.error, { email: CONTACT.email, phone: CONTACT.phoneDisplay }) : ""}
      </p>

      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
