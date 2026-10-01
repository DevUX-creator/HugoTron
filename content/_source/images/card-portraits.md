# Portrait product card images

Created 2026-09-20 with built-in image_gen, one edit call per product; no CLI fallback or image postprocessing.

- Nine additional PNGs, one per product, at 1086 × 1448 pixels (3:4 portrait).
- Each uses its existing front.png as the edit target and retains the warm cream studio setting.
- Upright packaging is centered with clear margins. Loose ingredients are arranged into a taller group without stretching individual pieces.
- ProductCard uses card-portrait.png for the front view. Its existing 5:6 tile uses cover for the portrait, trimming only cream margins; alternate landscape views retain contain.
- The 22 existing landscape images remain unchanged and available for hero, category and gallery use.

## Saved files

- [pardis-1121-basmati-indien](../../../public/products/pardis-1121-basmati-indien/card-portrait.png)
- [aladdin-1121-basmati-pakistan](../../../public/products/aladdin-1121-basmati-pakistan/card-portrait.png)
- [pardis-basmati-indien-1kg](../../../public/products/pardis-basmati-indien-1kg/card-portrait.png)
- [aladdin-basmati-pakistan-1kg](../../../public/products/aladdin-basmati-pakistan-1kg/card-portrait.png)
- [premium-negin-safran](../../../public/products/premium-negin-safran/card-portrait.png)
- [vahdam-earl-grey](../../../public/products/vahdam-earl-grey/card-portrait.png)
- [pistazien-mit-schale](../../../public/products/pistazien-mit-schale/card-portrait.png)
- [pistazienkerne](../../../public/products/pistazienkerne/card-portrait.png)
- [kichererbsen-25kg](../../../public/products/kichererbsen-25kg/card-portrait.png)

## Validation

- Verified all nine portrait files are 1086 × 1448 pixels and all 22 existing landscape images retain their original checksums.
- Checked every card on desktop (1440 px, English) and mobile (390 px, German), including switching to an alternate image and back to the portrait.
- TypeScript, ESLint for ProductCard, and Stylelint for its stylesheet passed.
- The development preview reports a root HTML class hydration warning outside the changed card component; portrait loading and gallery interaction pass without uncaught page errors.

## Exact prompts

### pardis-1121-basmati-indien

Edit target: public/products/pardis-1121-basmati-indien/front.png

```text
Use case: precise-object-edit.
Asset type: portrait ecommerce product-card photograph.
Input image 1 is the EDIT TARGET: the approved front studio photograph of Pardis 1121 Basmati 5 kg.
Primary request: make ONE extra vertical version, PORTRAIT 3:4 canvas, 1152 pixels wide by 1536 pixels tall. Reframe this exact product for a tall card.
Composition: center the entire upright bag horizontally, preserve its original natural proportions and exact front camera angle. Product from top of handle to bottom of bag should occupy 70% of image height, from y=15% to y=85%, with cream breathing room at all four edges. Product width should follow its original proportions, never stretch or crop. Keep the full handle and full base visible. Retain room above for a small card badge and below for gallery dots.
Setting: same seamless warm ivory cream studio backdrop and matte tabletop, soft diffuse studio lighting and subtle grounded contact shadow, visually matching the edit target.
Invariants: preserve the identical navy-and-yellow Pardis 5 kg packaging, blue rigid handle, zipper, rice-filled translucent gusset, logos, printed artwork, exact lettering and numbers, textures, wrinkles and colors. Change only outer framing and uniform scale, never redesign, rotate or retouch label artwork. No new text, props, border, watermark or decorative elements. One single portrait photograph, visibly taller than wide.
```

### aladdin-1121-basmati-pakistan

Edit target: public/products/aladdin-1121-basmati-pakistan/front.png

```text
Use case: precise-object-edit.
Asset type: portrait ecommerce product-card photograph.
Input image 1 is the EDIT TARGET: the approved front studio photograph of Aladdin 1121 Basmati 5 kg.
Primary request: make ONE extra vertical version, PORTRAIT 3:4 canvas, 1152 pixels wide by 1536 pixels tall. Reframe this exact product for a tall card.
Composition: center the entire upright package horizontally, preserve its original natural proportions and exact front camera angle. Product should occupy about 70% of image height, from y=15% to y=85%, with cream breathing room at all four edges. Width follows the original proportions; never stretch or crop. Full top and full base visible. Keep cream space above for a small card badge and below for gallery dots.
Setting: same seamless warm ivory cream studio backdrop and matte tabletop as input, soft diffuse studio lighting and subtle grounded contact shadow.
Invariants: identical plum-purple and golden-yellow Aladdin 5 kg bag with integrated yellow die-cut oval handle, clear rice-filled left gusset and gold Aladdin medallion; no rigid handle and no zipper. Preserve exact printed artwork, logos, lettering, numbers, textures, wrinkles, colors and camera angle. Change only framing and uniform scale; never redesign, rotate or retouch label artwork. No new text, props, borders, watermark or decorations. One single portrait photograph, visibly taller than wide.
```

