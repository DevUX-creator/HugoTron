# Animation

The homepage and rice category have separate Three.js scenes. GSAP supplies
text and scroll reveals; Lenis smooths vertical scrolling.

## Hugo Tron world

`src/sections/World/World.tsx` loads the world scene dynamically. The supplied
courtyard surrounds a glass cube with an engraved mark, moving blue edges,
particle streams, light beams and foreground defocus. The camera approaches
along a curved path while focus resolves. Scene and cube respond to the cursor;
hovering the cube adds local colour, sheen, lift and tilt.

The catalogue arrow sits below the two-line uppercase title at the bottom left.
The introduction sits in the top-right corner. A narrower category list sits
below it, with the last category aligned to the bottom of the catalogue action. Copy reveals
follow scene readiness. Mobile places the content around the scene in normal
flow. Reduced motion keeps copy visible and the scene still. Failed scene
loading and disabled JavaScript preserve a static poster and usable links.

`useWorldJourney` maps native scroll onto a continuous second environment.
The single canvas stays pinned as the courtyard dissolves and the cube panels
part. The entire cube, including its core, cages, flare and light, fades at the
entrance; it does not travel into the second scene. `journey.ts` takes the camera
forward along the light currents. The shortened chapter stops at 60% of that
flight, before the upward camera bank. `progress.ts` keeps camera, lighting,
shader transitions and DOM shading at the same low composition.

The hero's filaments and sparks in `stream.ts` become two open, sweeping blue
currents. Their shared curves in `paths.ts` also guide the instanced mineral field
in `rocks.ts`: stones travel along each current and slowly revolve around its
local axis, with independent rotation. Endpoints sit beyond the composition and
taper out before particles or stones wrap. Fine strands, white-cyan accents and
local blue scattering share the hero's depth-aware light pass. Small cyan-white
particles drift along both routes, reusing the hero particle buffer. There is no
central sculpture, spiral or separate tunnel in the second scene.

The focus pass follows the trails while blurring peripheral geometry. Rocks
share one geometry and draw call, with fewer instances on phones and no added
model or texture downloads. Their dark charcoal material uses object-space
mineral grain and filtered fine relief, which stays attached as each rock rotates.
They are compiled behind the loader. The half-resolution peripheral blur pass
stays active at the held pose, retaining the flight's depth and softness.
Camera progress is speed-limited, and copy follows the rendered camera.
The arrival heading is centred low in the
frame, leaving the sweeping currents visible above it. One fixed hairline frame
with corner details spans both chapters, independently of the copy fades.

One curved video screen in `films.ts` enters from the right during the last part
of the flight and settles above the text. The video has no border or corner marks.
Its edges bend gently away from the viewer, with slow, asymmetric ripples and
a slight twist that keep it feeling like floating paper while the centre stays
quiet. This ambient deformation stops under reduced motion.
Hovering lifts the paper locally beneath the cursor and adds a small tilt and
forward lift. A plane intersection maps the cursor into the sheet's coordinates;
the response eases out beyond its edges and during departure, and settles when
the pointer leaves. Touch and reduced motion do not trigger this deformation.
Continued scrolling peels a corner, tips the sheet down and sends it back into
the rocks and light current, with increasing defocus as it recedes. The next film
arrives from the right; only one screen remains at rest. The camera holds its
established low pose. Direction and scroll velocity drive a GPU sheet bend
inspired by `IDEA.zip` (the Three.js slider). The bend relaxes when scrolling
stops. No wheel or touch events are intercepted.

The three screens use `WORLD_FILMS`: rice fields, dining room, and tea ritual.
The first two reuse existing range media; the third uses optimized versions of
the supplied `3dvideo.mp4`. The rice page retains its separate `RANGE_FILMS`
playlist. Desktop/mobile delivery files and posters are documented in
`content/_source/video/world-films.md`.
`filmTexture.ts` loads posters during the approach, plays only the selected video,
and pauses decoding outside the chapter, when hidden, or under reduced motion.
Posters remain visible while video loads or if playback fails. The film pass uses
the existing renderer after the atmosphere blur, sampling scene depth for rock
occlusion so the video stays sharp within the soft environment. Film selectors,
a pause control, and synchronized EN/DE copy remain ordinary accessible HTML.
Without WebGL, the selectors change a static image and its matching text.

The scroll run is a real flow spacer, not bottom padding: a sticky canvas cannot
travel into its parent's padding. The hero's selected category is preserved when
scrolling back. Inactive sections become inert. Reduced motion switches directly
between still compositions; failed WebGL and no JavaScript use two normal-flow
sections with optimized scene posters. No wheel interception or scroll locking.

The renderer reduces resolution and assets on mobile, slows ambient frames,
pauses when hidden or out of view, and disposes resources on unmount. Scene
implementation details and model preparation are documented in
`content/_source/models/hugo-world.md`.

## Rice category

`Opening` owns the sculptural bowl and warm basmati. Hover tilts the bowl;
clicking or using the corner control lifts the grains. The control keeps its
label while temporarily disabled during a toss. Slow motion is optional.

The reveal begins distant and blurred, approaches along a curve, and settles
into the initial composition. Scrolling early skips the entrance. Continued
scroll pulls the camera back, follows a shallow orbit and approaches overhead.
Pointer drift fades before brushing becomes available. Reduced motion skips
camera travel, the entrance and hover parallax.

Hero copy, rules, product and ambient light follow the pointer at different
response rates; navigation stays fixed. Grain composites over the content.
Theme changes update the lighting, material and page together, and persist
across reloads. The original temporary rice lab now redirects to this page.

## Range and buying sections

`PaperChapter` covers the rice scene after its scroll sequence. `RangeReveal`
expands the film to the viewport before moving the commerce cards horizontally.
`FilmPlaylist` owns the optimized range films and playback controls. The cards
share the catalogue's product and cart components.

`BuyingOptions` returns to vertical flow. `StoryImage` moves the kitchen
photograph within its overscanned frame and stays still under reduced motion.

## Shared wrappers

- `Copy`: masked lines for headings and body copy.
- `Reveal`: whole-block entrances for images, controls and groups.

Pass one text child to `Copy`. Custom text components must forward their ref
and class name. SplitText waits for fonts and remeasures after layout changes.
Both wrappers load GSAP dynamically and wait for the page entrance. Content
stays available without JavaScript and when setup fails.

Register plugins through `registerGsapPlugins()` in `@/lib/gsap`. Revert split
text and tweens, disconnect observers and remove event handlers on unmount.

`SmoothScroll` owns Lenis and coordinates it with ScrollTrigger. Its frame loop
rests when scrolling and tweens settle. `useScrollLock()` supports overlays,
and native anchors use the header clearance from `scroll-padding`.
