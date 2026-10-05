import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing, localeLabels, type Locale } from "@/i18n/routing";
import { fontVariables } from "@/styles/fonts";
import SmoothScroll from "@/components/providers/SmoothScroll";
import InlineScript from "@/components/providers/InlineScript";
import Cursor from "@/components/ui/Cursor";
import CartProvider from "@/components/commerce/cart/CartProvider";
import CartDrawer from "@/components/commerce/cart/CartDrawer";
import SoundProvider from "@/components/sound/SoundProvider";
import CookieNotice from "@/components/legal/CookieNotice";
import { HOME_THEME_STORAGE_KEY } from "@/components/rice/themePreference";
import { COMPANY } from "@/content/site";
import "@/styles/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/* The phone's browser bar takes the World's night colour (styles/theme.css --color-world-night). */
export const viewport: Viewport = { themeColor: "#0a1320" };

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hugo-tron.com"),
  /* Location hints for local search (Hamburg, Friesenweg 2b). */
  other: {
    "geo.region": COMPANY.regionCode,
    "geo.placename": COMPANY.city,
    "geo.position": `${COMPANY.latitude};${COMPANY.longitude}`,
    ICBM: `${COMPANY.latitude}, ${COMPANY.longitude}`,
  },
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
    <html
      lang={localeLabels[locale as Locale].htmlLang}
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        {/* Marks JS as available so `.reveal-pending` can hide pre-animation
            content. Without JS the class never bites and content stays
            visible — see docs/handoff/ARCHITECTURE.md (Motion). */}
        <InlineScript
          html={`document.documentElement.classList.add('js');(function(){var p=location.pathname.split('/').filter(Boolean);var rice=(p.length===2&&['rice','reis'].includes(p[1]))||(p.length===3&&['products','sortiment'].includes(p[1])&&['rice','reis'].includes(p[2]));if(${JSON.stringify(routing.locales)}.includes(p[0])&&(p.length===1||['products','sortiment'].includes(p[1])||rice)){var t='dark';if(rice){try{if(localStorage.getItem('${HOME_THEME_STORAGE_KEY}')==='light')t='light'}catch(e){}}document.documentElement.dataset.homeTheme=t}})()`}
        />
      </head>
      <body>
        <NextIntlClientProvider>
          {/* Site-wide, so it survives navigation between pages rather than
              being torn down and re-created on each one. */}
          <SoundProvider>
            <Cursor />
            <SmoothScroll>
              <CartProvider>
                {children}
                <CartDrawer />
                <CookieNotice />
              </CartProvider>
            </SmoothScroll>
          </SoundProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
