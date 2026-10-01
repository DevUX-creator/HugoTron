# Homepage courtyard

Source supplied by the user: `shrine_of_the_oracle.glb` (19,464,068 bytes).
The original file is retained without modification.

Embedded asset metadata credits **Shrine of the Oracle** by **Isabella Crowder**:
<https://sketchfab.com/3d-models/shrine-of-the-oracle-a17d5aa5f7544e8e9cb602b1ed1925a3>

License recorded in the asset: **CC BY 4.0**.
<https://creativecommons.org/licenses/by/4.0/>
Source metadata and modification notes are retained in this project document.
The website attribution footer, public text file and related UI copy were removed
at the user's request. Embedded metadata in the supplied GLB is unchanged.

## Web derivatives

Run `python3 scripts/prepare-world-model.py` from the repository root (Pillow required).

- `public/models/world/hugo-world.glb`: 1024 px WebP textures; 5,757,420 bytes.
- `public/models/world/hugo-world-mobile.glb`: 512 px WebP textures; 2,663,276 bytes.
- Texture format uses the standard `EXT_texture_webp` glTF extension.
- Nodes `polySurface101_orb_0`, `polySurface101_wire_0` and
  `polySurface101_pottery_0` are removed, including their orphan geometry and maps.
  Eleven outer props entirely beyond the atmosphere's full dissolve are removed
  as well; the list and bounds criteria live in `prepare-world-model.py`.
  No objects are removed merely because a resting camera view hides them.
- Only reachable meshes, materials, textures and accessor slices are packaged.
  Mesh indices use lossless 16-bit storage where possible. Retained positions,
  normals, UVs, indices and encoded texture bytes were compared with the previous
  derivatives and are identical. The original source GLB remains unchanged.
- This saves 303,488 bytes (5.0%) on desktop and 303,484 bytes (10.2%) on mobile.
  The model has 39,200 triangles, down from 39,540, so the main benefit is loading
  and asset size, with a small reduction in geometry work. Draw calls stay at 20.
- The derivative GLBs preserve the original materials, UVs, geometry positions
  and author metadata. The runtime applies the material grading described below.
- Still posters are captures of the adapted scene, exported as WebP for loading,
  no-JavaScript, and unavailable-WebGL fallbacks.

## Runtime foundation

`src/components/world/scene.ts` loads the appropriate derivative, scales the
source by 0.01 and merges static geometry by its shared materials: 7 model
draw calls and 39,200 triangles. Shadow maps render once and on theme changes.
The camera starts at the former resting view and follows a 2.8-second curved
approach into the central installation: desktop Z 12.2 → 7.13, mobile
Z 18.5 → 11.48. The final view is approximately 15% closer than the previous
composition. The animated focus pull and opening bokeh are retained.
The atmosphere renders during model loading; the sharp poster appears only
without JavaScript or when the live scene is unavailable. Cursor movement adds a
bounded orbit (0.145 radians horizontally, 0.12 vertically), a small dolly and
up to 0.018 radians of roll. The camera damps more slowly than the cube, producing
parallax between the architecture, cube and streams. Mobile halves this response;
touch does not drive it. Pointer exit or window blur returns the camera to rest.

`atmosphere.ts` adds depth-aware rear blur from the scene’s depth texture,
light shafts over navy-blue haze, and a single batch of 560 light motes
plus 18 soft foreground bokeh lights (230 + 10 on mobile). A world-space terrain dissolve blends the outer ground and
peripheral props into the same background before the mesh ends. Motes render
after this blend, using the scene depth texture to remain occluded by columns.
The two visible shafts use the projected positions and targets of actual
back/overhead spotlights, aimed toward the centre and floor. The upper-left key
has a narrower cone (0.16π radians), reduced penumbra (0.62), and a more defined
volumetric shaft. The secondary beam remains broad and soft. Cool neutral light,
blue-grey stone and a `#0a1320` backdrop give the scene a restrained brand-blue tint.
A gentle
overhead bounce fills the central pool. The key retains cached PCF shadows;
the softer secondary source drifts gently while keeping its aim. Volumetric
colour is integrated by view depth, with most mist inside/behind the architecture,
and the terrain dissolves into this same air colour.

