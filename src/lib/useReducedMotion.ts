"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const snapshot = () => window.matchMedia(QUERY).matches;
const serverSnapshot = () => false;

/** React to preference changes without requiring a reload. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
