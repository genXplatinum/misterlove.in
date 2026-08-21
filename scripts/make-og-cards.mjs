/**
 * Social cards for the Living Archive.
 *
 * Renders one 1200×630 card for the writing shelf, every series, every
 * published part, and every translated edition. The normal production build
 * runs this file before Vite, so adding a topic or part to the writing manifest
 * automatically creates the matching card and copies it into the final site.
 *
 * Output examples:
 *   public/og/writing.png
 *   public/og/kissan-andolan.png
 *   public/og/kissan-andolan-part-7.png
 *
 * The renderer and fonts are declared development dependencies. No ignored
 * machine-local files or system fonts are required.
 */
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pieces,
  writingMeta,
  writingTotals,
  livePartsOf,
  isInProgress,
  getPieceForLanguage,
} from '../src/data/writing.js';
import {
  books,
  booksMeta,
  booksTotals,
  liveStudiesOf,
  isOpen,
} from '../src/data/books.js';

const W = 1200;
const H = 630;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public', 'og');

const FONTS = [
  resolve(ROOT, 'assets/fonts/og/Newsreader-Variable.ttf'),
  resolve(ROOT, 'assets/fonts/og/Inter-Variable.ttf'),
  resolve(ROOT, 'assets/fonts/og/NotoSerifDevanagari-Variable.ttf'),
  resolve(ROOT, 'assets/fonts/og/NotoSansDevanagari-Variable.ttf'),
];

