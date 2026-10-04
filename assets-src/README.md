# Source assets (not served)

Originals that the scripts in `scripts/` turn into the web files under `public/`. Nothing in
this folder is deployed or requested by the site. Edit a master here, rerun its script, and
commit the regenerated files in `public/`.

| Master                                                                                           | Script                                            | Web files                                       |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------- |
| `audio/BackgroundMusic.mp3`, `MenuNavEtc.mp3`, `FLyAway.mp3`, `Click.wav`, `ItemAddedInCart.wav` | `python3 scripts/prepare-world-audio.py`          | `public/audio/world/*.mp3`                      |
| `audio/CarStart.mp3`, `audio/drive.mp3`                                                          | cut by hand with ffmpeg (see below)               | `public/audio/delivery/start.mp3`, `engine.mp3` |
| `video/14549712_2560_1440_30fps.mp4`, `video/13222703_1920_1080_50fps.mp4`                       | `python3 scripts/encode-range-films.py`           | `public/video/range/*`                          |
| `video/3dvideo.mp4`                                                                              | `python3 scripts/encode-world-films.py`           | `public/video/world/tea-ritual*`                |
| `models/shrine_of_the_oracle.glb`                                                                | `python3 scripts/prepare-world-model.py` (Pillow) | `public/models/world/hugo-world*.glb`           |
| `images/paper-world/*.png`                                                                       | `python3 scripts/ink-layer.py <in> <out> [width]` | `public/images/paper-world/*.webp`              |

`scripts/extract-room-stonework.py` cuts `public/models/private-label/courtyard-stonework.glb`
from the already prepared home model, so it needs no master of its own.

The delivery sounds are an eight-second section of `drive.mp3` with a 400 ms wrap crossfade
(7.6-second loop) and the starter from `CarStart.mp3`, both mono 44.1 kHz / 96 kbps MP3.

## Generated illustrations

The paper-world, palace, category and sourcing illustrations were generated for Hugo Tron
with an image model. The exact prompts are kept next to them (`images/*/prompts.json`,
`images/paper-world/*-prompts.json`, `images/product-cutouts.json`) so an illustration can be
regenerated or extended in the same style. They are editorial drawings, not photographs of
real suppliers, farms or warehouses.

## Licences and credits

- **Courtyard model:** "Shrine of the Oracle" by Isabella Crowder,
  <https://sketchfab.com/3d-models/shrine-of-the-oracle-a17d5aa5f7544e8e9cb602b1ed1925a3>,
  licensed **CC BY 4.0** (<https://creativecommons.org/licenses/by/4.0/>). The web versions
  remove some props and recompress textures. CC BY requires visible attribution; the site
  currently shows none (see `docs/CLIENT-INPUT.md`).
- **Music, sound effects, `3dvideo.mp4`, car recordings:** supplied by the owner.
- **Range films:** the file names follow Pexels' download pattern. Confirm the source and
  licence before launch.
- **Map data** for the delivery page: Natural Earth (public domain), downloaded by the
  generator scripts rather than stored here.
