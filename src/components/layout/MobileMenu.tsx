"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCategories } from "@/commerce/catalogue";
import { useScrollLock } from "@/components/providers/SmoothScroll";
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";
import ArrowIcon from "@/components/ui/ArrowIcon";
import BrandLogo from "./BrandLogo";
import "./mobileMenu.css";

type MenuLink = { href: ComponentProps<typeof Link>["href"]; label: string };
const categories = getCategories();

export default function MobileMenu({ links }: { links: readonly MenuLink[] }) {
  const t = useTranslations("nav");
  const names = useTranslations("world");
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { lock, unlock } = useScrollLock();

  useEffect(() => {
    const element = dialog.current;
    const opener = trigger.current;
    if (!element || !open) return;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    lock();
    const wide = matchMedia("(min-width: 64rem)");
    const resize = () => {
      if (wide.matches) setOpen(false);
    };
    wide.addEventListener("change", resize);
    return () => {
      wide.removeEventListener("change", resize);
      element.close();
      document.body.style.overflow = overflow;
      unlock();
      opener?.focus({ preventScroll: true });
    };
  }, [open, lock, unlock]);

  return (
    <>
      <button
        ref={trigger}
        className="header__tool header__menu"
        type="button"
        aria-label={t("menu")}
        aria-controls={id}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 8H21M3 16H21" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <dialog
        ref={dialog}
        id={id}
        className="mobile-menu"
        aria-label={t("menu")}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <div className="mobile-menu__inner" data-lenis-prevent>
          <div className="mobile-menu__head">
            <Link href="/" aria-label={t("home")} onClick={() => setOpen(false)}>
              <BrandLogo />
            </Link>
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              aria-label={t("closeMenu")}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
          <nav className="mobile-menu__nav" aria-label={t("primary")}>
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                prefetch={false}
                onClick={() => setOpen(false)}
              >
                <span>{link.label}</span>
                <ArrowIcon />
              </Link>
            ))}
          </nav>
          <nav className="mobile-menu__categories" aria-label={names("categoriesLabel")}>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                prefetch={false}
                onClick={() => setOpen(false)}
              >
                {names(category.id)}
              </Link>
            ))}
          </nav>
          <LocaleSwitcher />
        </div>
      </dialog>
    </>
  );
}
