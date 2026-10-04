/**
 * ILLUSTRATIONS FOR COMMERCE MESSAGES — to be drawn (engraved paper-world style, transparent
 * background, about 640 × 480, WebP). Drop each file at its `src` and set `ready: true`;
 * until then a quiet placeholder of the same size stands in.
 */
export const ILLUSTRATIONS = {
  /** Order placed and paid: a sealed parcel leaving the harbour. */
  orderPlaced: { src: "/illustrations/commerce/order-placed.webp", ready: false },
  /** Order placed, waiting for the bank transfer. */
  awaitingTransfer: { src: "/illustrations/commerce/awaiting-transfer.webp", ready: false },
  /** Payment refused or cancelled; nothing was charged. */
  paymentFailed: { src: "/illustrations/commerce/payment-failed.webp", ready: false },
  /** The cart is empty. */
  cartEmpty: { src: "/illustrations/commerce/cart-empty.webp", ready: false },
  /** Account created / signed in for the first time. */
  welcome: { src: "/illustrations/commerce/welcome.webp", ready: false },
  /** Something went wrong on our side. */
  error: { src: "/illustrations/commerce/error.webp", ready: false },
  /** A message from the contact page has arrived. */
  messageSent: { src: "/illustrations/commerce/message-sent.webp", ready: false },
  /** No orders yet in the account. */
  noOrders: { src: "/illustrations/commerce/no-orders.webp", ready: false },
} as const;

export type IllustrationId = keyof typeof ILLUSTRATIONS;
