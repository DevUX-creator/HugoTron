import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/* Baseline security headers for every response. A full Content-Security-Policy needs nonces
   for Next's inline scripts and the payment provider's domains; add it with the real backend. */
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self)",
  },
];

/* The old Wix site's URLs, moved permanently so search
   rankings and bookmarks follow. Pages that no longer exist go to their nearest new page. */
const WIX_PRODUCTS: Record<string, string> = {
  "pardis-basmati-reis": "/de/sortiment/reis",
  "aladdin-basmati-reis-1": "/de/sortiment/reis",
  "pardis-basmati-aus-indien-1kg": "/de/sortiment/reis",
  "aladdin-basmati-aus-pakistan-1kg": "/de/sortiment/reis",
  safran: "/de/sortiment/safran",
  "vahdam-earl-grey-pyramiden-teebeutel": "/de/sortiment/tee",
  pistazienkerne: "/de/sortiment/nuesse",
  "pistazien-mit-schale": "/de/sortiment/nuesse",
  "kichererbsen-25kg": "/de/sortiment/huelsenfruechte",
};
const WIX_PAGES: Record<string, string> = {
  "/%C3%BCberuns": "/de",
  "/gro%C3%9Fhandel": "/de/grosshandel",
  "/privatelabel": "/de/private-label",
  "/zusammenarbeit": "/de/grosshandel",
  "/stellenangebote": "/de/kontakt",
  "/lieferung": "/de/lieferung",
  "/kontakt": "/de/kontakt",
  "/agb": "/de/agb",
  "/datenschutz": "/de/datenschutz",
  "/impressum": "/de/impressum",
  "/category/all-products": "/de/sortiment",
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      ...Object.entries(WIX_PAGES).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      ...Object.entries(WIX_PRODUCTS).map(([slug, destination]) => ({
        source: `/product-page/${slug}`,
        destination,
        permanent: true,
      })),
      { source: "/product-page/:slug*", destination: "/de/sortiment", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    /* LOCAL IMAGES WITH A QUERY HAVE TO BE DECLARED. `next/image` rejects a
       query string on a local src unless a pattern allows it, and the product
       photographs carry a `?v=2` cache-bust — without the first entry here,
       declaring the second would silently forbid every OTHER local image,
       because the moment `localPatterns` exists it is the whole allow-list. */
    localPatterns: [
      { pathname: "/**", search: "" },
      { pathname: "/products/**", search: "?v=2" },
    ],
  },
};

export default withNextIntl(nextConfig);
