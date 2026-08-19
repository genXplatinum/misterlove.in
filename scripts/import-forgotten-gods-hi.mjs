/**
 * import-forgotten-gods-hi.mjs — Hindi edition importer for The Forgotten Gods.
 *
 * Same idea as import-forgotten-gods.mjs (structure recovered from typography:
 * font size tells a heading from a paragraph, x-offset tells an indented box
 * from body copy), but with one addition this PDF forces on us: pdf.js's own
 * text strings for this file are unreliable for Devanagari. Two defects, both
 * confirmed by inspecting raw codepoints straight out of the content stream —
 * not an artifact of this script:
 *
 *   1. The pre-base vowel sign "i-matra" is drawn (and therefore extracted)
 *      *before* the consonant it belongs to — "बिसरे" comes out as "िबसरे".
 *   2. Some म+े+ं glyph clusters ("में") carry a broken ToUnicode entry and
 *      extract as one letter followed by a control character — silent data
 *      loss, not reordering.
 *
 * poppler/xpdf's pdftotext does not have either problem — it reorders and
 * maps Devanagari correctly (verified against the same pages). So this
 * importer takes text from pdftotext and structure (size, x, page, y — none
 * of which touch character encoding) from pdf.js, and stitches them together:
 * pdftotext already merges each wrapped visual line into one logical line per
 * paragraph/heading/box, in the same order pdf.js's own paragraph-grouping
 * would produce, so each open block (para/box/quote/heading) pulls exactly
 * one pdftotext line per *distinct page* its rows touch, in order. A block
 * whose rows never leave one page pulls one line; a paragraph that continues
 * across a page break pulls one line from each side and joins them — which
 * is exactly how pdftotext itself broke them.
 *
 * A translated edition can't slugify its own anchor ids — Devanagari strips
 * to nothing under the English slugifier — so section ids are borrowed from
 * the English edition by position (1st H2 in Hindi part N ↔ 1st toc entry in
 * English part N, and so on). That is also what keeps the language switch on
 * an article landing on the same section it left.
 *
 *     node scripts/import-forgotten-gods-hi.mjs "<path to the Hindi PDF>"
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const SRC = process.argv[2]
  ?? 'C:/Users/rajpa/Downloads/Forgotten Gods Hindi - Simplified.pdf';
const OUT = 'src/data/writing/forgotten-gods-hi.js';
const PDFTOTEXT = 'C:/Program Files/Git/mingw64/bin/pdftotext.exe';

const englishModule = await import(pathToFileURL(resolve('src/data/writing/forgotten-gods.js')).href);
const english = englishModule.default;

/* Typography → meaning. Measured from this document; see the header note.
   Distinct from the English SIZE map — this PDF was set with different
   metrics (a 30pt cover title, not 32; an 11pt box vs a 10.5pt citation,
   where English uses 10.5 for both). */
const SIZE = {
  bookTitle: 29,   // part cover (title contains "देवता") — threshold, not exact
  frontHead: 22,   // "लेखक की एक बात", "विषय-सूची"
  chapter: 21,     // chapter title → h2
  section: 14,     // section heading → h3 (the opening epigraph is also 14pt,
                    // but it always falls inside the stripped contents range —
                    // see buildPart — so no collision survives into `body`)
  numeral: 13,     // chapter numeral ("I ."), still plain Latin/roman
  body: 12,        // body copy
  pull: 12.5,      // pull-quote / epigraph text
  boxSmall: 11,    // explainer boxes
  citeSmall: 10.5, // quote attributions
};

