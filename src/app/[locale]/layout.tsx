import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing, localeLabels, type Locale } from "@/i18n/routing";
import { fontVariables } from "@/styles/fonts";
import SmoothScroll from "@/components/providers/SmoothScroll";
import "@/styles/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hugo-tron.com"),
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  /* Without this the route silently becomes dynamic and loses prerendering. */
  setRequestLocale(locale);

  return (
    <html lang={localeLabels[locale as Locale].htmlLang} className={fontVariables}>
      <head>
        {/* Marks JS as available so `.reveal-pending` can hide pre-animation
            content. Without JS the class never bites and content stays
            visible — see docs/ANIMATION.md, contract item 3. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
