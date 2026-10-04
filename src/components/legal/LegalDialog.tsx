"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { LegalDocument } from "@/content/legal/types";
import { useScrollLock } from "@/components/providers/SmoothScroll";
import LegalBlocks from "./LegalBlocks";
import "./legal.css";

/**
 * A legal text in a dialog, so the buyer reads it without leaving checkout (used for the
 * cancellation policy). The withdrawal function itself stays on its own route, linked here.
 */
export default function LegalDialog({
  document,
  open,
  onClose,
}: {
  document: LegalDocument;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("legal");
  const dialog = useRef<HTMLDialogElement>(null);
  const { lock, unlock } = useScrollLock();
  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    element.showModal();
    lock();
    return () => {
      element.close();
      unlock();
    };
  }, [open, lock, unlock]);
  return (
    <dialog
      ref={dialog}
      className="legal-dialog"
      aria-labelledby="legal-dialog-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="legal-dialog__inner" data-lenis-prevent>
        <header className="legal-dialog__head">
          <h2 id="legal-dialog-title">{document.title}</h2>
          <button
            type="button"
            className="legal-dialog__close"
            onClick={onClose}
            aria-label={t("close")}
            autoFocus
          >
            ×
          </button>
        </header>
        {document.translationNote && <p className="legal__note">{document.translationNote}</p>}
        <div className="legal__body">
          <LegalBlocks
            blocks={document.blocks}
            slot={
              <p>
                <Link
                  href={{ pathname: "/withdrawal", hash: "widerrufen" }}
                  className="commerce-link"
                  target="_blank"
                >
                  {t("withdraw")}
                </Link>
              </p>
            }
          />
        </div>
      </div>
    </dialog>
  );
}