### pardis-basmati-indien-1kg

Edit target: public/products/pardis-basmati-indien-1kg/front.png

```text
Use case: precise-object-edit.
Asset type: portrait ecommerce product-card photograph.
Input image 1 is the EDIT TARGET: the approved front studio photograph of Pardis Basmati 1 kg.
Primary request: make ONE extra vertical version, PORTRAIT 3:4 canvas, 1152 pixels wide by 1536 pixels tall. Reframe this exact product for a tall card.
Composition: center the entire upright package horizontally, preserve its original natural proportions and exact front camera angle. Product should occupy about 70% of image height, from y=15% to y=85%, with cream breathing room at all four edges. Width follows the original proportions; never stretch or crop. Full top and full base visible. Keep cream space above for a small card badge and below for gallery dots.
Setting: same seamless warm ivory cream studio backdrop and matte tabletop as input, soft diffuse studio lighting and subtle grounded contact shadow.
Invariants: identical blue-and-yellow Pardis 1 kg soft sealed rectangular packet, flat heat-sealed top without a handle, pale narrow sides, sunrise emblem, central yellow arch, lower blue stripes, 1KG badge; do not turn it into the 5 kg pack. Preserve exact printed artwork, logos, lettering, numbers, textures, wrinkles, colors and camera angle. Change only framing and uniform scale; never redesign, rotate or retouch label artwork. No new text, props, borders, watermark or decorations. One single portrait photograph, visibly taller than wide.
```

### aladdin-basmati-pakistan-1kg

Edit target: public/products/aladdin-basmati-pakistan-1kg/front.png

```text
Use case: precise-object-edit.
Asset type: portrait ecommerce product-card photograph.
Input image 1 is the EDIT TARGET: the approved front studio photograph of Aladdin Basmati 1 kg.
Primary request: make ONE extra vertical version, PORTRAIT 3:4 canvas, 1152 pixels wide by 1536 pixels tall. Reframe this exact product for a tall card.
Composition: center the entire upright package horizontally, preserve its original natural proportions and exact front camera angle. Product should occupy about 70% of image height, from y=15% to y=85%, with cream breathing room at all four edges. Width follows the original proportions; never stretch or crop. Full top and full base visible. Keep cream space above for a small card badge and below for gallery dots.
Setting: same seamless warm ivory cream studio backdrop and matte tabletop as input, soft diffuse studio lighting and subtle grounded contact shadow.
Invariants: identical purple-and-yellow Aladdin 1 kg soft sealed rectangular packet, flat yellow heat-sealed top without a handle, centered Aladdin medallion, central yellow arch, lower purple stripes, 1KG badge; do not turn it into the 5 kg pack. Preserve exact printed artwork, logos, lettering, numbers, textures, wrinkles, colors and camera angle. Change only framing and uniform scale; never redesign, rotate or retouch label artwork. No new text, props, borders, watermark or decorations. One single portrait photograph, visibly taller than wide.
```

### premium-negin-safran

Edit target: public/products/premium-negin-safran/front.png

```text
Use case: precise-object-edit.
Asset type: portrait ecommerce product-card photograph.
Input image 1 is the EDIT TARGET: the approved front studio photograph of Premium Negin Safran 1g by biotti.
Primary request: make ONE extra vertical version, PORTRAIT 3:4 canvas, 1152 pixels wide by 1536 pixels tall. Reframe this exact pouch for a tall card.
Composition: center the whole upright pouch horizontally, preserving its original proportions and front camera angle. Pouch about 65% of frame height, top at 18% and base at 83%, with generous cream breathing room all around for card badges and controls. Full top, hang slot and base visible; do not stretch or crop.
Setting: same seamless warm ivory cream studio backdrop and matte tabletop, soft diffuse studio lighting and subtle grounded contact shadow.
Invariants: preserve identical pearlescent white biotti saffron 1g pouch with burgundy label, gold SAFRAN lettering, Super Negin Qualität, horse and purple crocus artwork, transparent window showing deep red saffron, gold outlines, burgundy 1g badge, original hang slot and zipper. Keep exact label artwork, lettering, colors, textures and proportions unchanged. Change only framing and uniform scale. No new text, props, border or watermark. One single portrait photograph, visibly taller than wide.
```

### vahdam-earl-grey

Edit target: public/products/vahdam-earl-grey/front.png

