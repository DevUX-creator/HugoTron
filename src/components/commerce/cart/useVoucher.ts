"use client";

import { useEffect, useState } from "react";
import { checkVoucher } from "@/commerce/checkout/actions";
import type { Voucher } from "@/commerce/types";
import { useCart } from "./CartProvider";

/**
 * The cart's voucher, always checked on the server against the current lines: a code is only
 * worth what the backend says it is worth for this cart, never what the browser assumes.
 */
export function useVoucher() {
  const cart = useCart();
  const key = `${cart.voucher}|${JSON.stringify(cart.lines)}`;
  const [result, setResult] = useState<{
    key: string;
    voucher: Voucher | null;
    error: string | null;
  }>({ key: "", voucher: null, error: null });
  useEffect(() => {
    if (!cart.voucher || cart.lines.length === 0) return;
    let current = true;
    void checkVoucher(cart.voucher, cart.lines)
      .then((answer) => {
        if (!current) return;
        setResult(
          answer.ok
            ? { key, voucher: answer.voucher, error: null }
            : { key, voucher: null, error: answer.error },
        );
      })
      .catch(() => {
        if (current) setResult({ key, voucher: null, error: "generic" });
      });
    return () => {
      current = false;
    };
    // `key` covers the code and the lines.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const settled = result.key === key;
  return {
    code: cart.voucher,
    voucher: cart.voucher && settled ? result.voucher : null,
    error: cart.voucher && settled ? result.error : null,
    pending: Boolean(cart.voucher) && !settled,
    apply: (code: string) => cart.setVoucher(code.trim().toUpperCase().slice(0, 40)),
    remove: () => cart.setVoucher(""),
  };
}
