"use client";

import { useId, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { COMMERCE } from "@/commerce/config";
import type { AddressInput } from "@/commerce/checkout/schema";

export const EMPTY_ADDRESS: AddressInput = {
  firstName: "",
  lastName: "",
  company: "",
  street: "",
  addition: "",
  postcode: "",
  city: "",
  country: COMMERCE.checkout.countries[0],
  phone: "",
};

type Key = keyof AddressInput;
const FIELDS: { key: Key; auto: string; required: boolean; wide?: boolean }[] = [
  { key: "firstName", auto: "given-name", required: true },
  { key: "lastName", auto: "family-name", required: true },
  { key: "company", auto: "organization", required: false, wide: true },
  { key: "street", auto: "address-line1", required: true, wide: true },
  { key: "addition", auto: "address-line2", required: false, wide: true },
  { key: "postcode", auto: "postal-code", required: true },
  { key: "city", auto: "address-level2", required: true },
  { key: "country", auto: "country", required: true },
  { key: "phone", auto: "tel", required: false },
];

/**
 * A postal address, with the browser's standard autofill tokens (`section-…` keeps delivery
 * and billing apart). Controlled: the checkout and the account own the values. `name`
 * attributes make it work inside a plain <form> too (the account's address form).
 */
export default function AddressFields({
  section,
  value,
  onChange,
  errors = {},
}: {
  /** "shipping" or "billing": the autofill section and the id prefix. */
  section: string;
  value: AddressInput;
  onChange?: (next: AddressInput) => void;
  /** Field key → message id under commerce.errors. */
  errors?: Partial<Record<Key, string>>;
}) {
  const t = useTranslations("commerce.address");
  const messages = useTranslations("commerce.errors");
  const countries = useTranslations("commerce.countries");
  const base = useId();
  return (
    <div className="commerce-fields">
      {FIELDS.map(({ key, auto, required, wide }) => {
        const id = `${base}-${key}`;
        const error = errors[key];
        const common = {
          id,
          name: key,
          required,
          autoComplete: `section-${section} ${section} ${auto}`,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? `${id}-error` : undefined,
        } as const;
        return (
          <div key={key} className={`commerce-field${wide ? " commerce-field--wide" : ""}`}>
            <label htmlFor={id}>
              {t(key)}
              {!required && <span className="commerce-field__optional"> {t("optional")}</span>}
            </label>
            {key === "country" ? (
              <select
                {...common}
                {...(onChange
                  ? {
                      value: value.country,
                      onChange: (event: ChangeEvent<HTMLSelectElement>) =>
                        onChange({
                          ...value,
                          country: event.target.value as AddressInput["country"],
                        }),
                    }
                  : { defaultValue: value.country })}
              >
                {COMMERCE.checkout.countries.map((code) => (
                  <option key={code} value={code}>
                    {countries(code)}
                  </option>
                ))}
              </select>
            ) : onChange ? (
              <input
                {...common}
                type={key === "phone" ? "tel" : "text"}
                value={value[key]}
                onChange={(event) => onChange({ ...value, [key]: event.target.value })}
              />
            ) : (
              <input
                {...common}
                type={key === "phone" ? "tel" : "text"}
                defaultValue={value[key]}
              />
            )}
            {error && (
              <span id={`${id}-error`} className="commerce-field__error">
                {messages(error as Parameters<typeof messages>[0])}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
