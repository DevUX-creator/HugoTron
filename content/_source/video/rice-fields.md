# Rice fields homepage film

Source: the supplied `public/cutTo8sec.mp4` (292,475,984 bytes, 38.39 seconds,
3840 × 2160, 59.94 fps). The original is preserved and is not loaded by the
homepage. SHA-256:
`1a926ceca329a4fb36a2dc2362ce7ac6252378374a1eef8edac77f89bb5905a6`.

The film shows rice terraces. Its location and relationship to Hugo suppliers
have not been established; the accessible descriptions make no such claims.

## Edit and delivery

The edit uses seconds 0.5–8.5, with the last half-second blending into source
seconds 0–0.5 for a softer loop seam. All delivery files are eight seconds,
30 fps, with no audio track. FFmpeg produced a high-quality 1080p intermediate,
then the following files in `public/video/`:

| File                      | Encoding                             | Resolution  | Bytes     |
| ------------------------- | ------------------------------------ | ----------- | --------- |
| `rice-fields.webm`        | Two-pass VP9, 2400 kb/s              | 1920 × 1080 | 2,403,244 |
| `rice-fields-mobile.webm` | Two-pass VP9, 1100 kb/s              | 1280 × 720  | 1,108,164 |
| `rice-fields.mp4`         | H.264, CRF 25, faststart             | 1920 × 1080 | 3,846,636 |
| `rice-fields-mobile.mp4`  | H.264, CRF 25, faststart             | 1280 × 720  | 1,752,572 |
| `rice-fields-poster.webp` | WebP, quality 72, first edited frame | 1600 × 900  | 304,578   |

VP9 is preferred when supported, with H.264 as both a compatibility and network
failure fallback. Smaller screens and data-saving connections select the mobile
file. Media loads near the section and plays only while visible. Reduced-motion
and data-saving preferences keep the poster until the visitor explicitly plays
the film. The original source is never requested by this component.
