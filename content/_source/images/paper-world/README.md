# Paper World illustrations

Original illustrations generated for Hugo Tron with OpenAI image generation on 1 October 2026. The floating farmland and harbour are fictional editorial scenes, not depictions of a specific supplier or company warehouse.

The transparent PNG masters are retained here. Public versions are 1280 px wide WebP files at quality 82 / alpha quality 85 (approximately 266 KB and 248 KB), in `public/images/paper-world/`. Responsive derivatives are served by Next Image. The matching decorative routes, clouds and small buying illustrations are lightweight SVG components in `PaperArt.tsx`.

## At the source — separate layers

Generated with the built-in `image_gen` tool on 2 October 2026. Exact prompts are
saved in [source-prompts.json](source-prompts.json). Both assets have transparent
backgrounds and are used as independent layers, with scroll masks and parallax.

- `source-column.png`: original engraving of a weathered column. Optimized asset:
  `public/images/paper-world/source-column.webp`, 720 × 1080, 83,780 bytes.
- `source-cloud.png`: original engraved cloud bank. Optimized asset:
  `public/images/paper-world/source-cloud.webp`, 1200 × 480, 133,978 bytes.

Both versions use WebP quality 82 and alpha quality 85. Two differently positioned
instances share each image download. The archive retains the original farmland
artwork; the updated first scene uses the separate column/cloud layers instead.
