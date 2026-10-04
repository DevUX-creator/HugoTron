"""Create web delivery files from the two supplied films in assets-src/video; preserve originals."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public/video/range"
OUTPUT.mkdir(parents=True, exist_ok=True)
CLIPS = [
    ("dining-room", "14549712_2560_1440_30fps.mp4", 4, 9),
    ("light-and-grain", "13222703_1920_1080_50fps.mp4", 0, 4.8),
]
for name, source, start, duration in CLIPS:
    base = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(start), "-i", str(ROOT / "assets-src/video" / source), "-t", str(duration), "-an"]
    for suffix, width in [("", 1920), ("-mobile", 1280)]:
        filters = f"scale={width}:-2:flags=lanczos,fps=30,setsar=1"
        subprocess.run(base + ["-vf", filters, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30", "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", "-threads", "4", "-pix_fmt", "yuv420p", str(OUTPUT / f"{name}{suffix}.webm")], check=True)
        subprocess.run(base + ["-vf", filters, "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-threads", "4", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUTPUT / f"{name}{suffix}.mp4")], check=True)
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(start), "-i", str(ROOT / "assets-src/video" / source), "-frames:v", "1", "-vf", "scale=1600:-2", "-quality", "82", str(OUTPUT / f"{name}-poster.webp")], check=True)
    print(f"Encoded {name}: {duration}s", flush=True)
