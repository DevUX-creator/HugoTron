"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { categoryProducts, getCategories } from "@/commerce/catalogue";
import { useCart } from "@/components/commerce/cart/CartProvider";
import { useScrollLock } from "@/components/providers/SmoothScroll";
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";
import ArrowIcon from "@/components/ui/ArrowIcon";
import BrandLogo from "./BrandLogo";
import { AccountIcon, CartIcon } from "./Icons";
import "./mobileMenu.css";

type MenuLink = { href: ComponentProps<typeof Link>["href"]; label: string };

/** Each catalogue category with the products filed under it, resolved once. */
const groups = getCategories().map((category) => ({
  category,
  products: categoryProducts(category),
}));

/** How long the closing wipe runs; the CSS transition uses the same duration token. */
const CLOSE_MS = 280;

/**
 * The site menu: the whole navigation on phones and tablets, and on every width the one place
 * that also carries the products by category, cart, account, language and the legal pages
 * (the Impressum has to be reachable from every page, and the scene pages have no footer).
 *
 * A native modal `<dialog>`: `showModal()` puts it in the top layer over the whole viewport
 * (header and safe areas included), makes the page behind it inert, keeps Tab inside it and
 * turns Escape into a `cancel` event. Mechanics after the reference header (one trigger, a
 * panel that wipes down from the top, contents that follow in a short stagger, Lenis held while
 * it is open); the look is ours.
 *
 * Every way out funnels through `finish()`, which closes the dialog, releases the scroll locks
 * and hands focus back to the burger — so no path can leave an invisible modal over the page.
 * Following a link closes it at once rather than animating, and any route change (locale
 * included) closes it again as a guarantee.
 */
