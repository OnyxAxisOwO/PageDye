from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "Designer.png"
OUTPUT_DIR = ROOT / "icons"
SIZES = (16, 48, 128)


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    with Image.open(SOURCE) as source:
        source = source.convert("RGBA")
        for size in SIZES:
            icon = source.resize((size, size), Image.Resampling.LANCZOS)
            icon.save(OUTPUT_DIR / f"icon{size}.png", format="PNG", optimize=True)


if __name__ == "__main__":
    main()
