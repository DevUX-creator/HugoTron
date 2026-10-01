"""Original Hugo Tron sound palette. Standard-library synthesis; ffmpeg encodes MP3.

Run: python3 scripts/generate-sounds.py
No samples, voices, music libraries, or runtime synthesis dependencies.
"""

import array
import math
from pathlib import Path
import random
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "audio"
RATE = 44100
TAU = math.tau


def envelope(t, duration, attack):
    return (1 - math.exp(-t / attack)) * math.exp(-t * 5 / duration) * min(1, (duration - t) / 0.09)


def render(name, duration, peak):
    rng = random.Random(427 + len(name))
    samples = array.array("f")
    low = [0.0, 0.0]
    slower = [0.0, 0.0]
    # Integer cycles across the ambient buffer make every partial and its modulation periodic.
    partials = [(round(f * duration) / duration, weight, rng.random() * TAU)
                for f, weight in [(73.416, .32), (146.83, .42), (220, .18),
                                  (293.66, .13), (329.63, .055), (440, .025)]]
    air = [(rng.randrange(900, 11000) / duration, rng.random() * TAU)
           for _ in range(18)]
    for i in range(round(RATE * duration)):
        t = i / RATE
        for channel in range(2):
            spread = channel * .48
            if name == "ambience":
                value = sum(weight * math.sin(TAU * frequency * t + phase + spread)
                            * (.76 + .24 * math.sin(TAU * t / duration + phase))
                            for frequency, weight, phase in partials)
                value += sum(.009 * math.sin(TAU * frequency * t + phase + spread)
                             * (.5 + .5 * math.sin(TAU * 2 * t / duration + phase))
                             for frequency, phase in air)
            else:
                noise = rng.uniform(-1, 1)
                low[channel] += .095 * (noise - low[channel])
                slower[channel] += .008 * (noise - slower[channel])
                breath = low[channel] - slower[channel]
                if name == "hover":
                    # A short, rounded glass touch. No hard transient or UI beep.
                    env = envelope(t, duration, .04)
                    value = env * (.16 * math.sin(TAU * 440 * t + spread)
                                   + .025 * math.sin(TAU * 659.25 * t + spread)
                                   + breath * .35)
                elif name == "product":
                    swell = math.sin(math.pi * min(1, t / .7)) ** 2 if t < .7 else 0
                    value = breath * swell * .35
                    age = max(0, t - .07 - channel * .012)
                    env = envelope(age, duration, .085)
                    value += env * (.14 * math.sin(TAU * (293.66 * age + 1.6 * (1 - math.exp(-age * 5))))
                                    + .035 * math.sin(TAU * 440 * age))
                else:
                    swell = math.sin(math.pi * t / duration) ** 2
                    value = breath * swell * .45
                    value += envelope(t, duration, .2) * .18 * math.sin(
                        TAU * (146.83 * t + 3 * (1 - math.exp(-t * 2))) + spread)
            if name != "ambience":
                value *= min(1, (duration - t) / .09)
            samples.append(value)
    scale = peak / max(abs(value) for value in samples)
    pcm = array.array("h", (round(value * scale * 32767) for value in samples))
    with tempfile.TemporaryDirectory(prefix="hugo-audio-") as tmp:
        wav = Path(tmp) / f"{name}.wav"
        with wave.open(str(wav), "wb") as file:
            file.setnchannels(2)
            file.setsampwidth(2)
            file.setframerate(RATE)
            file.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
                        "-codec:a", "libmp3lame", "-b:a", "80k", "-map_metadata", "-1",
                        str(OUTPUT / f"{name}.mp3")], check=True)
    print(f"{name}: {duration}s, {(OUTPUT / f'{name}.mp3').stat().st_size:,} bytes")


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for spec in [("hover", .48, .18), ("product", 1.15, .32),
                 ("transition", 1.8, .28), ("ambience", 16, .26)]:
        render(*spec)
