/**
 * The hand-off from the World journey to Daylight, 0–1. Daylight drives it from scroll; the
 * World scene listens so its lines, blur and grain move with the page's falling copy.
 */
type Listener = (value: number) => void;

let current = 0;
const listeners = new Set<Listener>();

export const worldHandoff = {
  get: () => current,
  set(value: number) {
    if (value === current) return;
    current = value;
    for (const listener of listeners) listener(value);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
