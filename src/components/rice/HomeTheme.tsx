"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { HOME_THEME_STORAGE_KEY } from "./themePreference";
import "./homeTheme.css";

let selectedTheme: boolean | undefined;
const listeners = new Set<() => void>();
const serverTheme = () => true;

function readTheme() {
  if (selectedTheme !== undefined) return selectedTheme;
  try {
    return window.localStorage.getItem(HOME_THEME_STORAGE_KEY) !== "light";
  } catch {
    return document.documentElement.dataset.homeTheme !== "light";
  }
}

function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key !== HOME_THEME_STORAGE_KEY && event.key !== null) return;
    selectedTheme = undefined;
    listener();
  };
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", sync);
  };
}

function setDark(dark: boolean) {
  selectedTheme = dark;
  const theme = dark ? "dark" : "light";
  document.documentElement.dataset.homeTheme = theme;
  try {
    window.localStorage.setItem(HOME_THEME_STORAGE_KEY, theme);
  } catch {
    // The switch still works when browser storage is unavailable.
  }
  for (const listener of listeners) listener();
}

/**
 * Every mounted provider claims a theme; the newest claim owns `html[data-home-theme]`.
 * During a client navigation the page being left may unmount (or be hidden) after the next
 * page has set its theme. Deleting the attribute on unmount then left a paper page without a
 * theme, so headings, logo and footer fell back to the dark palette's light text until a
 * reload. With claims, unmount order no longer matters.
 */
const themeClaims: { theme: string }[] = [];

function applyThemeClaims() {
  const root = document.documentElement;
  const top = themeClaims[themeClaims.length - 1];
  if (!top) delete root.dataset.homeTheme;
  // The home and category stories mark their paper with data-world-paper while it covers the
  // screen; that page-level light state wins over the provider's resting dark claim.
  else root.dataset.homeTheme = root.hasAttribute("data-world-paper") ? "light" : top.theme;
}

const ThemeContext = createContext<{ dark: boolean; setDark: (dark: boolean) => void } | null>(
  null,
);

export function HomeThemeProvider({
  children,
  forcedTheme,
}: {
  children: ReactNode;
  forcedTheme?: "dark" | "light";
}) {
  const preference = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  const dark = forcedTheme ? forcedTheme === "dark" : preference;
  useLayoutEffect(() => {
    // Read the saved value even during the initial server-snapshot hydration pass.
    const claim = { theme: forcedTheme ?? (readTheme() ? "dark" : "light") };
    themeClaims.push(claim);
    applyThemeClaims();
    return () => {
      themeClaims.splice(themeClaims.indexOf(claim), 1);
      applyThemeClaims();
    };
  }, [dark, forcedTheme]);
  return (
    <ThemeContext.Provider value={{ dark, setDark: forcedTheme ? () => {} : setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useHomeTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("Home theme requires HomeThemeProvider");
  return theme;
}

export function HomeThemeSwitcher() {
  const { dark, setDark } = useHomeTheme();
  const t = useTranslations("hero.scene");
  return (
    <div className="home-theme" role="group" aria-label={t("theme")}>
      <button
        type="button"
        className="home-theme__swatch home-theme__swatch--light"
        aria-label={t("light")}
        title={t("light")}
        aria-pressed={!dark}
        onClick={() => setDark(false)}
      />
      <button
        type="button"
        className="home-theme__swatch home-theme__swatch--dark"
        aria-label={t("dark")}
        title={t("dark")}
        aria-pressed={dark}
        onClick={() => setDark(true)}
      />
    </div>
  );
}
