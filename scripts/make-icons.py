"""Generate the three PWA icons per spec §9.

Output:
  icons/icon-192.png         - 192x192, standard, full-bleed glyph
  icons/icon-512.png         - 512x512, standard, full-bleed glyph
  icons/icon-maskable.png    - 512x512, glyph at 60% with 20% safe-zone padding

Background: #0a0a0b, foreground: white "M" with a downward arrow, IBM Plex Mono Bold.
Falls back to a default monospace if IBM Plex is not installed.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BG = (10, 10, 11, 255)   # #0a0a0b
FG = (255, 255, 255, 255)
ROOT = Path(__file__).resolve().parent.parent
ICONS_DIR = ROOT / "icons"
ICONS_DIR.mkdir(exist_ok=True)

GLYPH = "M↓"  # "M" + downward arrow


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        "IBMPlexMono-Bold.ttf",
        "IBM Plex Mono Bold.ttf",
        "IBM_Plex_Mono-Bold.ttf",
        "consolab.ttf",
        "DejaVuSansMono-Bold.ttf",
    ]
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def draw_glyph(canvas_size: int, glyph_height_ratio: float) -> Image.Image:
    img = Image.new("RGBA", (canvas_size, canvas_size), BG)
    draw = ImageDraw.Draw(img)

    target_h = int(canvas_size * glyph_height_ratio)
    size = target_h
    font = load_font(size)
    while size > 8:
        font = load_font(size)
        bbox = draw.textbbox((0, 0), GLYPH, font=font)
        h = bbox[3] - bbox[1]
        w = bbox[2] - bbox[0]
        if h <= target_h and w <= canvas_size * 0.9:
            break
        size -= 4

    bbox = draw.textbbox((0, 0), GLYPH, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (canvas_size - w) // 2 - bbox[0]
    y = (canvas_size - h) // 2 - bbox[1]
    draw.text((x, y), GLYPH, fill=FG, font=font)
    return img


def main() -> None:
    # Standard icons: glyph fills ~60% of the icon.
    for size in (192, 512):
        img = draw_glyph(size, 0.6)
        out = ICONS_DIR / f"icon-{size}.png"
        img.save(out, "PNG", optimize=True)
        print(f"wrote {out}")

    # Maskable icon: glyph at 60% of the *safe zone* (center 60% of the canvas).
    # Spec calls for a 20% safe-zone padding on each side -> glyph_height_ratio of 0.36.
    maskable = draw_glyph(512, 0.36)
    out = ICONS_DIR / "icon-maskable.png"
    maskable.save(out, "PNG", optimize=True)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