A small, steady rear accent illuminates the tree branch at (-0.83, 2.9, -4.13)
from (1.1, 5.8, -3.2). Its narrow spotlight has a 0.032π cone and 0.12 penumbra,
with intensity 40 in the dark theme. The corresponding shaft has a defined edge,
ends at the branch and uses the scene depth texture to stay behind nearer columns.
It is evaluated in the existing atmosphere composite and has no extra shadow map,
render target or draw call. Its lighting still adds a little shader work.

The supplied `img_2.png` lighting reference informed this pass. The original
stone atlas is graded into charcoal marble, retaining its UVs,
veins and normal detail. The soil’s
roughness range and normal strength are adjusted for broad reflections, and
textile saturation is reduced. These are shader/material adjustments with no
new texture downloads; no AI-generated maps were needed.
A third of the particles have independent short glow pulses with fully invisible
intervals; the remainder provide dimmer drifting dust.
The completed desktop composition uses 20 draw calls and 87,365 triangles, including
the beveled cube, composite, two point batches, light filaments and a neon outline.
Physical glass transmission adds an opaque-scene refraction pass at half resolution
(0.4 resolution on mobile). This uses Three's renderer-managed, mipmapped buffer;
no extra animation loop is added. The main scene still renders once for depth and atmosphere.
The focus pull uses an additional half-resolution pass only during arrival,
with up to 21 draw calls; its render target is released when focus settles.
There is no bloom pyramid.
DPR is capped at 1.5 desktop / 1.25 mobile. The ambient loop is capped at 30 fps
after arrival, temporarily allowing 60 fps while cursor motion settles, and stops
while the tab/scene is hidden. Reduced motion displays
a stationary camera, particles and lighting, rendering only on changes.
Fog distance follows the camera so mobile retains the same depth treatment.
The homepage is dark-only, with no theme switcher. Its provider and pre-paint
script enforce dark mode without changing the stored rice-page preference.
The rice page retains both themes. Fallback posters for the homepage are always dark.
Key/fill/bounce intensities are reduced to 260/70/15, with low ambient light;
the cube supplies the local blue reflections and glow through a 12-intensity
point light and a depth-aware optical halo, with a slow, small breathing variation.

## Particle sculpture

`installation.ts` creates a hovering 1.05-unit cube centred at `(0, 1.65, 0)`.
The supplied `public/brand/logo.png` is used directly as the face artwork.
A geometry attribute masks it to the front face only while retaining one body
draw call. Its blue background is replaced in the material shader; the exact
logo shape drives a negative height field, with pale silver-blue recessed centres,
light-catching bevels and a small view-dependent offset for the inner walls.
The engraving uses material relief rather than extra geometry. The current finish
is clear tinted optical glass with a soft blue-violet diagonal gradient. Transmission
is 0.96, face roughness varies from 0.035 to 0.08, and lower thickness, absorption and
surface emission retain more of the courtyard behind it. A very shallow procedural
micro-grain keeps the finish natural; no material texture needs downloading. The body stays a single mesh
and draw call. Its edge glow retains the `#1755A9` brand-blue family observed on
<https://www.hugo-tron.com/>. The supplied `img_3.png`–`img_8.png` references informed
the reflective finish and electric edges; there are no nested cubes or interior patterns.
Raycasting the cube's actual surface drives a damped cyan/violet colour shift around
the pointer. Hovering elsewhere only moves the camera and cube. Pointer exit restores
the resting gradient. A narrow cyan-violet sheen follows the surface position with
very shallow refraction, while the cube lifts 0.065 units, grows 2.5%, and tilts toward
the hovered part of the face. Edge currents accelerate smoothly by up to 80% without
resetting their phase; local light rises by 14%. Exit damps all effects back to rest.
Touch and reduced motion do not activate this response.
The earlier titanium and generated basalt studies are retained in `public/textures/`
but are unused. Their prompts are in `content/_source/images/cube-titanium.md` and
`content/_source/images/cube-basalt.md`.
`cubeEnvironment.ts` generates a small, static reflection map with cool grazing
light panels and dark gaps. Assigning this map directly to the cube gives it independent
reflection intensity while retaining the courtyard's dim lighting. The reflection map
is generated once and disposed with the scene; it adds no per-frame reflection pass.
`outline.ts` draws twelve padded screen-space strips in one draw call. Fine blue
threads swell and taper locally as slower currents move around the upper/lower
perimeters and vertical edges. A gentle lateral drift and quieter secondary strands
match the scene's flowing lines. Core thickness, halo width and brightness vary
along each segment; reduced peaks and tighter halos keep the corners restrained.
Depth tests at the line centre hide rear edges;
per-pixel depth also occludes glow behind nearer architecture.
The cube follows the damped cursor with bounded yaw (0.42 radians), pitch (0.27), roll and a slight
position offset in all three axes, independently of the slower camera orbit.
A separate cyan point light illuminates
the surrounding stone. A depth-aware halo is integrated into the existing composite.

