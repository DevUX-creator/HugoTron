"use client";

import { useEffect } from "react";
import { useCart } from "../cart/CartProvider";

/** Empties the cart once its order is confirmed (rendered by the confirmation page). */
export default function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
