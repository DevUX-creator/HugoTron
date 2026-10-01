# Lifestyle product images

Revised 2026-09-21 using built-in `image_gen`, one generation per product.

All nine `lifestyle-parallax.png` files now use distinct environments, materials,
lighting and camera angles. The earlier repeated dark-kitchen set was replaced
at the user's request. Each image is **1774 × 887 pixels (2:1)**, with room
around its subject for parallax framing. All 31 studio product photos are unchanged.

## Files and settings

| Product                    | Environment                    | Saved asset                                                                                                                           |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Pardis 1121 Basmati, 5 kg  | Bright restaurant prep kitchen | [pardis-1121-basmati-indien/lifestyle-parallax.png](../../../public/products/pardis-1121-basmati-indien/lifestyle-parallax.png)       |
| Aladdin 1121 Basmati, 5 kg | Wholesale pantry and stockroom | [aladdin-1121-basmati-pakistan/lifestyle-parallax.png](../../../public/products/aladdin-1121-basmati-pakistan/lifestyle-parallax.png) |
| Pardis Basmati, 1 kg       | Sunlit home dining nook        | [pardis-basmati-indien-1kg/lifestyle-parallax.png](../../../public/products/pardis-basmati-indien-1kg/lifestyle-parallax.png)         |
| Aladdin Basmati, 1 kg      | Terracotta home kitchen        | [aladdin-basmati-pakistan-1kg/lifestyle-parallax.png](../../../public/products/aladdin-basmati-pakistan-1kg/lifestyle-parallax.png)   |
| Premium Negin saffron      | Travertine spice preparation   | [premium-negin-safran/lifestyle-parallax.png](../../../public/products/premium-negin-safran/lifestyle-parallax.png)                   |
| Vahdam Earl Grey           | Café window on a rainy day     | [vahdam-earl-grey/lifestyle-parallax.png](../../../public/products/vahdam-earl-grey/lifestyle-parallax.png)                           |
| Pistachios in shell        | Outdoor garden table           | [pistazien-mit-schale/lifestyle-parallax.png](../../../public/products/pistazien-mit-schale/lifestyle-parallax.png)                   |
| Pistachio kernels          | Pâtisserie marble workbench    | [pistazienkerne/lifestyle-parallax.png](../../../public/products/pistazienkerne/lifestyle-parallax.png)                               |
| Chickpeas                  | Daylit dry-goods market stall  | [kichererbsen-25kg/lifestyle-parallax.png](../../../public/products/kichererbsen-25kg/lifestyle-parallax.png)                         |

## References and review

Each generation used only that product's existing `front.png` as an identity
reference. No shared kitchen background was supplied. All outputs were visually
reviewed for product identity, different surroundings and usable framing. The
images depict illustrative settings, not verified Hugo premises. Small packaging
lettering is generated and is not a label master. The unmarked jute sack in the
chickpea scene is a styling prop, not a depiction of the actual delivery sack.

Actual output dimensions are 1774 × 887 despite the prompt's preferred
2048 × 1024; the intended 2:1 ratio is preserved. No image postprocessing was
applied. Previous project copies were backed up in
`/tmp/hugo-parallax-first-set/`; original generated files remain in the image
tool's generated-images directory. This revision changes imagery, not layout.

## Exact prompt set

Each call used this shared prompt followed by its product-specific suffix below.

```text
Use case: photorealistic-natural.
Asset type: replacement lifestyle-parallax product photograph.
Input image 1 is a PRODUCT IDENTITY reference only. Preserve its exact product identity, colors, proportions, printed artwork and readable labeling; discard its plain studio background. Generate the distinct real environment described below from scratch.
Primary request: make this product image visibly different from the other product scenes through its location, architecture, light, materials and camera angle. This set must NOT repeat the earlier dark kitchen background. Match professional editorial photographic quality, not a repeated set.
Format: one LANDSCAPE 2:1 photograph, ideally 2048 × 1024, with clear photographic depth and at least 12% breathing room above and below the complete main subject for vertical parallax cropping. Natural photorealistic materials, believable scale and shadows, restrained styling, no CGI look.
Constraints: one main product, preserve recognizable brand and label exactly when packaged; loose ingredients keep their natural identity. Do not invent brand marks or claims. Do not introduce people, hands, typography overlays, titles, website UI, borders, watermarks or a collage. Only a small number of scene-appropriate supporting objects. Do not reuse the black-counter / window-slats / dark-kitchen scene from the previous set.
```

