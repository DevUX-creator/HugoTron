# Social sharing and icons

Added 5 October 2026. These are **website link previews**, not published social posts.

- Ten finished JPEG banners: `public/social/{en,de}/{world,products,wholesale,private-label,delivery}.jpg`.
- 1200 × 630 pixels, local assets, optimized JPEG. No new JavaScript or image-generation work
  is added to the visitor's page load; social crawlers fetch static files.
- Five cinematic backgrounds were generated with the built-in image-generation tool. Masters
  and the exact prompt set live in `assets-src/social/`; the original vector wordmark and
  Mersad font are composed deterministically so branding and localized text remain accurate.
- `src/lib/social.ts` maps internal routes to artwork. `pageMetadata()` in `src/lib/seo.ts`
  supplies both Open Graph and Twitter large-card metadata. Product/category links use the
  product banner; home and other general information pages use the world banner.
- Rebuild exports after editing copy/art with `node scripts/generate-social-banners.mjs`.
  The generator uses the existing Playwright Chromium dependency and fails if titles overflow.
- The old generic, runtime `opengraph-image.tsx` was removed so it cannot override per-page images.

## Favicon provenance

The existing mark was downloaded from the icon links on [the live Hugo Tron site](https://www.hugo-tron.com/).
It is the stacked white HUGO TRON wordmark on blue. Its master is
`assets-src/brand/live-favicon.png`; the 32px variant is retained beside it.

`src/app/icon.png` (512px) and `src/app/apple-icon.png` (180px) serve the same live-site artwork
locally using Next's icon convention. The PNG icon supplies the browser favicon and the web
manifest references these local assets. The image is not redrawn by AI. There is no Wix
dependency when visitors load these assets.

## Deployment check

Verify the final hostname in `SITE_URL`/`metadataBase`. Check a deployed link with the sharing
platforms after release; platforms cache previews and an earlier shared URL may require a
refresh in their inspection tools. Confirm that the CDN serves images publicly, without login,
bot challenges or robots restrictions. Local browser checks cannot confirm external caches.
