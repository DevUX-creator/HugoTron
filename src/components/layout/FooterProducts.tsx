"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import ArrowLink from "@/components/ui/ArrowLink";
import type { ProductSlug } from "@/lib/catalogue";
import "./footerProducts.css";

const FOOTER_PRODUCTS = [
  "pardis-1121-basmati-indien",
  "premium-negin-safran",
  "pistazien-mit-schale",
  "vahdam-earl-grey",
  "aladdin-1121-basmati-pakistan",
  "pistazienkerne",
  "pardis-basmati-indien-1kg",
  "kichererbsen-25kg",
  "aladdin-basmati-pakistan-1kg",
] as const satisfies readonly ProductSlug[];

/** Accordion frames adapted from the supplied Footer.zip. */
export default function FooterProducts() {
  const t = useTranslations("homeStory.contact");
  const products = useTranslations("products");
  const controls = useTranslations("cart");
  const [active, setActive] = useState(0);
  const selectors = useRef<(HTMLButtonElement | null)[]>([]);
  const count = FOOTER_PRODUCTS.length;

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % count;
        break;
      case "ArrowLeft":
        next = (index + count - 1) % count;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    setActive(next);
    selectors.current[next]?.focus({ preventScroll: true });
  }

  return (
    <section
      className="footer-products"
      aria-label={t("productGallery")}
      style={{ "--frame-count": count } as CSSProperties}
    >
      <div className="footer-products__track">
        <ul className="footer-products__panels">
          {FOOTER_PRODUCTS.map((slug, index) => (
            <li
              className="footer-products__panel"
              data-active={index === active}
              key={slug}
              style={
                {
                  "--frame-index": index,
                  "--frame-offset":
                    index > active ? "var(--frame-open) - var(--frame-closed)" : "0px",
                } as CSSProperties
              }
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setActive(index);
              }}
            >
              <div className="footer-products__image">
                <Image
                  src={`/products/${slug}/lifestyle-parallax.png?v=2`}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 800px, 640px"
                />
              </div>
              <button
                className="footer-products__select"
                type="button"
                aria-label={products(slug)}
                aria-pressed={index === active}
                tabIndex={index === active ? 0 : -1}
                ref={(element) => {
                  selectors.current[index] = element;
                }}
                onClick={() => setActive(index)}
                onFocus={() => setActive(index)}
                onKeyDown={(event) => navigate(event, index)}
              />
              <div className="footer-products__overlay" inert={index !== active}>
                <ArrowLink
                  href={{ pathname: "/enquiry", query: { product: slug } }}
                  className="footer-products__order"
                >
                  {t("order")}
                  <span className="sr-only"> — {products(slug)}</span>
                </ArrowLink>
                <h3 className="footer-products__name">{products(slug)}</h3>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="footer-products__controls">
        <button
          type="button"
          aria-label={controls("previousProducts")}
          onClick={() => setActive((index) => (index + count - 1) % count)}
        >
          <span aria-hidden="true">←</span>
        </button>
        <span aria-hidden="true">
          {active + 1} / {count}
        </span>
        <button
          type="button"
          aria-label={controls("nextProducts")}
          onClick={() => setActive((index) => (index + 1) % count)}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
