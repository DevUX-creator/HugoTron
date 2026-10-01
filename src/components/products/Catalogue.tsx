import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import ArrowLink from "@/components/ui/ArrowLink";
import { HomeThemeProvider } from "@/components/rice/HomeTheme";
import {
  categoryProducts,
  getCategories,
  getProducts,
  type ProductCategory,
} from "@/lib/catalogue";
import RangeProductCard from "./RangeProductCard";
import "./catalogue.css";

/** Lightweight category destinations share the existing catalogue and cart. */
export default function Catalogue({ category }: { category?: ProductCategory }) {
  const t = useTranslations("catalogue");
  const names = useTranslations("world");
  const products = category ? categoryProducts(category) : getProducts();

  return (
    <HomeThemeProvider forcedTheme="dark">
      <Header brandLogo />
      <main className="catalogue">
        <div className="catalogue__frame">
          <Link href="/" className="catalogue__back">
            ← {t("back")}
          </Link>
          <header className="catalogue__intro">
            <p className="catalogue__eyebrow">Hugo Tron / {t("all")}</p>
            <h1>{category ? names(category.id) : t("title")}</h1>
            <p>{category ? t(`descriptions.${category.id}`) : t("lead")}</p>
          </header>
          <nav className="catalogue__categories" aria-label={names("categoriesLabel")}>
            <Link href="/range" aria-current={!category ? "page" : undefined}>
              {t("all")}
            </Link>
            {getCategories().map((item) => (
              <Link
                key={item.id}
                href={item.href}
                prefetch={false}
                aria-current={category?.id === item.id ? "page" : undefined}
              >
                {names(item.id)}
              </Link>
            ))}
          </nav>
          {products.length > 0 ? (
            <div className="catalogue__grid">
              {products.map((product, index) => (
                <RangeProductCard key={product.slug} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="catalogue__enquiry">
              <ArrowLink href="/enquiry" prefetch={false}>
                {t("enquire")}
              </ArrowLink>
            </div>
          )}
          {!category && (
            <div className="catalogue__experience">
              <ArrowLink href="/range/rice" prefetch={false}>
                {t("riceExperience")}
              </ArrowLink>
            </div>
          )}
        </div>
      </main>
    </HomeThemeProvider>
  );
}
