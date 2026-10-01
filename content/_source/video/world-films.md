# Home 3D sheet films

The home journey has exactly three sheets, configured in
`src/content/worldFilms.ts`: rice fields → dining room → tea ritual.
The tea film replaces the previous light-and-grain sheet. The rice category's
range playlist is unchanged.

The supplied `public/3dvideo.mp4` shows loose tea leaves being poured from a wooden
scoop into a container. The original is preserved and never requested by the
page. This is editorial footage, not a claim about a particular product or origin.

The full 15.2-second clip is retained at its original 25 fps. Optimized versions
live in `public/video/world/`: VP9/WebM with H.264/MP4 fallback, 1920 × 1080 for
desktop and 1280 × 720 for mobile. Both formats use 8-bit YUV 4:2:0, retain the
source's BT.709 colour space, and omit audio and source metadata. MP4 files use
faststart. A 1600 × 900 WebP of the opening frame supports loading, failed
playback, reduced motion, and the non-WebGL version.

| Delivery file            | Bytes     |
| ------------------------ | --------- |
| `tea-ritual.webm`        | 1,719,327 |
| `tea-ritual.mp4`         | 3,407,181 |
| `tea-ritual-mobile.webm` | 991,623   |
| `tea-ritual-mobile.mp4`  | 1,373,799 |
| `tea-ritual-poster.webp` | 38,600    |

Only the active sheet plays. The tea film is requested when the third sheet
becomes active, independently of the initial home scene load.

Reproduce: `python3 scripts/encode-world-films.py`.