const INDENT = 8;
// Normal body prose in this document has an ~22-23pt same-paragraph line
// gap and an ~30-35pt between-paragraph gap, with clean daylight between
// the two — a threshold anywhere in the high 20s tells them apart. Bullet
// lists break that assumption: consecutive list items sit ~27-29pt apart,
// inside the "same paragraph" range for normal prose but wide enough to
// trip a lower threshold into splitting mid-list. 30 sits above every
// bullet-list gap actually measured in this PDF while still catching every
// real paragraph break.
const PARA_GAP = 30;
const ORNAMENT = /^[—–-]\s*[◆◇•]\s*[—–-]$/;
const ENDS_SENTENCE = /[.!?।॥”"'’]\s*$/;

/** Cover copy carries the part's identity; lifted verbatim from each part's
    cover page via pdftotext (the only place this text needs to be trusted a
    second time, and it's plain paragraph text, not glyph-cluster-heavy). */
const PARTS = [
  { label: 'यूरोप', title: 'यूरोप ने हज़ार जीती-जागती रूहों को आसमान में बैठे एक दूर के राजा के बदले कैसे दे दिया' },
  { label: 'भारत', title: 'वह धरती जो झुकी नहीं' },
  { label: 'औपनिवेशिक भारत', title: 'वह कंपनी जो एक पूरे देश को निगल गई' },
  { label: 'पूर्वी एशिया', title: 'वे सभ्यताएँ जो नहीं झुकीं' },
];

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * This PDF is fully justified, and poppler/xpdf's word-space heuristic
 * occasionally mistakes the extra stretch it inserts around certain matras
 * for a real space — "कुछ" comes back as "कु छ". That is a width-heuristic
 * artifact, not a text error, and it is not reliably reversible without a
 * Hindi wordlist (the same two-token split is sometimes a real word
 * boundary). What *is* always safe: a space can never legitimately precede
 * Hindi sentence punctuation, so that class gets fixed outright.
 */
const cleanupSpacing = (s) => (s || '').replace(/ +([।॥,.!?)])/g, '$1');

/** Safety net, not a primary fix: a same-page run of body rows whose gaps
    all disagree with pdftotext's own paragraph grouping (a rarer case than
    the bullet-list one PARA_GAP is tuned for, but the same shape of problem)
    can still leave a genuinely empty heading or paragraph shell — the text
    that belongs there ends up folded into a neighbour instead of lost, since
    every page's queue is drained before its accumulator closes (see
    drainPage below), so the shell itself carries nothing. Drop it rather
    than render an empty tag. */
// h2 is excluded deliberately — it carries the id a TOC entry and the
// language switch both anchor to, and this book's chapter titles are never
// genuinely empty, so there is nothing to protect against there.
const dropEmptyTags = (s) => (s || '').replace(/<(h3|p)(?:\s[^>]*)?>\s*<\/\1>/g, '');

/** Some glyph clusters in this font (the same ToUnicode defect that breaks
    "में" — see the header note) extract as a lone control character, and
    occasionally at a y a couple of points off the row's real baseline, which
    would otherwise register as its own spurious one-character "line" and
    desync the page's pdftotext queue below. Built via codePointAt rather
    than a regex control-character class, which upstream tooling has a habit
    of mangling. */
const stripControlChars = (raw) => Array.from(raw)
  .filter((ch) => {
    const c = ch.codePointAt(0);
    return c > 31 && c !== 127;
  })
  .join('');

const ROMAN = { I: 1, V: 5, X: 10, L: 50, C: 100 };
function fromRoman(s) {
  const t = s.replace(/[^IVXLC]/gi, '').toUpperCase();
  if (!t) return null;
  let n = 0;
  for (let i = 0; i < t.length; i++) {
    const v = ROMAN[t[i]];
    n += v < (ROMAN[t[i + 1]] ?? 0) ? -v : v;
  }
  return n || null;
}

/* ---------------- clean text, via pdftotext, as one line-queue per page ---------------- */

const rawText = execFileSync(
  PDFTOTEXT,
  ['-enc', 'UTF-8', SRC, '-'],
  { maxBuffer: 1024 * 1024 * 64 }
).toString('utf8');

// pdftotext separates pages with a form feed; pageTexts[0] is page 1.
const pageTexts = rawText.split('\f');
const queues = pageTexts.map((t) => t.split('\n').map((l) => l.trim()).filter(Boolean));

const DEBUG = process.env.DEBUG_IMPORT === '1';
const takeLine = (page) => {
  const q = queues[page - 1];
  if (!q || !q.length) {
    if (DEBUG) console.error(`  [queue empty] page ${page}`);
    return '';
  }
  return q.shift();
};
const hasLine = (page) => {
  const q = queues[page - 1];
  return Boolean(q && q.length);
};

/* ---------------- read the PDF into positioned lines (pdf.js, structure only) ----------------
   `text` below is pdf.js's own extraction and is NOT trusted for Devanagari —
   it is only used where the pattern is pure Latin/symbols (roman numerals,
   the ornament rule), which this document's encoding defect does not touch. */

