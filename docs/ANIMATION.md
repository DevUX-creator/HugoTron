# Animation

GSAP 3 (+ ScrollTrigger, SplitText) for choreography, Lenis for smooth scroll —
the same pairing the outgoing site used, so the motion feel carries over.

## Plugin registration

Always via `registerGsapPlugins()` from `@/lib/gsap`. It is idempotent and also
sets `ScrollTrigger.defaults({ pinType: "fixed" })` — transform-based pinning
creates a containing block that breaks the `position: fixed` header.

Call it **inside an effect in a client component**. `src/lib/gsap.ts` imports
GSAP statically, so importing it from a server component pulls the library into
the server bundle.

## Smooth scroll

`SmoothScroll` (`src/components/providers/SmoothScroll.tsx`) owns the Lenis
instance, bridges it to `ScrollTrigger.update` and the GSAP ticker, and scrolls
to top on navigation.

Access it through the typed context, never a global:

```tsx
const { lock, unlock } = useScrollLock(); // for menus and modals
const lenis = useLenis();
```

On breakpoint changes it uses `gsap.matchMedia()` + `ScrollTrigger.refresh()`.
It must never call `window.location.reload()` — the project this was modelled on
did, and a desktop window resize threw away all page state.

## The three wrappers

| Wrapper        | Splits        | Use for                                   |
| -------------- | ------------- | ----------------------------------------- |
| `<Reveal>`     | nothing       | A whole block — a card, an image, a group |
| `<RevealText>` | words         | Headings                                  |
| `<Copy>`       | lines, masked | Body copy                                 |

```tsx
<RevealText eager>
  <Heading as={1} size="hero-lg">{title}</Heading>
</RevealText>

<Copy delay={0.2}>
  <p>{body}</p>
</Copy>
```

`RevealText` and `Copy` clone their child so SplitText operates on the real
`<h1>`/`<p>` rather than a wrapper div, which keeps line metrics honest.
Pass exactly one element child.

## The hero is the one exception

`src/sections/Hero/HeroCopy.tsx` uses the same three motions — words out of a
blur, masked lines, block lift — but not the wrappers. It cannot: the wrappers
are one-shot (`ScrollTrigger` with `once: true`), and the hero's two copy sets
have to arrive AND leave, repeatedly, every time the scroll crosses the phase
threshold in either direction.

So each set gets a paused timeline assembled from the same tweens, played
forward to arrive and `.reverse()`d to leave. The exit is therefore literally
the entrance backwards, rather than a second effect that has to be maintained
in sympathy with the first. Parts opt in with `data-reveal="words" | "lines"`,
and anything SplitText would mangle — a flex row, a pair of buttons — omits the
value and lifts as one block.

The same shared contract applies: dynamic GSAP import, `reveal-pending` guard,
failsafe timeout, reduced-motion short-circuit, full revert on unmount.

`eager` animates immediately — use it above the fold. Without it, the wrapper
waits for an IntersectionObserver.

## The shared contract

Every wrapper in `src/animations/` must:

1. **Dynamically import GSAP**, so it stays out of the initial bundle.
2. **Wait for `document.fonts.ready`** before splitting. Splitting against the
   fallback face measures the wrong metrics and the text jumps when
   Nasalization swaps in.
3. **Guard against FOUC with the `.reveal-pending` class**, never an inline
   `visibility: hidden`. The class only bites when `.js` is present on `<html>`
   (set by an inline script in the layout), so a visitor without JavaScript
   sees the content instead of a permanently blank page.
4. **Carry a failsafe timeout** (1200ms) that reveals the content anyway.
   Unanimated copy is a far better failure than invisible copy.
5. **Bail before loading GSAP** under `prefers-reduced-motion`.
6. **Revert everything on unmount** — `splitter.revert()`, `tween.kill()`,
   `scrollTrigger.kill()`, `observer.disconnect()`.

## Reduced motion

Two layers, both required:

- CSS: a global kill-switch in `globals.css` collapses all animation and
  transition durations.
- JS: every animated component checks `prefersReducedMotion()` and returns
  **before** importing GSAP, so the library is never even fetched.

`tests/e2e/smoke.spec.ts` asserts content is visible and unhidden under
reduced motion, and again with JavaScript fully disabled.

## Page transitions

`app/[locale]/template.tsx` is remounted on every navigation, replaying the
`page-in` keyframe from `globals.css`. Zero JavaScript, and it disables itself
under reduced motion.
