"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { HOME_THEME_STORAGE_KEY } from "./themePreference";
import InlineScript from "@/components/providers/InlineScript";
import { createPageThemes } from "./pageTheme";

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
  try {
    window.localStorage.setItem(HOME_THEME_STORAGE_KEY, theme);
  } catch {
    // The switch still works when browser storage is unavailable.
  }
  for (const listener of listeners) listener();
}

const pageThemes = createPageThemes(({ theme, paper, leave }) => {
  const root = document.documentElement;
  if (!theme) delete root.dataset.homeTheme;
  else if (root.dataset.homeTheme !== theme) root.dataset.homeTheme = theme;
  if (root.hasAttribute("data-world-paper") !== paper)
    root.toggleAttribute("data-world-paper", paper);
  if (leave === null) root.style.removeProperty("--leave");
  else root.style.setProperty("--leave", leave.toFixed(4));
});

const ThemeContext = createContext<{
  dark: boolean;
  setDark: (dark: boolean) => void;
  setPaper: (paper: boolean, leave?: number | null) => void;
} | null>(null);

export function HomeThemeProvider({
  children,
  forcedTheme,
}: {
  children: ReactNode;
  forcedTheme?: "dark" | "light";
}) {
  const preference = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  const dark = forcedTheme ? forcedTheme === "dark" : preference;
  const [scope] = useState(() => pageThemes.createScope());
  useLayoutEffect(() => {
    // Read the saved value even during the initial server-snapshot hydration pass.
    return scope.activate(forcedTheme ?? (readTheme() ? "dark" : "light"));
  }, [dark, forcedTheme, scope]);
  return (
    <ThemeContext.Provider
      value={{ dark, setDark: forcedTheme ? () => {} : setDark, setPaper: scope.setPaper }}
    >
      {/* Document loads use the page's actual theme before its content paints.
          Soft navigations use the layout effect; InlineScript does not run there. */}
      <InlineScript
        html={`(function(){var t=${JSON.stringify(forcedTheme ?? "dark")};${forcedTheme ? "" : `try{if(localStorage.getItem('${HOME_THEME_STORAGE_KEY}')==='light')t='light'}catch(e){}`}document.documentElement.dataset.homeTheme=t})()`}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useHomeTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("Home theme requires HomeThemeProvider");
  return theme;
}

/** Stable callback scoped to the page containing this story, never another route. */
export function usePaperTheme() {
  return useHomeTheme().setPaper;
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
