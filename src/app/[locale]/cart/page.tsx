import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { commerceMetadata } from "@/commerce/pageMeta";
import CommerceShell from "@/components/commerce/layout/CommerceShell";
import CartView from "@/components/commerce/cart/CartView";

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => commerceMetadata(params, "cart");

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <CommerceShell>
      <CartView />
    </CommerceShell>
  );
}
