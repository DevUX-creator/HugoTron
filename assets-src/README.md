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
