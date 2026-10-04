"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cartStore } from "@/commerce/cart/store";
import { cartSummary, type CartLine } from "@/commerce/cart/model";
import { useSound } from "@/components/sound/SoundProvider";

const actions = {
  addItem: (productId: string, quantity: number) =>
    cartStore.dispatch({ type: "add", productId, quantity }),
  updateQuantity: (productId: string, quantity: number) =>
    cartStore.dispatch({ type: "quantity", productId, quantity }),
  removeItem: (productId: string) => cartStore.dispatch({ type: "remove", productId }),
  /** After an order is placed. */
  clear: () => cartStore.dispatch({ type: "clear" }),
  setVoucher: (voucher: string) => cartStore.setExtras({ voucher }),
  setNote: (note: string) => cartStore.setExtras({ note }),
};
type CartContextValue = ReturnType<typeof cartSummary> &
  typeof actions & {
    ready: boolean;
    /** The lines as the checkout contract sends them: product IDs and quantities. */
    lines: CartLine[];
    voucher: string;
    note: string;
    open: boolean;
    setOpen: (open: boolean) => void;
  };
const Context = createContext<CartContextValue | null>(null);

export default function CartProvider({ children }: { children: ReactNode }) {
  const { play } = useSound();
  const addItem = useCallback(
    (productId: string, quantity: number) => {
      const before =
        cartStore.getSnapshot().lines.find((line) => line.productId === productId)?.quantity ?? 0;
      actions.addItem(productId, quantity);
      const after =
        cartStore.getSnapshot().lines.find((line) => line.productId === productId)?.quantity ?? 0;
      // Confirm the accepted cart mutation, never hydration, quantity edits, or rejected additions.
      if (after > before) play("cart");
    },
    [play],
  );
  const snapshot = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const value = useMemo(
    () => ({
      ...cartSummary(snapshot.lines),
      ...actions,
      addItem,
      ready: snapshot.ready,
      voucher: snapshot.voucher,
      note: snapshot.note,
      lines: snapshot.lines,
      open,
      setOpen,
    }),
    [snapshot, open, addItem],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error("Cart controls require CartProvider");
  return value;
}
