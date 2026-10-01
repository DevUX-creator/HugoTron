import { changeCart, parseCart, type CartCommand, type CartLine } from "./model";

const CART_STORAGE_KEY = "hugo.cart.v1";
type Snapshot = { lines: CartLine[]; ready: boolean };
const EMPTY: Snapshot = { lines: [], ready: false };
let snapshot: Snapshot | undefined;
const listeners = new Set<() => void>();

function read(): Snapshot {
  try {
    return { lines: parseCart(window.localStorage.getItem(CART_STORAGE_KEY)), ready: true };
  } catch {
    return { lines: [], ready: true };
  }
}
function emit() {
  for (const listener of listeners) listener();
}

/** Local persistence adapter. A server-backed cart replaces this boundary, not the cards. */
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
    const lines = changeCart(cartStore.getSnapshot().lines, command);
    snapshot = { lines, ready: true };
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, lines }));
    } catch {
      /* The cart still works for this visit when storage is unavailable. */
    }
    emit();
  },
};
