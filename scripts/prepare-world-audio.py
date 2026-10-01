"""Prepare the owner's soundtrack, preserving the original files and their dynamics."""

import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public/audio/world"


def prepare():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source = ROOT / "public/BackgroundMusic.mp3"
    info = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_format", "-of", "json", str(source),
    ]))
    duration = float(info["format"]["duration"])
    overlap = 1.5
    # Rotate the loop: the last 1.5 seconds blend into the opening, then meet the
    # unchanged middle on the next pass. No repeated fade to silence every loop.
    graph = (
        "[0:a]asplit=3[head][middle][tail];"
        f"[head]atrim=0:{overlap},asetpts=PTS-STARTPTS[h];"
        f"[middle]atrim={overlap}:{duration-overlap},asetpts=PTS-STARTPTS[m];"
        f"[tail]atrim={duration-overlap}:{duration},asetpts=PTS-STARTPTS[t];"
        f"[t][h]acrossfade=d={overlap}:c1=qsin:c2=qsin[seam];"
        "[m][seam]concat=n=2:v=0:a=1[out]"
    )
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
        "-filter_complex", graph, "-map", "[out]", "-map_metadata", "-1",
        "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100",
        str(OUTPUT / "background.mp3"),
    ], check=True)
    for original, output, sample_rate, level in [
        ("MenuNavEtc.mp3", "menu.mp3", "48000", "0dB"),
        ("FLyAway.mp3", "fly-away.mp3", "24000", "0dB"),
        # Leave encoding headroom for the near-full-scale WAV transients.
        ("Click.wav", "click.mp3", "44100", "-3dB"),
        ("ItemAddedInCart.wav", "cart-added.mp3", "44100", "-3dB"),
    ]:
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(ROOT / "public" / original), "-map", "0:a:0",
            "-map_metadata", "-1", "-af", f"volume={level}",
            "-c:a", "libmp3lame", "-b:a", "96k",
            "-ar", sample_rate, str(OUTPUT / output),
        ], check=True)
    for asset in sorted(OUTPUT.glob("*.mp3")):
        print(f"{asset.name}: {asset.stat().st_size:,} bytes", flush=True)


if __name__ == "__main__":
    prepare()
