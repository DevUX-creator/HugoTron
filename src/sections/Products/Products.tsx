import { useLocale, useTranslations } from "next-intl";
import Section from "@/components/ui/Section";
import Heading from "@/components/ui/Heading";
import Button from "@/components/ui/Button";
import RevealText from "@/animations/RevealText";
import { PRODUCTS } from "@/content/products";
import ProductsTrack from "./ProductsTrack";
import ProductCard from "./ProductCard";
import "./products.css";

/**
 * Block 8 — the catalogue, drifting.
 * See content/strategy/homepage-struktur.md (DE) / homepage-structure.en.md (EN).
 *
 * All nine, not a hand-picked four: the hero already makes the argument with a
 * chosen few, and this row's job is to show the range is real. Wholesale lines
 * sit in it alongside shop lines and simply offer a quote instead of a cart —
 * which is the arrangement audit.md §2 asks for, and the reason the live
 * shop's €0.00 placeholders can go.
 *
 * Names, prices and units resolve HERE: message keys are typed against the
 * catalogue and cannot travel as loose strings, and currency needs the locale.
 */
export default function Products() {
  const t = useTranslations("cart");
  const tp = useTranslations("products");
  const tu = useTranslations("units");
  const locale = useLocale();

  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });

  return (
    <Section id="products" width="fluid" ariaLabel={t("rowEyebrow")} className="products">
      <div className="products__head">
        <p className="products__eyebrow">
          <span className="eyebrow tag">{t("rowEyebrow")}</span>
        </p>

        <RevealText>
          <Heading as={2} size="title-xl" className="products__title">
            {t("rowTitle")}
          </Heading>
        </RevealText>

        <Button href="/range" variant="outline">
          {t("rowCta")}
        </Button>
      </div>

      <ProductsTrack label={t("rowEyebrow")}>
        {PRODUCTS.map((product) => (
          <ProductCard
            key={product.slug}
            product={product}
            name={tp(product.slug)}
            unit={tu(product.unit)}
            price={product.price === null ? null : money.format(product.price / 100)}
          />
        ))}
      </ProductsTrack>
    </Section>
  );
}
