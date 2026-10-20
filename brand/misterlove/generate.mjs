// Run from any directory: node brand/misterlove/generate.mjs [--python <path>]
// Requires this repository's harfbuzzjs and @resvg/resvg-js plus Python fonttools.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as hb from 'harfbuzzjs';
import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const python = process.argv.includes('--python') ? process.argv[process.argv.indexOf('--python') + 1] : 'python';
for (const dir of ['svg', 'png', 'avatars', 'favicon', 'fonts', 'qa']) mkdirSync(join(here, dir), { recursive: true });
const fontSource = join(repo, 'public/white-assets/manrope-latin.woff2');
copyFileSync(fontSource, join(here, 'fonts/manrope-latin.woff2'));
copyFileSync(join(repo, 'public/white-assets/Manrope-OFL.txt'), join(here, 'fonts/Manrope-OFL.txt'));
const fontMeta = JSON.parse(execFileSync(python, [
  join(here, 'prepare_font.py'), fontSource, join(here, 'fonts/Manrope-ExtraBold.ttf'),
], { encoding: 'utf8' }));
const fontBytes = readFileSync(join(here, 'fonts/Manrope-ExtraBold.ttf'));
const blob = new hb.Blob(fontBytes);
const face = new hb.Face(blob);
const font = new hb.Font(face);
font.setScale(fontMeta.unitsPerEm, fontMeta.unitsPerEm);

const colors = { ink: '#151714', white: '#FFFFFF', moss: '#526345' };
const round = number => Math.round(number * 1000) / 1000;
const assets = [];
const geometries = {};

function shape(text, tracking) {
  const buffer = new hb.Buffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const infos = buffer.getGlyphInfos();
  const positions = buffer.getGlyphPositions();
  let cursor = 0;
  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  const paths = infos.map((info, index) => {
    const pos = positions[index];
    const ext = font.glyphExtents(info.codepoint);
    const x = cursor + pos.xOffset;
    const y = pos.yOffset;
    if (ext) {
      xMin = Math.min(xMin, x + ext.xBearing);
      xMax = Math.max(xMax, x + ext.xBearing + ext.width);
      yMin = Math.min(yMin, y + ext.yBearing + ext.height);
      yMax = Math.max(yMax, y + ext.yBearing);
    }
    cursor += pos.xAdvance + tracking * fontMeta.unitsPerEm;
    return { d: font.glyphToPath(info.codepoint), x, y };
  });
  const margin = 0.04 * fontMeta.lowercaseMHeight;
  return {
    paths,
    bounds: { xMin, yMin, xMax, yMax },
    width: round(xMax - xMin + 2 * margin),
    height: round(yMax - yMin + 2 * margin),
    margin,
    tracking,
    text,
  };
}

function outlinedPaths(mark) {
  // HarfBuzz paths use the font's upward Y axis. Reflect them once into SVG.
  return `<g transform="translate(${round(mark.margin - mark.bounds.xMin)} ${round(mark.margin + mark.bounds.yMax)}) scale(1 -1)">${mark.paths.map(path => `<path d="${path.d}" transform="translate(${round(path.x)} ${round(path.y)})"/>`).join('')}</g>`;
}

