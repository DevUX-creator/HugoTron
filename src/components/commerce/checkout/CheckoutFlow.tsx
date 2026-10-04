"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";
import { Link, usePathname } from "@/i18n/navigation";
import { formatPrice } from "@/commerce/catalogue";
import { placeOrder, type PlaceOrderResult } from "@/commerce/checkout/actions";
import { addressSchema, type AddressInput } from "@/commerce/checkout/schema";
import {
  COMMERCE,
  DEV_TOOLS,
  SHIPPING_METHODS,
  shippingCost,
  type PaymentMethodId,
  type ShippingMethodId,
} from "@/commerce/config";
import type { Address } from "@/commerce/types";
import { useCart } from "../cart/CartProvider";
import OrderSummary from "../cart/OrderSummary";
import SecureNote from "../cart/SecureNote";
import VoucherField from "../cart/VoucherField";
import { useVoucher } from "../cart/useVoucher";
import SocialButtons from "../account/SocialButtons";
import StatusMessage from "../feedback/StatusMessage";
import AddressFields, { EMPTY_ADDRESS } from "./AddressFields";
import type { LegalDocument } from "@/content/legal/types";
import LegalDialog from "@/components/legal/LegalDialog";
import "./checkout.css";

type Step = "contact" | "delivery" | "payment" | "review";
const STEPS: readonly Step[] = ["contact", "delivery", "payment", "review"];
type Errors = Record<string, string>;
type Customer = { email: string; firstName: string; lastName: string; address: Address | null };

/** Field errors from a zod result, as path → message id. */
function fieldErrors(result: z.ZodSafeParseResult<unknown>, prefix = ""): Errors {
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => {
      const key = `${prefix}${issue.path.join(".")}`;
      return [key, issue.code === "too_small" ? "required" : "invalid"];
    }),
  );
}
const within = (errors: Errors, prefix: string) =>
  Object.fromEntries(
    Object.entries(errors)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value]),
  );

/**
 * The checkout: contact, delivery, payment and review on one page, each step collapsing into a
 * summary once done (and reopening with "Edit"). Every step validates against the same schema
 * the server uses; `placeOrder` then re-checks everything and prices the order itself.
 */
