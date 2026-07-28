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
 *     node scripts/make-og-cards.mjs --hindi-only
 *
 * Requires the brand TTFs in stories/_fonts/ and @resvg/resvg-js. Both are
 * local-only (stories/ is git-ignored, resvg installed with --no-save):
 *     npm i --no-save @resvg/resvg-js
 *     # fonts: fontsource Space Grotesk 500/700 + JetBrains Mono 400/700
 *     #        https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-500-normal.ttf
 */
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import {
  pieces,
  writingMeta,
  writingTotals,
  livePartsOf,
  isInProgress,
  getPieceForLanguage,
} from '../src/data/writing.js';

const W = 1200;
const H = 630;
const OUT = 'public/og';

const FONTS = [
  'stories/_fonts/sg-500.ttf',
  'stories/_fonts/sg-700.ttf',
  'stories/_fonts/jm-400.ttf',
  'stories/_fonts/jm-700.ttf',
  'C:/Windows/Fonts/mangal.ttf',
  'C:/Windows/Fonts/mangalb.ttf',
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

/** JetBrains Mono is fixed-pitch — the proportional table above under-measures
    it badly, which is enough to push a badge label outside its plate. */
const monoWidth = (s, size, tracking = 0) => graphemes(s).length * (size * 0.6 + tracking);

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

/* Per-piece palettes — the same registers as the on-site cover plates
   (.cover--harvest / .cover--ember in src/pages/Writing.css). */
const PALETTES = {
  harvest: { a: '#16301f', b: '#1e4429', c: '#29583a', lift: '#78be8c', gold: '#f2c14e', kick: '#ffe6a3', sub: '#cfe6d6', ink: '#22331f', foot: '#bcd6c5', mark: '#9dc0a8' },
  ember:   { a: '#17131b', b: '#2a1e26', c: '#3d2a2a', lift: '#d69652', gold: '#d59a4e', kick: '#f0cf9d', sub: '#d9c7bb', ink: '#221b18', foot: '#cbb8a8', mark: '#bfa88f' },
  ink:     { a: '#0f1520', b: '#1a2438', c: '#26324a', lift: '#e0873a', gold: '#e0873a', kick: '#f5c98d', sub: '#c3cee0', ink: '#1b1408', foot: '#aebbd0', mark: '#93a3bd' },
  quartz:  { a: '#0c1417', b: '#12262c', c: '#1b3a42', lift: '#57c9bd', gold: '#5ec8bb', kick: '#a8ece3', sub: '#c0d6da', ink: '#08211f', foot: '#a5bcc0', mark: '#86a4a9' },
  // The shelf belongs to the site, not to any one piece — so it wears the
  // site's own obsidian/cobalt rather than a book's register. It also stays
  // correct as pieces are added, which a borrowed cover would not.
  site:    { a: '#06070a', b: '#0a0c12', c: '#141826', lift: '#4d6bff', gold: '#4d6bff', kick: '#7d93ff', sub: '#aab3c5', ink: '#ffffff', foot: '#69748b', mark: '#69748b' },
};

const frame = (p) => `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0%" stop-color="${p.a}"/>
      <stop offset="48%" stop-color="${p.b}"/>
      <stop offset="100%" stop-color="${p.c}"/>
    </linearGradient>
    <radialGradient id="lift" cx="80%" cy="8%" r="70%">
      <stop offset="0%" stop-color="${p.lift}" stop-opacity="0.20"/>
      <stop offset="62%" stop-color="${p.lift}" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="${p.lift}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M72 0H0V72" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.30"/>
    </linearGradient>
    <style>.d{font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif}.m{font-family:'JetBrains Mono',ui-monospace,monospace}.h{font-family:'Mangal','Noto Sans Devanagari',sans-serif}</style>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#lift)"/>
  <rect y="${H - 210}" width="${W}" height="210" fill="url(#fade)"/>

  <!-- corner brackets, in the piece's own gold rather than the site's cobalt -->
  <path d="M40 72V40H72"        fill="none" stroke="${p.gold}" stroke-width="2.5"/>
  <path d="M1128 40h32v32"      fill="none" stroke="${p.gold}" stroke-width="2.5"/>
  <path d="M40 558v32h32"       fill="none" stroke="${p.gold}" stroke-width="2.5"/>
  <path d="M1160 590v-32h-32"   fill="none" stroke="${p.gold}" stroke-width="2.5"/>

  <!-- reticle wordmark -->
  <g transform="translate(60,54)">
    <circle cx="16" cy="16" r="14" fill="none" stroke="${p.gold}" stroke-width="2" opacity="0.65"/>
    <circle cx="16" cy="16" r="3.4" fill="${p.gold}"/>
    <path d="M16 0V6 M16 26V32 M0 16H6 M26 16H32" stroke="${p.gold}" stroke-width="2" stroke-linecap="round" opacity="0.65"/>
    <text class="d" x="46" y="23" fill="#f6f4f2" font-size="23" font-weight="700" letter-spacing="1">LOVEPREET <tspan fill="${p.mark}">SINGH</tspan></text>
  </g>
  <text class="m" x="${W - 60}" y="77" text-anchor="end" fill="${p.mark}" font-size="20" letter-spacing="2">misterlove.in</text>
`;

/** One card. `kicker` is the mono line, `title`/`sub` the display block. */
function card({ kicker, title, sub, standfirst, badge, byline, accent, language = 'en' }) {
  const p = PALETTES[accent] ?? PALETTES.harvest;
  const LEFT = 62;
  const MAXW = W - LEFT - 80;
  const displayClass = language === 'hi' ? 'h' : 'd';
  const labelClass = language === 'hi' ? 'h' : 'm';

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
    .map((l, i) => `<text class="${displayClass}" x="${LEFT}" y="${(titleTop + i * leading).toFixed(0)}" fill="#ffffff" font-size="${t.size}" font-weight="700" letter-spacing="${language === 'hi' ? '0' : `-${(t.size * 0.032).toFixed(1)}`}">${esc(l)}</text>`)
    .join('\n  ');

  const standLines = standCount
    ? clampLines(standfirst, 25, MAXW - 130, standCount)
        .map((l, i) => `<text class="${displayClass}" x="${LEFT}" y="${(standY + i * 34).toFixed(0)}" fill="${p.sub}" font-size="25" font-weight="500">${esc(l)}</text>`)
        .join('\n  ')
    : '';

  const badgeW = monoWidth(badge, 19, 1.4) + 34;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>${esc(title)} — ${esc(sub || '')}</title>
${frame(p)}
  <text class="${labelClass}" x="${LEFT}" y="${kickerY.toFixed(0)}" fill="${p.kick}" font-size="22" letter-spacing="${language === 'hi' ? '0' : '3.5'}">${esc(kicker.toUpperCase())}</text>
  ${titleLines}
  ${sub ? `<text class="${displayClass}" x="${LEFT}" y="${subY.toFixed(0)}" fill="${p.sub}" font-size="31" font-weight="500">${esc(sub)}</text>` : ''}
  <rect x="${LEFT}" y="${ruleY.toFixed(0)}" width="72" height="4" fill="${p.gold}"/>
  ${standLines}

  <g transform="translate(${LEFT}, ${BADGE_Y})">
    <rect x="0" y="0" width="${badgeW.toFixed(0)}" height="34" rx="3" fill="${p.gold}"/>
    <text class="${labelClass}" x="17" y="23" fill="${p.ink}" font-size="19" font-weight="700" letter-spacing="${language === 'hi' ? '0' : '1.4'}">${esc(badge)}</text>
    <text class="${labelClass}" x="${(badgeW + 26).toFixed(0)}" y="23" fill="${p.foot}" font-size="19" letter-spacing="${language === 'hi' ? '0' : '1'}">${esc(byline)}</text>
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
    .map((l, i) => `<text class="d" x="${LEFT}" y="${(titleTop + i * leading).toFixed(0)}" fill="#ffffff" font-size="${t.size}" font-weight="700" letter-spacing="-${(t.size * 0.032).toFixed(1)}">${esc(l)}</text>`)
    .join('\n  ');

  const ruleY = titleTop + (t.lines.length - 1) * leading + 40;

  // A line of the section's own copy fills the space under the rule, so the
  // left column doesn't trail off into empty card.
  const leadY = ruleY + 44;
  const leadLines = clampLines(writingMeta.lead, 24, LEFT_W, 2)
    .map((l, i) => `<text class="d" x="${LEFT}" y="${(leadY + i * 33).toFixed(0)}" fill="${p.sub}" font-size="24" font-weight="500">${esc(l)}</text>`)
    .join('\n  ');

  // One row per piece: an accent swatch in that piece's own register, its
  // title, and its size.
  const rowH = 74;
  const listTop = TOP + 56;
  const rows = shown
    .map((piece, i) => {
      const tone = (PALETTES[piece.accent] ?? PALETTES.harvest).gold;
      const y = listTop + i * rowH;
      const name = clampLines(piece.title, 27, 380, 1)[0];
      // A serialised piece says how far it has got, so the card never claims
      // fifteen parts are waiting when one is.
      const size = isInProgress(piece)
        ? `${livePartsOf(piece)} of ${piece.parts} parts · ${piece.words.toLocaleString('en-IN')} words`
        : `${piece.parts} parts · ${piece.words.toLocaleString('en-IN')} words`;
      return `  <rect x="${COL}" y="${y - 20}" width="4" height="26" fill="${tone}"/>
  <text class="d" x="${COL + 20}" y="${y}" fill="#eaeef7" font-size="27" font-weight="500" letter-spacing="-0.5">${esc(name)}</text>
  <text class="m" x="${COL + 20}" y="${y + 27}" fill="${p.foot}" font-size="17" letter-spacing="1">${size}</text>`;
    })
    .join('\n');

  const more = rest > 0
    ? `  <text class="m" x="${COL + 20}" y="${listTop + shown.length * rowH}" fill="${p.kick}" font-size="18" letter-spacing="1.5">+ ${rest} more</text>`
    : '';

  const badge = `${writingTotals.parts} PARTS · ${writingTotals.words.toLocaleString('en-IN')} WORDS`;
  const badgeW = monoWidth(badge, 19, 1.4) + 34;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>Writing — long-form research by Lovepreet Singh</title>
${frame(p)}
  <text class="m" x="${LEFT}" y="${TOP}" fill="${p.kick}" font-size="22" letter-spacing="3.5">${esc(`${writingMeta.index} — ${writingMeta.label}`.toUpperCase())}</text>
  ${titleLines}
  <rect x="${LEFT}" y="${ruleY.toFixed(0)}" width="72" height="4" fill="${p.gold}"/>
  ${leadLines}

  <text class="m" x="${COL}" y="${TOP}" fill="${p.foot}" font-size="19" letter-spacing="2.5">ON THE SHELF</text>
  <line x1="${COL}" y1="${TOP + 18}" x2="${W - 62}" y2="${TOP + 18}" stroke="#28324a" stroke-width="1"/>
${rows}
${more}

  <g transform="translate(${LEFT}, ${H - 88})">
    <rect x="0" y="0" width="${badgeW.toFixed(0)}" height="34" rx="3" fill="${p.gold}"/>
    <text class="m" x="17" y="23" fill="${p.ink}" font-size="19" font-weight="700" letter-spacing="1.4">${esc(badge)}</text>
    <text class="m" x="${(badgeW + 26).toFixed(0)}" y="23" fill="${p.foot}" font-size="19" letter-spacing="1">Researched &amp; written by Lovepreet Singh</text>
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
const hindiOnly = process.argv.includes('--hindi-only');

// The shelf card for /writing itself.
if (!hindiOnly) {
  const file = `${OUT}/writing.png`;
  const r = render(shelfCard(), file);
  console.log(`${file.padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
  total += r.kb;
}
for (const piece of pieces) {
  let r;
  if (!hindiOnly) {
    const parts = (await piece.load()).default;

    // Series card — used by /writing and as the piece-level fallback.
    const seriesFile = `${OUT}/${piece.slug}.png`;
    r = render(
      card({
        kicker: piece.kicker,
        title: piece.title,
        sub: piece.subtitle,
        standfirst: piece.standfirst,
        badge: isInProgress(piece) ? `${parts.length} OF ${piece.parts} PARTS LIVE` : `${piece.parts} PARTS`,
        byline: 'Written & researched by Lovepreet Singh',
        accent: piece.accent,
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
          accent: piece.accent,
        }),
        file
      );
      console.log(`${file.padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
      total += r.kb;
    }
  }

  for (const language of Object.keys(piece.translations ?? {})) {
    const edition = getPieceForLanguage(piece.slug, language);
    const translatedParts = (await edition.load()).default;
    const translatedSlug = edition.ogSlug ?? `${piece.slug}-${language}`;
    const translatedSeriesFile = `${OUT}/${translatedSlug}.png`;

    r = render(
      card({
        kicker: edition.kicker,
        title: edition.title,
        sub: edition.subtitle,
        standfirst: edition.standfirst,
        badge: `${edition.parts} भाग`,
        byline: 'Lovepreet Singh की शोध और लेखनी',
        accent: edition.accent,
        language,
      }),
      translatedSeriesFile
    );
    console.log(`${translatedSeriesFile.padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
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
      console.log(`${file.padEnd(46)} ${r.w}x${r.h}  ${r.kb.toFixed(0)} KB`);
      total += r.kb;
    }
  }
}

console.log(`\n✓ ${OUT} — ${(total / 1024).toFixed(2)} MB total`);
