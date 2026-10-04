"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HomeThemeProvider } from "@/components/rice/HomeTheme";
import StatusMessage from "@/components/commerce/feedback/StatusMessage";
import "@/components/commerce/layout/commerceShell.css";

/** Keep provider outages recoverable without exposing internal error details. */
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("commerce.errors");
  return (
    <HomeThemeProvider forcedTheme="light">
      <main id="main" className="commerce">
        <h1 className="commerce-caption">{t("genericTitle")}</h1>
        <StatusMessage
          tone="error"
          title={t("genericTitle")}
          actions={
            <>
              <button type="button" className="commerce-button" onClick={retry}>
                {t("retry")}
              </button>
              <Link href="/contact" className="commerce-button commerce-button--ghost">
                {t("contactUs")}
              </Link>
            </>
          }
        >
          <p>{t("generic")}</p>
        </StatusMessage>
      </main>
    </HomeThemeProvider>
  );
}
