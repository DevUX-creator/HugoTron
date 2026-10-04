import type { ReactNode } from "react";
import Image from "next/image";
import { ILLUSTRATIONS, type IllustrationId } from "./illustrations";
import "./feedback.css";

/**
 * Every commerce success, notice and error looks the same: an illustration, a title, a short
 * explanation and what to do next. Errors are announced immediately (role="alert"); successes
 * and notices politely (role="status").
 */
export default function StatusMessage({
  tone,
  title,
  children,
  illustration,
  actions,
  compact = false,
}: {
  tone: "success" | "error" | "info";
  title: string;
  children?: ReactNode;
  illustration?: IllustrationId;
  actions?: ReactNode;
  /** Inline in a form: no illustration, smaller type. */
  compact?: boolean;
}) {
  const art = illustration ? ILLUSTRATIONS[illustration] : null;
  return (
    <div
      className="status-message"
      data-tone={tone}
      data-compact={compact || undefined}
      role={tone === "error" ? "alert" : "status"}
    >
      {art && !compact && (
        <div className="status-message__art" data-illustration={illustration} aria-hidden="true">
          {art.ready ? (
            <Image src={art.src} alt="" width={640} height={480} sizes="320px" />
          ) : (
            <span className="status-message__placeholder" />
          )}
        </div>
      )}
      <div className="status-message__copy">
        <p className="status-message__title">{title}</p>
        {children && <div className="status-message__body">{children}</div>}
        {actions && <div className="status-message__actions">{actions}</div>}
      </div>
    </div>
  );
}
