/**
 * import-forgotten-gods-hi.mjs — Hindi edition importer for The Forgotten Gods.
 *
 * Same idea as import-forgotten-gods.mjs (structure recovered from typography:
 * font size tells a heading from a paragraph, x-offset tells an indented box
 * from body copy), but reading the PDF with mupdf rather than pdf.js.
 *
 * pdf.js's own text extraction is flatly wrong for this document's
 * Devanagari — confirmed by inspecting raw codepoints straight out of the
 * content stream, not an artifact of any script: a pre-base vowel sign is
 * drawn (and therefore extracted) before the consonant it belongs to
 * ("बिसरे" comes out "िबसरे"), and some common glyph clusters ("में", and
 * apparently many more — a scan turned up 119 distinct broken contexts)
 * carry a broken ToUnicode entry and extract as a control character,
 * losing the character outright. poppler/xpdf's pdftotext recovers the
 * characters correctly but, on this specific justified PDF, occasionally
 * mistakes the extra stretch around a matra for a real word-space —
 * "कुछ" becomes "कु छ" — with no reliable way to undo it that doesn't risk
 * merging two words that were genuinely separate.
 *
 * mupdf turns out to get both of those right: correct character order,
 * and — because it reads real spaces off the content stream (either their
 * own glyph or literal spaces embedded in a run) rather than inferring
 * them from inter-glyph distance — no phantom mid-word spaces either. Its
 * one defect is the same underlying font problem showing up a third way:
 * the trailing matra(s) of certain glyph clusters get reported twice
 * ("क्यों" → "क्योंों", "बड़ा" → "बड़ाा"). That is a narrow, mechanical
 * pattern — an immediately-repeated run of 1-3 Devanagari characters that
 * includes at least one vowel sign/virama/anusvara, which Hindi
 * orthography never produces legitimately — so DEDUPE_RE below collapses
 * it safely everywhere, not just at word boundaries.
 *
 * A translated edition can't slugify its own anchor ids — Devanagari
 * strips to nothing under the English slugifier — so section ids are
 * borrowed from the English edition by position (1st H2 in Hindi part N
 * ↔ 1st toc entry in English part N, and so on). That is also what keeps
 * the language switch on an article landing on the same section it left.
 *
 *     node scripts/import-forgotten-gods-hi.mjs "<path to the Hindi PDF>"
 */
import * as mupdf from 'mupdf';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const SRC = process.argv[2]
  ?? 'C:/Users/rajpa/Downloads/Forgotten Gods Hindi - Simplified.pdf';
const OUT = 'src/data/writing/forgotten-gods-hi.js';

const englishModule = await import(pathToFileURL(resolve('src/data/writing/forgotten-gods.js')).href);
const english = englishModule.default;

/* Typography → meaning, as reported by mupdf (rounder, coarser buckets
   than pdf.js's raw glyph-transform scale — e.g. box text and its
   citation, 11pt and 10.5pt in the English PDF, both read as 10pt here).
   Measured from this document; distinct from the English SIZE map, which
   was measured off a differently-typeset PDF. */
const SIZE = {
  bookTitle: 29,  // part cover (title contains "देवता") — threshold, not exact
  headBig: 20.5,  // front-matter note/TOC heading AND chapter title — both
                   // 21pt here (the English PDF's 22pt/21pt split doesn't
                   // survive into this one); which is which is decided by
                   // position, not size — see buildPart.
  section: 13,    // h3 — also the size of the stripped-out cover epigraph,
                   // but that page never reaches `body` (see buildPart)
  body: 11.5,     // body copy: 12pt in Part 1's long author's note, 11pt in
                   // Parts 2-4's shorter transitional notes and nowhere
                   // else — 0.75 tolerance below catches both
  boxOrCite: 10,  // explainer boxes and quote citations share one size;
                   // the quote-open check (same as the English importer)
                   // tells them apart regardless
};

