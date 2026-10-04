import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { CATEGORY_STORIES } from "@/content/categoryStories";
import { alternates } from "@/lib/seo";

/** Public pages in every locale, each listing its translations as hreflang alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { href: "/", priority: 1 },
    { href: "/range", priority: 0.8 },
    ...CATEGORY_STORIES.map((story) => ({ href: story.href, priority: 0.8 })),
    { href: "/wholesale", priority: 0.7 },
    { href: "/delivery", priority: 0.5 },
    { href: "/private-label", priority: 0.6 },
    { href: "/contact", priority: 0.5 },
    { href: "/terms", priority: 0.2 },
    { href: "/privacy", priority: 0.2 },
    { href: "/imprint", priority: 0.2 },
  ] as const;
  return pages.flatMap(({ href, priority }) =>
    routing.locales.map((locale) => {
      const links = alternates(href, locale);
      return {
        url: links.canonical,
        priority,
        changeFrequency: "monthly" as const,
        alternates: { languages: links.languages },
      };
    }),
  );
}
