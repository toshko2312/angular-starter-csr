#!/usr/bin/env python3
"""
Regenerates the oversized source images in public/.

The originals were a 8.5 MB 5644x3763 camera JPEG used as a CSS background and
a 1.5 MB 1024x1024 PNG logo rendered at 74px. Both are recoverable from git
history (commit bfeedc9) if the masters are ever needed again.

Run:  python3 scripts/optimize-images.py <source-background.jpg> <source-logo.png>

The theme backgrounds go through the same mill:

Run:  python3 scripts/optimize-images.py --themes <bg-white.png> <bg-dark.png>
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


def themes(white_src, dark_src):
    """
    The two theme backgrounds, kept at their own width — they arrive at
    1672px, and upscaling to the 1920 above would only add bytes.
    """
    # The dark slate is far noisier than the pale plaster and costs ~2.5x the
    # bytes at equal quality; 75 is where its texture still holds without
    # banding.
    for src, name, quality in ((white_src, "bg-white", 82), (dark_src, "bg-dark", 75)):
        img = strip(Image.open(src).convert("RGB"))
        img.save(f"public/{name}.webp", "WEBP", quality=quality, method=6)
        img.save(f"public/{name}.jpg", "JPEG", quality=quality, optimize=True, progressive=True)
        print(f"{name}: {img.width}x{img.height} q{quality}")


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
    if sys.argv[1] == "--themes":
        themes(sys.argv[2], sys.argv[3])
    else:
        main(sys.argv[1], sys.argv[2])
