import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { backend, commerceAvailable } from "@/commerce/backend";
import ServiceUnavailable from "@/components/commerce/feedback/ServiceUnavailable";
import StatusMessage from "@/components/commerce/feedback/StatusMessage";
import { commerceMetadata } from "@/commerce/pageMeta";
import { getSession } from "@/commerce/session";
import CommerceShell from "@/components/commerce/layout/CommerceShell";
import AccountOverview from "@/components/commerce/account/AccountOverview";
import AuthPanel from "@/components/commerce/account/AuthPanel";
import "@/components/commerce/account/account.css";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string; returnTo?: string; email?: string; authError?: string }>;
};

export const generateMetadata = ({ params }: Props) => commerceMetadata(params, "account");

/** Signed out: sign in, register or reset. Signed in: orders, address, sign out. */
export default async function AccountPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (!commerceAvailable()) return <ServiceUnavailable />;
  const t = await getTranslations("commerce.errors");
  const query = await searchParams;
  const session = await getSession();
  if (!session) {
    const mode = query.mode === "register" || query.mode === "reset" ? query.mode : "signin";
    return (
      <CommerceShell>
        {query.authError && (
          <StatusMessage tone="error" title={t("genericTitle")}>
            <p>{t("generic")}</p>
          </StatusMessage>
        )}
        <AuthPanel initialMode={mode} returnTo={query.returnTo ?? ""} email={query.email ?? ""} />
      </CommerceShell>
    );
  }
  const orders = await backend().orders.listForCustomer(session.customer.id);
  return (
    <CommerceShell>
      <AccountOverview customer={session.customer} orders={orders} locale={locale} />
    </CommerceShell>
  );
}
