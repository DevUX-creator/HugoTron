import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import CommerceShell from "../layout/CommerceShell";
import StatusMessage from "./StatusMessage";

/** Render a useful contact route instead of forms backed by a disabled provider. */
export default async function ServiceUnavailable() {
  const t = await getTranslations("commerce.errors");
  return (
    <CommerceShell>
      <h1 className="commerce-caption">{t("unavailableTitle")}</h1>
      <StatusMessage
        tone="info"
        title={t("unavailableTitle")}
        actions={
          <Link href="/contact" className="commerce-button">
            {t("contactUs")}
          </Link>
        }
      >
        <p>{t("unavailable")}</p>
      </StatusMessage>
    </CommerceShell>
  );
}
