# Product image format

Updated 2026-09-20 at the user's request: wider images with more space around each product.

- Format: 4:3 landscape, 1448 × 1086 pixels, PNG.
- Framing: target product height around 70% of the canvas, with generous cream space on all sides; actual generated placement varies slightly by view.
- Setting: existing seamless warm cream studio, matte ground and soft contact shadow.
- Mode: built-in image_gen, one call per image; no CLI fallback or image postprocessing.
- Existing filenames in public/products are retained so existing site references use the wider images.
- Backups of the six previously approved square images: each product's content/_source/images/<slug>/approved-square/ directory.
- Small back-label text remains AI-generated and should not be treated as a verified transcription.

## Updated files

- public/products/pardis-1121-basmati-indien/front.png
- public/products/pardis-1121-basmati-indien/side.png
- public/products/pardis-1121-basmati-indien/back.png
- public/products/aladdin-1121-basmati-pakistan/front.png
- public/products/aladdin-1121-basmati-pakistan/side.png
- public/products/aladdin-1121-basmati-pakistan/back.png

## Exact selected prompts

### wide_pardis_front

Use case: precise-object-edit.
Input image 1 is the EDIT TARGET: approved Pardis 1121 Basmati 5kg front studio photograph.
Primary request: extend the warm ivory studio background and tabletop around this exact product, zooming the composition out. Output a LANDSCAPE 4:3 image, 1536 px wide × 1152 px high. The result must be visibly wider than tall, never square.
Composition: reduce the product's relative size to 70% of total frame height. Center the product horizontally, top at 15% of height, base at 85%, generous cream negative space on every side. Preserve natural original aspect ratio of the package; do not stretch it. Extend the existing seamless warm cream backdrop and cream matte ground with its soft contact shadow.
Invariants: keep the identical approved Pardis package and camera angle, printed lettering, rice window, logo, handle, zipper, colors, textures and highlights unchanged. Only change outer canvas / breathing room and the relative scale of the entire original photographic subject. Preserve all existing label text exactly; do not redraw, restyle or redesign the product. No new text, props, borders or decorations. No crop. One single product photograph.

### wide_pardis_side

Use case: precise-object-edit.
Input image is the EDIT TARGET: the approved narrow SIDE PROFILE photograph of the Pardis 1121 Basmati 5kg rice bag. Preserve this SIDE VIEW exactly.
Request: change only the image framing by extending the existing warm cream background and matte cream tabletop around the original subject. LANDSCAPE 4:3 canvas (1536 wide × 1152 high), visibly wider than tall. Show the very same thin SIDE PROFILE, centered, at about 70% canvas height, leaving approximately 15% clear space above the top and 15% below the base. Maintain the original proportions: the bag is a narrow side-facing column, approximately 19% of the total landscape canvas width.
The transparent gusset with visible rice and the navy Pardis side logo faces the camera. The front and back faces remain nearly edge-on, exactly as the reference. Top handle stays a tiny narrow edge-on shape at the top. Do NOT rotate to a front-facing bag and do NOT invent an oval handle seen front-on.
Keep the exact original side logo, printed Persian lettering, rice texture, navy and gold edge seams, wrinkles, photographic highlights and soft grounded shadow. Preserve all subject appearance. Only add more seamless cream studio around it and scale the original entire subject uniformly within the new frame. No stretching, redesign, props, extra text or borders. Output one side-profile photo only.

### wide_pardis_back

Use case: precise-object-edit.
Input image 1 is the EDIT TARGET: approved Pardis 1121 Basmati 5kg back studio photograph.
Primary request: extend the warm ivory studio background and tabletop around this exact product, zooming the composition out. Output a LANDSCAPE 4:3 image, 1536 px wide × 1152 px high. The result must be visibly wider than tall, never square.
Composition: reduce the product's relative size to 70% of total frame height. Center the product horizontally, top at 15% of height, base at 85%, generous cream negative space on every side. Preserve natural original aspect ratio of the package; do not stretch it. Extend the existing seamless warm cream backdrop and cream matte ground with its soft contact shadow.
Invariants: keep the identical approved Pardis package and camera angle, printed lettering, rice window, logo, handle, zipper, colors, textures and highlights unchanged. Only change outer canvas / breathing room and the relative scale of the entire original photographic subject. Preserve all existing label text exactly; do not redraw, restyle or redesign the product. No new text, props, borders or decorations. No crop. One single product photograph.
Input image 2 is the approved LANDSCAPE COMPOSITION reference: match its canvas aspect ratio, background, product height and top/base positions. Image 1 alone defines the product angle and all printed artwork. Do not switch it to the front view.

