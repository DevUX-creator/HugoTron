import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ArrowIcon from "@/components/ui/ArrowIcon";
import "./announcementBar.css";

/**
 * The delivery promise, as a strip at the top of the page content (below the floating header,
 * never over it). It opens the Delivery page.
 */
export default function AnnouncementBar() {
  const t = useTranslations("announcement");
  return (
    <aside className="announce" aria-label={t("chip")}>
      <Link href="/delivery" prefetch={false} className="announce__panel">
        <span className="announce__chip">{t("chip")}</span>
        <span className="announce__message">{t("message")}</span>
        <ArrowIcon className="announce__arrow" />
      </Link>
    </aside>
  );
}
