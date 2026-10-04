import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/commerce/types";

const TONE: Record<OrderStatus, "progress" | "done" | "waiting" | "stopped"> = {
  pending_payment: "waiting",
  awaiting_transfer: "waiting",
  paid: "progress",
  processing: "progress",
  shipped: "progress",
  delivered: "done",
  cancelled: "stopped",
  refunded: "stopped",
};

/** An order's status, as a small labelled badge. */
export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("commerce.orders.status");
  return (
    <span className="order-status" data-tone={TONE[status]}>
      {t(status)}
    </span>
  );
}
