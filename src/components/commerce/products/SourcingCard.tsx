"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import EnquireLink from "./EnquireLink";
import "./rangeProductCard.css";

/**
 * The last card of any product rail: everything not in the catalogue, sourced to order. It has
 * the product card's rows (top line, image, name, meta, action), so a rail stays aligned; its
 * copy is shared, and only the illustration changes with the range.
 */
export default function SourcingCard({ index, image }: { index: number; image?: string }) {
  const t = useTranslations("catalogue.sourcing");
  return (
    <article className="range-product range-product--sourcing" aria-labelledby="sourcing-card">
      <div className="range-product__top">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span>{t("badge")}</span>
      </div>
      <div className="range-product__image range-product__image--pack" aria-hidden="true">
        {image && <Image src={image} alt="" fill sizes="(max-width: 767px) 260px, 368px" />}
      </div>
      <h3 id="sourcing-card">{t("title")}</h3>
      <div className="range-product__meta">
        <p>{t("note")}</p>
      </div>
      <EnquireLink product={null} name={t("title")} className="range-product__enquiry" />
    </article>
  );
}
