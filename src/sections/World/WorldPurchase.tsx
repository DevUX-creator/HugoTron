"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  BRAND_NAMES,
  categoryProducts,
  formatPrice,
  isPurchasable,
  type Product,
  type ProductCategory,
} from "@/commerce/catalogue";
import {
  AddToCartButton,
  AddToCartQuantity,
  useAddToCart,
} from "@/components/commerce/products/AddToCart";
import EnquireLink from "@/components/commerce/products/EnquireLink";
import {
  useProductChoice,
  type ProductChoice,
} from "@/components/commerce/products/useProductChoice";

const ORIGIN_KEYS = { india: "originIndia", pakistan: "originPakistan" } as const;

/** Replaces the catalogue link once a category is chosen: buy the lead product, or enquire. */
export default function WorldPurchase({
  category,
  choice,
  onChoose,
}: {
  category: ProductCategory;
  choice: ProductChoice | undefined;
  onChoose: (choice: ProductChoice) => void;
}) {
  const t = useTranslations("world");
  const cartText = useTranslations("cart");
  const names = useTranslations("products");
  const units = useTranslations("units");
  const locale = useLocale();
  // Ranges sold as several types and sizes (basmati) offer a choice; others show their lead.
  const options = useProductChoice(categoryProducts(category), { choice, onChoose });
  const { product } = options;
  const name = product ? names(product.slug) : t(category.id);

  return (
    <div className="world__purchase">
      <p className="world__product">
        <span>{name}</span>
        <span>
          {product?.price != null
            ? `${formatPrice(product.price, locale)} / ${units(product.unit)}`
            : cartText("badgeWholesale")}
        </span>
      </p>
      {(options.brands.length > 1 || options.sizes.length > 1) && (
        <div className="world__options">
          {options.brands.length > 1 && (
            <div className="world__segment" role="group" aria-label={t("typeLabel")}>
              {options.brands.map((option) => {
                const origin = options.originOf(option);
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={options.brand === option}
                    onClick={() => options.chooseBrand(option)}
                  >
                    {BRAND_NAMES[option]}
                    {origin && <span>{t(ORIGIN_KEYS[origin])}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {options.sizes.length > 1 && (
            <div className="world__segment" role="group" aria-label={t("sizeLabel")}>
              {options.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={options.unit === option}
                  onClick={() => options.chooseUnit(option)}
                >
                  {units(option)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="world__actions">
        {product && isPurchasable(product) ? (
          <HeroPurchase key={product.slug} product={product} name={name} />
        ) : (
          <EnquireLink product={product} name={name} size="large" variant="glass" />
        )}
      </div>
      <Link href={category.href} prefetch={false} className="world__explore">
        {t("explore", { category: t(category.id) })}
      </Link>
    </div>
  );
}

function HeroPurchase({ product, name }: { product: Product; name: string }) {
  const cart = useAddToCart(product, name);
  return (
    <>
      <AddToCartQuantity state={cart} />
      <AddToCartButton state={cart} appearance="link" />
    </>
  );
}
