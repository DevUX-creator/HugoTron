import type { Locale } from "@/i18n/routing";

export type SocialBanner = "world" | "products" | "wholesale" | "private-label" | "delivery";

/** Internal (untranslated) routes share an appropriate localized campaign image. */
export function socialBannerForPath(pathname: string): SocialBanner {
  if (pathname === "/wholesale" || pathname.startsWith("/wholesale/")) return "wholesale";
  if (pathname === "/private-label") return "private-label";
  if (pathname === "/delivery") return "delivery";
  if (
    pathname === "/range" ||
    pathname.startsWith("/range/") ||
    pathname.startsWith("/product/") ||
    pathname === "/rice"
  )
    return "products";
  return "world";
}

export function socialImagePath(pathname: string, locale: Locale) {
  return `/social/${locale}/${socialBannerForPath(pathname)}.jpg`;
}
