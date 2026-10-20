# MisterLove identity assets

The approved `misterlove.` wordmark and `m.` symbol, preserved from the White edition. These files are reusable artwork; creating this folder does not replace any website logo or favicon.

## Start here

- `svg/wordmark-ink.svg`: primary wordmark for a white background.
- `svg/mark-ink.svg`: compact `m.` symbol.
- `svg/*-white.svg`: reversed artwork for a dark background.
- `svg/*-moss.svg`: the moss accent version.
- `png/`: transparent PNG exports. Wordmarks are 600, 1200 and 2400 pixels wide; symbols are 256, 512 and 1024 pixels wide.
- `avatars/`: square SVGs and 512/1024-pixel PNGs in ink on white, white on ink and white on moss.
- `favicon/`: optional SVG, PNG and multi-size ICO files. They remain in this folder until deliberately adopted.
- `design-tokens.json` and `design-tokens.css`: reusable palette, typography and geometry.
- `manifest.json`: exact dimensions, source-font fingerprint and SHA-256 hashes.
- `qa/contact-sheet.png` and `qa/verification.json`: visual review sheet and export checks.

## Approved construction

Both marks use the site's actual Manrope variable web font, instantiated at weight **800**. The wordmark uses **−0.075em** tracking; the `m.` uses **−0.08em**. Kerning is shaped with HarfBuzz before conversion to paths. The SVGs contain outlined glyphs and need no fonts to display.

The wordmark's CSS line-height is **0.95**, with a 30px desktop size and 28px mobile size in the White header. The symbol's CSS line-height is **0.9**. Outlined assets are cropped to the visible glyph geometry with small safety padding, so their image height is not the same measurement as CSS font size.

| Colour | Value | Use |
| --- | --- | --- |
| Ink | `#151714` | Primary mark and text |
| White | `#FFFFFF` | Canvas; reversed artwork |
| Moss | `#526345` | Secondary mark and accent |
| Gallery | `#EFF1EA` | Quiet supporting surfaces |
| Muted | `#5A605A` | Secondary text |
| Rule | `#E8EAE5` | Dividers |

Keep the period, lowercase spelling, proportions and letter spacing. Place the artwork without stretching, rebuilding individual letters or adding effects.

## Space and size

Let **x** be the visible height of the lowercase `m` in the symbol. Keep at least **0.5x** clear on every side, measured outside the visible artwork. The SVG canvas includes only **0.04x** safety padding, so add the remaining clear space in the layout. Square avatars already provide generous space around the mark.

Suggested practical minima, measured by visible artwork width: wordmark **112 CSS pixels / 28mm**, symbol **24 CSS pixels / 6mm**. Inspect the actual reproduction at small sizes. The optional favicon has its own tighter square composition for 16–64px use.

## Fonts and regeneration

The original WOFF2, the generated static weight-800 TTF and the full SIL Open Font License 1.1 are in `fonts/`. Font copyright belongs to the Manrope Project Authors. The approved wordmark and symbol here are MisterLove brand artwork; the included font licence covers the font software.

To regenerate from the checked repository web font:

```powershell
node brand/misterlove/generate.mjs --python <python-with-fonttools-and-pillow>
```

This uses the repository's `harfbuzzjs` and `@resvg/resvg-js`. Python needs `fontTools` and `Pillow`. It writes only inside this brand folder. `prepare_font.py` creates the exact weight-800 instance; `verify_assets.py` checks dimensions, alpha bounds, outlines and hashes, then makes the ICOs and contact sheet.

Identity approved and packaged on **20 October 2026**.
