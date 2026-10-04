import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, redirect, getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { backend } from "@/commerce/backend";
import { commerceMetadata } from "@/commerce/pageMeta";
import { getSession } from "@/commerce/session";
import type { OrderStatus } from "@/commerce/types";
import CommerceShell from "@/components/commerce/layout/CommerceShell";
import OrderDetails from "@/components/commerce/account/OrderDetails";
import "@/components/commerce/account/account.css";

type Props = { params: Promise<{ locale: string; reference: string }> };

export const generateMetadata = ({ params }: Props) => commerceMetadata(params, "order");

const PROGRESS: readonly OrderStatus[][] = [
  ["pending_payment", "awaiting_transfer", "paid", "processing", "shipped", "delivered"],
  ["paid", "processing", "shipped", "delivered"],
  ["shipped", "delivered"],
  ["delivered"],
];

/** One of the signed-in customer's orders, with its progress. */
export default async function OrderPage({ params }: Props) {
  const { locale, reference } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) {
    const here = getPathname({
      locale: locale as Locale,
      href: { pathname: "/account/orders/[reference]", params: { reference } },
    });
    return redirect({ href: { pathname: "/account", query: { returnTo: here } }, locale });
  }
  const order = await backend().orders.get(reference);
  if (!order || order.customerId !== session.customer.id) notFound();
  const t = await getTranslations("commerce.orders");
  const stopped = order.status === "cancelled" || order.status === "refunded";
  return (
    <CommerceShell>
      <div className="order-page">
        <Link href="/account" className="commerce-link order-page__back">
          {t("backToAccount")}
        </Link>
        {!stopped && (
          <ol className="order-progress" aria-label={t("progressLabel")}>
            {(["placed", "paid", "shipped", "delivered"] as const).map((stage, index) => (
              <li key={stage} data-reached={PROGRESS[index]!.includes(order.status) || undefined}>
                {t(`progress.${stage}`)}
              </li>
            ))}
          </ol>
        )}
        <OrderDetails order={order} locale={locale} />
        {!stopped && (
          <Link
            href={{ pathname: "/withdrawal", query: { ref: order.reference }, hash: "widerrufen" }}
            className="commerce-button commerce-button--ghost order-page__back"
          >
            {t("withdraw")}
          </Link>
        )}
      </div>
    </CommerceShell>
  );
}