const doc = await getDocument({ data: new Uint8Array(readFileSync(SRC)), useSystemFonts: true }).promise;
const lines = [];

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const rows = new Map();

  for (const it of (await page.getTextContent()).items) {
    if (!it.str) continue;
    const y = Math.round(it.transform[5]);
    const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push({ x: it.transform[4], str: it.str, size: Math.abs(it.transform[0]) || it.height || 0 });
  }

  [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .forEach(([y, items]) => {
      items.sort((a, b) => a.x - b.x);
      const text = stripControlChars(items.map((i) => i.str).join(''))
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) return;
      lines.push({
        page: p,
        y,
        x: Math.round(items[0].x),
        size: Math.round(Math.max(...items.map((i) => i.size)) * 10) / 10,
        text,
      });
    });
}

/* ---------------- split into parts at each cover page ----------------
   Matched on "देवता" alone (the last word of the title) rather than the full
   title string — देवता has no pre-base vowel signs, so unlike "बिसरे" it
   extracts correctly out of pdf.js even with this document's encoding bug. */

const partStarts = lines
  .filter((l) => l.size >= SIZE.bookTitle && /देवता/.test(l.text))
  .map((l) => l.page);

const chunks = partStarts.map((start, i) => {
  const end = partStarts[i + 1] ?? Infinity;
  return lines.filter((l) => l.page >= start && l.page < end);
});

/* ---------------- turn one part's lines into HTML ---------------- */