### wide_aladdin_front

Use case: precise-object-edit.
Input image 1 is the EDIT TARGET: approved Aladdin 1121 Basmati 5kg front studio photograph.
Primary request: extend the warm ivory studio background and tabletop around this exact product, zooming the composition out. Output a LANDSCAPE 4:3 image, 1536 px wide × 1152 px high. The result must be visibly wider than tall, never square.
Composition: reduce the product's relative size to 70% of total frame height. Center the product horizontally, top at 15% of height, base at 85%, generous cream negative space on every side. Preserve natural original aspect ratio of the package; do not stretch it. Extend the existing seamless warm cream backdrop and cream matte ground with its soft contact shadow.
Invariants: keep the identical approved Aladdin package and camera angle, printed lettering, rice window, logo, integrated yellow handle, colors, textures and highlights unchanged. Only change outer canvas / breathing room and the relative scale of the entire original photographic subject. Preserve all existing label text exactly; do not redraw, restyle or redesign the product. No new text, props, borders or decorations. No crop. One single product photograph.

### wide_aladdin_side

Use case: precise-object-edit.
Input image is the EDIT TARGET: the approved narrow SIDE PROFILE photograph of the Aladdin 1121 Basmati 5kg rice bag. Preserve this SIDE VIEW exactly.
Request: change only the image framing by extending the existing warm cream background and matte cream tabletop around the original subject. LANDSCAPE 4:3 canvas (1536 wide × 1152 high), visibly wider than tall. Show the very same thin SIDE PROFILE, centered, at about 70% canvas height, leaving approximately 15% clear space above the top and 15% below the base. Maintain the original proportions: the bag is a narrow side-facing column, approximately 19% of the total landscape canvas width.
The transparent gusset with visible rice and the purple-and-gold Aladdin side logo faces the camera. The front and back faces remain nearly edge-on, exactly as the reference. Top yellow integrated handle stays a tiny narrow edge-on shape at the top. Do NOT rotate to a front-facing bag and do NOT invent an oval handle seen front-on.
Keep the exact original side logo, gold Aladdin script, rice texture, purple and gold edge seams, wrinkles, photographic highlights and soft grounded shadow. Preserve all subject appearance. Only add more seamless cream studio around it and scale the original entire subject uniformly within the new frame. No stretching, redesign, props, extra text or borders. Output one side-profile photo only.

### wide_aladdin_back

Use case: precise-object-edit.
Input image 1 is the EDIT TARGET: approved Aladdin 1121 Basmati 5kg BACK studio photograph.
Primary request: extend the warm ivory studio background and tabletop around this exact product, zooming the composition out. Output a LANDSCAPE 4:3 image, 1536 px wide × 1152 px high. The result must be visibly wider than tall, never square.
Composition: reduce the product's relative size to 70% of total frame height. Center the product horizontally, top at 15% of height, base at 85%, generous cream negative space on every side. Preserve natural original aspect ratio of the package; do not stretch it. Extend the existing seamless warm cream backdrop and cream matte ground with its soft contact shadow.
Invariants: keep the identical approved Aladdin package and camera angle, printed lettering, rice window, logo, integrated yellow handle, colors, textures and highlights unchanged. Only change outer canvas / breathing room and the relative scale of the entire original photographic subject. Preserve all existing label text exactly; do not redraw, restyle or redesign the product. No new text, props, borders or decorations. No crop. One single product photograph.
This MUST remain a BACK VIEW: keep the purple nutrition / cooking-instructions panel, white batch label and barcode facing the camera exactly as in the reference. Do not show the front face. Preserve the existing original small label text and all numeric values, without changes.
