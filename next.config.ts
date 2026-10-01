import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
    remotePatterns: [
      /* Product photography still lives on the Wix CDN. Image IDs are in
         content/_source/data/products.json. Replace with the client's own
         asset host once they supply originals — see kundenfragebogen.md §A. */
      { protocol: "https", hostname: "static.wixstatic.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
