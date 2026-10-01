# Section playbook

Build new sections around the current Hugo Tron world and rice category.
See [ARCHITECTURE.md](ARCHITECTURE.md) for the application map and
[ANIMATION.md](ANIMATION.md) for motion and lifecycle requirements.

## Content and structure

1. Use approved company and product information from `content/` and `src/content/`.
   Leave unconfirmed commercial claims out of the page.
2. Add corresponding German and English strings to `messages/`.
3. Keep section markup and its stylesheet together in `src/sections/`.
   Place shared product, media or layout components in `src/components/`.
4. Start with a server component. Use a client component for browser APIs,
   state or interactions; shared reveal wrappers can surround server content.

## Visual language

Use existing semantic colour and spacing tokens. The active concept combines
hairline frames, triangular corners, large typography, glass surfaces and
restrained light. Reuse `ArrowLink` for navigation actions and the shared
commerce controls for cart actions. Keep native links and buttons accessible
by keyboard, with visible focus and localized labels.

The world is dark. The rice experience also supports light mode. Check both
rice themes when editing shared styles. Keep the navigation fixed while scene
content responds to the cursor.

## Motion and verification

Use `Copy` for text and `Reveal` for blocks. Respect reduced motion, pause
invisible media and dispose animation resources on navigation. Heavy scene
modules must load separately from catalogue and enquiry pages.

Verify desktop and narrow mobile layouts in both locales. Check no-JavaScript
and failed-scene navigation, then run the relevant project checks. Remove
superseded implementations when a prototype graduates into its final feature;
retain original assets and source notes for future editing.
