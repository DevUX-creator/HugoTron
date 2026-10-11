"""Build the six-second harbour loop; its first/last decoded frames must be identical.

    python3 scripts/encode-harbour-loop.py

The OpenArt master uses the same start/end reference. A gentle endpoint blend
removes the generator's remaining drift. Reusing the first encoded I-frame as
the last frame also removes any seam introduced by lossy inter-frame encoding.
Requires ffmpeg/ffprobe; no Python packages.
"""

import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets-src/video/hamburg-loop-openart.mp4"
OUTPUT = ROOT / "public/videos/paper-hamburg.mp4"
POSTER = ROOT / "public/images/paper-world/hamburg-film.webp"
FPS = 24
FRAMES = 144


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def smooth(value):
    t = f"min(1,max(0,{value}))"
    return f"({t}*{t}*(3-2*{t}))"


with tempfile.TemporaryDirectory(prefix="hugo-harbour-loop-") as directory:
    folder = Path(directory)
    body, first = folder / "body.mp4", folder / "first.mp4"
    weight = f"{smooth('T/0.35')}*{smooth(f'({(FRAMES - 1) / FPS}-T)/0.65')}"
    filters = (
        "[0:v]fps=24,scale=1280:720:flags=lanczos,setsar=1,format=yuv420p,"
        "trim=end_frame=144,setpts=N/(24*TB),split[motion][still];"
        "[still]trim=end_frame=1,loop=loop=-1:size=1:start=0,setpts=N/(24*TB)[anchor];"
        f"[motion][anchor]blend=all_expr='round(A*({weight})+B*(1-({weight})))':shortest=1[out]"
    )
    run("ffmpeg", "-v", "error", "-i", str(SOURCE), "-filter_complex", filters,
        "-map", "[out]", "-frames:v", str(FRAMES - 1), "-an", "-c:v", "libx264",
        "-preset", "slow", "-crf", "20", "-bf", "0", "-g", "48",
        "-pix_fmt", "yuv420p", "-video_track_timescale", "12288", "-y", str(body))
    run("ffmpeg", "-v", "error", "-i", str(body), "-frames:v", "1",
        "-an", "-c:v", "copy", "-y", str(first))
    playlist = folder / "loop.txt"
    playlist.write_text("file 'body.mp4'\nfile 'first.mp4'\n")
    run("ffmpeg", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(playlist),
        "-an", "-c:v", "copy", "-movflags", "+faststart", "-y", str(OUTPUT))

hashes = [line.rsplit(",", 1)[-1].strip() for line in
          run("ffmpeg", "-v", "error", "-i", str(OUTPUT), "-f", "framemd5", "-").splitlines()
          if line and not line.startswith("#")]
assert len(hashes) == FRAMES, f"Expected {FRAMES} frames, got {len(hashes)}"
assert hashes[0] == hashes[-1], "Loop endpoints differ after decoding"
assert len(set(hashes)) > FRAMES // 2, "Loop must contain real motion"
run("ffmpeg", "-v", "error", "-i", str(OUTPUT), "-frames:v", "1",
    "-c:v", "libwebp", "-quality", "90", "-y", str(POSTER))
info = json.loads(run("ffprobe", "-v", "error", "-show_entries",
                      "format=duration,size:stream=codec_name,width,height,nb_frames",
                      "-of", "json", str(OUTPUT)))
print(json.dumps({"output": str(OUTPUT.relative_to(ROOT)), "matching_endpoint_md5": hashes[0],
                  "unique_frames": len(set(hashes)), **info}, indent=2))
