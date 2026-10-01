import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { getPathname, Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";
import SwapLabel from "@/components/ui/SwapLabel";
import Wordmark from "./Wordmark";
import BrandLogo from "./BrandLogo";
import { SearchIcon, AccountIcon } from "./Icons";
import CartButton from "@/components/cart/CartButton";
import SoundToggle from "@/components/sound/SoundToggle";
import "./header.css";

/** Floating navigation shared by the world, product experiences and enquiry. */
export default function Header({
  brandControl,
  brandLogo = false,
  showSoundToggle = true,
}: {
  brandControl?: ReactNode;
  brandLogo?: boolean;
  showSoundToggle?: boolean;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();

  const links = [
    { href: "/range", label: t("range") },
    { href: "/wholesale", label: t("wholesale") },
    { href: "/private-label", label: t("privateLabel") },
    { href: "/about", label: t("about") },
    { href: "/delivery", label: t("delivery") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className="header">
      <div className="header__start">
        {/* A document navigation intentionally reloads the localized homepage. */}
        <a
          href={getPathname({ locale, href: "/" })}
          className="header__brand"
          aria-label={t("home")}
        >
          {brandLogo ? <BrandLogo /> : <Wordmark />}
        </a>
        {brandControl}
      </div>

      <div className="header__end">
        <nav aria-label={t("primary")}>
          <ul className="header__links">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="header__link swap-host"
                  data-cursor="wrap"
                  data-sound-hover
                >
                  <SwapLabel>{link.label}</SwapLabel>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <span className="header__rule" aria-hidden="true" />

        <div className="header__tools">
          {showSoundToggle && <SoundToggle />}
          <button type="button" className="header__tool" aria-label={t("search")}>
            <SearchIcon className="header__icon" />
          </button>

          <LocaleSwitcher />

          {/* TODO(auth): a real destination once accounts exist. It is a
              button rather than a link for exactly that reason — a link to
              nowhere is worse than a control that does not act yet. */}
          <button type="button" className="header__tool" aria-label={t("account")}>
            <AccountIcon className="header__icon" />
          </button>

          <CartButton />
        </div>
      </div>
    </header>
  );
}
