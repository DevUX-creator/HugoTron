"""Optimize the supplied tea film for the home 3D sheet, preserving the original."""

from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets-src/video/3dvideo.mp4"
OUTPUT = ROOT / "public/video/world"


def encode():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    base = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(SOURCE), "-map", "0:v:0", "-an", "-map_metadata", "-1",
    ]
    for suffix, width in [("", 1920), ("-mobile", 1280)]:
        # Keep the source's 25 fps rather than adding duplicated frames.
        filters = f"scale={width}:-2:flags=lanczos,setsar=1"
        common = [
            "-vf", filters, "-threads", "4", "-pix_fmt", "yuv420p",
            "-color_primaries", "bt709", "-color_trc", "bt709",
            "-colorspace", "bt709", "-color_range", "tv",
        ]
        subprocess.run(base + common + [
            "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30",
            "-deadline", "good", "-cpu-used", "3", "-row-mt", "1",
            str(OUTPUT / f"tea-ritual{suffix}.webm"),
        ], check=True)
        subprocess.run(base + common + [
            "-c:v", "libx264", "-preset", "slow", "-crf", "23",
            "-movflags", "+faststart", str(OUTPUT / f"tea-ritual{suffix}.mp4"),
        ], check=True)
        print(f"Encoded tea-ritual{suffix}", flush=True)
    subprocess.run(base + [
        "-frames:v", "1", "-vf", "scale=1600:-2:flags=lanczos",
        "-c:v", "libwebp", "-quality", "82",
        str(OUTPUT / "tea-ritual-poster.webp"),
    ], check=True)


if __name__ == "__main__":
    encode()
