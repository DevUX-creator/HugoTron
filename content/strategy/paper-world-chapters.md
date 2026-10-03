# Paper-world story, October 2026

Scope: only the story after the existing paper transition. The World, films, sound identity,
fixed frame, original cube and transition renderer remain unchanged.

1. **At the source** — centered uppercase statement, two etched columns, a lower cloud.
2. **It begins with the land** — a field appears first; mountains and people join after a
   short delay. Foreground layers part to either side as the visitor moves onward.
3. **Pakistan** — a separate, quieter origin scene. Only the established basmati origin is
   named; no supplier, farm ownership, certification or new provenance is implied.
4. **Hamburg** — a generated living engraving of the harbour, with static sacks and birds.
   Decorative illustration, not footage of an actual Hugo Tron property. Import, warehousing
   and distribution to businesses in Germany follow the headline.
5. **However you buy** — three staggered framed illustrations: home, kitchen and trade.
6. **Private label** — the existing changing pack and enquiry route.
7. **The collection** — a rectangular film above all catalogue products in an unframed,
   cart-enabled rail with swipe, mouse drag and arrow controls, against an engraved orbital
   chart that recalls the opening World.
8. **Let's make it happen** — the same fibrous paper wipe as the arrival transition opens
   inward from the right screen edge along the irregular diagonal in `img.png`, revealing the stationary current hero cube, its flowing
   filaments and sparks, subtle grain and a small field of instanced mineral rocks.
   The footer provides product navigation, company and
   contact information, business enquiries and links to the published legal notices.
   No landscape GLB, postprocessing pipeline or new audio.

The grey route remains visible ahead; a blue spatial clip follows the scroll position.
There is no endpoint dot, sampled arc-length stepping, or trailing scroll interpolation.
Titles remain real text and scroll naturally. Pointer parallax settles and stops.

## Mobile and positioning update — 3 October

On phones, source → land → Indian basmati → Pakistani basmati → Hamburg are five focused
compositions. Each has a title, brief note and static illustration below; native scrolling
moves the whole composition. There are no independently animated illustration layers or
Hamburg video effect on mobile. Reduced motion and no JavaScript use normal document flow.
The line stays hidden on mobile; the footer cube retains its fully revealed torn edge.
On desktop the moving footer reveal edge is also curved and fibrous, with stable spatial
noise for reverse scrolling. The canvas becomes visible only after a masked frame has
rendered, avoiding a brief rectangular entrance. The finished opening is unchanged.

The [client's positioning](client-positioning-2026-10-03.md) is threaded through sourcing,
Hamburg, trade and private-label copy. A compact “Beyond the range” invitation follows the
catalogue for additional foods and raw materials. It leads to a sourcing enquiry without
implying that all those products are currently stocked. The existing shop stays intact.

Rendering measurements and reproduction steps are in
[the mobile story performance note](../../docs/MOBILE-STORY-PERFORMANCE.md).

## Media and resource lifetime

- Illustration layers: generated with the built-in imagegen skill, converted to alpha WebP.
- Hamburg: OpenArt Wan 2.7, one 5-second 1080p generation, 175 credits. Prompt and job id:
  `content/_source/images/paper-world/story-prompts.json`.
- Harbour video loads near its chapter; it pauses outside that chapter, when the tab hides,
  and under reduced motion. Its poster supplies the static version.
- Footer renderer imports only near the footer, pauses when hidden/offscreen, and disposes
  all geometry, materials, environment texture, depth target and WebGL context on unmount.
  It shares the hero's `createCoreInstallation` and reflection environment. Its drawing buffer
  uses the untransformed layout dimensions, so the reveal stays sharp. Reduced motion renders
  a still image; WebGL failure leaves a CSS cube. GPU allocation stays bounded.
- Catalogue reads through `getProducts()`. Existing product components retain cart and
  enquiry behavior; products are not duplicated into a separate home-only data source.
