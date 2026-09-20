"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useScrollLock, useScrollWake } from "@/components/providers/SmoothScroll";
import "./menu.css";

const MAIN = [
  { href: "/range", key: "range" },
  { href: "/wholesale", key: "wholesale" },
  { href: "/private-label", key: "privateLabel" },
  { href: "/about", key: "about" },
  { href: "/delivery", key: "delivery" },
  { href: "/contact", key: "contact" },
] as const;

const LEGAL = [
  { href: "/terms", key: "terms" },
  { href: "/privacy", key: "privacy" },
  { href: "/imprint", key: "imprint" },
] as const;

/**
 * The site menu — a full-height panel that WIPES IN FROM THE LEFT.
 *
 * Adapted from the PV_energy project, simplified to one mode: that overlay was
 * shared by a menu and an offices browser, and we have no offices.
 *
 * The wipe is a `clip-path` inset animated from `inset(0 100% 0 0)` (nothing
 * showing, collapsed against the left edge) to `inset(0 0 0 0)`. The cards then
 * stagger in along the SAME axis the panel arrived on — a vertical stagger
 * under a horizontal wipe reads as two unrelated movements.
 *
 * GSAP is imported dynamically, so the menu costs nothing until it is opened.
 */
export default function Menu() {
  const t = useTranslations("menu");
  const tNav = useTranslations("nav");
  const [open, setOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const animating = useRef(false);

  const { lock, unlock } = useScrollLock();
  const wakeScroll = useScrollWake();
  /* The wipe effect below must run for a CHANGE OF `open` and nothing else —
     re-entering it mid-animation restarts the timeline from the closed state.
     The lock is reached through a ref so it is not a dependency, and the ref
     is written in an effect rather than during render. */
  const scrollLock = useRef({ lock, unlock });
  useEffect(() => {
    scrollLock.current = { lock, unlock };
  }, [lock, unlock]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;

    const run = async () => {
      const { gsap } = await import("@/lib/gsap");
      if (cancelled) return;

      /* The frame loop sleeps when the page is idle, and a click that reaches
         this through the keyboard or a programmatic open never woke it — the
         wipe then started and froze at 99.9%. Wake it before animating. */
      wakeScroll();

      const cards = panel.querySelectorAll<HTMLElement>(".menu__card");

      /* With motion disabled, apply the final state directly. A zero-duration
         staggered timeline can leave the trigger waiting for completion. */
      if (reduce) {
        if (open) scrollLock.current.lock();
        else scrollLock.current.unlock();
        gsap.set(overlay, { autoAlpha: open ? 1 : 0 });
        gsap.set(panel, { clipPath: open ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" });
        gsap.set(cards, { x: 0, autoAlpha: 1 });
        animating.current = false;
        return;
      }

      animating.current = true;

      if (open) {
        scrollLock.current.lock();
        gsap.set(overlay, { autoAlpha: 1 });

        const tl = gsap.timeline({
          onComplete: () => {
            animating.current = false;
          },
        });
        tl.fromTo(
          panel,
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power3.inOut" },
        );
        tl.fromTo(
          cards,
          { x: -40, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.55,
            stagger: 0.07,
            ease: "power3.out",
          },
          "-=0.35",
        );
      } else {
        scrollLock.current.unlock();
        gsap.to(panel, {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.45,
          ease: "power3.inOut",
          onComplete: () => {
            gsap.set(overlay, { autoAlpha: 0 });
            animating.current = false;
          },
        });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, wakeScroll]);

  /* Escape closes, and focus goes back to the control that opened it — a
     keyboard user must never be stranded in a closed dialog. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [open, wakeScroll]);

  /* Scroll lock is an effect, so it has to be released if this unmounts while
     open — otherwise the page is left frozen with no way to unfreeze it. */
  useEffect(() => () => scrollLock.current.unlock(), []);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`menu-btn${open ? " is-open" : ""}`}
        aria-label={open ? t("close") : tNav("openMenu")}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => {
          if (animating.current) return;
          setOpen((v) => !v);
        }}
      >
        <span className="menu-btn__bars" aria-hidden="true">
          <span />
          <span />
        </span>
        <span className="header__control-label">{open ? t("close") : tNav("menu")}</span>
      </button>

      <div
        id="site-menu"
        ref={overlayRef}
        className="menu"
        role="dialog"
        aria-modal="true"
        aria-label={tNav("primary")}
        /* Closed, the panel is clipped to nothing but its links are still in
           the DOM — `inert` keeps them out of the tab order and out of the
           accessibility tree instead of relying on the clip alone. */
        inert={!open}
      >
        <div ref={panelRef} className="menu__panel" tabIndex={-1}>
          <div className="menu__inner">
            <div className="menu__grid">
              <nav className="menu__card menu__card--nav" aria-label={tNav("primary")}>
                <p className="menu__eyebrow eyebrow">{t("navigate")}</p>
                <ul className="menu__list">
                  {MAIN.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="menu__link" onClick={close}>
                        {/* Same two-face swap as the header nav. */}
                        <span className="menu__swap">
                          <span className="menu__face">{tNav(item.key)}</span>
                          <span className="menu__face" aria-hidden="true">
                            {tNav(item.key)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="menu__card menu__card--contact">
                <p className="menu__eyebrow eyebrow">{t("getInTouch")}</p>
                <a href="mailto:info@hugo-tron.com" className="menu__contact">
                  info@hugo-tron.com
                </a>
                <a href="tel:+494021078869" className="menu__contact">
                  +49 40 210 788 69
                </a>
                <p className="menu__address">
                  Friesenweg 2b
                  <br />
                  22763 Hamburg
                </p>
              </div>

              <div className="menu__card menu__card--meta">
                <p className="menu__tagline">{t("tagline")}</p>
                <ul className="menu__meta-list">
                  {LEGAL.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="menu__meta-link" onClick={close}>
                        {t(item.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