function svg(mark, color, title, squareBackground, occupancy = 0.56) {
  if (squareBackground) {
    const scale = occupancy * 1024 / mark.width;
    const x = (1024 - mark.width * scale) / 2;
    const y = (1024 - mark.height * scale) / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="${title}"><title>${title}</title><rect width="1024" height="1024" fill="${squareBackground}"/><g fill="${color}" transform="translate(${round(x)} ${round(y)}) scale(${scale})">${outlinedPaths(mark)}</g></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${mark.width}" height="${mark.height}" viewBox="0 0 ${mark.width} ${mark.height}" role="img" aria-label="${title}"><title>${title}</title><g fill="${color}">${outlinedPaths(mark)}</g></svg>`;
}

function save(path, bytes, metadata) {
  writeFileSync(join(here, path), bytes);
  assets.push({ path: path.replaceAll('\\', '/'), ...metadata });
}

for (const [name, text, tracking] of [['wordmark', 'misterlove.', -0.075], ['mark', 'm.', -0.08]]) {
  const mark = shape(text, tracking);
  geometries[name] = {
    text, weight: 800, trackingEm: tracking,
    viewBox: [0, 0, mark.width, mark.height],
    glyphBoundsFontUnits: mark.bounds,
    inkWidth: round(mark.bounds.xMax - mark.bounds.xMin),
    inkHeight: round(mark.bounds.yMax - mark.bounds.yMin),
    canvasSafetyPaddingFontUnits: mark.margin,
    clearSpaceXFontUnits: fontMeta.lowercaseMHeight,
    recommendedClearSpaceFontUnits: fontMeta.lowercaseMHeight * 0.5,
    glyphCount: mark.paths.length,
  };
  for (const [colorName, color] of Object.entries(colors)) {
    const content = svg(mark, color, `MisterLove ${name}`);
    save(`svg/${name}-${colorName}.svg`, content, { type: 'outlined-svg', variant: name, color });
    for (const width of name === 'wordmark' ? [600, 1200, 2400] : [256, 512, 1024]) {
      const render = new Resvg(content, { fitTo: { mode: 'width', value: width } }).render();
      save(`png/${name}-${colorName}-${width}.png`, render.asPng(), { type: 'transparent-png', variant: name, color, width: render.width, height: render.height });
    }
  }
  if (name === 'mark') {
    for (const [variant, foreground, background] of [
      ['ink-on-white', colors.ink, colors.white],
      ['white-on-ink', colors.white, colors.ink],
      ['white-on-moss', colors.white, colors.moss],
    ]) {
      const content = svg(mark, foreground, 'MisterLove', background);
      save(`avatars/avatar-${variant}.svg`, content, { type: 'square-avatar-svg', color: foreground, background, width: 1024, height: 1024 });
      for (const width of [512, 1024]) {
        const render = new Resvg(content, { fitTo: { mode: 'width', value: width } }).render();
        save(`avatars/avatar-${variant}-${width}.png`, render.asPng(), { type: 'square-avatar-png', color: foreground, background, width, height: width });
      }
      if (variant !== 'white-on-moss') {
        const compactIcon = svg(mark, foreground, 'MisterLove', background, 0.76);
        save(`favicon/favicon-${variant}.svg`, compactIcon, { type: 'favicon-svg', color: foreground, background });
        const iconPng = new Resvg(compactIcon, { fitTo: { mode: 'width', value: 256 } }).render();
        save(`favicon/favicon-${variant}-256.png`, iconPng.asPng(), { type: 'favicon-png', color: foreground, background, width: 256, height: 256 });
      }
    }
  }
}

const tokens = {
  brand: 'MisterLove',
  approvedForms: { wordmark: 'misterlove.', symbol: 'm.' },
  colors: { ...colors, gallery: '#EFF1EA', muted: '#5A605A', rule: '#E8EAE5' },
  typography: {
    family: 'Manrope',
    wordmark: { weight: 800, trackingEm: -0.075, lineHeight: 0.95, desktopPx: 30, mobilePx: 28 },
    symbol: { weight: 800, trackingEm: -0.08, lineHeight: 0.9 },
    display: { weight: 650, trackingEm: -0.055 },
    body: { weight: 450, lineHeight: 1.8 },
  },
  geometry: geometries,
  spacing: { unit: 'x = visible height of the lowercase m in the symbol', minimumClearSpace: '0.5x on every side; outside the artwork bounds', artworkCanvasPadding: '0.04x safety padding; add external clear space in the layout' },
  suggestedMinimums: { wordmark: { screenInkWidthPx: 112, printInkWidthMm: 28 }, symbol: { screenInkWidthPx: 24, printInkWidthMm: 6 }, note: 'Optically check actual output. Favicon is a separately supplied small-use asset.' },
  fontLicense: 'SIL Open Font License 1.1; see fonts/Manrope-OFL.txt',
  scope: 'Reusable brand assets. This generator does not alter any site source or favicon.',
};
writeFileSync(join(here, 'design-tokens.json'), JSON.stringify(tokens, null, 2) + '\n');
writeFileSync(join(here, 'design-tokens.css'), `/* MisterLove: approved White edition identity. Optional import. */\n:root {\n  --ml-ink: #151714;\n  --ml-white: #ffffff;\n  --ml-moss: #526345;\n  --ml-gallery: #eff1ea;\n  --ml-muted: #5a605a;\n  --ml-rule: #e8eae5;\n  --ml-font-family: 'Manrope', Arial, sans-serif;\n  --ml-wordmark-weight: 800;\n  --ml-wordmark-tracking: -0.075em;\n  --ml-symbol-weight: 800;\n  --ml-symbol-tracking: -0.08em;\n}\n.misterlove-wordmark {\n  font-family: var(--ml-font-family);\n  font-weight: var(--ml-wordmark-weight);\n  letter-spacing: var(--ml-wordmark-tracking);\n  line-height: 0.95;\n}\n.misterlove-symbol {\n  font-family: var(--ml-font-family);\n  font-weight: var(--ml-symbol-weight);\n  letter-spacing: var(--ml-symbol-tracking);\n  line-height: 0.9;\n}\n`);

const manifest = {
  brand: 'MisterLove', version: '1.0.0', date: '2026-10-20',
  source: {
    font: 'public/white-assets/manrope-latin.woff2',
    fontSha256: createHash('sha256').update(readFileSync(fontSource)).digest('hex'),
    wordmarkCss: 'src/white/White.css:64 + src/white/WhitePremium.css:12',
    symbolCss: 'src/white/PublicationCover.css .pc-colophon',
    shaping: 'HarfBuzz; fontTools variable instance wght=800; native kerning plus CSS tracking; outlined glyph paths',
  },
  geometry: geometries,
  assets: assets.map(asset => {
    const bytes = readFileSync(join(here, asset.path));
    return { ...asset, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  }),
};
writeFileSync(join(here, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const qa = JSON.parse(execFileSync(python, [join(here, 'verify_assets.py'), here], { encoding: 'utf8' }));
for (const entry of qa.generatedAssets) {
  const bytes = readFileSync(join(here, entry.path));
  manifest.assets.push({ ...entry, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
manifest.qa = { report: 'qa/verification.json', checks: qa.checks };
function allFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? allFiles(join(directory, entry.name)) : [join(directory, entry.name)]);
}
manifest.files = allFiles(here).filter(path => path !== join(here, 'manifest.json')).sort().map(path => {
  const bytes = readFileSync(path);
  return { path: relative(here, path).replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});
writeFileSync(join(here, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ visualAssets: manifest.assets.length, hashedFiles: manifest.files.length, root: here, geometry: geometries }, null, 2));
