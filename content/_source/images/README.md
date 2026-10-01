# Product image index

Completed 2026-09-20. All nine products from the [Hugo-Tron catalog](https://www.hugo-tron.com/category/all-products) now have matching studio images in public/products/.

**40 images across 9 products:** 22 studio landscape PNGs at 1448 × 1086 pixels (4:3), nine studio portrait PNGs at 1086 × 1448 pixels (3:4), and nine lifestyle landscape PNGs at 1774 × 887 pixels (2:1). Studio images share a warm cream setting; lifestyle images now use nine distinct settings, including a restaurant kitchen, stockroom, dining room, café, garden table, pastry bench and market stall. All work used built-in image_gen; original sources and exact prompts are retained in the linked notes.

Each product now has a `card-portrait.png` used as its opening card image. See [portrait files and exact prompts](card-portraits.md). Existing landscape images remain available at their original paths.

Each product also has a `lifestyle-parallax.png`. The first set was replaced with varied environments at the user's request. See the [nine lifestyle images and exact prompt set](lifestyle-parallax.md).

## Files

| Product                          | Images                                                                                                                                                                                                                        | Sources and prompts                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Pardis 1121 Basmati, 5 kg        | [front](../../../public/products/pardis-1121-basmati-indien/front.png) · [side](../../../public/products/pardis-1121-basmati-indien/side.png) · [back](../../../public/products/pardis-1121-basmati-indien/back.png)          | [Notes](product-image-format.md)                     |
| Aladdin 1121 Basmati, 5 kg       | [front](../../../public/products/aladdin-1121-basmati-pakistan/front.png) · [side](../../../public/products/aladdin-1121-basmati-pakistan/side.png) · [back](../../../public/products/aladdin-1121-basmati-pakistan/back.png) | [Notes](aladdin-1121-basmati-pakistan/generation.md) |
| Pardis Basmati, 1 kg             | [front](../../../public/products/pardis-basmati-indien-1kg/front.png) · [angle](../../../public/products/pardis-basmati-indien-1kg/angle.png)                                                                                 | [Notes](pardis-basmati-indien-1kg/generation.md)     |
| Aladdin Basmati aus Pakistan 1kg | [front](../../../public/products/aladdin-basmati-pakistan-1kg/front.png) · [back](../../../public/products/aladdin-basmati-pakistan-1kg/back.png) · [angle](../../../public/products/aladdin-basmati-pakistan-1kg/angle.png)  | [Notes](aladdin-basmati-pakistan-1kg/generation.md)  |
| Premium Negin Safran             | [front](../../../public/products/premium-negin-safran/front.png) · [angle](../../../public/products/premium-negin-safran/angle.png) · [detail](../../../public/products/premium-negin-safran/detail.png)                      | [Notes](premium-negin-safran/generation.md)          |
| Vahdam Earl Grey                 | [front](../../../public/products/vahdam-earl-grey/front.png) · [angle](../../../public/products/vahdam-earl-grey/angle.png)                                                                                                   | [Notes](vahdam-earl-grey/generation.md)              |
| Pistazien mit Schale             | [front](../../../public/products/pistazien-mit-schale/front.png) · [top](../../../public/products/pistazien-mit-schale/top.png)                                                                                               | [Notes](pistazien-mit-schale/generation.md)          |
| Pistazienkerne                   | [front](../../../public/products/pistazienkerne/front.png) · [top](../../../public/products/pistazienkerne/top.png)                                                                                                           | [Notes](pistazienkerne/generation.md)                |
| Kichererbsen 25kg                | [front](../../../public/products/kichererbsen-25kg/front.png) · [top](../../../public/products/kichererbsen-25kg/top.png)                                                                                                     | [Notes](kichererbsen-25kg/generation.md)             |

## Format and source notes

- [Shared framing instructions and the six reframing prompts](product-image-format.md).
- Original approved square 5kg images remain in each product's approved-square/ source directory; public images use the new wider format.
- Some alternate angles are reconstructions from front-only references. These limitations are recorded per product. No undocumented back packaging was created.
- Generated small back-label text and nutritional details are not verified label artwork. Retain the original photographs for label comparison.
- The loose-food images depict the ingredients from the catalog; the 25kg chickpea listing has no source sack photograph.
- All files were inspected visually and checked for image dimensions. The portrait addition updates ProductCard to use the new front image with cover framing; other views retain their existing images and contain framing.
