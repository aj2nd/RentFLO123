from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path("/home/ubuntu/RentFLO123")
SOURCE = Path("/home/ubuntu/upload/IMG_8682.jpeg")
PUBLIC = ROOT / "client" / "public"
PREVIEW_PUBLIC = Path("/home/ubuntu/rentflo-design-update/client/public")

source = Image.open(SOURCE).convert("RGB")

def make_icon(size: int) -> Image.Image:
    canvas = Image.new("RGB", (size, size), "#020712")
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        (int(size * -0.30), int(size * -0.22), int(size * 0.56), int(size * 0.64)),
        fill=(221, 157, 69, 38),
    )
    glow_draw.ellipse(
        (int(size * 0.49), int(size * -0.15), int(size * 1.20), int(size * 0.62)),
        fill=(33, 82, 150, 34),
    )
    canvas = Image.alpha_composite(canvas.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(max(1, size // 14))))

    target_width = int(size * 0.90)
    target_height = round(source.height * target_width / source.width)
    wordmark = source.resize((target_width, target_height), Image.Resampling.LANCZOS).convert("RGBA")
    canvas.alpha_composite(wordmark, ((size - target_width) // 2, (size - target_height) // 2))
    return canvas.convert("RGB")

for output_dir in (PUBLIC, PREVIEW_PUBLIC):
    output_dir.mkdir(parents=True, exist_ok=True)
    make_icon(32).save(output_dir / "favicon.png", "PNG", optimize=True)
    make_icon(180).save(output_dir / "apple-touch-icon.png", "PNG", optimize=True)
    make_icon(192).save(output_dir / "icon-192x192.png", "PNG", optimize=True)
    make_icon(512).save(output_dir / "icon-512x512.png", "PNG", optimize=True)
    make_icon(512).save(output_dir / "icon-maskable-512.png", "PNG", optimize=True)