export default function MobileMenu({ links }: { links: readonly MenuLink[] }) {
  const t = useTranslations("nav");
  const names = useTranslations("world");
  const productNames = useTranslations("products");
  const legal = useTranslations("menu");
  const { count } = useCart();
  const route = `${useLocale()}:${usePathname()}`;
  const id = useId();
  const productsId = `${id}-products`;
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closing = useRef<number | null>(null);
  const savedOverflow = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const { lock, unlock } = useScrollLock();

  /** Closes the dialog and releases the scroll locks. DOM only, so effects may call it;
   *  the dialog's `close` event then brings React's state along. Idempotent. */
  const release = useCallback(() => {
    if (closing.current !== null) window.clearTimeout(closing.current);
    closing.current = null;
    const element = dialog.current;
    if (element) {
      delete element.dataset.state;
      if (element.open) element.close();
    }
    if (savedOverflow.current !== null) {
      document.body.style.overflow = savedOverflow.current;
      savedOverflow.current = null;
      unlock();
    }
  }, [unlock]);

  /** Closes for real: dialog, scroll locks, state, focus. */
  const finish = useCallback(
    (restoreFocus = true) => {
      release();
      setOpen(false);
      if (restoreFocus) trigger.current?.focus({ preventScroll: true });
    },
    [release],
  );

  const show = () => {
    const element = dialog.current;
    if (!element) return;
    if (closing.current !== null) window.clearTimeout(closing.current);
    closing.current = null;
    // Line the head up with the bar it covers, so the close button lands on the burger.
    const bar = trigger.current?.getBoundingClientRect();
    if (bar) element.style.setProperty("--menu-head-top", `${bar.top + bar.height / 2 - 22}px`);
    if (!element.open) element.showModal();
    if (savedOverflow.current === null) {
      savedOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      lock();
    }
    element.scrollTop = 0;
    setOpen(true);
    // One frame in the closed pose, then the wipe runs.
    requestAnimationFrame(() => {
      if (element.open) element.dataset.state = "open";
    });
  };

  /** Animated close for the close button and Escape. */
  const dismiss = useCallback(() => {
    const element = dialog.current;
    if (!element?.open) return finish();
    if (closing.current !== null) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return finish();
    element.dataset.state = "closing";
    closing.current = window.setTimeout(() => finish(), CLOSE_MS);
  }, [finish]);

  // Any route change closes the menu — a guarantee on top of the link handler below.
  useEffect(() => {
    if (route) release();
  }, [route, release]);

  // Unmounting (a page swap, a locale switch) never leaves a modal behind.
  useEffect(() => release, [release]);

  // Escape: animate out instead of the browser's instant close.
  const onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    dismiss();
  };

  // A link anywhere inside (locale switch included) closes synchronously, before navigation.
  const onClick = (event: MouseEvent<HTMLDialogElement>) => {
    const target = event.target as Element;
    if (target.closest("a[href]")) finish(false);
  };

  return (
    <>
      <button
        ref={trigger}
        className="header__tool header__menu"
        type="button"
        aria-controls={id}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={show}
      >
        <span className="header__menu-label">{t("menu")}</span>
        <span className="header__menu-icon" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      <dialog
        ref={dialog}
        id={id}
        className="mobile-menu"
        aria-label={t("menu")}
        onCancel={onCancel}
        onClose={() => finish(false)}
        onClick={onClick}
        data-lenis-prevent
      >
        <div className="mobile-menu__head">
          <Link href="/" className="mobile-menu__brand" aria-label={t("home")}>
            <BrandLogo />
          </Link>
          <button type="button" className="mobile-menu__close" onClick={dismiss} autoFocus>
            <span className="visually-hidden">{t("closeMenu")}</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        <div className="mobile-menu__body">
          <nav className="mobile-menu__nav" aria-label={t("primary")}>
            <p className="mobile-menu__eyebrow" aria-hidden="true">
              {t("explore")}
            </p>
            <ul>
              {links.map((link, index) => {
                const isRange = link.href === "/range";
                return (
                  <li
                    key={link.label}
                    className="mobile-menu__item"
                    style={{ "--i": index } as CSSProperties}
                  >
                    <div className="mobile-menu__row">
                      <Link href={link.href} prefetch={false} className="mobile-menu__link">
                        <span className="mobile-menu__index" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{link.label}</span>
                        {!isRange && <ArrowIcon />}
                      </Link>
                      {isRange && (
                        <button
                          type="button"
                          className="mobile-menu__toggle"
                          aria-expanded={productsOpen}
                          aria-controls={productsId}
                          onClick={() => setProductsOpen((value) => !value)}
                        >
                          <span className="visually-hidden">{t("toggleProducts")}</span>
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {isRange && (
                      <div
                        id={productsId}
                        className="mobile-menu__products"
                        data-open={productsOpen || undefined}
                        inert={!productsOpen}
                      >
                        <ul className="mobile-menu__groups" aria-label={names("categoriesLabel")}>
                          {groups.map(({ category, products }) => (
                            <li key={category.id} className="mobile-menu__group">
                              <Link
                                href={category.href}
                                prefetch={false}
                                className="mobile-menu__category"
                              >
                                <span>{names(category.id)}</span>
                                <span className="mobile-menu__count">
                                  {t("productCount", { count: products.length })}
                                </span>
                              </Link>
                              <ul>
                                {products.map((product) => (
                                  <li key={product.slug}>
                                    <Link
                                      href={{
                                        pathname: category.href,
                                        hash: `range-product-${product.slug}`,
                                      }}
                                      prefetch={false}
                                      className="mobile-menu__product"
                                    >
                                      {productNames(
                                        product.slug as Parameters<typeof productNames>[0],
                                      )}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mobile-menu__foot">
            <div className="mobile-menu__tools">
              <Link href="/cart" prefetch={false} className="mobile-menu__tool">
                <CartIcon className="mobile-menu__tool-icon" />
                <span>{t("cart")}</span>
                <span className="mobile-menu__badge">{t("cartCount", { count })}</span>
              </Link>
              <Link href="/account" prefetch={false} className="mobile-menu__tool">
                <AccountIcon className="mobile-menu__tool-icon" />
                <span>{t("account")}</span>
              </Link>
            </div>
            <nav className="mobile-menu__legal" aria-label={t("legal")}>
              <Link href="/imprint" prefetch={false}>
                {legal("imprint")}
              </Link>
              <Link href="/privacy" prefetch={false}>
                {legal("privacy")}
              </Link>
              <Link href="/terms" prefetch={false}>
                {legal("terms")}
              </Link>
            </nav>
            <div className="mobile-menu__language">
              <span className="mobile-menu__eyebrow" aria-hidden="true">
                {t("language")}
              </span>
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
