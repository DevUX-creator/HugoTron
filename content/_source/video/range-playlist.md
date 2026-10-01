# Range playlist films

Original user uploads remain in `public/` and are not requested by the page.

- `14549712_2560_1440_30fps.mp4`: 24.591s, 2560 × 1440, 18,874,035 bytes.
  The delivery cut uses 4.0–13.0 seconds (9 seconds), preserving the restaurant pan.
- `13222703_1920_1080_50fps.mp4`: 4.84s, 1920 × 1080, 3,059,362 bytes.
  The atmospheric clip uses 0.0–4.8 seconds.

Both are delivered at 30 fps, without audio, in VP9/WebM with H.264/MP4 fallback.
The 1080p files are for desktop; 720p files are for mobile/data-saving playback.
MP4 uses faststart; a 1600px WebP poster is supplied for each film.

Playlist order: existing rice fields → dining room → light and grain → repeat.
These are editorial background films, not claims about specific growers or locations.

| File                        | Codec | Size        | Duration | Bytes     |
| --------------------------- | ----- | ----------- | -------- | --------- |
| dining-room-mobile.mp4      | h264  | 1280 × 720  | 9.00s    | 1,195,688 |
| dining-room-mobile.webm     | vp9   | 1280 × 720  | 9.00s    | 923,493   |
| dining-room.mp4             | h264  | 1920 × 1080 | 9.00s    | 2,326,880 |
| dining-room.webm            | vp9   | 1920 × 1080 | 9.00s    | 1,927,197 |
| light-and-grain-mobile.mp4  | h264  | 1280 × 720  | 4.80s    | 793,228   |
| light-and-grain-mobile.webm | vp9   | 1280 × 720  | 4.80s    | 290,589   |
| light-and-grain.mp4         | h264  | 1920 × 1080 | 4.80s    | 1,968,661 |
| light-and-grain.webm        | vp9   | 1920 × 1080 | 4.80s    | 574,179   |

Reproduce: `python3 scripts/encode-range-films.py`.
