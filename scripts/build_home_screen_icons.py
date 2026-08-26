from pathlib import Path
from PIL import Image

ROOT = Path("/home/ubuntu/RentFLO123")
SOURCE = Path("/home/ubuntu/upload/IMG_8713.jpeg")
PUBLIC = ROOT / "client" / "public"
PREVIEW_PUBLIC = Path("/home/ubuntu/rentflo-design-update/client/public")

source = Image.open(SOURCE).convert("RGB")

def make_icon(size: int) -> Image.Image:
    return source.resize((size, size), Image.Resampling.LANCZOS)

for output_dir in (PUBLIC, PREVIEW_PUBLIC):
    output_dir.mkdir(parents=True, exist_ok=True)
    make_icon(32).save(output_dir / "favicon.png", "PNG", optimize=True)
    make_icon(180).save(output_dir / "apple-touch-icon.png", "PNG", optimize=True)
    make_icon(192).save(output_dir / "icon-192x192.png", "PNG", optimize=True)
    make_icon(512).save(output_dir / "icon-512x512.png", "PNG", optimize=True)
    make_icon(512).save(output_dir / "icon-maskable-512.png", "PNG", optimize=True)
