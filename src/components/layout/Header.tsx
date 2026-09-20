import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MenuIcon, SearchIcon, AccountIcon, CartIcon } from "./Icons";
import "./header.css";

/**
 * Sticky header with the logo centred.
 *
 * Three tracks: controls left, brand centre, controls right. The brand sits in
 * a plate that hangs BELOW the bar's bottom edge, repeating the announcement
 * panel's rounded-bottom shape — that overhang is what stops a centred logo
 * reading as merely symmetrical.
 *
 * DESKTOP shows the primary links inline, split by hairlines. BELOW `lg` they
 * collapse into the menu button, which is currently inert — the drawer and its
 * motion come later, per Dmitrij. The button is still a real `<button>` with an
 * accessible name so the markup does not have to change when it is wired up.
 */
export default function Header() {
  const t = useTranslations("nav");

  const links = [
    { href: "/range", label: t("range") },
    { href: "/wholesale", label: t("wholesale") },
    { href: "/private-label", label: t("privateLabel") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className="header">
      <div className="header__bar">
        <div className="header__side header__side--start">
          <button
            type="button"
            className="header__icon-btn header__menu"
            aria-label={t("openMenu")}
          >
            <MenuIcon className="header__icon" />
          </button>
          <button type="button" className="header__icon-btn" aria-label={t("search")}>
            <SearchIcon className="header__icon" />
          </button>

          <nav className="header__nav" aria-label={t("primary")}>
            <ul className="header__nav-list">
              {links.map((link) => (
                <li key={link.href} className="header__nav-item">
                  <Link href={link.href} className="header__nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link href="/" className="header__brand" aria-label={t("home")}>
          {/* The logo is a solid navy block, so it IS the plate rather than
              sitting on one — the artwork's own ground provides the shape.
              Cropped with object-fit because the source is near-square with
              generous navy padding; a full square would hang far too deep.

              Raster lifted from the live site. A vector original is requested —
              see content/strategy/kundenfragebogen.md §A. */}
          <Image
            src="/brand/logo.png"
            alt="Hugo Tron GmbH"
            width={536}
            height={510}
            priority
            className="header__logo"
          />
        </Link>

        <div className="header__side header__side--end">
          <button type="button" className="header__icon-btn" aria-label={t("account")}>
            <AccountIcon className="header__icon" />
          </button>
          <Link href="/cart" className="header__icon-btn" aria-label={t("cart")}>
            <CartIcon className="header__icon" />
          </Link>
        </div>
      </div>
    </header>
  );
}