const missing = FONTS.filter((f) => !existsSync(f));
if (missing.length) {
  console.error(`\nMissing OG-card dependencies:\n  ${missing.join('\n  ')}\n\nRun npm install, then try again.\n`);
  process.exit(1);
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---- Text measurement -------------------------------------------------
   resvg has no text-layout API to query, so wrapping is done here against a
   conservative per-character table calibrated for Newsreader. */
const NARROW = new Set(['i', 'l', 'I', 'j', 't', 'f', 'r', '.', ',', ':', ';', "'", '’', '!', '|', ' ']);
const WIDE = new Set(['m', 'w', 'M', 'W', '—', '&', '@']);
const graphemeSegmenter = new Intl.Segmenter('hi', { granularity: 'grapheme' });
const graphemes = (text) => [...graphemeSegmenter.segment(text)].map((part) => part.segment);

const charWidth = (c, size) => {
  // A Devanagari grapheme often combines several code points into one wide
  // shaped cluster (for example "स्ता"). Measuring it like a Latin letter
  // makes resvg place text beyond the card edge, so keep a conservative
  // advance that matches Mangal's rendered width.
  if (/[\u0900-\u097f]/u.test(c)) return size * 0.82;
  if (NARROW.has(c)) return size * (c === ' ' ? 0.26 : 0.32);
  if (WIDE.has(c)) return size * 0.86;
  if (c >= 'A' && c <= 'Z') return size * 0.66;
  if (c >= '0' && c <= '9') return size * 0.58;
  return size * 0.545;
};

const textWidth = (s, size) => graphemes(s).reduce((a, c) => a + charWidth(c, size), 0);

/** Inter labels use generous tracking, so their plates need a conservative
    width estimate. */
const labelWidth = (s, size, tracking = 0) => graphemes(s).length * (size * 0.57 + tracking);

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

/* Every card belongs to the same warm private-press system. Individual series
   keep a cloth-and-ink accent so they remain recognisable on the shelf. */
const PALETTES = {
  harvest: { a: '#f3efe6', b: '#fcfaf5', c: '#eae2d5', lift: '#9a7742', accent: '#8a6638', tab: '#dcc9a5', paper: '#1d1a16', sub: '#5e574d', ink: '#fcfaf5', foot: '#867d70', rule: '#b7aa97' },
  ember:   { a: '#f3efe6', b: '#fcfaf5', c: '#eaded8', lift: '#7c3032', accent: '#8f443d', tab: '#dec2b8', paper: '#1d1a16', sub: '#5e574d', ink: '#fcfaf5', foot: '#867d70', rule: '#b7aa97' },
  ink:     { a: '#f3efe6', b: '#fcfaf5', c: '#e1e2df', lift: '#4d5660', accent: '#4d5660', tab: '#cbd0d0', paper: '#1d1a16', sub: '#5e574d', ink: '#fcfaf5', foot: '#867d70', rule: '#b7aa97' },
  quartz:  { a: '#f3efe6', b: '#fcfaf5', c: '#dfe7e1', lift: '#536d67', accent: '#536d67', tab: '#c5d5cb', paper: '#1d1a16', sub: '#5e574d', ink: '#fcfaf5', foot: '#867d70', rule: '#b7aa97' },
  /* The Darwin reading's own room, so its share cards match the page they
     link to: the print edition's sheet, sepia ink and burnt sienna. */
  specimen: { a: '#fbf6ea', b: '#fffcf4', c: '#f0e4cd', lift: '#8d3f26', accent: '#8d3f26', tab: '#eed9c4', paper: '#34291f', sub: '#4d4034', ink: '#fffcf4', foot: '#7b6a56', rule: '#c6b391' },
  site:    { a: '#f3efe6', b: '#fcfaf5', c: '#eae2d5', lift: '#7c3032', accent: '#7c3032', tab: '#eadcdd', paper: '#1d1a16', sub: '#5e574d', ink: '#fcfaf5', foot: '#867d70', rule: '#b7aa97' },
};

const frame = (p) => `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.a}"/>
      <stop offset="54%" stop-color="${p.b}"/>
      <stop offset="100%" stop-color="${p.c}"/>
    </linearGradient>
    <radialGradient id="lift" cx="83%" cy="10%" r="76%">
      <stop offset="0%" stop-color="${p.lift}" stop-opacity="0.08"/>
      <stop offset="58%" stop-color="${p.lift}" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="${p.lift}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="fibre" width="38" height="38" patternUnits="userSpaceOnUse">
      <path d="M3 8h13 M25 28h9 M7 34h5 M29 6h4" stroke="${p.paper}" stroke-opacity="0.025" stroke-width="1"/>
      <circle cx="20" cy="18" r="0.8" fill="${p.paper}" fill-opacity="0.035"/>
    </pattern>
    <style>
      .r{font-family:'Newsreader',Georgia,serif}
      .s{font-family:'Inter','Segoe UI',sans-serif}
      .h{font-family:'Noto Serif Devanagari','Nirmala UI',serif}
      .hs{font-family:'Noto Sans Devanagari','Nirmala UI',sans-serif}
    </style>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#lift)"/>
  <rect width="${W}" height="${H}" fill="url(#fibre)"/>
  <rect x="28" y="28" width="10" height="574" fill="${p.accent}"/>
  <rect x="28" y="28" width="1144" height="574" rx="1" fill="none" stroke="${p.rule}" stroke-width="1.2"/>
  <rect x="34" y="34" width="1132" height="562" rx="1" fill="none" stroke="${p.rule}" stroke-width="0.7" opacity="0.58"/>
  <line x1="62" y1="112" x2="1138" y2="112" stroke="${p.rule}" stroke-width="1"/>

  <!-- A small printer's mark and the author masthead. -->
  <g transform="translate(62,56)">
    <text class="r" x="0" y="25" fill="${p.accent}" font-size="25" font-weight="600">LS</text>
    <text class="s" x="48" y="24" fill="${p.paper}" font-size="21" font-weight="600" letter-spacing="1.2">LOVEPREET SINGH</text>
  </g>
  <text class="s" x="${W - 62}" y="78" text-anchor="end" fill="${p.foot}" font-size="16" font-weight="500" letter-spacing="1.8">ESSAYS · RESEARCH · MISTERLOVE.IN</text>
`;

/** One route card. */
function card({ kicker, title, sub, standfirst, badge, byline, accent, language = 'en' }) {
  const p = PALETTES[accent] ?? PALETTES.harvest;
  const LEFT = 62;
  const MAXW = W - LEFT - 80;
  const displayClass = language === 'hi' ? 'h' : 'r';
  const labelClass = language === 'hi' ? 'hs' : 's';

  // The wordmark and the badge row are pinned to the top and bottom edges. The
  // block between them is measured and then centred in that band, so a
  // one-line title doesn't leave the card bottom-heavy and a three-line one
  // doesn't crowd the badge. A three-line title buys the room by giving the
  // standfirst a line.
  const BADGE_Y = H - 88;
  const BAND_TOP = 150;
  const BAND_BOTTOM = BADGE_Y - 30;

  const t = fitLines(title, {
    max: language === 'hi' ? 64 : 76,
    min: language === 'hi' ? 38 : 42,
    maxW: MAXW,
    maxLines: 3,
  });
  const leading = t.size * (language === 'hi' ? 1.28 : 1.03);
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
    .map((l, i) => `<text class="${displayClass}" x="${LEFT}" y="${(titleTop + i * leading).toFixed(0)}" fill="${p.paper}" font-size="${t.size}" font-weight="600" letter-spacing="${language === 'hi' ? '0' : `-${(t.size * 0.024).toFixed(1)}`}" word-spacing="${language === 'hi' ? '5' : '0'}">${esc(l)}</text>`)
    .join('\n  ');

  const standLines = standCount
    ? clampLines(standfirst, 23, MAXW - 130, standCount)
        .map((l, i) => `<text class="${labelClass}" x="${LEFT}" y="${(standY + i * (language === 'hi' ? 36 : 32)).toFixed(0)}" fill="${p.sub}" font-size="23" font-weight="400" word-spacing="${language === 'hi' ? '4' : '0'}">${esc(l)}</text>`)
        .join('\n  ')
    : '';

  const badgeW = labelWidth(badge, 17, 1.2) + 34;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>${esc(title)} — ${esc(sub || '')}</title>
${frame(p)}
  <text class="${labelClass}" x="${LEFT}" y="${kickerY.toFixed(0)}" fill="${p.accent}" font-size="18" font-weight="600" letter-spacing="${language === 'hi' ? '0' : '3.2'}">${esc(kicker.toUpperCase())}</text>
  ${titleLines}
  ${sub ? `<text class="${displayClass}" x="${LEFT}" y="${subY.toFixed(0)}" fill="${p.sub}" font-size="30" font-weight="400" word-spacing="${language === 'hi' ? '4' : '0'}">${esc(sub)}</text>` : ''}
  <rect x="${LEFT}" y="${ruleY.toFixed(0)}" width="72" height="3" rx="1.5" fill="${p.accent}"/>
  ${standLines}

  <g transform="translate(${LEFT}, ${BADGE_Y})">
    <rect x="0" y="0" width="${badgeW.toFixed(0)}" height="34" rx="1" fill="${p.accent}"/>
    <text class="${labelClass}" x="17" y="23" fill="${p.ink}" font-size="17" font-weight="700" letter-spacing="${language === 'hi' ? '0' : '1.2'}">${esc(badge)}</text>
    <text class="${labelClass}" x="${(badgeW + 24).toFixed(0)}" y="22" fill="${p.foot}" font-size="17" font-weight="500" letter-spacing="${language === 'hi' ? '0' : '0.4'}">${esc(byline)}</text>
  </g>
</svg>`;
}

/**
 * The shelf card for /writing — the section, not a piece.
 *
 * Lists the research so a shared link previews what's actually there, and
 * derives its counts from the manifest so it stays true as pieces are added.
 * Beyond ROWS entries it lists the newest and says how many more there are,
 * rather than silently cutting the list off.
 */
function shelfCard() {
  const p = PALETTES.site;
  const LEFT = 62;
  const COL = 660;                 // where the list column starts
  const LEFT_W = COL - LEFT - 40;  // headline measure
  const ROWS = 4;

  const shown = pieces.slice(0, ROWS);
  const rest = pieces.length - shown.length;

  // Both columns hang from the same top line, so the headline and the shelf
  // read as one composition rather than two things that happen to share a card.
  const TOP = 150;

  const t = fitLines(writingMeta.title, { max: 56, min: 34, maxW: LEFT_W, maxLines: 4 });
  const leading = t.size * 1.06;
  const titleTop = TOP + t.size * 0.92;

  const titleLines = t.lines
    .map((l, i) => `<text class="r" x="${LEFT}" y="${(titleTop + i * leading).toFixed(0)}" fill="${p.paper}" font-size="${t.size}" font-weight="600" letter-spacing="-${(t.size * 0.024).toFixed(1)}">${esc(l)}</text>`)
    .join('\n  ');

  const ruleY = titleTop + (t.lines.length - 1) * leading + 40;

  // A line of the section's own copy fills the space under the rule, so the
  // left column doesn't trail off into empty card.
  const leadY = ruleY + 44;
  const leadLines = clampLines(writingMeta.lead, 22, LEFT_W, 3)
    .map((l, i) => `<text class="s" x="${LEFT}" y="${(leadY + i * 31).toFixed(0)}" fill="${p.sub}" font-size="22" font-weight="400">${esc(l)}</text>`)
    .join('\n  ');

  // One row per piece: an accent swatch in that piece's own register, its
  // title, and its size.
  const rowH = 74;
  const listTop = TOP + 56;
  const rows = shown
    .map((piece, i) => {
      const tone = (PALETTES[piece.accent] ?? PALETTES.harvest).accent;
      const y = listTop + i * rowH;
      const name = clampLines(piece.title, 27, 380, 1)[0];
      // A serialised piece says how far it has got, so the card never claims
      // fifteen parts are waiting when one is.
      const size = isInProgress(piece)
        ? `${livePartsOf(piece)} of ${piece.parts} parts · ${piece.words.toLocaleString('en-IN')} words`
        : `${piece.parts} parts · ${piece.words.toLocaleString('en-IN')} words`;
      return `  <rect x="${COL}" y="${y - 20}" width="4" height="26" fill="${tone}"/>
  <text class="r" x="${COL + 20}" y="${y}" fill="${p.paper}" font-size="27" font-weight="600" letter-spacing="-0.4">${esc(name)}</text>
  <text class="s" x="${COL + 20}" y="${y + 27}" fill="${p.foot}" font-size="15" font-weight="500" letter-spacing="0.7">${size}</text>`;
    })
    .join('\n');

  const more = rest > 0
    ? `  <text class="s" x="${COL + 20}" y="${listTop + shown.length * rowH}" fill="${p.accent}" font-size="16" font-weight="600" letter-spacing="1">+ ${rest} more</text>`
    : '';

  const badge = `${writingTotals.parts} PARTS · ${writingTotals.words.toLocaleString('en-IN')} WORDS`;
  const badgeW = labelWidth(badge, 17, 1.2) + 34;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>Writing — long-form research by Lovepreet Singh</title>
${frame(p)}
  <text class="s" x="${LEFT}" y="${TOP}" fill="${p.accent}" font-size="18" font-weight="600" letter-spacing="3.2">${esc(`${writingMeta.index} · ${writingMeta.label}`.toUpperCase())}</text>
  ${titleLines}
  <rect x="${LEFT}" y="${ruleY.toFixed(0)}" width="72" height="3" rx="1.5" fill="${p.accent}"/>
  ${leadLines}

  <text class="s" x="${COL}" y="${TOP}" fill="${p.foot}" font-size="16" font-weight="600" letter-spacing="2.5">IN THE LIBRARY</text>
  <line x1="${COL}" y1="${TOP + 18}" x2="${W - 62}" y2="${TOP + 18}" stroke="${p.rule}" stroke-width="1"/>
${rows}
${more}

  <g transform="translate(${LEFT}, ${H - 88})">
    <rect x="0" y="0" width="${badgeW.toFixed(0)}" height="34" rx="1" fill="${p.accent}"/>
    <text class="s" x="17" y="23" fill="${p.ink}" font-size="17" font-weight="700" letter-spacing="1.2">${esc(badge)}</text>
    <text class="s" x="${(badgeW + 24).toFixed(0)}" y="22" fill="${p.foot}" font-size="17" font-weight="500">Research and writing by Lovepreet Singh</text>
  </g>
</svg>`;
}

/**
 * The shelf card for /books — the section, not a book.
 *
 * Same composition as the writing shelf, but each row is somebody else's book
 * with its author under it, because that is the fact a reader needs first.
 */
function booksShelfCard() {
  const p = PALETTES.site;
  const LEFT = 62;
  const COL = 660;
  const LEFT_W = COL - LEFT - 40;
  const ROWS = 4;

  const shown = books.slice(0, ROWS);
  const rest = books.length - shown.length;
  const TOP = 150;

  const t = fitLines(booksMeta.title, { max: 56, min: 34, maxW: LEFT_W, maxLines: 4 });
  const leading = t.size * 1.06;
  const titleTop = TOP + t.size * 0.92;

  const titleLines = t.lines
    .map((l, i) => `<text class="r" x="${LEFT}" y="${(titleTop + i * leading).toFixed(0)}" fill="${p.paper}" font-size="${t.size}" font-weight="600" letter-spacing="-${(t.size * 0.024).toFixed(1)}">${esc(l)}</text>`)
    .join('\n  ');

  const ruleY = titleTop + (t.lines.length - 1) * leading + 40;
  const leadY = ruleY + 44;
  const leadLines = clampLines(booksMeta.lead, 22, LEFT_W, 3)
    .map((l, i) => `<text class="s" x="${LEFT}" y="${(leadY + i * 31).toFixed(0)}" fill="${p.sub}" font-size="22" font-weight="400">${esc(l)}</text>`)
    .join('\n  ');

  const rowH = 74;
  const listTop = TOP + 56;
  const rows = shown
    .map((book, i) => {
      const tone = (PALETTES[book.accent] ?? PALETTES.harvest).accent;
      const y = listTop + i * rowH;
      const name = clampLines(book.title, 27, 380, 1)[0];
      const size = isOpen(book)
        ? `${book.author} · ${liveStudiesOf(book)} of ${book.studies} studies`
        : `${book.author} · ${book.studies} ${book.studies === 1 ? 'study' : 'studies'}`;
      return `  <rect x="${COL}" y="${y - 20}" width="4" height="26" fill="${tone}"/>
  <text class="r" x="${COL + 20}" y="${y}" fill="${p.paper}" font-size="27" font-weight="600" letter-spacing="-0.4">${esc(name)}</text>
  <text class="s" x="${COL + 20}" y="${y + 27}" fill="${p.foot}" font-size="15" font-weight="500" letter-spacing="0.7">${esc(clampLines(size, 15, 470, 1)[0])}</text>`;
    })
    .join('\n');

  const more = rest > 0
    ? `  <text class="s" x="${COL + 20}" y="${listTop + shown.length * rowH}" fill="${p.accent}" font-size="16" font-weight="600" letter-spacing="1">+ ${rest} more</text>`
    : '';

  const badge = `${booksTotals.studies} ${booksTotals.studies === 1 ? 'STUDY' : 'STUDIES'} · ${booksTotals.axioms} AXIOMS DUG OUT`;
  const badgeW = labelWidth(badge, 17, 1.2) + 34;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>Books, taken apart — close readings by Lovepreet Singh</title>
${frame(p)}
  <text class="s" x="${LEFT}" y="${TOP}" fill="${p.accent}" font-size="18" font-weight="600" letter-spacing="3.2">${esc(`${booksMeta.index} · ${booksMeta.label}`.toUpperCase())}</text>
  ${titleLines}
  <rect x="${LEFT}" y="${ruleY.toFixed(0)}" width="72" height="3" rx="1.5" fill="${p.accent}"/>
  ${leadLines}

  <text class="s" x="${COL}" y="${TOP}" fill="${p.foot}" font-size="16" font-weight="600" letter-spacing="2.5">ON THE SHELF</text>
  <line x1="${COL}" y1="${TOP + 18}" x2="${W - 62}" y2="${TOP + 18}" stroke="${p.rule}" stroke-width="1"/>
${rows}
${more}

  <g transform="translate(${LEFT}, ${H - 88})">
    <rect x="0" y="0" width="${badgeW.toFixed(0)}" height="34" rx="1" fill="${p.accent}"/>
    <text class="s" x="17" y="23" fill="${p.ink}" font-size="17" font-weight="700" letter-spacing="1.2">${esc(badge)}</text>
    <text class="s" x="${(badgeW + 24).toFixed(0)}" y="22" fill="${p.foot}" font-size="17" font-weight="500">Close readings by Lovepreet Singh</text>
  </g>
</svg>`;
}

const renderedCards = [];
const expectedFiles = new Set();

function render(svg, file) {
  const name = basename(file);
  if (expectedFiles.has(name)) {
    throw new Error(`Two writing routes resolve to the same OG filename: ${name}`);
  }

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Newsreader' },
  });
  const img = resvg.render();
  const png = img.asPng();

  if (img.width !== W || img.height !== H) {
    throw new Error(`${name} rendered at ${img.width}×${img.height}; expected ${W}×${H}`);
  }
  if (png.length < 20_000) {
    throw new Error(`${name} is unexpectedly small (${png.length} bytes); text or fonts may be missing`);
  }

  expectedFiles.add(name);
  renderedCards.push({ file, png });
  return { w: img.width, h: img.height, kb: png.length / 1024 };
}

mkdirSync(OUT, { recursive: true });

let total = 0;
const hindiOnly = process.argv.includes('--hindi-only');
const routeSlugs = new Set();

function registerSlug(slug, label) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${label} has an unsafe OG slug: ${slug}`);
  }
  if (routeSlugs.has(slug)) {
    throw new Error(`Duplicate OG slug: ${slug}`);
  }
  routeSlugs.add(slug);
}