### pardis-1121-basmati-indien

Input image 1: `public/products/pardis-1121-basmati-indien/front.png`.

```text
Subject: Pardis BASMATI SELLA 1121 5KG bag: navy-and-gold front artwork, navy rigid handle, zipper, clear side rice window, exact Pardis logo and 5KG badge.
Scene and light: A working restaurant preparation kitchen in daylight, brushed stainless-steel worktop and sink, off-white small square tiles with visible grout, a softly out-of-focus steel extractor and stacked plain white plates. The bag stands toward the right of frame on the steel bench, one modest steel scoop of dry long-grain rice beside it. No dark wood anywhere. Cool silver and porcelain-white surroundings, soft north-window light and realistic diffuse metal reflections.
Camera and composition: Counter-height three-quarter perspective with a 50mm documentary food-photography feel. Show the whole bag at about 58% image height, situated around 65% across. Left half has quiet stainless worktop, natural depth.
```

### aladdin-1121-basmati-pakistan

Input image 1: `public/products/aladdin-1121-basmati-pakistan/front.png`.

```text
Subject: Aladdin BASMATI SELLA 1121 5KG bag: purple-and-yellow front artwork, yellow integral carry handle, clear side rice window, exact Aladdin script logo and 5KG badge.
Scene and light: A tidy small wholesale food stockroom with warm exposed red brick and pale plywood storage shelving; a broad unfinished birch packing table, plain unprinted kraft cartons in the soft-focus background. The bag stands on the foreground table, with a modest folded coarse jute textile beneath one edge. A side loading-door casts a broad strip of afternoon light across the brick. Ochre, red brick and pale raw wood palette. No kitchen appliances, ceramic rice bowl, or domestic countertop.
Camera and composition: Slightly low eye-level product portrait in a wide 2:1 frame. Whole bag at 60% image height near 58% across. Deep stockroom perspective, readable front, plausible grounded shadow.
```

### pardis-basmati-indien-1kg

Input image 1: `public/products/pardis-basmati-indien-1kg/front.png`.

```text
Subject: Pardis 1KG basmati retail bag: blue-and-yellow front, white side seams, exact logo, printed Persian mark and 1KG badge. Sealed small retail bag, NO handle.
Scene and light: An airy Scandinavian apartment dining nook, white limewashed walls and sheer curtains over a large window. The bag stands on a pale ash dining table beside a small white porcelain plate of freshly cooked basmati rice. One casually folded sky-blue linen napkin. Morning sunlight makes soft curtain shadows; a leafy tree is indistinct through the window. Light, spacious, fresh, quietly lived-in. No black kitchen or dark counter, no heavy shelves.
Camera and composition: Natural table-height slightly elevated perspective, wider environmental framing. Whole bag at about 50% image height near 62% across; airy negative space with believable dining-room depth.
```

### aladdin-basmati-pakistan-1kg

Input image 1: `public/products/aladdin-basmati-pakistan-1kg/front.png`.

```text
Subject: Aladdin 1KG basmati retail bag: purple-and-yellow front, exact Aladdin script mark, BASMATI SELLA 1121 and 1KG badge. Sealed small retail bag, NO handle.
Scene and light: A warm family kitchen with muted terracotta square tiles, creamy plaster and a butcher-block counter of honey-colored beech. The upright bag sits next to a low glazed ivory serving dish of simple vegetable basmati pilaf. A copper cooking pot is softly blurred in the background. Late afternoon warm sidelight, earthy terracotta and copper palette. This feels intimate and domestic, not a commercial dark grey restaurant kitchen.
Camera and composition: Slightly elevated oblique 45-degree camera, bag front still clearly visible. Bag at about 55% image height just right of center, enough surroundings to establish the tiled kitchen.
```

### premium-negin-safran

Input image 1: `public/products/premium-negin-safran/front.png`.

