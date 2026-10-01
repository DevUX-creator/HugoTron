"use client";

import { useTranslations } from "next-intl";
import { BRAND_NAMES, categoryProducts, getCategory } from "@/lib/catalogue";
import { useProductChoice } from "@/components/products/useProductChoice";
import RiceProductCard from "./RiceProductCard";
import Reveal from "@/animations/Reveal";

/** Two rice propositions, each with its own clearly selected pack size. */
export default function OpeningProduct() {
  const t = useTranslations("hero.scene");
  const units = useTranslations("units");
  const rice = getCategory("rice");
  const options = useProductChoice(rice ? categoryProducts(rice) : []);
  const { product } = options;

  return (
    <div className="opening__product">
      <Reveal className="opening__product-choices" delay={0.08}>
        <div className="opening__rices" role="group" aria-label={t("productLabel")}>
          {options.brands.map((brand, index) => (
            <button
              key={brand}
              type="button"
              aria-pressed={options.brand === brand}
              onClick={() => options.chooseBrand(brand)}
            >
              <span aria-hidden="true">0{index + 1}</span>
              {BRAND_NAMES[brand]}
            </button>
          ))}
        </div>
        <div className="opening__product-head">
          <p>{t("packSize")}</p>
          <div className="opening__packs" role="group" aria-label={t("packSize")}>
            {options.sizes.map((unit) => (
              <button
                key={unit}
                type="button"
                aria-pressed={options.unit === unit}
                onClick={() => options.chooseUnit(unit)}
              >
                <span className="opening__pack-check" aria-hidden="true">
                  ✓
                </span>
                {units(unit)}
              </button>
            ))}
          </div>
        </div>
      </Reveal>
      <div className="opening__product-detail" aria-live="polite" aria-atomic="true">
        {product && <RiceProductCard key={product.slug} product={product} />}
      </div>
    </div>
  );
}
