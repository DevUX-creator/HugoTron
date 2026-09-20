import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      /* Product photography still lives on the Wix CDN. Image IDs are in
         content/_source/data/products.json. Replace with the client's own
         asset host once they supply originals — see kundenfragebogen.md §A. */
      { protocol: "https", hostname: "static.wixstatic.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