const INDENT = 8;
// Measured off this document's mupdf bbox.y (top-down, unlike pdf.js's
// baseline-up y): a same-paragraph line-to-line gap is ~22-24pt, a genuine
// paragraph break is ~30-43pt. Bullet-list items sit closer together than
// that but still wider than a wrapped line, ~28-29pt — inside a normal
// paragraph's gap but outside a normal wrapped-line's, so 30 sits above
// every bullet-to-bullet gap actually measured while still catching every
// real paragraph break.
const PARA_GAP = 30;
const ORNAMENT = /^[—–-]\s*[◆◇•]\s*[—–-]$/;
const ENDS_SENTENCE = /[.!?।॥”"'’]\s*$/;

/** Hindi orthography has no legitimate reason to repeat 1-3 characters
    back to back when at least one of them is a dependent vowel sign,
    virama, anusvara, candrabindu or visarga — so wherever this fires, it
    is mupdf's duplication defect, not real text. See the header note. */
const DEDUPE_RE = /([\u093E-\u094D\u0951-\u0952\u0902\u0903\u0901]{1,3})\1/gu;

/** A wider net \u2014 consonant *plus* vowel sign, immediately repeated \u2014
    would also catch this defect (verified: it fixes "\u092B\u0947\u0902\u0915\u0947" from
    "\u092B\u0947\u0902\u0915\u0947\u0915\u0947"), but it isn't safe in general: "\u092B\u093C\u094D\u0930\u093E\u0902\u0938\u0940\u0938\u0940" legitimately
    ends in "\u0938\u0940\u0938\u0940" (two real syllables, \u0938\u094D+\u0940 twice), and a document-wide
    scan turned up twenty-plus other genuine words built the same way
    (\u0935\u093F\u0936\u094D\u0935\u0935\u093F\u0926\u094D\u092F\u093E\u0932\u092F, \u092A\u0941\u0930\u093E\u0924\u0924\u094D\u0935, \u0928\u094D\u092F\u093E\u092F\u093E\u0932\u092F, \u0905\u092A\u0928\u093E\u0928\u093E\u2026). "\u0928\u0947" is the one
    exception \u2014 every "\u0928\u0947\u0928\u0947" in this document (161 of them, all traced)
    is the same postposition/verb-ending duplicated, never two genuine
    words butted together with no space between \u2014 so it alone is safe to
    collapse unconditionally; "\u0915\u0947" gets the same narrow treatment for the
    one confirmed instance ("\u092B\u0947\u0902\u0915\u0947\u0915\u0947"). Broader classes go through
    DEDUPE_RE above, which never touches a bare consonant and so never
    risks this. */
const NARROW_DEDUPE_RE = /(\u0928\u0947|\u0915\u0947)\1/gu; // \u0928\u0947 | \u0915\u0947, doubled

const dedupe = (s) => {
  let prev;
  let out = s;
  do {
    prev = out;
    out = out.replace(DEDUPE_RE, '$1').replace(NARROW_DEDUPE_RE, '$1');
  } while (out !== prev);
  return out;
};

/** Cover copy carries the part's identity; lifted verbatim from each
    part's cover page (plain paragraph text, not glyph-cluster-heavy, and
    mupdf's own extraction is trustworthy here regardless). */
const PARTS = [
  { label: 'यूरोप', title: 'यूरोप ने हज़ार जीती-जागती रूहों को आसमान में बैठे एक दूर के राजा के बदले कैसे दे दिया' },
  { label: 'भारत', title: 'वह धरती जो झुकी नहीं' },
  { label: 'औपनिवेशिक भारत', title: 'वह कंपनी जो एक पूरे देश को निगल गई' },
  { label: 'पूर्वी एशिया', title: 'वे सभ्यताएँ जो नहीं झुकीं' },
];

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A space can never legitimately precede Hindi sentence punctuation — a
    cheap, safe defensive pass in case any slips through. */
const cleanupSpacing = (s) => (s || '').replace(/ +([।॥,.!?)])/g, '$1');

// h2 is excluded deliberately — it carries the id a TOC entry and the
// language switch both anchor to, and this book's chapter titles are
// never genuinely empty, so there is nothing to protect against there.
const dropEmptyTags = (s) => (s || '').replace(/<(h3|p)(?:\s[^>]*)?>\s*<\/\1>/g, '');

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

/* ---------------- read the PDF into positioned, deduplicated rows ---------------- */

