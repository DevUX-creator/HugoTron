import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategories, getProducts, isPurchasable } from "@/commerce/catalogue";
import { CATEGORY_STORIES } from "@/content/categoryStories";
import ArrowIcon from "@/components/ui/ArrowIcon";
import ProductBrowser from "./ProductBrowser";
import "./productsPage.css";

/**
 * All products, buyable in place. Categories filter the grid on this page (no navigation);
 * the stories of each range are offered below, for whoever wants to read more.
 */
export default async function ProductsPage({ category }: { category?: string | undefined }) {
  const t = await getTranslations("commerce.products");
  const stories = await getTranslations("category");
  // What can be bought online comes first; quoted and sourced lines follow in catalogue order.
  const products = [...getProducts()].sort(
    (a, b) => Number(isPurchasable(b)) - Number(isPurchasable(a)),
  );
  const categories = getCategories()
    .map((item) => ({ id: item.id, products: [...item.products] as string[] }))
    .filter((item) => item.products.length > 0);
  return (
    <div className="shop">
      <header className="shop__head">
        <h1>{t("title")}</h1>
        <p>{t("lead")}</p>
      </header>
      <ProductBrowser
        products={products}
        categories={categories}
        initialCategory={categories.some((item) => item.id === category) ? category! : null}
      />
      <section className="shop__stories" aria-labelledby="shop-stories-title">
        <div className="shop__stories-head">
          <p className="commerce-caption">{t("storiesEyebrow")}</p>
          <h2 id="shop-stories-title">{t("storiesTitle")}</h2>
        </div>
        <ul>
          {CATEGORY_STORIES.map((story) => (
            <li key={story.slug}>
              <Link href={story.href} prefetch={false} className="shop__story">
                <span className="shop__story-name">
                  {stories(`${story.slug}.name` as Parameters<typeof stories>[0])}
                </span>
                <span className="shop__story-lead">
                  {stories(`${story.slug}.shortLead` as Parameters<typeof stories>[0])}
                </span>
                <ArrowIcon className="shop__story-arrow" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
