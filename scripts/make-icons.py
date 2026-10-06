#!/usr/bin/env python3
"""Render the PWA icons from the front-facing Clawd grid (same shape as public/sprites.js)."""
from pathlib import Path
from PIL import Image, ImageDraw

GRID = [
    "...CCCCCCCCCCCCC...",
    "...CCCCCCCCCCCCC...",
    "...CCCECCCCCECCC...",
    "...CCCECCCCCECCC...",
    ".CCCCCCCCCCCCCCCCC.",
    ".CCCCCCCCCCCCCCCCC.",
    "...CCCCCCCCCCCCC...",
    "...CCCCCCCCCCCCC...",
    "...C.C.......C.C...",
    "...C.C.......C.C...",
]
COLORS = {"C": (215, 119, 87), "E": (29, 29, 27)}
BG = (240, 238, 230)
OUT = Path(__file__).resolve().parent.parent / "public" / "icons"


def render(size):
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)
    cell = size * 0.6 / len(GRID[0])  # keeps Clawd inside the maskable safe zone
    x0 = (size - cell * len(GRID[0])) / 2
    y0 = (size - cell * len(GRID)) / 2
    for j, row in enumerate(GRID):
        for i, c in enumerate(row):
            if c in COLORS:
                x, y = x0 + i * cell, y0 + j * cell
                draw.rectangle([round(x), round(y), round(x + cell) - 1, round(y + cell) - 1], fill=COLORS[c])
    return img


OUT.mkdir(parents=True, exist_ok=True)
for size in (192, 512):
    render(size).save(OUT / f"icon-{size}.png")
