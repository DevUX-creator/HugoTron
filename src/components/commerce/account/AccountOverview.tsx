import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/commerce/account/actions";
import { formatPrice } from "@/commerce/catalogue";
import { OPEN_ORDER_STATUSES, type Customer, type Order } from "@/commerce/types";
import StatusMessage from "../feedback/StatusMessage";
import AddressForm from "./AddressForm";
import OrderStatusBadge from "./OrderStatusBadge";
import "./account.css";

/**
 * The customer's cabinet, kept simple: orders on their way, past orders, the delivery address
 * and signing out. Everything else (email, password, deletion) is a backend task by request.
 */
export default async function AccountOverview({
  customer,
  orders,
  locale,
}: {
  customer: Customer;
  orders: readonly Order[];
  locale: string;
}) {
  const t = await getTranslations("commerce.account");
  const o = await getTranslations("commerce.orders");
  const format = await getFormatter();
  const current = orders.filter((order) => OPEN_ORDER_STATUSES.includes(order.status));
  const past = orders.filter((order) => !OPEN_ORDER_STATUSES.includes(order.status));
  const list = (items: readonly Order[]) => (
    <ul className="account-orders">
      {items.map((order) => (
        <li key={order.reference} className="account-order commerce-panel">
          <div className="account-order__main">
            <Link
              href={{
                pathname: "/account/orders/[reference]",
                params: { reference: order.reference },
              }}
              className="account-order__ref"
            >
              {order.reference}
            </Link>
            <span>{format.dateTime(new Date(order.placedAt), { dateStyle: "medium" })}</span>
            <span>
              {o("items", { count: order.lines.reduce((sum, line) => sum + line.quantity, 0) })}
            </span>
          </div>
          <div className="account-order__side">
            <OrderStatusBadge status={order.status} />
            <strong>{formatPrice(order.totals.total, locale)}</strong>
          </div>
          {order.tracking && order.status === "shipped" && (
            <a href={order.tracking.url} className="commerce-link" target="_blank" rel="noreferrer">
              {o("track", { carrier: order.tracking.carrier })}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="account">
      <header className="account__head">
        <div>
          <p className="commerce-caption">{t("eyebrow")}</p>
          <h1>{t("hello", { name: customer.firstName })}</h1>
          <p>{customer.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="commerce-button commerce-button--ghost">
            {t("signOut")}
          </button>
        </form>
      </header>

      <section className="account__section" aria-labelledby="account-current">
        <h2 id="account-current">{t("currentOrders")}</h2>
        {current.length ? list(current) : <p className="account__empty">{t("noCurrent")}</p>}
      </section>

      <section className="account__section" aria-labelledby="account-history">
        <h2 id="account-history">{t("orderHistory")}</h2>
        {past.length ? (
          list(past)
        ) : orders.length === 0 ? (
          <StatusMessage
            tone="info"
            title={t("noOrdersTitle")}
            illustration="noOrders"
            actions={
              <Link href="/range" className="commerce-button">
                {t("browse")}
              </Link>
            }
          />
        ) : (
          <p className="account__empty">{t("noHistory")}</p>
        )}
      </section>

      <section className="account__section" aria-labelledby="account-address">
        <h2 id="account-address">{t("deliveryAddress")}</h2>
        <p className="account__lead">{t("addressLead")}</p>
        <AddressForm address={customer.address} />
      </section>
    </div>
  );
}