function validateParts(parts, label) {
  const numbers = parts.map((part) => part.n);
  const expected = Array.from({ length: parts.length }, (_, index) => index + 1);
  if (numbers.some((number) => !Number.isInteger(number) || number < 1)) {
    throw new Error(`${label} has a non-positive or non-integer part number`);
  }
  if (numbers.some((number, index) => number !== expected[index])) {
    throw new Error(`${label} parts must be unique, ordered and contiguous from 1`);
  }
}

for (const piece of pieces) {
  registerSlug(piece.slug, piece.title);
  for (const language of Object.keys(piece.translations ?? {})) {
    const edition = getPieceForLanguage(piece.slug, language);
    registerSlug(edition.ogSlug ?? `${piece.slug}-${language}`, `${piece.title} (${language})`);
  }
}

// The shelf card for /writing itself.
if (!hindiOnly) {
  const file = `${OUT}/writing.png`;
  const r = render(shelfCard(), file);
  console.log(`${relative(ROOT, file).padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
  total += r.kb;
}
for (const piece of pieces) {
  let r;
  if (!hindiOnly) {
    const parts = (await piece.load()).default;
    validateParts(parts, piece.title);
    if (livePartsOf(piece) !== parts.length) {
      throw new Error(`${piece.title} declares ${livePartsOf(piece)} live parts but loads ${parts.length}`);
    }

    // Series card — used by /writing and as the piece-level fallback.
    const seriesFile = `${OUT}/${piece.slug}.png`;
    r = render(
      card({
        kicker: piece.kicker,
        title: piece.title,
        sub: piece.subtitle,
        standfirst: piece.standfirst,
        badge: isInProgress(piece) ? `${parts.length} OF ${piece.parts} PARTS LIVE` : `${piece.parts} PARTS`,
        byline: 'Research and writing by Lovepreet Singh',
        accent: piece.accent,
      }),
      seriesFile
    );
    console.log(`${relative(ROOT, seriesFile).padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
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
          accent: piece.accent,
        }),
        file
      );
      console.log(`${relative(ROOT, file).padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
      total += r.kb;
    }
  }

  for (const language of Object.keys(piece.translations ?? {})) {
    const edition = getPieceForLanguage(piece.slug, language);
    const translatedParts = (await edition.load()).default;
    validateParts(translatedParts, `${edition.title} (${language})`);
    if (translatedParts.length > edition.parts) {
      throw new Error(`${edition.title} (${language}) loads more parts than its planned total`);
    }
    const translatedSlug = edition.ogSlug ?? `${piece.slug}-${language}`;
    const translatedSeriesFile = `${OUT}/${translatedSlug}.png`;

    r = render(
      card({
        kicker: edition.kicker,
        title: edition.title,
        sub: edition.subtitle,
        standfirst: edition.standfirst,
        badge: translatedParts.length < edition.parts
          ? `${translatedParts.length} / ${edition.parts} भाग प्रकाशित`
          : `${edition.parts} भाग`,
        byline: 'Lovepreet Singh की शोध और लेखनी',
        accent: edition.accent,
        language,
      }),
      translatedSeriesFile
    );
    console.log(`${relative(ROOT, translatedSeriesFile).padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
    total += r.kb;

    for (const translatedPart of translatedParts) {
      const file = `${OUT}/${translatedSlug}-part-${translatedPart.n}.png`;
      r = render(
        card({
          kicker: `भाग ${String(translatedPart.n).padStart(2, '0')} / ${edition.parts} · ${translatedPart.label}`,
          title: translatedPart.title,
          sub: `${edition.title} — ${edition.subtitle}`,
          standfirst: translatedPart.lead,
          badge: `${translatedPart.minutes} मिनट`,
          byline: 'Lovepreet Singh · misterlove.in',
          accent: edition.accent,
          language,
        }),
        file
      );
      console.log(`${relative(ROOT, file).padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
      total += r.kb;
    }
  }
}

/* ---- The shelf at /books ------------------------------------------------
   Books cards are namespaced `books-…` so a book and a research piece can
   share a slug without their cards colliding. render() would catch a collision
   anyway; the prefix means it never happens. */
if (!hindiOnly) {
  const shelfFile = `${OUT}/books.png`;
  let r = render(booksShelfCard(), shelfFile);
  console.log(`${relative(ROOT, shelfFile).padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
  total += r.kb;

  for (const book of books) {
    registerSlug(book.slug, book.title);
    const studies = (await book.load()).default;
    if (liveStudiesOf(book) !== studies.length) {
      throw new Error(`${book.title} declares ${liveStudiesOf(book)} live studies but loads ${studies.length}`);
    }
    validateParts(studies, book.title);

    // The book card — used by /books and as the book-level fallback.
    const bookFile = `${OUT}/books-${book.slug}.png`;
    r = render(
      card({
        kicker: `${book.kicker} · ${book.author}`,
        title: book.title,
        sub: book.subtitle,
        standfirst: book.standfirst,
        badge: isOpen(book)
          ? `${studies.length} OF ${book.studies} STUDIES LIVE`
          : `${book.studies} ${book.studies === 1 ? 'STUDY' : 'STUDIES'}`,
        byline: 'Taken apart by Lovepreet Singh',
        accent: book.accent,
      }),
      bookFile
    );
    console.log(`${relative(ROOT, bookFile).padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
    total += r.kb;

    for (const study of studies) {
      // The card leads with the sentence under the knife rather than the
      // study's own title — that line is what anyone sharing this recognises.
      const file = `${OUT}/books-${book.slug}-${study.slug}.png`;
      r = render(
        card({
          kicker: `${book.title} · ${study.label} · ${study.axioms} hidden axioms`,
          title: `“${study.sentence}”`,
          sub: `${study.title} — ${book.author} taken apart`,
          standfirst: study.lead,
          badge: `${study.minutes} MIN READ`,
          byline: 'Lovepreet Singh · misterlove.in',
          accent: book.accent,
        }),
        file
      );
      console.log(`${relative(ROOT, file).padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
      total += r.kb;
    }

    /* Language editions get their own card, in their own script — a Hindi
       study shared to a Hindi reader should not preview in English. The
       manifest's list of translated slugs is checked against the file that
       actually loads, so the reader's language switch cannot offer a study
       whose prose was never generated. */
    for (const [language, edition] of Object.entries(book.translations ?? {})) {
      const translated = (await edition.load()).default;
      const declared = [...(edition.studies ?? [])].sort();
      const loaded = translated.map((s) => s.slug).sort();
      if (JSON.stringify(declared) !== JSON.stringify(loaded)) {
        throw new Error(
          `${book.title} [${language}] declares [${declared}] but loads [${loaded}]`
        );
      }

      for (const study of translated) {
        const file = `${OUT}/books-${book.slug}-${study.slug}-${language}.png`;
        r = render(
          card({
            kicker: `${book.title} · ${study.label} · ${study.axioms} छिपी मान्यताएँ`,
            title: `“${study.sentence}”`,
            sub: `${study.title} — ${book.author} टुकड़ा-टुकड़ा करके`,
            standfirst: study.lead,
            badge: `${study.minutes} मिनट`,
            byline: 'लवप्रीत सिंह · misterlove.in',
            accent: book.accent,
            language,
          }),
          file
        );
        console.log(`${relative(ROOT, file).padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
        total += r.kb;
      }
    }
  }
}

for (const { file, png } of renderedCards) writeFileSync(file, png);

let removed = 0;
if (!hindiOnly) {
  for (const name of readdirSync(OUT)) {
    if (name.endsWith('.png') && !expectedFiles.has(name)) {
      unlinkSync(resolve(OUT, name));
      removed += 1;
    }
  }
}

console.log(`\n✓ ${renderedCards.length} cards · ${(total / 1024).toFixed(2)} MB${removed ? ` · removed ${removed} stale files` : ''}`);