const doc = mupdf.Document.openDocument(new Uint8Array(readFileSync(SRC)), 'application/pdf');
const lines = [];

for (let p = 0; p < doc.countPages(); p++) {
  const page = doc.loadPage(p);
  const structured = JSON.parse(page.toStructuredText('preserve-whitespace').asJSON());

  // Flatten every block's lines into one bag first — mupdf's block order
  // is content-stream order, not visual order, and a bulleted list on this
  // PDF comes back with its bullet glyphs and item text as separate blocks
  // that land well out of sequence (verified: a run of six list items
  // surfaced *after* the paragraph that visually follows them). Grouping
  // by y across the whole page, then sorting groups top-to-bottom, fixes
  // both that and mupdf's separate habit of splitting one visual line into
  // two "lines" at the same y (a mid-word wrap artifact) — a bullet glyph
  // and its item text are exactly such a same-y pair, just from different
  // blocks instead of the same one.
  const flat = [];
  for (const block of structured.blocks) {
    if (block.type !== 'text') continue;
    for (const ln of block.lines) flat.push(ln);
  }

  const byY = new Map();
  for (const ln of flat) {
    const y = Math.round(ln.bbox.y);
    const key = [...byY.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
    if (!byY.has(key)) byY.set(key, []);
    byY.get(key).push(ln);
  }

  const rows = [...byY.entries()].sort((a, b) => a[0] - b[0]);
  for (const [y, group] of rows) {
    group.sort((a, b) => a.bbox.x - b.bbox.x);
    const text = dedupe(group.map((ln) => ln.text).join('')).trim();
    if (!text) continue;
    lines.push({
      page: p + 1,
      y,
      x: Math.round(group[0].bbox.x),
      size: Math.round(group[0].font.size * 10) / 10,
      bold: group[0].font.weight === 'bold',
      text,
    });
  }
}

/* ---------------- split into parts at each cover page ---------------- */

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

  // Colophon lines: a standalone "लवप्रीत सिंह" signature sits on its own
  // page in two places per part (between the note and the contents, and
  // again as a closing mark at the part's end), and the closing page also
  // carries a one-line "खंड X समाप्त…" / "किताब समाप्त" sign-off. All of
  // it is body-sized but center-indented (~x265-269 against a ~56 margin)
  // — far past even a box's or quote's indent — so it's cover-adjacent
  // matter, not prose, and never appears anywhere in the English edition's
  // own output (its tighter, hand-tuned size thresholds happened to
  // exclude it as a side effect; this document's wider body-size range,
  // needed to cover both Part 1's 12pt note and Parts 2-4's 11pt one,
  // does not get that side effect for free).
  const isColophon = (l) => l.x > 200 && /^(लवप्रीत सिंह|\d{4})$/.test(l.text.trim());
  body = body.filter((l) => !isColophon(l) && !/समाप्त/.test(l.text));

  // Contents heading = the 2nd big/bold heading in the part (the 1st is
  // the author's note / transitional note); matched by position since
  // both it and the chapter titles share one font size here.
  const bigHeads = body.filter((l) => l.size >= SIZE.headBig && l.bold);
  const contentsHead = bigHeads[1];
  if (contentsHead) {
    const nextChapter = body.find((l) => l.page > contentsHead.page && l.size >= SIZE.headBig && l.bold);
    body = body.filter((l) => !(l.page >= contentsHead.page && (!nextChapter || l.page < nextChapter.page)));
  }

  const xTally = {};
  body.forEach((l) => {
    if (Math.abs(l.size - SIZE.body) < 0.75 && !l.bold) xTally[l.x] = (xTally[l.x] || 0) + 1;
  });
  const bodyX = Number(Object.entries(xTally).sort((a, b) => b[1] - a[1])[0][0]);
  // Capped on the far side: a box/quote's own indent never runs past
  // roughly +100 from the margin in this document. A handful of short
  // closing reflections (one per part, present in this Hindi edition
  // without an English counterpart to check against) sit further right
  // still — apparently centered rather than left-indented — and those are
  // ordinary paragraphs, not quotes; leaving the range open-ended would
  // catch them as quotes instead.
  const indented = (x) => x > bodyX + INDENT && x < bodyX + 100;

  const blocks = [];
  let para = null, box = null, quote = null, heading = null, pendingNum = null;
  let seenFirstNumeral = false;

  const flushPara = () => { if (para) { blocks.push({ t: 'p', text: para.text }); para = null; } };
  const flushBox = () => { if (box) { blocks.push({ t: 'box', text: box.text }); box = null; } };
  const flushQuote = () => { if (quote) { blocks.push({ t: 'quote', text: quote.text, cite: quote.cite }); quote = null; } };
  const flushHeading = () => {
    if (!heading) return;
    blocks.push({ t: heading.level, text: heading.text, num: heading.num });
    heading = null;
  };
  const flushAll = () => { flushHeading(); flushPara(); flushBox(); flushQuote(); };

  for (const l of body) {
    const { size, x, text, page } = l;

    if (ORNAMENT.test(text)) { flushAll(); continue; }

    // Chapter numeral, e.g. "I." — the only thing at body size that is
    // ever *only* a roman numeral, so safe to key off regardless of the
    // size collision with body text.
    if (l.bold && size <= SIZE.body + 1 && /^[IVXLC]+\.?$/i.test(text)) {
      flushAll();
      pendingNum = fromRoman(text);
      seenFirstNumeral = true;
      continue;
    }

    // Chapter title (h2) or front-matter heading — same size and weight
    // here, told apart by whether the first numeral has appeared yet.
    if (size >= SIZE.headBig && l.bold) {
      flushPara(); flushBox(); flushQuote();
      const level = seenFirstNumeral ? 'h2' : 'front';
      if (heading && heading.level === level) {
        heading.text += ` ${text}`;
      } else {
        flushHeading();
        heading = { level, num: pendingNum, text };
        pendingNum = null;
      }
      continue;
    }

    // Section heading (h3), also wraps.
    if (Math.abs(size - SIZE.section) < 0.4 && l.bold) {
      flushPara(); flushBox(); flushQuote();
      if (heading && heading.level === 'h3') {
        heading.text += ` ${text}`;
      } else {
        flushHeading();
        heading = { level: 'h3', num: null, text };
      }
      continue;
    }
    flushHeading();

    // Small indented type: an attribution if a quote is open, else an
    // explainer box.
    if (Math.abs(size - SIZE.boxOrCite) < 0.6 && indented(x)) {
      flushPara();
      if (quote) {
        quote.cite = (quote.cite ? `${quote.cite} ` : '') + text.replace(/^[—–-]\s*/, '');
        continue;
      }
      box = box ? { text: `${box.text} ${text}` } : { text };
      continue;
    }

    // Body-sized text: a pull-quote if indented, otherwise a paragraph —
    // except a bullet item's wrapped line is *also* indented (hanging
    // indent under the bullet glyph, ~x69-73 against a ~x56 margin, close
    // enough to a box's or quote's own indent that x alone can't tell
    // them apart). So: if a paragraph is already open and this row reads
    // as its natural continuation (small gap, not a fresh page-and-ended
    // situation), continue it regardless of x — indentation only decides
    // between starting a new quote and starting a new paragraph, never
    // interrupts one already in progress.
    if (Math.abs(size - SIZE.body) < 0.75) {
      if (para) {
        const sameCol = Math.abs(para.y - l.y);
        const newPage = page !== para.page;
        const ended = ENDS_SENTENCE.test(para.text);
        const continues = newPage ? !ended : sameCol <= PARA_GAP;
        if (continues) {
          para.text += ` ${text}`;
          para.page = page;
          para.y = l.y;
          continue;
        }
      }

      if (indented(x)) {
        flushPara(); flushBox();
        quote = quote ? { ...quote, text: `${quote.text} ${text}` } : { text, cite: null };
        continue;
      }

      flushBox(); flushQuote(); flushPara();
      para = { text, page, y: l.y };
      continue;
    }

    flushAll();
  }
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

  // Matches the sitewide convention (see validate-forgotten-gods-hindi.mjs):
  // word count is title + lead + prologue + html, computed after cleanup so
  // it agrees with what actually ships.
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
