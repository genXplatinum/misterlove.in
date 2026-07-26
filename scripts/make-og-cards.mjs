/**
 * make-og-cards.mjs — social share cards for the writing section.
 *
 * Renders one 1200×630 card per route: a series card for /writing and one per
 * part, so sharing "Part 7" previews Part 7 rather than a generic site banner.
 *
 * The design takes the book's own cover — field-green gradient, gold rule, part
 * badge — and sets it in the site's share frame: corner brackets, blueprint
 * grid, reticle wordmark, Space Grotesk. Same pairing as the on-site cover.
 *
 * Output: public/og/kissan-andolan.png + public/og/kissan-andolan-part-N.png
 * (committed). Run from the project root:
 *
 *     node scripts/make-og-cards.mjs
 *
 * Requires the brand TTFs in stories/_fonts/ and @resvg/resvg-js. Both are
 * local-only (stories/ is git-ignored, resvg installed with --no-save):
 *     npm i --no-save @resvg/resvg-js
 *     # fonts: fontsource Space Grotesk 500/700 + JetBrains Mono 400/700
 *     #        https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-500-normal.ttf
 */
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { pieces } from '../src/data/writing.js';

const W = 1200;
const H = 630;
const OUT = 'public/og';

const FONTS = [
  'stories/_fonts/sg-500.ttf',
  'stories/_fonts/sg-700.ttf',
  'stories/_fonts/jm-400.ttf',
  'stories/_fonts/jm-700.ttf',
];

const missing = FONTS.filter((f) => !existsSync(f));
if (missing.length) {
  console.error(`\nMissing brand fonts:\n  ${missing.join('\n  ')}\n\nSee the header of this file for where to fetch them. Skipping card generation.\n`);
  process.exit(1);
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---- Text measurement -------------------------------------------------
   resvg has no text-layout API to query, so wrapping is done here against a
   per-character advance table calibrated for Space Grotesk. Approximate, but
   the titles are short and the box has generous slack. */
const NARROW = new Set(['i', 'l', 'I', 'j', 't', 'f', 'r', '.', ',', ':', ';', "'", '’', '!', '|', ' ']);
const WIDE = new Set(['m', 'w', 'M', 'W', '—', '&', '@']);

const charWidth = (c, size) => {
  if (NARROW.has(c)) return size * (c === ' ' ? 0.26 : 0.32);
  if (WIDE.has(c)) return size * 0.86;
  if (c >= 'A' && c <= 'Z') return size * 0.66;
  if (c >= '0' && c <= '9') return size * 0.58;
  return size * 0.545;
};

const textWidth = (s, size) => [...s].reduce((a, c) => a + charWidth(c, size), 0);

/** JetBrains Mono is fixed-pitch — the proportional table above under-measures
    it badly, which is enough to push a badge label outside its plate. */
const monoWidth = (s, size, tracking = 0) => s.length * (size * 0.6 + tracking);

/** Greedy wrap to a pixel width. */
function wrap(text, size, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, size) > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrink until the text fits the given number of lines. */
function fitLines(text, { max, min, maxW, maxLines }) {
  for (let size = max; size >= min; size -= 2) {
    const lines = wrap(text, size, maxW);
    if (lines.length <= maxLines) return { size, lines };
  }
  return { size: min, lines: wrap(text, min, maxW).slice(0, maxLines) };
}

/** Trim to a pixel width, adding an ellipsis if it had to cut. */
function clampLines(text, size, maxW, maxLines) {
  const lines = wrap(text, size, maxW);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s.,;:—-]+$/, '')}…`;
  return kept;
}

const FRAME = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0%" stop-color="#16301f"/>
      <stop offset="48%" stop-color="#1e4429"/>
      <stop offset="100%" stop-color="#29583a"/>
    </linearGradient>
    <radialGradient id="lift" cx="80%" cy="8%" r="70%">
      <stop offset="0%" stop-color="#78be8c" stop-opacity="0.20"/>
      <stop offset="62%" stop-color="#78be8c" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#78be8c" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M72 0H0V72" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.30"/>
    </linearGradient>
    <style>.d{font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif}.m{font-family:'JetBrains Mono',ui-monospace,monospace}</style>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#lift)"/>
  <rect y="${H - 210}" width="${W}" height="210" fill="url(#fade)"/>

  <!-- corner brackets, in the book's gold rather than the site's cobalt -->
  <path d="M40 72V40H72"        fill="none" stroke="#f2c14e" stroke-width="2.5"/>
  <path d="M1128 40h32v32"      fill="none" stroke="#f2c14e" stroke-width="2.5"/>
  <path d="M40 558v32h32"       fill="none" stroke="#f2c14e" stroke-width="2.5"/>
  <path d="M1160 590v-32h-32"   fill="none" stroke="#f2c14e" stroke-width="2.5"/>

  <!-- reticle wordmark -->
  <g transform="translate(60,54)">
    <circle cx="16" cy="16" r="14" fill="none" stroke="#f2c14e" stroke-width="2" opacity="0.65"/>
    <circle cx="16" cy="16" r="3.4" fill="#f2c14e"/>
    <path d="M16 0V6 M16 26V32 M0 16H6 M26 16H32" stroke="#f2c14e" stroke-width="2" stroke-linecap="round" opacity="0.65"/>
    <text class="d" x="46" y="23" fill="#f2f7f3" font-size="23" font-weight="700" letter-spacing="1">LOVEPREET <tspan fill="#9dc0a8">SINGH</tspan></text>
  </g>
  <text class="m" x="${W - 60}" y="77" text-anchor="end" fill="#9dc0a8" font-size="20" letter-spacing="2">misterlove.in</text>
`;

