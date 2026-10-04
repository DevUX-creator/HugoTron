# Wholesale palace walk

`/en/wholesale` and `/de/grosshandel` are an original Three.js architectural scene.
The visual reference is [Lost Palace Church by xinige](https://sketchfab.com/3d-models/lost-palace-church-14ad706c86ea4162a6dac91801c15130):
a dark entrance arch, a tall nave, paired columns under moulded piers, deep stone bases,
repeated arches, hanging cables and a distant illuminated doorway. All geometry here is
built in the project. The reference model is not included.

## Implementation

- `src/components/hall/palaceScene.ts`: stone architecture merged by material, original generated
  surface maps, side-aisle shipping crates, wooden pallets and tied sacks, camera path,
  fixed shadow map, lighting, depth softening and a restrained bloom pass.
- `src/components/hall/palaceStream.ts`: fine tapered blue filaments and sparks. Four
  curves are sampled into one small data texture; movement happens in two GPU draws.
- `src/components/hall/types.ts`: the scene's progress, door and disposal contract.
- `src/sections/Wholesale/WholesaleHall.tsx`: seven viewport heights of walking with
  five HTML reading stations. The product catalogue is linked from the sourcing station.
- `src/components/transition/DoorTransition.tsx`: the shared arrow link opens the door,
  fades into light and navigates to Delivery. Reaching the end also leads through;
  returning with Back leaves the visitor in the hall until they walk back and approach again.
- `src/sections/Delivery/`: existing text-led destination behind the door. Its separate
  3D scene is future work.

## Assets

Four original material images were generated with the built-in `image_gen.imagegen` tool
and converted to 1024 px WebP. Public files: `public/textures/palace/`. Exact prompts,
source paths and outputs: `content/_source/images/palace/prompts.json`.

The albedo textures are reused for subtle bump response; these are not scanned PBR map sets.

## Reading and motion

Scene colour remains dark navy with neutral stone and cool window light. The mobile camera
uses a wider field of view. Copy moves between left and right reading positions on desktop;
on mobile it remains within the fixed frame, below the persistent identity and audio control.
The shared home viewport measurement keeps browser toolbar resizing from shifting the walk.

Reduced motion uses normal document flow and a static scene. No WebGL, a lost context, or
no JavaScript also leaves all chapters and real links accessible in normal document flow.
The DOM remains the source of text and navigation; the canvas has no essential information.

## Runtime ownership

- Pixel ratio is capped at 1.25 on mobile and 1.5 on desktop.
- The checked reading stations use 33 draw calls, 25 uploaded geometries and 11 textures,
  including post-processing. Repeated forward/back walks keep those allocations constant.
- Static shadows render once. The scene runs at 30 fps while settled and up to 60 while walking.
- Hidden tabs and scenes outside the viewport suspend their animation loop.
- Geometry, materials, textures, shadow maps, environment and post targets are disposed on
  departure; the owned WebGL context is explicitly released.
- Async texture/compile completion is guarded after disposal. Transition timers are cleared.
- Resource counts are exposed as scene data attributes for the browser check.

`node scripts/check-wholesale.mjs [baseURL] [chromium|webkit]` exercises three viewport sizes,
English/German, five reading stations, reverse scrolling, the door and Back navigation,
resource stability, hidden-tab suspension, disposal, and reduced-motion/no-WebGL/no-JS modes.
