"""
Turns an engraving on plain paper into a transparent ink layer for the paper story.

The paper around the drawing becomes transparent (soft-edged, following the ink), while light
areas enclosed by the drawing (a gull's body, a petal) stay solid, so lines and layers behind
never show through the subject. Output is cropped to the drawing and saved as WebP.

    python3 scripts/ink-layer.py in.png public/images/paper-world/ship.webp [max-side]

Requires Pillow.
"""

import sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


def ink_layer(source, target, max_side=1600):
    rgb = Image.open(source).convert("RGB")
    rgb.thumbnail((max_side, max_side), Image.LANCZOS)
    lum = ImageOps.grayscale(rgb)
    # The local paper tone: the brightest nearby value, smoothed. Handles vignettes and grain.
    paper = lum.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(25))
    # Ink strength 0-255: how much darker than its own paper each pixel is.
    darkness = ImageChops.subtract(paper, lum).point(lambda v: 0 if v < 10 else min(255, (v - 10) * 3))
    # Outside = paper-coloured pixels connected to the border.
    region = darkness.point(lambda v: 255 if v < 40 else 0).filter(ImageFilter.MinFilter(3))
    w, h = region.size
    seed_value = 128
    for x in range(0, w, 8):
        for y in (0, h - 1):
            if region.getpixel((x, y)) == 255:
                ImageDraw.floodfill(region, (x, y), seed_value)
    for y in range(0, h, 8):
        for x in (0, w - 1):
            if region.getpixel((x, y)) == 255:
                ImageDraw.floodfill(region, (x, y), seed_value)
    outside = region.point(lambda v: 255 if v == seed_value else 0).filter(ImageFilter.GaussianBlur(1.2))
    inside = ImageOps.invert(outside)
    alpha = ImageChops.lighter(darkness, inside)
    out = rgb.copy()
    out.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    if box:
        pad = 8
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(w, box[2] + pad), min(h, box[3] + pad))
        out = out.crop(box)
    out.save(target, "WEBP", quality=88, method=6)
    print(f"{source} -> {target} {out.size}")


if __name__ == "__main__":
    ink_layer(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1600)
