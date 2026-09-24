#!/usr/bin/env python3
"""
Builds web-sized animated GIFs of each room, backgrounds intact.

The sprite-sheet pipeline in `cut-tiles.py` flood-filled each room's
background away so the tile could float in a 3D scene. That scene is gone,
and with it the reason to throw the backdrop out — the artist painted a lava
field behind the greenhouse and clouds behind the bunker, and those are part
of the picture.

So this is the plain version: same artwork, whole frame, resized and with
frames dropped until it is small enough to ship.

Why GIF rather than a video: these are already GIFs, and re-encoding to
H.264 or VP9 would blur the pixel edges that the whole look depends on. A
paletted GIF is lossless per frame, and at this size the file is smaller than
the sprite sheets it replaces.

Usage:  python3 scripts/room-gifs.py
Writes: public/rooms/<n>.gif        the animation
        public/rooms/<n>.png        frame 0, as the poster
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets-source" / "sectors"
OUT = ROOT / "public" / "rooms"

# The rooms a card actually shows. Keyed by the name used in sectors.ts so
# the mapping is visible here rather than inferred from a filename.
ROOMS = {
    "01": "The Holding Bay",
    "03": "The Greenhouse",
    "04": "The Deep Freeze",
    "06": "The Dig",
}

# A card is at most ~640 CSS px wide and usually half that. 480 covers a 2x
# screen at the common size without paying for the 1920px master.
SIZE = 480

# Every Nth frame. The source runs 120 frames at 25fps; every third gives 40
# frames at about 8fps, which is the right cadence for pixel art and a third
# of the weight.
STEP = 3

# Frame delay in the output, in milliseconds. 40ms * STEP keeps the animation
# running at its original speed rather than a third of it.
DELAY = 40 * STEP


def build(src: Path, gif_out: Path, png_out: Path) -> tuple[int, float]:
    source = Image.open(src)

    frames = []
    for i in range(0, source.n_frames, STEP):
        source.seek(i)
        # Convert each frame as it is reached: GIF frames can be partial
        # updates, and Pillow composites them onto the running canvas only
        # while they are read in order.
        frame = source.convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
        frames.append(frame)

    # One shared palette across every frame rather than one per frame. The
    # rooms barely change between frames, so a per-frame palette spends bytes
    # re-describing the same colours and can make flat areas shimmer.
    palette_source = frames[0].quantize(colors=255, method=Image.MEDIANCUT)
    quantised = [f.quantize(palette=palette_source, dither=Image.NONE) for f in frames]

    quantised[0].save(
        gif_out,
        save_all=True,
        append_images=quantised[1:],
        duration=DELAY,
        loop=0,
        optimize=True,
        disposal=1,
    )

    # The poster: what a card shows before the animation is asked for.
    frames[0].save(png_out, "PNG", optimize=True)

    return len(frames), gif_out.stat().st_size / 1024


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    for key, name in ROOMS.items():
        src = SOURCE / f"{key}.gif"
        if not src.exists():
            print(f"skip {src.name} — not found")
            continue

        count, kb = build(src, OUT / f"{key}.gif", OUT / f"{key}.png")
        print(f"{name:18s} {src.name} -> {key}.gif  {count} frames  {kb:6.0f} KB")


if __name__ == "__main__":
    main()
