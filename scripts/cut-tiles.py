#!/usr/bin/env python3
"""
Cuts each sector's hexagonal room out of its background, as an animated
sprite sheet the 3D map can play.

Two problems solved at once:

1. The rooms have to float in 3D space, so everything around the hexagon must
   be transparent. A plain colour key won't do it — the pale blue of sector
   01's sky also appears inside the room on metal and ice, and keying by
   colour alone punches holes through the artwork. So the cut is a flood fill
   inward from the edges: only background actually connected to the border is
   removed, and anything enclosed by the room is kept, however similar its
   colour.

2. The source GIFs are 1920px and 120 frames — 69MB for six, far too much to
   ship. Sampling every Nth frame into one sheet at a smaller size keeps the
   motion while cutting the weight by better than 95%.

A sheet rather than a video: WebGL can upload one image and step through it
with UV offsets, which needs no decoder, no autoplay permission, and no
per-frame texture upload. It also loops seamlessly, which a video element in
a texture does not reliably do.

Usage:  python3 scripts/cut-tiles.py
Writes: public/sectors/<n>-tile.png   (a COLS x ROWS sheet)
        public/sectors/<n>-tile.json  (its frame count and grid)
        public/sectors/<n>-tile-sm.png  (the same sheet, phone sized)
        public/sectors/<n>-still.png    (one frame, for reduced motion)
"""

import json
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets-source" / "sectors"
OUT = ROOT / "public" / "sectors"

# How far a pixel may drift from the sampled corner and still count as
# background. The flat fills are clean; the cloud skies have the most
# variation, which is what sets the floor here.
TOLERANCE = 38

# Every Nth frame. The source is 120 frames at 24fps; taking every third
# gives 40 frames at 8fps, which is the right cadence for pixel art and a
# third of the pixels to ship.
FRAME_STEP = 3

# Each frame's size in the sheet. The rooms are shown a few hundred pixels
# wide at most, so 256 is already generous — and 40 of them at 320 would push
# the sheet past what mobile GPUs reliably accept as one texture.
FRAME_SIZE = 256

# The sheet's grid. 8x5 holds 40 frames in a 2048x1280 texture, inside the
# 4096 limit every WebGL2 device supports.
COLS = 8

# The single frame phones get instead of the sheet.
#
# A sheet decodes to about 10MB of VRAM and six of them is more than a
# mid-range phone gives a browser tab without thrashing. At 192px a still is
# 0.15MB decoded, and still above what a phone screen resolves at the size a
# tile is actually drawn.
STILL_SIZE = 192

# The phone build: the same frames at a smaller cell.
#
# A full sheet decodes to about 10MB of VRAM and six is more than a mid-range
# phone hands a browser tab. At 112 a cell the sheet is 896x560, or 2MB
# decoded, so phones keep the animation rather than being handed a frozen
# frame.
SMALL_SIZE = 112


def close_enough(a, b, tol=TOLERANCE):
    """Manhattan distance in RGB — cheaper than euclidean and good enough for
    deciding whether two near-identical flats are the same flat."""
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2]) <= tol * 3


