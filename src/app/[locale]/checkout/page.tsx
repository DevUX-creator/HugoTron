import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { commerceMetadata } from "@/commerce/pageMeta";
import { guestCheckoutAllowed } from "@/commerce/dev/settings";
import { getSession } from "@/commerce/session";
import { legalDocument } from "@/lib/legal/source";
import type { Locale } from "@/i18n/routing";
import CommerceShell from "@/components/commerce/layout/CommerceShell";
import CheckoutFlow from "@/components/commerce/checkout/CheckoutFlow";
import { commerceAvailable, isMockCommerce } from "@/commerce/backend";
import ServiceUnavailable from "@/components/commerce/feedback/ServiceUnavailable";

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => commerceMetadata(params, "checkout");

/** Checkout: contact, delivery, payment, review. See docs/BACKEND.md for the flow. */
export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (!commerceAvailable()) return <ServiceUnavailable />;
  const session = await getSession();
  const customer = session
    ? {
        email: session.customer.email,
        firstName: session.customer.firstName,
        lastName: session.customer.lastName,
        address: session.customer.address,
      }
    : null;
  return (
    <CommerceShell>
      <CheckoutFlow
        preview={isMockCommerce()}
        customer={customer}
        allowGuest={await guestCheckoutAllowed()}
        cancellationPolicy={legalDocument("withdrawal", locale as Locale)}
      />
    </CommerceShell>
  );
}
