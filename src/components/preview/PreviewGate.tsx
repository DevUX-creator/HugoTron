"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { useScrollLock } from "@/components/providers/SmoothScroll";
import "./previewGate.css";

/**
 * TEMPORARY, for the client preview: only the home page is ready. Any link to another page of
 * this site opens a short note instead of navigating. Home, language, anchors, email and phone
 * links still work. Remove this component (and its line in the locale layout) to open the site.
 */
function leadsToSubpage(anchor: HTMLAnchorElement) {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return false;
  const segments = url.pathname.split("/").filter(Boolean);
  const isHome =
    segments.length === 0 ||
    (segments.length === 1 && (routing.locales as readonly string[]).includes(segments[0]!));
  return !isHome;
}

export default function PreviewGate() {
  const t = useTranslations("preview");
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const { lock, unlock } = useScrollLock();

  useEffect(() => {
    const intercept = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !leadsToSubpage(anchor)) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
    };
    // Capture phase, so the note opens before any link (or Next's router) acts on the click.
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    if (!element.open) element.showModal();
    lock();
    return () => {
      if (element.open) element.close();
      unlock();
    };
  }, [open, lock, unlock]);

  return (
    <dialog
      ref={dialog}
      className="preview-gate"
      aria-labelledby="preview-gate-title"
      onClose={() => setOpen(false)}
      onClick={(event) => {
        // A click on the backdrop closes the note.
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div className="preview-gate__card">
        <p className="preview-gate__eyebrow">{t("eyebrow")}</p>
        <h2 id="preview-gate-title">{t("title")}</h2>
        <p className="preview-gate__body">{t("body")}</p>
        <button
          type="button"
          className="preview-gate__close"
          onClick={() => setOpen(false)}
          autoFocus
        >
          {t("close")}
        </button>
      </div>
    </dialog>
  );
}
