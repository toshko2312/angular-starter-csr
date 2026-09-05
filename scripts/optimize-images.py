#!/usr/bin/env python3
"""
Regenerates the oversized source images in public/.

The originals were a 8.5 MB 5644x3763 camera JPEG used as a CSS background and
a 1.5 MB 1024x1024 PNG logo rendered at 74px. Both are recoverable from git
history (commit bfeedc9) if the masters are ever needed again.

Run:  python3 scripts/optimize-images.py <source-background.jpg> <source-logo.png>
"""
import sys
from PIL import Image

BACKGROUND_WIDTH = 1920
LOGO_SIZE = 160
OG_SIZE = (1200, 630)


def resized(img, width):
    if img.width <= width:
        return img.copy()
    height = round(img.height * width / img.width)
    return img.resize((width, height), Image.LANCZOS)


def strip(img):
    """Drop EXIF (orientation already applied) so no camera metadata ships."""
    clean = Image.new(img.mode, img.size)
    clean.putdata(list(img.getdata()))
    return clean


def cover(img, size):
    """Centre-crop to exactly `size`, the Open Graph 1.91:1 ratio."""
    target = size[0] / size[1]
    source = img.width / img.height
    if source > target:
        w = round(img.height * target)
        box = ((img.width - w) // 2, 0, (img.width + w) // 2, img.height)
    else:
        h = round(img.width / target)
        box = (0, (img.height - h) // 2, img.width, (img.height + h) // 2)
    return img.crop(box).resize(size, Image.LANCZOS)


def main(bg_src, logo_src):
    bg = Image.open(bg_src).convert("RGB")
    wide = strip(resized(bg, BACKGROUND_WIDTH))
    wide.save("public/background-1.webp", "WEBP", quality=80, method=6)
    wide.save("public/background-1.jpg", "JPEG", quality=82, optimize=True, progressive=True)

    og = cover(bg, OG_SIZE)
    og.save("public/og-image.jpg", "JPEG", quality=84, optimize=True, progressive=True)

    logo = Image.open(logo_src).convert("RGBA")
    small = logo.resize((LOGO_SIZE, LOGO_SIZE), Image.LANCZOS)
    small.save("public/logo.webp", "WEBP", quality=90, method=6)
    small.save("public/logo.png", "PNG", optimize=True)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