The Collaboration section of the user-supplied reference <https://hubtown.co.in/>
informed the mixture of cyan filaments, brighter travelling pulses and loose sparks.
`stream.ts` samples two Catmull–Rom routes through the courtyard and onward
into the background. Sparks and screen-facing light strips share layered
turbulence but have different speeds, widths and pulse timings. They pass under
and behind the cube rather than assembling into it. The upper rear branch is
removed; turbulence tightens behind the cube and the remaining trails fade
before the far architecture, keeping that region quiet.
The cube itself resolves during the camera arrival, between 1.2 and 2.8 seconds.
The stream uses 2,500 sparks and 27 passing filaments on desktop, 1,200 sparks and
16 passing filaments on mobile, in two draw calls. The temporary inward side routes
were removed at the user's request. The original routes retain their movement with
a slightly bluer tint in the filaments and sparks.
Depth sampling occludes the streams behind
architecture and the cube; the stream needs no extra render target.
Ambient motes retain independent glow pulses. Reduced motion
shows the complete cube immediately and holds all particles and lighting still.

## Foreground focus

The cursor-following, feathered focus mask on <https://pvlinkenergy.com/products/>
was inspected in the supplied `DevUX-creator/PV_energy` repository at commit
`66ec429b22ec5377bfd8554fb9dacd6a7bf75585` (`ProductsHero.tsx` / `productsHero.css`).
Its focus principle is adapted into the existing scene composite: the lower
foreground gains up to 15 px of depth blur, feathering out at 46% of viewport
height from the bottom, with a broad clear area following the damped cursor.
`focus.ts` shares this mask with flowing points and filaments. Two uneven,
slowly drifting foreground veils retain soft diffusion after the opening zoom,
with clear gaps and a slight blue wash. The cube's depth and central screen position
keep it sharp. Sparse blue bokeh lights extend slightly higher in the existing
dust draw call. The effect
does not blur the HTML frame, text or navigation, add a render target, or run
a separate animation loop. Reduced motion fixes the focus at the centre.

The source model has no animation clips. No replacement products have been added yet.

The homepage loads this world independently of the original rice scene.
The complete previous homepage is now at `/en/products/rice` and `/de/sortiment/reis`.
The old `/en/rice` and `/de/reis` addresses permanently redirect to these category routes.
Rice is absent from the top navigation. A shared category list drives the homepage's
bottom-left navigation and lightweight product pages, using the existing product cards
and cart. The larger left-hand title reads “A world of good ingredients”, with a small
brand label at the top left and a short introduction. There is no duplicate product
button. Copy reveals during camera arrival and stays visible without
JavaScript or with reduced motion. On small screens the copy, scene and category list
stack within the same frame. The bottom retains distribution and origin wording.
The homepage header uses the user's supplied horizontal 844 × 106 SVG wordmark,
preserving all eight paths and its white fill. It scales responsively without a raster
image or filter. Other pages retain their existing wordmark and theme treatment.
