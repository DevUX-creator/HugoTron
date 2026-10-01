import { useTranslations } from "next-intl";
import "./announcementBar.css";

/** The shipping strip links directly to the homepage delivery answers. */
export default function AnnouncementBar() {
  const t = useTranslations("announcement");

  return (
    <aside className="announce">
      <a href="#delivery" className="announce__panel">
        <span className="announce__chip">{t("chip")}</span>
        <span className="announce__message">{t("message")}</span>
        <svg
          className="announce__chevron"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </aside>
  );
}
