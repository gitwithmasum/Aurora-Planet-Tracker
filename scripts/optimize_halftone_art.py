"""Rasterize the existing dense halftone SVG once for efficient browser painting.

The SVG source remains unchanged in the repository. This script is used only
as an asset-build step; the production app loads its lightweight WebP copy.
"""
from io import BytesIO
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/assets/aurora-halftone.svg"
OUTPUT = ROOT / "src/assets/aurora-halftone.webp"

def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Missing halftone source: {SOURCE}")
    png = cairosvg.svg2png(url=str(SOURCE), output_width=1920)
    with Image.open(BytesIO(png)) as raster:
        if raster.height > 2000:
            raster.thumbnail((1920, 2000), Image.Resampling.LANCZOS)
        raster.save(OUTPUT, "WEBP", quality=85, method=5)
        width, height = raster.size
    if OUTPUT.stat().st_size < 10_000:
        raise ValueError("Rendered image unexpectedly small")
    print(f"Generated {OUTPUT}: {width}x{height}, {OUTPUT.stat().st_size:,} bytes")

if __name__ == "__main__":
    main()
