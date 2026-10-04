import { getFormatter, getTranslations } from "next-intl/server";
import { formatPrice } from "@/commerce/catalogue";
import type { Address, Order } from "@/commerce/types";
import OrderStatusBadge from "./OrderStatusBadge";

/** Everything about one order: lines, totals, addresses, methods and tracking. */
export default async function OrderDetails({ order, locale }: { order: Order; locale: string }) {
  const t = await getTranslations("commerce.orders");
  const names = await getTranslations("products");
  const units = await getTranslations("units");
  const shipping = await getTranslations("commerce.shipping");
  const payment = await getTranslations("commerce.payment.methods");
  const countries = await getTranslations("commerce.countries");
  const format = await getFormatter();
  const price = (cents: number) => formatPrice(cents, locale);
  const address = (value: Address) =>
    [
      `${value.firstName} ${value.lastName}`,
      value.company,
      value.street,
      value.addition,
      `${value.postcode} ${value.city}`,
      countries(value.country as Parameters<typeof countries>[0]),
    ].filter((part) => part.trim());
  return (
    <article className="order-details commerce-panel" aria-labelledby={`order-${order.reference}`}>
      <header className="order-details__head">
        <div>
          <p className="commerce-caption">{t("reference")}</p>
          <h2 id={`order-${order.reference}`}>{order.reference}</h2>
        </div>
        <div className="order-details__meta">
          <OrderStatusBadge status={order.status} />
          <span>{format.dateTime(new Date(order.placedAt), { dateStyle: "long" })}</span>
        </div>
      </header>
      <ul className="order-details__lines">
        {order.lines.map((line) => (
          <li key={line.productId}>
            <span>
              {line.quantity} × {names(line.productId)}
              <small>{units(line.unit)}</small>
            </span>
            <span>{price(line.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="order-details__totals">
        <div>
          <dt>{t("subtotal")}</dt>
          <dd>{price(order.totals.subtotal)}</dd>
        </div>
        <div>
          <dt>{t("shipping")}</dt>
          <dd>
            {order.totals.shipping === null
              ? t("shippingOnRequest")
              : order.totals.shipping === 0
                ? t("free")
                : price(order.totals.shipping)}
          </dd>
        </div>
        {order.totals.discount > 0 && (
          <div>
            <dt>{t("discount", { code: order.voucher ?? "" })}</dt>
            <dd>−{price(order.totals.discount)}</dd>
          </div>
        )}
        <div className="order-details__total">
          <dt>{t("total")}</dt>
          <dd>{price(order.totals.total)}</dd>
        </div>
      </dl>
      <div className="order-details__facts">
        <section>
          <h3>{t("shipTo")}</h3>
          <address>
            {address(order.shippingAddress).map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
          <p>{shipping(`${order.shippingMethod}.name`)}</p>
          {order.tracking && (
            <a href={order.tracking.url} className="commerce-link" target="_blank" rel="noreferrer">
              {t("track", { carrier: order.tracking.carrier })}
            </a>
          )}
        </section>
        <section>
          <h3>{t("billTo")}</h3>
          <address>
            {address(order.billingAddress).map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
          <p>{payment(`${order.paymentMethod}.name`)}</p>
        </section>
        {order.note && (
          <section>
            <h3>{t("note")}</h3>
            <p>{order.note}</p>
          </section>
        )}
      </div>
    </article>
  );
}
