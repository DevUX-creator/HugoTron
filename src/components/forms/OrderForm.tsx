"use client";

import { useActionState, useEffect, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import ArrowLink from "@/components/ui/ArrowLink";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/lib/catalogue";
import { CONTACT } from "@/content/site";
import { submitOrder, type OrderState } from "@/app/[locale]/checkout/actions";
import Field from "./Field";
import "./form.css";

const INITIAL: OrderState = { ok: false };

/**
 * The order request: the cart plus billing and delivery details, paid by invoice once Hugo Tron
 * confirms availability. Prices shown here are the catalogue's; the server prices the request
 * again and refuses a cart that no longer matches it.
 */
export default function OrderForm() {
  const t = useTranslations("checkout");
  const names = useTranslations("products");
  const units = useTranslations("units");
  const locale = useLocale();
  const uid = useId();
  const cart = useCart();
  const [state, formAction, pending] = useActionState(submitOrder, INITIAL);
  const { clear } = cart;

  // The request is with us: the cart has done its job.
  useEffect(() => {
    if (state.ok) clear();
  }, [state.ok, clear]);

  if (state.ok) {
    return (
      <div className="form__done" role="status">
        <Heading as={2} size="title-xl">
          {t("successTitle")}
        </Heading>
        {state.reference && <p>{t("successReference", { reference: state.reference })}</p>}
        <p>{t("successBody", { phone: CONTACT.phoneDisplay })}</p>
      </div>
    );
  }

  if (cart.ready && cart.items.length === 0) {
    return (
      <div className="form__done">
        <p>{t("empty")}</p>
        <ArrowLink href="/range" prefetch={false}>
          {t("browse")}
        </ArrowLink>
      </div>
    );
  }

  const typed = (name: string, fallback = "") => ({
    defaultValue: state.values?.[name] ?? fallback,
  });
  const required = { text: t("required"), required: true };
  const optional = { text: t("optional"), required: false };
  const lines = cart.items.map(({ product, quantity }) => ({ productId: product.slug, quantity }));

  return (
    <form className="form" action={formAction} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />

      <fieldset className="form__group">
        <legend>{t("summaryTitle")}</legend>
        <ul className="form__summary">
          {cart.items.map(({ product, quantity, lineTotal }) => (
            <li key={product.slug}>
              <span>
                {names(product.slug)}
                <small>{t("quantityLine", { count: quantity, unit: units(product.unit) })}</small>
              </span>
              <strong>{formatPrice(lineTotal, locale)}</strong>
            </li>
          ))}
        </ul>
        <p className="form__total">
          <span>{t("subtotal")}</span>
          <strong>{formatPrice(cart.subtotal, locale)}</strong>
        </p>
        <p className="form__hint">{t("invoiceNote")}</p>
      </fieldset>

      <fieldset className="form__group">
        <legend>{t("groupContact")}</legend>
        <div className="form__grid">
          <Field
            id={`${uid}-name`}
            name="name"
            {...typed("name")}
            label={t("name")}
            requirement={required}
            autoComplete="name"
            invalid={state.error === "errorDetails"}
            errorId={`${uid}-error`}
          />
          <Field
            id={`${uid}-email`}
            name="email"
            {...typed("email")}
            label={t("email")}
            requirement={required}
            type="email"
            inputMode="email"
            autoComplete="email"
            invalid={state.error === "errorEmail"}
            errorId={`${uid}-error`}
          />
          <Field
            id={`${uid}-company`}
            name="company"
            {...typed("company")}
            label={t("company")}
            requirement={optional}
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
          <Field
            id={`${uid}-vat`}
            name="vatId"
            {...typed("vatId")}
            label={t("vatId")}
            requirement={optional}
            hint={t("vatIdHint")}
            autoComplete="off"
          />
        </div>
      </fieldset>

      <fieldset className="form__group">
        <legend>{t("groupBilling")}</legend>
        <div className="form__grid">
          <Field
            id={`${uid}-street`}
            name="street"
            {...typed("street")}
            label={t("street")}
            requirement={required}
            autoComplete="street-address"
          />
          <Field
            id={`${uid}-postcode`}
            name="postcode"
            {...typed("postcode")}
            label={t("postcode")}
            requirement={required}
            autoComplete="postal-code"
          />
          <Field
            id={`${uid}-city`}
            name="city"
            {...typed("city")}
            label={t("city")}
            requirement={required}
            autoComplete="address-level2"
          />
          <Field
            id={`${uid}-country`}
            name="country"
            {...typed("country", t("countryDefault"))}
            label={t("country")}
            requirement={required}
            autoComplete="country-name"
          />
        </div>
        <Field
          id={`${uid}-notes`}
          name="notes"
          {...typed("notes")}
          label={t("notes")}
          requirement={optional}
          hint={t("notesHint")}
          multiline
        />
      </fieldset>

      {/* The bot trap, as on the enquiry form: off-screen, never focusable or announced. */}
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

      <p className="form__error" id={`${uid}-error`} role="alert" aria-live="polite">
        {state.error ? t(state.error, { email: CONTACT.email }) : ""}
      </p>

      <Button type="submit" disabled={pending || !cart.ready} aria-busy={pending}>
        {pending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