function buildPart(chunk, index) {
  const meta = PARTS[index];
  const englishPart = english[index];

  const coverPage = chunk[0].page;
  let body = chunk.filter((l) => l.page !== coverPage);

  // Contents heading = the 2nd front-matter-level heading in the part (the
  // 1st is the author's note / transitional note). Matched by position, not
  // text — "विषय-सूची" itself extracts corrupted out of pdf.js for the same
  // reason "बिसरे" does (the i-matra is pre-base), so a text regex can't be
  // trusted here the way it can for the English importer.
  const frontHeads = body.filter((l) => l.size >= SIZE.frontHead - 0.3);
  const contentsHead = frontHeads[1];
  if (contentsHead) {
    const nextChapter = body.find((l) => l.page > contentsHead.page && l.size >= SIZE.chapter - 0.5);
    body = body.filter((l) => !(l.page >= contentsHead.page && (!nextChapter || l.page < nextChapter.page)));
  }

  const xTally = {};
  body.forEach((l) => {
    if (Math.abs(l.size - SIZE.body) < 0.4) xTally[l.x] = (xTally[l.x] || 0) + 1;
  });
  const bodyX = Number(Object.entries(xTally).sort((a, b) => b[1] - a[1])[0][0]);
  const indented = (x) => x > bodyX + INDENT;

  const blocks = [];
  let para = null, box = null, quote = null, heading = null, pendingNum = null;

  const newAcc = () => ({ text: '', _pages: new Set() });

  // Dense, irregularly-spaced runs (bullet lists especially) can make pdf.js
  // see more distinct paragraph breaks on one page than pdftotext actually
  // produced lines for — the row-to-row gap that usually separates
  // paragraphs doesn't reliably separate "next list item" from "actually a
  // new paragraph" here. Rather than guess and risk losing a sentence to an
  // empty block, every page's queue is drained into whichever accumulator
  // last drew from it, the moment processing moves off that page. Nothing
  // pdftotext produced is ever dropped; a paragraph boundary the two tools
  // disagree on merges into its neighbour instead of vanishing.
  let lastAppender = null; // (extraText) => void — appends into whatever last took from the current page
  let lastAppenderPage = null;
  const drainPage = (page) => {
    if (!lastAppender || lastAppenderPage !== page) return;
    while (hasLine(page)) {
      const t = takeLine(page);
      if (t) lastAppender(t);
    }
  };

  /** Pull exactly one pdftotext line into `acc`, but only the first time a
      row from this page has fed this specific accumulator — a paragraph
      whose seven pdf.js rows all sit on one page must not pull seven lines,
      it pulls the one pdftotext already merged them into. */
  const takeFor = (acc, l) => {
    lastAppender = (extra) => { acc.text = acc.text ? `${acc.text} ${extra}` : extra; };
    lastAppenderPage = l.page;
    if (acc._pages.has(l.page)) return;
    acc._pages.add(l.page);
    const t = takeLine(l.page);
    if (t) acc.text = acc.text ? `${acc.text} ${t}` : t;
  };

  // A flush snapshots the accumulator's text into a plain object pushed onto
  // `blocks`; a later drainPage() mutating the accumulator after that point
  // would be writing into a detached object nothing renders. So every flush
  // clears the appender too — whatever creates the next accumulator (a
  // fresh para/box/quote/heading) re-points it via takeFor before any row
  // could reach a drainPage() call.
  const flushPara = () => { if (para) { blocks.push({ t: 'p', text: para.text }); para = null; lastAppender = null; } };
  const flushBox = () => { if (box) { blocks.push({ t: 'box', text: box.text }); box = null; lastAppender = null; } };
  const flushQuote = () => { if (quote) { blocks.push({ t: 'quote', text: quote.text, cite: quote.cite }); quote = null; lastAppender = null; } };
  const flushHeading = () => {
    if (!heading) return;
    blocks.push({ t: heading.level, text: heading.text, num: heading.num });
    heading = null;
    lastAppender = null;
  };
  const flushAll = () => { flushHeading(); flushPara(); flushBox(); flushQuote(); };

  let prevPage = null;
  for (const l of body) {
    const { size, x, text, page } = l;

    if (page !== prevPage) {
      if (prevPage !== null) drainPage(prevPage);
      prevPage = page;
    }

    if (ORNAMENT.test(text)) { flushAll(); takeLine(page); continue; }

    // Chapter numeral, e.g. "I ." — plain Latin, safe to read straight off
    // pdf.js. Still consumes its own pdftotext line so the queue stays in
    // step for whatever block comes next.
    if (size >= SIZE.numeral - 0.3 && size < SIZE.section && /^[IVXLC]+\s*\.?$/i.test(text)) {
      flushAll();
      pendingNum = fromRoman(text);
      takeLine(page);
      continue;
    }

    // Chapter title (h2) or front-matter heading — both can wrap over two
    // lines that pdftotext has already joined into one.
    if (size >= SIZE.chapter - 0.5) {
      flushPara(); flushBox(); flushQuote();
      const level = size >= SIZE.frontHead - 0.3 ? 'front' : 'h2';
      if (heading && heading.level === level) {
        takeFor(heading, l);
      } else {
        flushHeading();
        heading = { level, num: pendingNum, text: '', _pages: new Set() };
        pendingNum = null;
        takeFor(heading, l);
      }
      continue;
    }

    // Section heading (h3), also wraps.
    if (Math.abs(size - SIZE.section) < 0.3) {
      flushPara(); flushBox(); flushQuote();
      if (heading && heading.level === 'h3') {
        takeFor(heading, l);
      } else {
        flushHeading();
        heading = { level: 'h3', num: null, text: '', _pages: new Set() };
        takeFor(heading, l);
      }
      continue;
    }
    flushHeading();

    // Pull-quote: indented, larger than body.
    if (Math.abs(size - SIZE.pull) < 0.3 && indented(x)) {
      flushPara(); flushBox();
      if (!quote) quote = { text: '', cite: null, _pages: new Set(), _citePages: new Set() };
      takeFor(quote, l);
      continue;
    }

    // Small indented type: an attribution if a quote is open, else an
    // explainer box. Two distinct sizes in this document (11 for boxes,
    // 10.5 for citations) where the English source uses one (10.5 for both)
    // — the quote-open check disambiguates regardless of which fires.
    if ((Math.abs(size - SIZE.boxSmall) < 0.4 || Math.abs(size - SIZE.citeSmall) < 0.4) && indented(x)) {
      flushPara();
      if (quote) {
        const q = quote;
        lastAppender = (extra) => { q.cite = (q.cite ? `${q.cite} ` : '') + extra.replace(/^[—–-]\s*/, ''); };
        lastAppenderPage = page;
        if (!quote._citePages.has(page)) {
          quote._citePages.add(page);
          const t = takeLine(page);
          if (t) quote.cite = (quote.cite ? `${quote.cite} ` : '') + t.replace(/^[—–-]\s*/, '');
        }
        continue;
      }
      if (!box) box = newAcc();
      takeFor(box, l);
      continue;
    }

    // Body copy.
    if (Math.abs(size - SIZE.body) < 0.4 && !indented(x)) {
      flushBox(); flushQuote();
      if (para) {
        const sameCol = Math.abs(para.y - l.y);
        const newPage = page !== para.page;
        const ended = ENDS_SENTENCE.test(para.text);
        if (newPage ? ended : sameCol > PARA_GAP) {
          flushPara();
          para = { ...newAcc(), page, y: l.y };
          takeFor(para, l);
        } else {
          takeFor(para, l);
          para.page = page;
          para.y = l.y;
        }
      } else {
        para = { ...newAcc(), page, y: l.y };
        takeFor(para, l);
      }
      continue;
    }

    flushAll();
  }
  if (prevPage !== null) drainPage(prevPage);
  flushAll();

  /* ---- render ---- */
  const toc = [];
  let prologue = '';
  let prologueTitle = null;
  let sources = null;
  let html = '';
  let mode = 'front';
  let sectionNo = 0;
  let inSources = false;

  const render = (b) => {
    switch (b.t) {
      case 'p': return `<p>${esc(b.text)}</p>`;
      case 'h3': return `<h3 class="w-h3">${esc(b.text)}</h3>`;
      case 'box':
        return `<div class="w-box w-box--key"><span class="w-box-label">सीधे शब्दों में</span><p>${esc(b.text)}</p></div>`;
      case 'quote':
        return b.cite
          ? `<div class="w-box w-box--quote"><span class="w-box-label">उन्हीं के शब्दों में</span><p>${esc(b.text)}</p><p class="w-sign">— ${esc(b.cite)}</p></div>`
          : `<div class="w-pullquote">${esc(b.text)}</div>`;
      default: return '';
    }
  };

  for (const b of blocks) {
    if (b.t === 'front') {
      mode = 'front';
      if (!prologueTitle) prologueTitle = b.text;
      else prologue += `<h3 class="w-h3">${esc(b.text)}</h3>`;
      continue;
    }

    if (b.t === 'h2') {
      inSources = /स्रोत/.test(b.text);
      if (inSources) { mode = 'sources'; continue; }
      mode = 'body';
      sectionNo += 1;
      const englishEntry = englishPart.toc[sectionNo - 1];
      const num = englishEntry ? englishEntry.num : String(b.num ?? sectionNo);
      const id = englishEntry ? englishEntry.id : `fg${index + 1}-${sectionNo}-hi`;
      toc.push({ id, num, text: b.text });
      html += `<h2 class="w-h2" id="${id}"><span class="w-num">${num}</span>${esc(b.text)}</h2>`;
      continue;
    }

    const out = render(b);
    if (mode === 'front') prologue += out;
    else if (mode === 'sources') sources = (sources ?? '') + out;
    else html += out;
  }

  const strip = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const firstPara = blocks.find((b, i) => b.t === 'p' && blocks.slice(0, i).some((x) => x.t === 'h2'));
  const lead = firstPara ? cleanupSpacing(firstPara.text.replace(/\s+/g, ' ').slice(0, 260)) : '';

  const finish = (s) => (s ? dropEmptyTags(cleanupSpacing(s)) : s);
  const title = cleanupSpacing(meta.title);
  const finishedPrologue = finish(prologue) || null;
  const finishedHtml = finish(html);

  // Matches the sitewide convention (see validate-hindi-writing.mjs): word
  // count is title + lead + prologue + html — everything a reader's eyes
  // pass over, not just the chaptered prose — computed after cleanup so it
  // agrees with what actually ships.
  const words = strip(
    [title, lead, finishedPrologue, finishedHtml].filter(Boolean).join(' ')
  ).split(/\s+/).filter(Boolean).length;

  return {
    n: index + 1,
    label: meta.label,
    title,
    lead,
    words,
    minutes: Math.max(1, Math.round(words / 180)),
    toc: toc.map((t) => ({ ...t, text: cleanupSpacing(t.text) })),
    prologue: finishedPrologue,
    prologueTitle: prologueTitle ? cleanupSpacing(prologueTitle) : null,
    prologueTag: null,
    html: finishedHtml,
    sources: finish(sources) || null,
  };
}

const parts = chunks.map((c, i) => buildPart(c, i));

parts.forEach((p) =>
  console.log(`part ${p.n}  ${String(p.words).padStart(6)} words  ${String(p.toc.length).padStart(2)} sections  ${p.sources ? 'sources' : '       '}  — ${p.title.slice(0, 40)}`)
);

const total = parts.reduce((a, p) => a + p.words, 0);

mkdirSync('src/data/writing', { recursive: true });
writeFileSync(
  OUT,
  `/* ============================================================
   भूले-बिसरे देवता (THE FORGOTTEN GODS — HINDI EDITION)
   Generated by scripts/import-forgotten-gods-hi.mjs from the authored
   PDF. Do not hand-edit: re-run the importer instead.

   ${parts.length} parts · ${total.toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`
);

console.log(`\n✓ ${OUT} — ${parts.length} parts, ${total.toLocaleString('en-IN')} words`);