```text
Subject: Exact small biotfi SAFRAN Super Negin Qualität 1g sachet: white pouch, burgundy vertical branding strip, purple crocus and decorated horse, clear red saffron window and 1g mark.
Scene and light: A quiet artisanal spice-preparation still life on a pale beige travertine work surface, with a warm dusty-rose plaster wall. The tiny saffron sachet stands against a low natural stone riser beside one small aged brass mortar and pestle containing a delicate pinch of crimson saffron threads. A few real threads on cream folded paper; scale makes clear it is a tiny spice packet. A high side window casts a clean angled sunlight shape. Minimal intimate setting, ivory, rose and warm brass, no cooking shelves, no rice bag, no tea glass.
Camera and composition: Close tabletop view slightly from above, 85mm macro-product feeling, subtle visible stone pores and paper wrinkles. Entire small pouch around 48% image height toward 60% across, naturally scaled next to miniature mortar. Spare composition.
```

### vahdam-earl-grey

Input image 1: `public/products/vahdam-earl-grey/front.png`.

```text
Subject: Exact VAHDAM INDIA EARL GREY retail carton: dark green border, black central panel, gold VAHDAM and BLACK TEA type, cream EARL GREY heading, original label arrangement and package proportions.
Scene and light: A small neighborhood café window table on an overcast rainy afternoon. Round walnut tabletop, a softly blurred teal upholstered bench, rain droplets on the large window, an indistinct courtyard beyond. The tea carton sits beside one white porcelain cup of amber Earl Grey on a saucer with a small teaspoon. Soft cool daylight against warm tea; calm muted teal, walnut and blue-grey palette. No kitchen shelves, charcoal counter, cooking pots, or strong golden sunlight.
Camera and composition: Seated eye-level three-quarter view across the small table with shallow depth of field, environmental café portrait. Whole carton at about 44% image height toward 62% across, sharp readable branding, rain window visible behind.
```

### pistazien-mit-schale

Input image 1: `public/products/pistazien-mit-schale/front.png`.

```text
Subject: Natural pistachios in their split beige hard shells from the reference, showing green nuts and some purple-brown skin. Loose nuts; never invent branded packaging.
Scene and light: An outdoor garden courtyard table in early summer, warm white terrazzo tabletop with small terracotta-colored flecks. Pistachios in a shallow rustic cream-glazed bowl, with a few nuts scattered naturally. Olive leaves cast dappled sunlight, softly blurred sage green foliage and sunlit pale stucco behind. Fresh outdoor atmosphere, natural shell texture, gentle breeze implied only by distant leaves. No indoor kitchen, black dish, dark shelves or oak counter.
Camera and composition: Natural 45-degree downward food photograph, intimate serving scale, broad garden background and tabletop. Main bowl right of center near 62% across with the whole bowl and loose nuts inside generous margins.
```

### pistazienkerne

Input image 1: `public/products/pistazienkerne/front.png`.

```text
Subject: Shelled pistachio kernels exactly like the ingredient reference: green and golden-green elongated kernels, purple-brown papery skin patches; absolutely NO hard outer shells or invented packaging.
Scene and light: A bright artisan pâtisserie workspace. Cool white Carrara marble with subtle grey veining, a rectangular sheet of white baking parchment carrying a loose generous mound of pistachio kernels. A small copper measuring scoop sits beside the kernels; farther back a metal cooling rack holds a few pistachio biscuits softly out of focus. Diffuse bakery skylight, powdery white and cool grey surroundings, small touches of copper. No main bowl, black countertop or restaurant shelving.
Camera and composition: High oblique view around 65 degrees downward, focus on kernels and marble textures rather than a front-on packaged-product setup. Main kernel mound around 58% across, clear textured negative space to the left, composed as a horizontal editorial ingredient photograph.
```

### kichererbsen-25kg

Input image 1: `public/products/kichererbsen-25kg/front.png`.

```text
Subject: Dry golden beige chickpeas matching the reference, rounded irregular matte shapes and pointed little beaks. Uncooked dried chickpeas, not cooked or wet. No invented branded sack or retail package.
Scene and light: A covered dry-goods market stall in soft daylight, pale weathered timber counter, one open plain jute sack of chickpeas with its mouth folded down and an old wooden scoop resting across the rim. A modest scattering of chickpeas on the counter. In the blurred background are natural wicker baskets and a sage-green canvas market awning, with a little soft daylight beyond. Earthy straw, sage and pale timber palette. No kitchen, hummus plate, black bowl, chrome or dark interior.
Camera and composition: Three-quarter view slightly above the open sack so its contents are sharply visible, realistic size and gravity, editorial market ingredient portrait. Sack group right of center, lower middle of the image, generous air above and foreground below.
```
