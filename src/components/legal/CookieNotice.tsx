"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import "./cookieNotice.css";

// An acknowledgement only: this must never be used as permission to load trackers.
const STORAGE_KEY = "hugo.storage-notice.v1";
const CHANGE_EVENT = "hugo:storage-notice";
let dismissedForVisit = false;

function isVisible() {
  if (dismissedForVisit) return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "dismissed";
  } catch {
    return !dismissedForVisit;
  }
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      dismissedForVisit = false;
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

function dismiss() {
  dismissedForVisit = true;
  try {
    localStorage.setItem(STORAGE_KEY, "dismissed");
  } catch {
    // The notice still dismisses for this visit when storage is unavailable.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Non-modal storage information for the current app, which has no optional trackers. */
export default function CookieNotice() {
  const t = useTranslations("cookieNotice");
  const legal = useTranslations("menu");
  const visible = useSyncExternalStore(subscribe, isVisible, () => false);
  if (!visible) return null;

  return (
    <aside className="cookie-notice" aria-labelledby="cookie-notice-title" data-lenis-prevent>
      <h2 id="cookie-notice-title">{t("title")}</h2>
      <p>{t("body")}</p>
      <div className="cookie-notice__actions">
        <nav aria-label={t("links")}>
          <Link href="/privacy" prefetch={false}>
            {legal("privacy")}
          </Link>
          <Link href="/terms" prefetch={false}>
            {legal("terms")}
          </Link>
          <Link href="/imprint" prefetch={false}>
            {legal("imprint")}
          </Link>
        </nav>
        <Button variant="outline" showArrow={false} onClick={dismiss}>
          {t("dismiss")}
        </Button>
      </div>
    </aside>
  );
}