/** One card. `kicker` is the mono line, `title`/`sub` the display block. */
function card({ kicker, title, sub, standfirst, badge, byline }) {
  const LEFT = 62;
  const MAXW = W - LEFT - 80;

  // The wordmark and the badge row are pinned to the top and bottom edges. The
  // block between them is measured and then centred in that band, so a
  // one-line title doesn't leave the card bottom-heavy and a three-line one
  // doesn't crowd the badge. A three-line title buys the room by giving the
  // standfirst a line.
  const BADGE_Y = H - 88;
  const BAND_TOP = 150;
  const BAND_BOTTOM = BADGE_Y - 30;

  const t = fitLines(title, { max: 76, min: 42, maxW: MAXW, maxLines: 3 });
  const leading = t.size * 1.03;
  const standCount = standfirst ? (t.lines.length >= 3 ? 1 : 2) : 0;

  const gapKickerTitle = t.size * 0.92;
  const titleBlock = (t.lines.length - 1) * leading;
  const gapTitleSub = sub ? 40 : 0;
  const gapSubRule = sub ? 26 : 24;
  const gapRuleStand = standCount ? 36 : 0;
  const standBlock = standCount ? (standCount - 1) * 34 : 0;

  const blockH = gapKickerTitle + titleBlock + gapTitleSub + gapSubRule + 4 + gapRuleStand + standBlock;
  const kickerY = BAND_TOP + Math.max(0, (BAND_BOTTOM - BAND_TOP - blockH) / 2);

  const titleTop = kickerY + gapKickerTitle;
  const afterTitle = titleTop + titleBlock;
  const subY = afterTitle + gapTitleSub;
  const ruleY = subY + gapSubRule;
  const standY = ruleY + 4 + gapRuleStand;

  const titleLines = t.lines
    .map((l, i) => `<text class="d" x="${LEFT}" y="${(titleTop + i * leading).toFixed(0)}" fill="#ffffff" font-size="${t.size}" font-weight="700" letter-spacing="-${(t.size * 0.032).toFixed(1)}">${esc(l)}</text>`)
    .join('\n  ');

  const standLines = standCount
    ? clampLines(standfirst, 25, MAXW - 130, standCount)
        .map((l, i) => `<text class="d" x="${LEFT}" y="${(standY + i * 34).toFixed(0)}" fill="#dcece2" font-size="25" font-weight="500">${esc(l)}</text>`)
        .join('\n  ')
    : '';

  const badgeW = monoWidth(badge, 19, 1.4) + 34;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>${esc(title)} — ${esc(sub || '')}</title>
${FRAME}
  <text class="m" x="${LEFT}" y="${kickerY.toFixed(0)}" fill="#ffe6a3" font-size="22" letter-spacing="3.5">${esc(kicker.toUpperCase())}</text>
  ${titleLines}
  ${sub ? `<text class="d" x="${LEFT}" y="${subY.toFixed(0)}" fill="#cfe6d6" font-size="31" font-weight="500">${esc(sub)}</text>` : ''}
  <rect x="${LEFT}" y="${ruleY.toFixed(0)}" width="72" height="4" fill="#f2c14e"/>
  ${standLines}

  <g transform="translate(${LEFT}, ${BADGE_Y})">
    <rect x="0" y="0" width="${badgeW.toFixed(0)}" height="34" rx="3" fill="#f2c14e"/>
    <text class="m" x="17" y="23" fill="#22331f" font-size="19" font-weight="700" letter-spacing="1.4">${esc(badge)}</text>
    <text class="m" x="${(badgeW + 26).toFixed(0)}" y="23" fill="#bcd6c5" font-size="19" letter-spacing="1">${esc(byline)}</text>
  </g>
</svg>`;
}

function render(svg, file) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Space Grotesk' },
  });
  const img = resvg.render();
  const png = img.asPng();
  writeFileSync(file, png);
  return { w: img.width, h: img.height, kb: png.length / 1024 };
}

mkdirSync(OUT, { recursive: true });

let total = 0;
for (const piece of pieces) {
  const parts = (await piece.load()).default;

  // Series card — used by /writing and as the piece-level fallback.
  const seriesFile = `${OUT}/${piece.slug}.png`;
  let r = render(
    card({
      kicker: piece.kicker,
      title: piece.title,
      sub: piece.subtitle,
      standfirst: piece.standfirst,
      badge: `${piece.parts} PARTS`,
      byline: 'Written & researched by Lovepreet Singh',
    }),
    seriesFile
  );
  console.log(`${seriesFile.padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
  total += r.kb;

  for (const part of parts) {
    const file = `${OUT}/${piece.slug}-part-${part.n}.png`;
    r = render(
      card({
        kicker: `Part ${String(part.n).padStart(2, '0')} of ${piece.parts} · ${part.label}`,
        title: part.title,
        sub: `${piece.title} — ${piece.subtitle}`,
        standfirst: part.lead,
        badge: `${part.minutes} MIN READ`,
        byline: 'Lovepreet Singh · misterlove.in',
      }),
      file
    );
    console.log(`${file.padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
    total += r.kb;
  }
}

console.log(`\n✓ ${OUT} — ${(total / 1024).toFixed(2)} MB total`);
