import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import "./announcementBar.css";

/**
 * The shipping strip above the header.
 *
 * A dark panel inset from the viewport edges with its BOTTOM corners rounded,
 * so it reads as hanging from the top of the page rather than as a full-bleed
 * band. The header's logo plate repeats that shape, which is what ties the two
 * together as one piece of chrome.
 *
 * It is a link, not a notice: the one thing the old site never resolved is what
 * delivery actually costs (see content/strategy/audit.md §3), so the promise
 * points straight at the page that will answer it.
 */
export default function AnnouncementBar() {
  const t = useTranslations("announcement");

  return (
    <aside className="announce">
      <Link href="/delivery" className="announce__panel">
        <span className="announce__eyebrow eyebrow">{t("eyebrow")}</span>
        <span className="announce__message">{t("message")}</span>
        <svg
          className="announce__chevron"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </aside>
  );
}
