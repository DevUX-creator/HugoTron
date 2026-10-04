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
    const root = document.documentElement;
    // Read the saved value even during the initial server-snapshot hydration pass.
    root.dataset.homeTheme = forcedTheme ?? (readTheme() ? "dark" : "light");
    return () => {
      delete root.dataset.homeTheme;
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
