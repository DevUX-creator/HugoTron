"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/commerce/catalogue";
import RangeProductCard from "./RangeProductCard";

type Category = { id: string; products: string[] };

/**
 * The product grid with its category filter. Filtering happens in place: the URL keeps
 * `?category=` (shareable, survives reload) without a navigation, and the count is announced.
 */
export default function ProductBrowser({
  products,
  categories,
  initialCategory,
}: {
  products: readonly Product[];
  categories: readonly Category[];
  initialCategory: string | null;
}) {
  const t = useTranslations("commerce.products");
  const names = useTranslations("world");
  const [active, setActive] = useState<string | null>(initialCategory);
  const gridId = useId();
  const shown = active
    ? products.filter((product) =>
        categories.find((item) => item.id === active)?.products.includes(product.slug),
      )
    : products;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (active) url.searchParams.set("category", active);
    else url.searchParams.delete("category");
    window.history.replaceState(window.history.state, "", url);
  }, [active]);

  const choose = (id: string | null) => setActive((current) => (current === id ? null : id));
  return (
    <>
      <div className="shop__filters" role="group" aria-label={t("filterLabel")}>
        <button
          type="button"
          aria-pressed={active === null}
          aria-controls={gridId}
          onClick={() => setActive(null)}
        >
          {t("all")}
          <span aria-hidden="true">{products.length}</span>
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-pressed={active === category.id}
            aria-controls={gridId}
            onClick={() => choose(category.id)}
          >
            {names(category.id as Parameters<typeof names>[0])}
            <span aria-hidden="true">{category.products.length}</span>
          </button>
        ))}
      </div>
      <p className="shop__count" role="status">
        {t("count", { count: shown.length })}
      </p>
      <div className="shop__grid" id={gridId}>
        {shown.map((product, index) => (
          <div
            key={product.slug}
            className="shop__cell"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <RangeProductCard product={product} index={index} />
          </div>
        ))}
      </div>
    </>
  );
}
