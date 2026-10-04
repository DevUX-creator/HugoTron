import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation primitives. Always import `Link`, `permanentRedirect`, `useRouter`,
 * `usePathname` and `getPathname` from here rather than from `next/*` — these
 * apply the locale prefix and the translated pathname map automatically.
 * ESLint enforces this (see eslint.config.mjs).
 */
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
