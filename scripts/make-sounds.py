#!/usr/bin/env python3
"""
Synthesises the checkpoint's sounds.

Generated rather than sourced: the art is pixel work and the font is an
arcade face, so square and triangle waves are the right texture, and nothing
here needs a licence or an attribution line.

They are deliberately short and quiet. A site that makes noise at someone is
a site they close — these are feedback for a gesture, not a soundtrack.

Usage:  python3 scripts/make-sounds.py
Writes: public/sound/*.wav
"""

import math
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "sound"

RATE = 44100


def square(freq: float, t: float, duty: float = 0.5) -> float:
    """A square wave, which is what a 1-bit channel sounds like."""
    phase = (t * freq) % 1.0
    return 1.0 if phase < duty else -1.0


def triangle(freq: float, t: float) -> float:
    """Softer than a square: used where a sound should land rather than click."""
    phase = (t * freq) % 1.0
    return 4 * abs(phase - 0.5) - 1


def write(name: str, samples: list[float], peak: float = 0.22) -> None:
    """
    Normalise, then scale to `peak`.

    Peak rather than raw amplitude because these are mixed together by the
    browser: one sound twice as loud as the rest is the one that makes people
    reach for the mute.
    """
    high = max(abs(s) for s in samples) or 1.0
    frames = b"".join(
        struct.pack("<h", int(max(-1.0, min(1.0, s / high)) * peak * 32767))
        for s in samples
    )

    path = OUT / f"{name}.wav"
    with wave.open(str(path), "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(frames)

    print(f"  {name}.wav  {path.stat().st_size / 1024:5.1f} KB")


def envelope(i: int, total: int, attack: float = 0.01, release: float = 0.5) -> float:
    """Linear in, curved out — a hard stop clicks."""
    t = i / total
    if t < attack:
        return t / attack
    if t > 1 - release:
        return ((1 - t) / release) ** 1.6
    return 1.0


def hover() -> list[float]:
    """A single soft tick: the cursor has found something."""
    dur = 0.045
    n = int(RATE * dur)
    return [
        triangle(1180, i / RATE) * envelope(i, n, 0.05, 0.8) * 0.5
        for i in range(n)
    ]


def open_panel() -> list[float]:
    """Two notes up: something opened."""
    dur = 0.16
    n = int(RATE * dur)
    out = []
    for i in range(n):
        t = i / RATE
        # The step happens at the midpoint rather than gliding, which is what
        # makes it read as two notes instead of a swoop.
        freq = 523 if t < dur / 2 else 784
        out.append(square(freq, t, 0.25) * envelope(i, n, 0.01, 0.55))
    return out


def close_panel() -> list[float]:
    """The same two notes, down."""
    dur = 0.14
    n = int(RATE * dur)
    out = []
    for i in range(n):
        t = i / RATE
        freq = 784 if t < dur / 2 else 523
        out.append(square(freq, t, 0.25) * envelope(i, n, 0.01, 0.6))
    return out


def door() -> list[float]:
    """
    The way through: a low sweep with a bright note over it.

    Longer than the rest because it is the one sound that accompanies leaving
    the page, and a short click would be lost under the navigation.
    """
    dur = 0.42
    n = int(RATE * dur)
    out = []
    for i in range(n):
        t = i / RATE
        p = t / dur
        # A rising sweep underneath.
        sweep = triangle(180 + 420 * p, t) * 0.6
        # And a note that arrives once the sweep is underway.
        note = square(880, t, 0.5) * 0.4 if p > 0.45 else 0.0
        out.append((sweep + note) * envelope(i, n, 0.02, 0.45))
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    print("synthesising:")
    write("hover", hover(), peak=0.10)
    write("open", open_panel(), peak=0.18)
    write("close", close_panel(), peak=0.14)
    write("door", door(), peak=0.22)


if __name__ == "__main__":
    main()
