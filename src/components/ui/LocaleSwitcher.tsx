"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { locales, localeLabels } from "@/i18n/routing";
import "./localeSwitcher.css";

/**
 * DE / EN toggle.
 *
 * Renders real links rather than a select or a button, so each language is
 * crawlable, middle-clickable and reachable without JavaScript. `usePathname`
 * returns the INTERNAL route, and passing it back through the typed `Link`
 * rebuilds the translated path for the target locale — so switching language
 * on `/de/grosshandel` lands on `/en/wholesale`, not on the English homepage.
 *
 * Client component only because it needs the current route.
 */
export default function LocaleSwitcher() {
  const active = useLocale();
  const pathname = usePathname();
  const params = useParams();

  return (
    <div className="locale-switcher">
      {locales.map((locale) => {
        const isActive = locale === active;
        return (
          <Link
            key={locale}
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            href={{ pathname, params } as any}
            locale={locale}
            className="locale-switcher__link"
            aria-current={isActive ? "true" : undefined}
            hrefLang={localeLabels[locale].htmlLang}
          >
            <span aria-hidden="true">{localeLabels[locale].short}</span>
            <span className="visually-hidden">{localeLabels[locale].name}</span>
          </Link>
        );
      })}
    </div>
  );
}
