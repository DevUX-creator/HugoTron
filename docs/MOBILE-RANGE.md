# Mobile story and range refinements — 3 October 2026

- The footer includes clearance for the fixed frame and the phone's safe area, so the legal
  links and back-to-top link remain above the bottom hairline at maximum scroll.
- Source columns, upper/lower clouds, distant mountains and smaller chapter details share
  each chapter's existing composition transform. There are no new illustration frame loops
  or live colour filters.
- The range rock is anchored beside the heading, independently of the background SVG crop.
- The range film is slightly smaller, with finer, lighter engraving and more tonal detail.
  Other engraved films retain their existing default treatment.
- The product rail has no snap correction. Touch and trackpad use native scrolling; horizontal
  gestures bypass the page's smooth-scroll handler. Mouse release gets a bounded, decaying
  glide that cancels on new input, tab hiding or unmount. Reduced motion skips this glide.
- Short phones get smaller product images while text and controls remain readable and tappable.
  The video-to-rail gap is larger. Range breadth appears before repeated rice pack sizes.

Six catalogue entries represent the client's additional sourcing scope: almonds/cashews,
hazelnuts/walnuts, dried fruits, ginger, cinnamon/cardamom and white/mung beans. Their
`sourcing` channel has no price or confirmed pack size. They use the shared product card
and enquiry flow and cannot enter the cart. Nuts and spices have catalogue groupings;
the hero retains the categories with its established 3D specimens.

Illustrative cutouts were generated with the built-in image generation tool and delivered
as 640 px alpha WebP, approximately 53–81 KB each. They are lazy-loaded card imagery, not
photographs of actual supplier stock. Full prompts and output paths are in
[the asset manifest](../content/_source/images/sourcing-cards/prompts.json).

```sh
node scripts/check-mobile-range.mjs http://localhost:3000
node scripts/check-mobile-range.mjs http://localhost:3000 webkit
node scripts/check-mobile-story.mjs http://localhost:3000
node scripts/check-mobile-home.mjs http://localhost:3213
node scripts/check-paper-story.mjs http://localhost:3213
```

The range check covers EN/DE phone sizes, the complete card and navigation fitting within
the frame, footer clearance, real native touch fling in Chromium, mouse glide settling,
and the sourcing enquiry preset. WebKit covers layout and links; physical phone testing
is still needed for device-specific browser and momentum behaviour.

Validation completed: `pnpm verify` (including 146 unit tests and the production build),
Chromium/WebKit range checks, and production mobile-home/paper-story checks. Covered World
rendering stops, hidden videos pause, and reverse scrolling resumes the scene.
