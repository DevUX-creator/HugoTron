"use client";

import { useActionState, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CONTACT } from "@/content/site";
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/enquiry/schema";
import { submitEnquiry } from "@/app/[locale]/enquiry/actions";
import { ENQUIRY_INITIAL_STATE, type EnquiryState } from "@/lib/enquiry/state";
import StatusMessage from "@/components/commerce/feedback/StatusMessage";

const PURPOSES = ["quote", "sample", "label", "other"] as const;
const PURPOSE_KEYS = {
  quote: "purposeQuote",
  sample: "purposeSample",
  label: "purposeLabel",
  other: "purposeOther",
} as const;
const ENQUIRY_FIELDS = [
  { name: "product", hint: true },
  { name: "quantity", hint: true },
  { name: "packSize", hint: true },
  { name: "postcode", hint: true },
  { name: "date", hint: false, type: "date" },
] as const;

/**
 * The contact form. Topics are radio buttons styled as tabs, inside the form: the chosen one
 * is submitted with the message and switches the visible fields through CSS (`:has`), so the
 * form works the same before JavaScript arrives. Only the email is required.
 *
 * It posts to the enquiry action (`app/[locale]/enquiry/actions.ts`, contract in
 * `lib/enquiry/schema.ts`, delivery behind `lib/enquiry/provider.ts`).
 */
export default function ContactForm({
  topic,
  purpose,
  product,
  packSize,
  email,
  name,
}: {
  topic: ContactTopic;
  purpose: (typeof PURPOSES)[number];
  product: string;
  packSize: string;
  email: string;
  name: string;
}) {
  const t = useTranslations("contact");
  const fields = useTranslations("enquiry");
  const locale = useLocale();
  const uid = useId();
  const [state, action, pending] = useActionState<EnquiryState, FormData>(
    submitEnquiry,
    ENQUIRY_INITIAL_STATE,
  );
  const typed = (key: string, fallback = "") => state.values?.[key] ?? fallback;
  const chosenTopic = (state.values?.topic as ContactTopic | undefined) ?? topic;

  if (state.ok) {
    return (
      <StatusMessage
        tone="success"
        title={fields("successTitle")}
        illustration="messageSent"
        actions={
          <Link href="/range" className="commerce-button commerce-button--ghost">
            {t("browse")}
          </Link>
        }
      >
        <p>{fields("successBody", { phone: CONTACT.phoneDisplay })}</p>
      </StatusMessage>
    );
  }

  const text = (
    key: string,
    label: string,
    options: { hint?: string; type?: string; auto?: string; wide?: boolean } = {},
  ) => (
    <div key={key} className={`commerce-field${options.wide ? " commerce-field--wide" : ""}`}>
      <label htmlFor={`${uid}-${key}`}>
        {label} <span className="commerce-field__optional">{fields("optional")}</span>
      </label>
      <input
        id={`${uid}-${key}`}
        name={key}
        type={options.type ?? "text"}
        autoComplete={options.auto ?? "off"}
        defaultValue={typed(
          key,
          key === "product" ? product : key === "packSize" ? packSize : key === "name" ? name : "",
        )}
        aria-describedby={options.hint ? `${uid}-${key}-hint` : undefined}
      />
      {options.hint && (
        <span id={`${uid}-${key}-hint`} className="commerce-field__hint">
          {options.hint}
        </span>
      )}
    </div>
  );

  return (
    <form className="contact-form" action={action} noValidate>
      <input type="hidden" name="locale" value={locale} />

      <fieldset className="contact-form__topics">
        <legend className="visually-hidden">{t("topicLegend")}</legend>
        {CONTACT_TOPICS.map((value) => (
          <label key={value} className="contact-form__topic">
            <input type="radio" name="topic" value={value} defaultChecked={chosenTopic === value} />
            <span>{t(`topics.${value}.label`)}</span>
          </label>
        ))}
      </fieldset>

      {CONTACT_TOPICS.map((value) => (
        <p key={value} className="contact-form__intro" data-topic={value}>
          {t(`topics.${value}.intro`)}
        </p>
      ))}

      <div className="contact-form__section" data-topic="enquiry">
        <fieldset className="contact-form__purposes">
          <legend>{fields("purposeLegend")}</legend>
          <div>
            {PURPOSES.map((value) => (
              <label key={value} className="contact-form__chip">
                <input
                  type="radio"
                  name="purpose"
                  value={value}
                  defaultChecked={(state.values?.purpose ?? purpose) === value}
                />
                <span>{fields(PURPOSE_KEYS[value])}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="commerce-fields">
          {ENQUIRY_FIELDS.map((field) =>
            text(field.name, fields(field.name), {
              ...(field.hint ? { hint: fields(`${field.name}Hint`) } : {}),
              ...("type" in field ? { type: field.type } : {}),
            }),
          )}
        </div>
      </div>

      <div className="contact-form__section" data-topic="order">
        <div className="commerce-fields">
          {text("orderReference", t("orderReference"), {
            hint: t("orderReferenceHint"),
            wide: true,
          })}
        </div>
      </div>

      <div className="commerce-field">
        <label htmlFor={`${uid}-message`}>
          {t("message")} <span className="commerce-field__optional">{fields("optional")}</span>
        </label>
        <textarea id={`${uid}-message`} name="message" defaultValue={typed("message")} rows={5} />
      </div>

      <fieldset className="contact-form__you">
        <legend>{fields("groupYou")}</legend>
        <div className="commerce-fields">
          <div className="commerce-field">
            <label htmlFor={`${uid}-email`}>
              {fields("email")} <span className="contact-form__required">{fields("required")}</span>
            </label>
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              defaultValue={typed("email", email)}
              aria-invalid={state.error === "errorEmail" ? true : undefined}
              aria-describedby={state.error ? `${uid}-error` : undefined}
            />
          </div>
          {text("name", fields("name"), { auto: "name" })}
          {text("company", fields("company"), { auto: "organization" })}
          {text("phone", fields("phone"), { type: "tel", auto: "tel" })}
        </div>
      </fieldset>

      {/* The bot trap: off-screen, never focusable or announced. See the enquiry action. */}
      <p className="contact-form__trap" aria-hidden="true">
        <label htmlFor={`${uid}-company-website`}>Website</label>
        <input
          id={`${uid}-company-website`}
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </p>

      <div id={`${uid}-error`} aria-live="polite">
        {state.error && (
          <StatusMessage
            tone="error"
            compact
            title={fields(state.error, { email: CONTACT.email, phone: CONTACT.phoneDisplay })}
          />
        )}
      </div>

      <button
        type="submit"
        className="commerce-button contact-form__submit"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? fields("sending") : t("submit")}
      </button>
      <p className="contact-form__privacy">
        {t.rich("privacy", {
          link: (chunks) => (
            <Link href="/privacy" className="commerce-link">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
