import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";
import Menu from "./Menu/Menu";
import { SearchIcon, AccountIcon, CartIcon } from "./Icons";
import "./header.css";

/**
 * Two stacked rows, following the reference layout
 * (public/reference/brigade-desktop.png):
 *
 *   1. NAV ROW — the primary links spread across the full width, split by
 *      vertical hairlines, closed by a rule underneath. Desktop only; below
 *      `lg` the links move into the menu.
 *   2. BRAND BAR — menu control left, logo centred, account and cart right.
 *
 * The logo plate hangs below the brand bar onto the hero, so neither row may
 * clip its overflow.
 *
 * The menu button is currently inert — the drawer and its motion come later,
 * per Dmitrij. It is still a real `<button>` with an accessible name so the
 * markup does not change when it is wired up.
 */
export default function Header() {
  const t = useTranslations("nav");

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

      <div className="header__bar">
        <div className="header__side header__side--start">
          {/* Owns both the trigger and the overlay, so the open state stays
              where it is used. */}
          <Menu />
          <button type="button" className="header__control" aria-label={t("search")}>
            <SearchIcon className="header__icon" />
          </button>
          <LocaleSwitcher />
        </div>

        <Link href="/" className="header__brand" aria-label={t("home")}>
          {/* The concave joints. Without them the plate meets the bar at two
              right angles and reads as a block sitting on top of the header;
              with them the bar appears to flow down into the plate. See
              public/reference/shape-klim-panels.png. */}
          <span className="morph-fillet morph-fillet--left header__brand-fillet" />
          <span className="morph-fillet morph-fillet--right header__brand-fillet" />
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
          <button type="button" className="header__control" aria-label={t("account")}>
            <AccountIcon className="header__icon" />
          </button>
          <Link href="/cart" className="header__control header__control--cart">
            <span className="header__cart-mark">
              <CartIcon className="header__icon" />
              {/* Count as an accent badge. Reads at a glance, and gives the
                  accent a second place to appear in the chrome. */}
              <span className="header__cart-count">0</span>
            </span>
            <span className="header__control-label">{t("cart")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
