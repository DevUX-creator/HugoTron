# The Hugo Tron paper world

## Direction

Continue the immersive home as an illustrated field journal on warm kraft paper.
One thought per scene, with separate illustrated layers around a quiet centre. No origin directory,
product lists, numbered country menu, or dense map during the story. Product
comparison belongs at the end. Keep the existing fixed frame, world identity,
sound control and navigation; change their ink colour as the paper arrives.

References: [Ironhill](https://ironhill.au/produce) for illustrated atmosphere
and generous space; [Son Daven](https://sondaven.com/en#benefits) for tactile paper,
engraving and transitions. Illustrations are original, not copied site assets.

## Build sequence

- [x] Synchronise the letter/video departure with the first visible paper reveal.
      Give the paper a subtle fibre texture; maintain a continuous global frame.
- [x] Replace the busy origin map chapter with a sparse origin moment and an
      original floating farmland engraving. Preserve the origin-to-Hamburg idea.
- [x] Let the blue route reach an illustrated Hamburg warehouse/port and continue
      into the buying paths. Present only a short caption and a few concise delivery facts.
- [x] Show three ways to buy, with concise home/kitchen/trade choices, followed
      by a pack changing from blank to Hugo Tron to the visitor's own brand.
      Wire a private-label destination and enquiry purpose preset.
- [x] End with the existing commerce components, a short film and contact.
      Check EN/DE, narrow screens, keyboard/reduced motion and resource cleanup.

## Motion and resource limits

The only 3D renderer remains the existing World scene. The paper transition
draws on scroll, stops while idle, and releases its context on unmount. The
World scene and videos pause when covered. The story uses compressed engraved
assets, SVG routes and a small number of transformed layers; pointer listeners
and motion run only while needed. Touch gets a readable stacked layout. Reduced
motion and no-JavaScript retain the complete text and links.

## Copy boundaries

No invented origin for pistachios or pulses. The origin illustration represents
basmati's India/Pakistan connection; it is an artistic scene, not a precise farm
or warehouse drawing. Avoid adding certifications, service guarantees or new
delivery schedules. Delivery and pack-size wording comes from existing content;
the €29 threshold is scoped to Germany. Private-label packaging is a concept,
with suitability discussed through an enquiry.

## Verification

Production build, TypeScript, ESLint, Stylelint, formatting and 140 unit tests passed.
Reviewed desktop (1512 × 982) and mobile (390 × 844) compositions. English and
German reduced-motion views keep the full story readable without the pinned
paper handoff. No-JavaScript and no-WebGL views retain the story and links.

`node scripts/check-paper-story.mjs http://localhost:3213` verifies the synchronous
handoff, stationary identity, ink colour, covered-renderer pause/resume, paused
video, shared cart, private-label enquiry preset and fallbacks.
`node scripts/check-world-lifecycle.mjs http://localhost:3213` verifies three
film/navigation cycles and resource disposal, including cancellation during load.

The two generated WebP masters total approximately 514 KiB before responsive
image delivery. No additional Three.js models or continuously rendered 3D scenes
were introduced. The pack is a CSS object, and the routes are SVG.

## At the source — 2 October review

This iteration changes only the first paper composition and the paper route
treatment. The earlier World, 3D, sound and paper-wipe files were checked against
a snapshot taken at the start of the iteration and remain byte-for-byte unchanged.

The source statement is centered again, with small origin/Hamburg captions to
either side and one note beneath. Separate column and cloud illustrations join
two small orbital rock drawings. The near and far layers have different scroll
and cursor movement; the copy stays steady. After the paper reveal completes,
the objects draw in at staggered positions, hold, then wipe away while Hamburg
enters from below. Reverse scrolling restores the source drawing.

The route uses a continuous grey stroke overlaid by blue ink as scroll advances.
The circulating spark and idle line animation have been removed. The new source
art uses two shared WebP downloads totalling 217,758 bytes. Original assets and
exact built-in imagegen prompts are retained in `content/_source/images/paper-world/`.

Desktop and mobile drawing, hold, wipe and hover states were visually reviewed.
The paper browser regression passed, including EN/DE, reduced motion, no-JS and
no-WebGL content, fixed identity, render pause/resume and commerce links. The
production build, type checking, linting, formatting and 141 unit tests passed.
Further story chapters await the client's review of this first composition.