export default function CheckoutFlow({
  customer,
  allowGuest,
  cancellationPolicy,
  preview,
}: {
  customer: Customer | null;
  allowGuest: boolean;
  preview: boolean;
  /** Shown in a dialog from the review step (not linked in the site footer). */
  cancellationPolicy: LegalDocument;
}) {
  const t = useTranslations("commerce.checkout");
  const errorsText = useTranslations("commerce.errors");
  const shippingText = useTranslations("commerce.shipping");
  const payText = useTranslations("commerce.payment");
  const countries = useTranslations("commerce.countries");
  const locale = useLocale();
  const pathname = usePathname();
  const cart = useCart();
  const voucher = useVoucher();
  const [pending, startTransition] = useTransition();
  const attempt = useRef<{ payload: string; id: string } | null>(null);

  const [step, setStep] = useState<Step>(customer ? "delivery" : "contact");
  const [done, setDone] = useState<ReadonlySet<Step>>(new Set(customer ? ["contact"] : []));
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<Exclude<PlaceOrderResult, { ok: true }>["error"] | null>(
    null,
  );
  const [email, setEmail] = useState(customer?.email ?? "");
  const [shippingAddress, setShippingAddress] = useState<AddressInput>(() => ({
    ...EMPTY_ADDRESS,
    ...(customer?.address as AddressInput | null),
    firstName: customer?.address?.firstName ?? customer?.firstName ?? "",
    lastName: customer?.address?.lastName ?? customer?.lastName ?? "",
  }));
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId>(COMMERCE.shipping[0].id);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | null>(null);
  const [billingSame, setBillingSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState<AddressInput>(EMPTY_ADDRESS);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [applePay, setApplePay] = useState(DEV_TOOLS);
  const termsId = useId();
  const price = (cents: number) => formatPrice(cents, locale);

  // Apple Pay is offered only where the browser can use it (the mock shows it everywhere).
  useEffect(() => {
    const session = (window as Window & { ApplePaySession?: { canMakePayments(): boolean } })
      .ApplePaySession;
    if (session?.canMakePayments()) setApplePay(true);
  }, []);

  const methods = COMMERCE.payments.filter((method) => method !== "applePay" || applePay);

  function validate(target: Step): Errors {
    if (target === "contact") return fieldErrors(z.email().safeParse(email), "email");
    if (target === "delivery")
      return fieldErrors(addressSchema.safeParse(shippingAddress), "shippingAddress.");
    if (target === "payment") {
      const found: Errors = {};
      if (!paymentMethod) found.paymentMethod = "choosePayment";
      if (!billingSame)
        Object.assign(
          found,
          fieldErrors(addressSchema.safeParse(billingAddress), "billingAddress."),
        );
      return found;
    }
    return acceptTerms ? {} : { acceptTerms: "acceptTerms" };
  }

  function next(current: Step) {
    if (current === "contact" && !customer && !allowGuest) return;
    const found = validate(current);
    setErrors(found);
    if (Object.keys(found).length) return;
    setDone((previous) => new Set(previous).add(current));
    setStep(STEPS[STEPS.indexOf(current) + 1] ?? "review");
  }

  function submit() {
    for (const target of STEPS) {
      const found = validate(target);
      if (Object.keys(found).length) {
        setErrors(found);
        setStep(target);
        return;
      }
    }
    setFailure(null);
    startTransition(async () => {
      const input = {
        lines: cart.lines,
        email: customer?.email ?? email,
        shippingAddress,
        shippingMethod,
        paymentMethod,
        billingSameAsShipping: billingSame,
        billingAddress: billingSame ? null : billingAddress,
        voucher: voucher.voucher ? voucher.code : "",
        note: cart.note,
        acceptTerms,
        locale,
      };
      const payload = JSON.stringify(input);
      if (attempt.current?.payload !== payload)
        attempt.current = { payload, id: crypto.randomUUID() };
      let result: PlaceOrderResult;
      try {
        result = await placeOrder({ ...input, checkoutId: attempt.current.id });
      } catch {
        setFailure("generic");
        return;
      }
      if (result.ok) {
        // The confirmation page empties the cart once the order is confirmed.
        window.location.assign(result.next);
        return;
      }
      setFailure(result.error);
      if (result.error === "paymentDeclined") setStep("payment");
      if (result.error === "signInRequired") setStep("contact");
      if (result.error === "invalid" && result.fields?.length) {
        setErrors(Object.fromEntries(result.fields.map((field) => [field, "invalid"])));
        const first = result.fields[0]!;
        setStep(
          first.startsWith("shipping")
            ? "delivery"
            : first.startsWith("billing") || first.startsWith("payment")
              ? "payment"
              : first === "email"
                ? "contact"
                : "review",
        );
      }
    });
  }

  if (!cart.ready) return <div className="checkout checkout--loading" aria-busy="true" />;
  if (cart.items.length === 0) {
    return (
      <StatusMessage
        tone="info"
        title={t("emptyTitle")}
        illustration="cartEmpty"
        actions={
          <Link href="/range" className="commerce-button">
            {t("browse")}
          </Link>
        }
      >
        <p>{t("emptyBody")}</p>
      </StatusMessage>
    );
  }

  const section = (target: Step, summary: ReactNode, body: ReactNode) => {
    const index = STEPS.indexOf(target) + 1;
    const open = step === target;
    const complete = done.has(target) && !open;
    return (
      <section
        className="checkout-step commerce-panel"
        data-open={open || undefined}
        data-complete={complete || undefined}
        aria-labelledby={`step-${target}`}
      >
        <header className="checkout-step__head">
          <span className="checkout-step__index" aria-hidden="true">
            {complete ? "✓" : index}
          </span>
          <h2 id={`step-${target}`}>{t(`steps.${target}`)}</h2>
          {complete && (
            <button
              type="button"
              className="commerce-link checkout-step__edit"
              onClick={() => setStep(target)}
              aria-label={t("editStep", { step: t(`steps.${target}`) })}
            >
              {t("edit")}
            </button>
          )}
        </header>
        {complete && <div className="checkout-step__summary">{summary}</div>}
        {open && <div className="checkout-step__body">{body}</div>}
      </section>
    );
  };

  const addressLine = (address: AddressInput) =>
    [
      `${address.firstName} ${address.lastName}`,
      address.company,
      address.street,
      address.addition,
      `${address.postcode} ${address.city}`,
      countries(address.country),
    ]
      .filter((part) => part.trim())
      .join(", ");

  const failureMessage = failure && (
    <StatusMessage tone="error" compact title={errorsText(`${failure}Title`)}>
      <p>{errorsText(failure)}</p>
      {failure === "cartChanged" && (
        <p>
          <Link href="/cart" className="commerce-link">
            {t("reviewCart")}
          </Link>
        </p>
      )}
    </StatusMessage>
  );

  return (
    <div className="checkout">
      <header className="checkout__head">
        <h1>{t("title")}</h1>
        <Link href="/cart" className="commerce-link">
          {t("backToCart")}
        </Link>
      </header>
      {preview && (
        <StatusMessage tone="info" compact title={t("previewTitle")}>
          <p>{t("previewBody")}</p>
        </StatusMessage>
      )}
      <div className="checkout__layout">
        <div className="checkout__steps">
          {section(
            "contact",
            <p>{customer ? t("signedInAs", { email: customer.email }) : email}</p>,
            customer ? (
              <p>{t("signedInAs", { email: customer.email })}</p>
            ) : (
              <div className="checkout-contact">
                {failure === "signInRequired" && failureMessage}
                {allowGuest ? (
                  <>
                    <div className="commerce-field">
                      <label htmlFor="checkout-email">{t("email")}</label>
                      <input
                        id="checkout-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={
                          errors.email ? "checkout-email-error" : "checkout-email-hint"
                        }
                      />
                      <span id="checkout-email-hint" className="commerce-field__hint">
                        {t("emailHint")}
                      </span>
                      {errors.email && (
                        <span id="checkout-email-error" className="commerce-field__error">
                          {errorsText("invalidEmail")}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="commerce-button"
                      onClick={() => next("contact")}
                    >
                      {t("continueAsGuest")}
                    </button>
                  </>
                ) : (
                  <StatusMessage tone="info" compact title={t("accountRequiredTitle")}>
                    <p>{t("accountRequired")}</p>
                  </StatusMessage>
                )}
                <div className="checkout-contact__account">
                  <p className="commerce-caption">{t("haveAccount")}</p>
                  <div className="checkout-contact__links">
                    <Link
                      href={{ pathname: "/account", query: { returnTo: pathname } }}
                      className="commerce-button commerce-button--ghost"
                    >
                      {t("signIn")}
                    </Link>
                    <Link
                      href={{
                        pathname: "/account",
                        query: { mode: "register", returnTo: pathname },
                      }}
                      className="commerce-button commerce-button--ghost"
                    >
                      {t("createAccount")}
                    </Link>
                  </div>
                  <SocialButtons returnTo={pathname} />
                </div>
              </div>
            ),
          )}

          {section(
            "delivery",
            <p>
              {addressLine(shippingAddress)}
              <br />
              {shippingText(`${shippingMethod}.name`)}
            </p>,
            <>
              <AddressFields
                section="shipping"
                value={shippingAddress}
                onChange={setShippingAddress}
                errors={within(errors, "shippingAddress.")}
              />
              <fieldset className="checkout-options">
                <legend>{t("deliveryMethod")}</legend>
                {SHIPPING_METHODS.map((method) => {
                  const cost = shippingCost(method, cart.subtotal);
                  return (
                    <label key={method.id} className="checkout-option">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method.id}
                        checked={shippingMethod === method.id}
                        onChange={() => setShippingMethod(method.id as ShippingMethodId)}
                      />
                      <span className="checkout-option__text">
                        <strong>{shippingText(`${method.id as ShippingMethodId}.name`)}</strong>
                        {cost === null ? (
                          <small>{shippingText("onRequestNote")}</small>
                        ) : (
                          method.carrier &&
                          method.days && (
                            <small>
                              {method.carrier} ·{" "}
                              {shippingText("days", { from: method.days[0], to: method.days[1] })}
                            </small>
                          )
                        )}
                        {method.freeFrom !== null && cost !== null && cost > 0 && (
                          <small>
                            {shippingText("freeFrom", { amount: price(method.freeFrom) })}
                          </small>
                        )}
                      </span>
                      <span className="checkout-option__price">
                        {cost === null
                          ? shippingText("onRequest")
                          : cost === 0
                            ? shippingText("free")
                            : price(cost)}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              {shippingCost(
                SHIPPING_METHODS.find((method) => method.id === shippingMethod)!,
                cart.subtotal,
              ) === null ? (
                <StatusMessage
                  tone="info"
                  compact
                  title={errorsText("shippingUnconfirmedTitle")}
                  actions={
                    <Link href="/contact" className="commerce-button">
                      {errorsText("contactUs")}
                    </Link>
                  }
                >
                  <p>{errorsText("shippingUnconfirmed")}</p>
                </StatusMessage>
              ) : (
                <button type="button" className="commerce-button" onClick={() => next("delivery")}>
                  {t("continueToPayment")}
                </button>
              )}
            </>,
          )}

          {section(
            "payment",
            <p>
              {paymentMethod && payText(`methods.${paymentMethod}.name`)}
              <br />
              {billingSame ? t("billingSame") : addressLine(billingAddress)}
            </p>,
            <>
              {failure === "paymentDeclined" && failureMessage}
              <fieldset className="checkout-options">
                <legend>{t("paymentMethod")}</legend>
                {methods.map((method) => (
                  <div key={method} className="checkout-payment">
                    <label className="checkout-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                      />
                      <span className="checkout-option__text">
                        <strong>{payText(`methods.${method}.name`)}</strong>
                        <small>{payText(`methods.${method}.note`)}</small>
                      </span>
                      <span className="checkout-option__badge" aria-hidden="true">
                        {payText(`methods.${method}.short`)}
                      </span>
                    </label>
                    {paymentMethod === method && method === "card" && (
                      <div className="checkout-payment__detail">
                        <p>{payText(preview ? "previewCard" : "hostedCard")}</p>
                      </div>
                    )}
                  </div>
                ))}
                {errors.paymentMethod && (
                  <p className="commerce-field__error" role="alert">
                    {errorsText(errors.paymentMethod as Parameters<typeof errorsText>[0])}
                  </p>
                )}
              </fieldset>
              <fieldset className="checkout-options">
                <legend>{t("billingAddress")}</legend>
                <label className="commerce-check">
                  <input
                    type="checkbox"
                    checked={billingSame}
                    onChange={(event) => setBillingSame(event.target.checked)}
                  />
                  {t("billingSame")}
                </label>
                {!billingSame && (
                  <AddressFields
                    section="billing"
                    value={billingAddress}
                    onChange={setBillingAddress}
                    errors={within(errors, "billingAddress.")}
                  />
                )}
              </fieldset>
              <button type="button" className="commerce-button" onClick={() => next("payment")}>
                {t("continueToReview")}
              </button>
            </>,
          )}

          {section(
            "review",
            null,
            <div className="checkout-review">
              <p>{t("reviewIntro")}</p>
              <dl className="checkout-review__facts">
                <div>
                  <dt>{t("steps.contact")}</dt>
                  <dd>{customer?.email ?? email}</dd>
                </div>
                <div>
                  <dt>{t("shipTo")}</dt>
                  <dd>{addressLine(shippingAddress)}</dd>
                </div>
                <div>
                  <dt>{t("deliveryMethod")}</dt>
                  <dd>{shippingText(`${shippingMethod}.name`)}</dd>
                </div>
                <div>
                  <dt>{t("paymentMethod")}</dt>
                  <dd>{paymentMethod && payText(`methods.${paymentMethod}.name`)}</dd>
                </div>
              </dl>
              <div className="commerce-field">
                <label htmlFor="checkout-note">{t("note")}</label>
                <textarea
                  id="checkout-note"
                  value={cart.note}
                  maxLength={COMMERCE.checkout.noteMaxLength}
                  onChange={(event) => cart.setNote(event.target.value)}
                />
              </div>
              <label className="commerce-check" htmlFor={termsId}>
                <input
                  id={termsId}
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                  aria-invalid={errors.acceptTerms ? true : undefined}
                  required
                />
                <span>
                  {t.rich("terms", {
                    terms: (chunks) => (
                      <Link href="/terms" target="_blank" className="commerce-link">
                        {chunks}
                      </Link>
                    ),
                    withdrawal: (chunks) => (
                      <button
                        type="button"
                        className="commerce-link checkout-review__policy"
                        onClick={() => setPolicyOpen(true)}
                      >
                        {chunks}
                      </button>
                    ),
                    privacy: (chunks) => (
                      <Link href="/privacy" target="_blank" className="commerce-link">
                        {chunks}
                      </Link>
                    ),
                  })}
                  *
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="commerce-field__error" role="alert">
                  {errorsText("acceptTerms")}
                </p>
              )}
              {failure &&
                failure !== "paymentDeclined" &&
                failure !== "signInRequired" &&
                failureMessage}
              <button
                type="button"
                className="commerce-button commerce-button--block checkout-review__submit"
                onClick={submit}
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? t("placing") : t("placeOrder")}
              </button>
              <SecureNote />
              <nav className="checkout-review__legal" aria-label={t("legalLabel")}>
                <button type="button" className="commerce-link" onClick={() => setPolicyOpen(true)}>
                  {t("cancellationPolicy")}
                </button>
                <Link href="/terms" target="_blank" className="commerce-link">
                  {t("termsLink")}
                </Link>
                <Link href="/privacy" target="_blank" className="commerce-link">
                  {t("privacyLink")}
                </Link>
              </nav>
            </div>,
          )}
        </div>

        <aside className="checkout__aside">
          <OrderSummary shippingMethod={shippingMethod} voucher={voucher.voucher}>
            <VoucherField />
          </OrderSummary>
        </aside>
      </div>
      <LegalDialog
        document={cancellationPolicy}
        open={policyOpen}
        onClose={() => setPolicyOpen(false)}
      />
    </div>
  );
}