```text
Use case: precise-object-edit.
Asset type: portrait ecommerce product-card photograph.
Input image 1 is the EDIT TARGET: the approved front studio photograph of Vahdam Earl Grey tea box.
Primary request: make ONE extra vertical version, PORTRAIT 3:4 canvas, 1152 pixels wide by 1536 pixels tall. Reframe this exact green tea box for a tall card.
Composition: preserve the box's original nearly square front proportions and exact camera angle with its small visible top edge. Center horizontally, box width about 72% of canvas, height about 59% of the portrait canvas. Visually centered around y=53%; leave generous cream breathing room at the top and bottom and at least 13% on the left and right. Entire carton visible including every corner. Do not elongate the box to make it fit.
Setting: same seamless warm ivory cream studio backdrop and matte tabletop, soft diffuse studio lighting and subtle grounded contact shadow.
Invariants: preserve identical deep green, black, white and gold VAHDAM INDIA EARL GREY carton; exact printed artwork, lettering, numbers, logos, badges and proportions. Preserve all original packaging text including FRAGRANT BLACK TEA WITH CITRUSY BERGAMOT FLAVOR, BLACK TEA, CERTIFIED ORGANIC and NET WT. 1.06 OZ (30g) • 15 TEA BAGS. Change only framing and uniform scale, never redesign or retouch label. No new text, props, border or watermark. One single portrait photograph, visibly taller than wide.
```

### pistazien-mit-schale

Edit target: public/products/pistazien-mit-schale/front.png

```text
Use case: precise-object-edit.
Asset type: portrait ecommerce ingredient product-card photograph.
Input image 1 is the EDIT TARGET: approved studio photograph of pistachios in shells.
Primary request: create ONE extra vertical version, PORTRAIT 3:4 canvas, 1152 pixels wide by 1536 pixels tall, carefully arranging the same ingredient for a tall product card.
Composition: natural compact cluster of the same in-shell pistachios, elongated gently along the vertical depth of the tabletop so the group fits a portrait composition. Entire group centered at x=50%, y=53%, about 74% of canvas width and 58% of canvas height. Leave generous clean cream margins, no nuts cut off at any edge. Preserve each nut's natural proportions; do not stretch, stack vertically into a tower or invent packaging. Slightly elevated three-quarter close-up camera as reference.
Setting: same warm ivory cream matte tabletop and seamless soft studio lighting, natural grounded shadows and crisp appetizing realistic shell and kernel texture.
Invariants: same pale tan naturally split shells, green kernels, brown-purple skins, realistic individual shapes and roughly same small quantity as reference. Adjust composition to fit portrait card, keeping the reference photographic look. No bowl, sack, props, text, logos, borders or watermark. One single portrait ingredient photograph, visibly taller than wide.
```

### pistazienkerne

Edit target: public/products/pistazienkerne/front.png

```text
Use case: precise-object-edit.
Asset type: portrait ecommerce ingredient product-card photograph.
Input image 1 is the EDIT TARGET: approved studio photograph of shelled pistachio kernels.
Primary request: create ONE extra vertical version, PORTRAIT 3:4 canvas, 1152 pixels wide by 1536 pixels tall, carefully arranging the same ingredient for a tall product card.
Composition: natural compact cluster of the same shelled pistachio kernels, elongated gently along the vertical depth of the tabletop so the group fits a portrait composition. Entire group centered at x=50%, y=53%, about 74% of canvas width and 58% of canvas height. Leave generous clean cream margins, no individual pieces cut off at any edge. Preserve each ingredient's natural proportions; do not stretch, stack vertically into a tower or invent packaging. Slightly elevated three-quarter close-up camera as reference.
Setting: same warm ivory cream matte tabletop and seamless soft studio lighting, natural grounded shadows and crisp appetizing realistic ingredient texture.
Invariants: same green and golden-green pistachio kernels, natural wrinkled surfaces and patches of brown-purple papery skin, a few split kernel halves and tiny loose skin fragments, roughly same small quantity as reference, absolutely no hard outer shells. Adjust only composition to fit portrait card, keeping the reference photographic look and ingredient identity. No bowl, sack, props, text, logos, borders or watermark. One single portrait ingredient photograph, visibly taller than wide.
```

### kichererbsen-25kg

Edit target: public/products/kichererbsen-25kg/front.png

```text
Use case: precise-object-edit.
Asset type: portrait ecommerce ingredient product-card photograph.
Input image 1 is the EDIT TARGET: approved studio photograph of dried chickpeas.
Primary request: create ONE extra vertical version, PORTRAIT 3:4 canvas, 1152 pixels wide by 1536 pixels tall, carefully arranging the same ingredient for a tall product card.
Composition: natural compact cluster of the same dried chickpeas, elongated gently along the vertical depth of the tabletop so the group fits a portrait composition. Entire group centered at x=50%, y=53%, about 74% of canvas width and 58% of canvas height. Leave generous clean cream margins, no individual pieces cut off at any edge. Preserve each ingredient's natural proportions; do not stretch, stack vertically into a tower or invent packaging. Slightly elevated three-quarter close-up camera as reference.
Setting: same warm ivory cream matte tabletop and seamless soft studio lighting, natural grounded shadows and crisp appetizing realistic ingredient texture.
Invariants: same pale golden beige dry chickpeas, rounded irregular shapes with little pointed beaks and delicate wrinkled matte surfaces, roughly same small quantity as reference, dry uncooked appearance, no green peas, nuts or grains. Adjust only composition to fit portrait card, keeping the reference photographic look and ingredient identity. No bowl, sack, props, text, logos, borders or watermark. One single portrait ingredient photograph, visibly taller than wide.
```
