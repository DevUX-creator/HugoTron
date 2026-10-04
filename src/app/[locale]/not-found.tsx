import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import CommerceShell from "@/components/commerce/layout/CommerceShell";
import StatusMessage from "@/components/commerce/feedback/StatusMessage";

/** A page that does not exist (or has moved): the site's paper, a way home and a way to ask. */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <CommerceShell label={t("title")}>
      {/* not-found cannot export metadata; React hoists this into the head. */}
      <title>{`${t("title")} | Hugo Tron`}</title>
      <div className="order-page">
        <h1 className="visually-hidden">{t("title")}</h1>
        <StatusMessage
          tone="info"
          title={t("title")}
          illustration="error"
          actions={
            <>
              <Link href="/" className="commerce-button">
                {t("home")}
              </Link>
              <Link href="/range" className="commerce-button commerce-button--ghost">
                {t("products")}
              </Link>
            </>
          }
        >
          <p>{t("body")}</p>
        </StatusMessage>
      </div>
    </CommerceShell>
  );
}