def cut_frame(img: Image.Image) -> Image.Image:
    """Flood the background out of one frame, at full resolution."""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    queue = deque()
    seen = bytearray(w * h)

    # Seed from every border pixel, each carrying its own reference colour —
    # a sky that is a gradient reads differently at the top than the bottom.
    for x in range(w):
        for y in (0, h - 1):
            idx = y * w + x
            if not seen[idx]:
                seen[idx] = 1
                queue.append((x, y, px[x, y][:3]))
    for y in range(h):
        for x in (0, w - 1):
            idx = y * w + x
            if not seen[idx]:
                seen[idx] = 1
                queue.append((x, y, px[x, y][:3]))

    while queue:
        x, y, ref = queue.popleft()
        here = px[x, y]
        if here[3] == 0 or not close_enough(here[:3], ref):
            continue

        px[x, y] = (here[0], here[1], here[2], 0)

        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                idx = ny * w + nx
                if not seen[idx]:
                    seen[idx] = 1
                    # The reference stays the one this fill started from.
                    # Re-seeding it from each neighbour lets the match drift a
                    # little at every step, and a chain of small drifts walks
                    # straight through the room's edge and eats the artwork.
                    queue.append((nx, ny, ref))

    # The flood only reaches what touches the border, so specks of background
    # the artwork encloses — splatter thrown clear of the room, a gap in a
    # cloud — survive it, floating unattached. Keep only the largest island:
    # the room is one connected mass and the rest is debris by definition.
    label = [0] * (w * h)
    best_id, best_size, current = 0, 0, 0

    for sy in range(h):
        for sx in range(w):
            start = sy * w + sx
            if label[start] or px[sx, sy][3] == 0:
                continue

            current += 1
            label[start] = current
            island = deque([(sx, sy)])
            size = 0

            while island:
                x, y = island.popleft()
                size += 1
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        n = ny * w + nx
                        if not label[n] and px[nx, ny][3] != 0:
                            label[n] = current
                            island.append((nx, ny))

            if size > best_size:
                best_id, best_size = current, size

    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if label[idx] and label[idx] != best_id:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)

    # LANCZOS rather than NEAREST for the shrink: the cut edge is the one part
    # that must not alias, and a resampled edge gives the 3D scene a clean
    # alpha to blend against. The art's own pixel blocks are far larger than
    # the sample window, so they stay crisp.
    return img.resize((FRAME_SIZE, FRAME_SIZE), Image.LANCZOS)


def build(path: Path, out_png: Path, out_json: Path) -> tuple[int, float]:
    source = Image.open(path)

    frames = []
    for i in range(0, source.n_frames, FRAME_STEP):
        source.seek(i)
        # Convert through RGBA on the palette frame itself: GIF frames can be
        # partial updates, and Pillow composites them onto the running canvas
        # as long as each is read in order, which the seek above guarantees.
        frames.append(cut_frame(source.copy()))

    rows = (len(frames) + COLS - 1) // COLS
    sheet = Image.new("RGBA", (COLS * FRAME_SIZE, rows * FRAME_SIZE), (0, 0, 0, 0))

    for i, frame in enumerate(frames):
        x = (i % COLS) * FRAME_SIZE
        y = (i // COLS) * FRAME_SIZE
        sheet.paste(frame, (x, y))

    sheet.save(out_png, "PNG", optimize=True)

    # The phone build: the same sheet at a smaller cell.
    small = Image.new(
        "RGBA", (COLS * SMALL_SIZE, rows * SMALL_SIZE), (0, 0, 0, 0)
    )
    for i, frame in enumerate(frames):
        small.paste(
            frame.resize((SMALL_SIZE, SMALL_SIZE), Image.LANCZOS),
            ((i % COLS) * SMALL_SIZE, (i // COLS) * SMALL_SIZE),
        )
    small_png = out_png.with_name(out_png.name.replace("-tile.png", "-tile-sm.png"))
    small.save(small_png, "PNG", optimize=True)
    small_png.with_suffix(".json").write_text(
        json.dumps(
            {
                "frames": len(frames),
                "cols": COLS,
                "rows": rows,
                "size": SMALL_SIZE,
                "fps": round(24 / FRAME_STEP, 2),
            }
        )
        + "\n"
    )

    # Reduced motion, and the poster: frame 0 on its own.
    frames[0].resize((STILL_SIZE, STILL_SIZE), Image.LANCZOS).save(
        out_png.with_name(out_png.name.replace("-tile.png", "-still.png")),
        "PNG",
        optimize=True,
    )
    out_json.write_text(
        json.dumps(
            {
                "frames": len(frames),
                "cols": COLS,
                "rows": rows,
                "size": FRAME_SIZE,
                # The source runs at 24fps; every FRAME_STEP-th frame plays
                # back at that rate divided by the step.
                "fps": round(24 / FRAME_STEP, 2),
            }
        )
        + "\n"
    )

    return len(frames), out_png.stat().st_size / 1024


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    for n in range(1, 7):
        src = SOURCE / f"{n:02d}.gif"
        if not src.exists():
            print(f"skip {src.name} — not found")
            continue

        png = OUT / f"{n:02d}-tile.png"
        meta = OUT / f"{n:02d}-tile.json"
        count, size = build(src, png, meta)
        print(f"{src.name} → {png.name}  {count:3d} frames  {size:6.0f} KB")


if __name__ == "__main__":
    main()
