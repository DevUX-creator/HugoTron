import {
  changeCart,
  NO_EXTRAS,
  parseCart,
  type CartCommand,
  type CartExtras,
  type CartLine,
} from "./model";

const CART_STORAGE_KEY = "hugo.cart.v1";
type Snapshot = { lines: CartLine[]; ready: boolean } & CartExtras;
const EMPTY: Snapshot = { lines: [], ready: false, ...NO_EXTRAS };
let snapshot: Snapshot | undefined;
const listeners = new Set<() => void>();

function read(): Snapshot {
  try {
    return { ...parseCart(window.localStorage.getItem(CART_STORAGE_KEY)), ready: true };
  } catch {
    return { ...EMPTY, ready: true };
  }
}
function emit() {
  for (const listener of listeners) listener();
}
function save(next: Snapshot) {
  snapshot = next;
  try {
    const { lines, voucher, note } = next;
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ version: 2, lines, voucher, note }),
    );
  } catch {
    /* The cart still works for this visit when storage is unavailable. */
  }
  emit();
}

/**
 * THE CART'S PERSISTENCE, in the browser's local storage. Only product IDs, quantities, a
 * voucher code and a note are kept; prices, names and images always come from the catalogue.
 * A server-side cart (e.g. the shop backend's cart API) replaces this file behind the same
 * interface; CartProvider and every button stay as they are.
 */
export const cartStore = {
  getServerSnapshot: () => EMPTY,
  getSnapshot: () => {
    if (typeof window === "undefined") return EMPTY;
    return (snapshot ??= read());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY && event.key !== null) return;
      snapshot = read();
      emit();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  dispatch: (command: CartCommand) => {
    const current = cartStore.getSnapshot();
    const lines = changeCart(current.lines, command);
    save(command.type === "clear" ? { ...EMPTY, ready: true } : { ...current, lines, ready: true });
  },
  setExtras: (extras: Partial<CartExtras>) => {
    save({ ...cartStore.getSnapshot(), ...extras, ready: true });
  },
};
