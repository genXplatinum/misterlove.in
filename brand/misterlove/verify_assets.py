"""Validate generated SVG/PNG artwork and make a review sheet plus ICOs."""
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(sys.argv[1])
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
generated = []
checks = []
for row in manifest["assets"]:
    path = root / row["path"]
    raw = path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == row["sha256"], path
    if path.suffix == ".svg":
        svg = ET.fromstring(raw)
        paths = list(svg.iter("{http://www.w3.org/2000/svg}path"))
        assert paths, f"No outlined glyphs: {path}"
        assert not list(svg.iter("{http://www.w3.org/2000/svg}text")), path
        assert not list(svg.iter("{http://www.w3.org/2000/svg}image")), path
        assert "font-family" not in raw.decode(), path
        checks.append({"path": row["path"], "outlined": True, "glyphPaths": len(paths)})
    elif path.suffix == ".png":
        im = Image.open(path).convert("RGBA")
        assert im.size == (row["width"], row["height"]), path
        if row["type"] == "transparent-png":
            alpha = im.getchannel("A")
            assert alpha.getextrema() == (0, 255), path
            bbox = alpha.getbbox()
            assert bbox and bbox[0] > 0 and bbox[1] > 0 and bbox[2] < im.width and bbox[3] < im.height, f"Clipped or missing artwork: {path}"
        else:
            assert im.getchannel("A").getextrema() == (255, 255), path
        checks.append({"path": row["path"], "dimensions": list(im.size), "alphaVerified": True})

for variant in ["ink-on-white", "white-on-ink"]:
    source = root / f"favicon/favicon-{variant}-256.png"
    target = root / f"favicon/favicon-{variant}.ico"
    Image.open(source).save(target, format="ICO", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    ico = Image.open(target)
    assert ico.ico.sizes() == {(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)}
    generated.append({"path": target.relative_to(root).as_posix(), "type": "multi-size-ico", "sizes": [16,24,32,48,64,128,256]})

sheet = Image.new("RGB", (1600, 1600), "#e5e8e1")
draw = ImageDraw.Draw(sheet)
font_path = root / "fonts/Manrope-ExtraBold.ttf"
heading = ImageFont.truetype(str(font_path), 28)
label = ImageFont.truetype(str(font_path), 16)
draw.text((48, 34), "MisterLove / approved identity assets", fill="#151714", font=heading)
draw.text((48, 76), "Manrope 800 · wordmark −0.075em · symbol −0.08em", fill="#526345", font=label)

for i, variant in enumerate(["ink", "white", "moss"]):
    x, y, width, height = 48, 130 + i * 195, 1504, 170
    surface = "#151714" if variant == "white" else "#ffffff"
    draw.rectangle((x, y, x + width, y + height), fill=surface)
    logo = Image.open(root / f"png/wordmark-{variant}-1200.png").convert("RGBA")
    logo.thumbnail((1000, 120), Image.Resampling.LANCZOS)
    sheet.paste(logo, (x + 32, y + (height - logo.height) // 2), logo)
    draw.text((x + 1235, y + 73), variant, fill="#ffffff" if variant == "white" else "#151714", font=label)

for i, variant in enumerate(["ink-on-white", "white-on-ink", "white-on-moss"]):
    x, y = 48 + i * 510, 735
    im = Image.open(root / f"avatars/avatar-{variant}-512.png").convert("RGB").resize((440,440), Image.Resampling.LANCZOS)
    sheet.paste(im, (x,y))
    draw.text((x,y + 454), variant, fill="#151714", font=label)

draw.text((48, 1260), "Small-use favicon / native pixel sizes", fill="#151714", font=heading)
for row, variant in enumerate(["ink-on-white", "white-on-ink"]):
    icon = Image.open(root / f"favicon/favicon-{variant}.ico")
    for col, size in enumerate([16,24,32,48,64]):
        x, y = 48 + col * 150, 1320 + row * 120
        sample = icon.ico.getimage((size,size)).convert("RGBA")
        sheet.paste(sample, (x,y), sample)
        draw.text((x,y + 70), str(size) + " px", fill="#151714", font=label)
sheet.save(root / "qa/contact-sheet.png")
generated.append({"path": "qa/contact-sheet.png", "type": "qa-contact-sheet", "width": 1600, "height": 1600})
report = {"status": "pass", "checks": checks, "generatedAssets": generated, "note": "Dimensions, transparency, unclipped alpha bounds, outlined SVG paths and hashes checked. Contact sheet also requires visual inspection."}
(root / "qa/verification.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report))
