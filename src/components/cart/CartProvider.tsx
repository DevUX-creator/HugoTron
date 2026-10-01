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
import { cartStore } from "@/lib/cart/store";
import { cartSummary } from "@/lib/cart/model";
import { useSound } from "@/components/sound/SoundProvider";

const actions = {
  addItem: (productId: string, quantity: number) =>
    cartStore.dispatch({ type: "add", productId, quantity }),
  updateQuantity: (productId: string, quantity: number) =>
    cartStore.dispatch({ type: "quantity", productId, quantity }),
  removeItem: (productId: string) => cartStore.dispatch({ type: "remove", productId }),
  /** After an order request is accepted. */
  clear: () => cartStore.dispatch({ type: "clear" }),
};
type CartContextValue = ReturnType<typeof cartSummary> &
  typeof actions & {
    ready: boolean;
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
