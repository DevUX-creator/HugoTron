import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { backend, commerceAvailable } from "@/commerce/backend";
import { LAST_ORDER_COOKIE } from "@/commerce/checkout/reference";
import { hasGuestAccess } from "@/commerce/checkout/guestAccess";
import { COMMERCE } from "@/commerce/config";
import { commerceMetadata } from "@/commerce/pageMeta";
import { getSession } from "@/commerce/session";
import { formatPrice } from "@/commerce/catalogue";
import CommerceShell from "@/components/commerce/layout/CommerceShell";
import StatusMessage from "@/components/commerce/feedback/StatusMessage";
import OrderDetails from "@/components/commerce/account/OrderDetails";
import ClearCart from "@/components/commerce/account/ClearCart";
import "@/components/commerce/account/account.css";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
};

export const generateMetadata = ({ params }: Props) => commerceMetadata(params, "confirmation");

/**
 * After checkout, and where redirect payments (PayPal, Klarna, 3-D Secure) return. Shows the
 * order only to the browser that placed it (a short-lived cookie) or to its signed-in owner.
 */
export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("commerce.confirmation");
  const { ref } = await searchParams;
  const session = await getSession();
  const last = (await cookies()).get(LAST_ORDER_COOKIE)?.value;
  const guestAccess = typeof ref === "string" && hasGuestAccess(last, ref);
  const order =
    ref && commerceAvailable() && (guestAccess || session) ? await backend().orders.get(ref) : null;
  const visible = order && (guestAccess || (session && order.customerId === session.customer.id));

  if (!order || !visible) {
    return (
      <CommerceShell>
        <StatusMessage
          tone="error"
          title={t("notFoundTitle")}
          illustration="error"
          actions={
            <Link href="/account" className="commerce-button">
              {t("toAccount")}
            </Link>
          }
        >
          <p>{t("notFound")}</p>
        </StatusMessage>
      </CommerceShell>
    );
  }

  const bank = COMMERCE.bankTransfer;
  const confirmed = order.status !== "pending_payment" && order.status !== "cancelled";
  return (
    <CommerceShell>
      {confirmed && <ClearCart />}
      <div className="order-page">
        {order.status === "awaiting_transfer" ? (
          <StatusMessage tone="info" title={t("transferTitle")} illustration="awaitingTransfer">
            <p>
              {t(bank ? "transfer" : "transferByEmail", {
                amount: formatPrice(order.totals.total, locale),
              })}
            </p>
            <dl className="bank-details">
              {bank && (
                <>
                  <dt>{t("bankHolder")}</dt>
                  <dd>{bank.holder}</dd>
                  <dt>IBAN</dt>
                  <dd>{bank.iban}</dd>
                  <dt>BIC</dt>
                  <dd>{bank.bic}</dd>
                </>
              )}
              <dt>{t("bankReference")}</dt>
              <dd>{order.reference}</dd>
            </dl>
          </StatusMessage>
        ) : order.status === "pending_payment" ? (
          <StatusMessage
            tone="info"
            title={t("pendingTitle")}
            illustration="awaitingTransfer"
            actions={
              <Link
                href={{ pathname: "/checkout/confirmation", query: { ref: order.reference } }}
                className="commerce-button commerce-button--ghost"
              >
                {t("refresh")}
              </Link>
            }
          >
            <p>{t("pending")}</p>
          </StatusMessage>
        ) : order.status === "cancelled" ? (
          <StatusMessage
            tone="error"
            title={t("failedTitle")}
            illustration="paymentFailed"
            actions={
              <Link href="/checkout" className="commerce-button">
                {t("retry")}
              </Link>
            }
          >
            <p>{t("failed")}</p>
          </StatusMessage>
        ) : (
          <StatusMessage tone="success" title={t("thanksTitle")} illustration="orderPlaced">
            <p>{t("thanks", { email: order.email })}</p>
          </StatusMessage>
        )}
        <OrderDetails order={order} locale={locale} />
        {!session && (
          <StatusMessage
            tone="info"
            compact
            title={t("accountTitle")}
            actions={
              <Link
                href={{ pathname: "/account", query: { mode: "register", email: order.email } }}
                className="commerce-button commerce-button--ghost"
              >
                {t("createAccount")}
              </Link>
            }
          >
            <p>{t("account")}</p>
          </StatusMessage>
        )}
        <Link
          href={{ pathname: "/withdrawal", query: { ref: order.reference }, hash: "widerrufen" }}
          className="commerce-link order-page__back"
        >
          {t("withdraw")}
        </Link>
        <Link href="/range" className="commerce-link order-page__back">
          {t("continue")}
        </Link>
      </div>
    </CommerceShell>
  );
}
