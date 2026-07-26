/**
 * import-forgotten-gods.mjs — one-shot content importer.
 *
 * Unlike the Kissan Andolan series, no HTML source for this piece survives —
 * only the rendered PDF. So this reads "Forgotten Gods English - Simplified.pdf"
 * directly, recovering structure from the typography: font size tells a chapter
 * title from a section heading from body copy, x-offset tells an indented
 * explainer box from a paragraph, and the gap between baselines tells where one
 * paragraph ends and the next begins.
 *
 * Emits src/data/writing/forgotten-gods.js in the same shape as the Kissan
 * importer, so the reader renders both through the identical Prose vocabulary.
 *
 * Requires pdfjs-dist, which is local-only (like resvg for the OG cards) —
 * CI never runs this, the generated data file is committed:
 *
 *     npm i --no-save pdfjs-dist
 *     node scripts/import-forgotten-gods.mjs "<path to the PDF>"
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = process.argv[2]
  ?? 'C:/Users/rajpa/Downloads/Forgotten Gods English - Simplified.pdf';
const OUT = 'src/data/writing/forgotten-gods.js';

/* Typography → meaning. Measured from the document; see the header note. */
const SIZE = {
  bookTitle: 32,   // part cover ("THE FORGOTTEN GODS")
  frontHead: 22,   // "A Note From the Author", "Contents"
  chapter: 21,     // chapter title  → h2
  epigraph: 14,    // the opening quotation
  section: 14.5,   // section heading → h3
  numeral: 13,     // chapter numeral ("I .") and cover subtitles
  body: 12,        // body copy, and the pull-quote at 12.5
  pull: 12.5,
  small: 10.5,     // explainer boxes and quote attributions
};

// Body copy sits at x≈57 in three of the four parts and x≈113 in the third —
// they were produced separately and merged, with different margins. So the text
// column is measured per part and "indented" is judged relative to it, never
// against a fixed number.
const INDENT = 8;         // >bodyX+8 means an explainer box or pull-quote
const PARA_GAP = 27;      // >27pt between baselines starts a new paragraph
const ORNAMENT = /^[—–-]\s*[◆◇•]\s*[—–-]$/;

/** Cover copy carries the part's identity; the PDF has no other label for it. */
const PARTS = [
  { label: 'Europe', title: 'How Europe Traded a Thousand Living Spirits for One Distant King in the Sky' },
  { label: 'India', title: 'The Land That Would Not Bend' },
  { label: 'Colonial India', title: 'The Company That Ate a Country' },
  { label: 'East Asia', title: 'The Civilisations That Did Not Bend' },
];

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);

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

/* ---------------- read the PDF into positioned lines ---------------- */

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
      const text = items.map((i) => i.str).join('').replace(/\s+/g, ' ').trim();
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

/* ---------------- split into parts at each cover page ---------------- */

const partStarts = lines
  .filter((l) => l.size >= SIZE.bookTitle && /FORGOTTEN GODS/i.test(l.text))
  .map((l) => l.page);

const chunks = partStarts.map((start, i) => {
  const end = partStarts[i + 1] ?? Infinity;
  return lines.filter((l) => l.page >= start && l.page < end);
});

/* ---------------- turn one part's lines into HTML ---------------- */

function buildPart(chunk, index) {
  const meta = PARTS[index];

  // Drop the cover page and the generated Contents page — the site renders its
  // own contents rail from the headings, so an inline copy is just duplication.
  const coverPage = chunk[0].page;
  let body = chunk.filter((l) => l.page !== coverPage);

  const contentsHead = body.find((l) => l.size >= SIZE.frontHead && /^contents/i.test(l.text));
  if (contentsHead) {
    const nextChapter = body.find((l) => l.page > contentsHead.page && l.size >= SIZE.chapter - 0.5);
    body = body.filter((l) => !(l.page >= contentsHead.page && (!nextChapter || l.page < nextChapter.page)));
  }

  // The text column = the most common x among body-size lines in this part.
  const xTally = {};
  body.forEach((l) => {
    if (Math.abs(l.size - SIZE.body) < 0.4) xTally[l.x] = (xTally[l.x] || 0) + 1;
  });
  const bodyX = Number(Object.entries(xTally).sort((a, b) => b[1] - a[1])[0][0]);
  const indented = (x) => x > bodyX + INDENT;

  const blocks = [];
  let para = null;      // open body paragraph
  let box = null;       // open explainer box
  let quote = null;     // open pull-quote
  let heading = null;   // open multi-line heading
  let pendingNum = null;

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
    const { size, x, text } = l;

    if (ORNAMENT.test(text) || /^by$/i.test(text) || /^L\s*O\s*V\s*E\s*P\s*R\s*E/i.test(text)) {
      flushAll();
      continue;
    }
    if (/^—\s*Part\s+\w+\s*—$/i.test(text)) { flushAll(); continue; }

    // Chapter numeral, e.g. "I ." — becomes the section's number plate.
    if (size >= SIZE.numeral - 0.2 && size < SIZE.section && /^[IVXLC]+\s*\.?$/i.test(text)) {
      flushAll();
      pendingNum = fromRoman(text);
      continue;
    }

    // Chapter title (h2) or front-matter heading — both can wrap over two lines.
    if (size >= SIZE.chapter - 0.5) {
      flushPara(); flushBox(); flushQuote();
      const level = size >= SIZE.frontHead ? 'front' : 'h2';
      if (heading && heading.level === level) heading.text += ' ' + text;
      else { flushHeading(); heading = { level, text, num: pendingNum }; pendingNum = null; }
      continue;
    }

    // Section heading (h3), also wraps.
    if (Math.abs(size - SIZE.section) < 0.3) {
      flushPara(); flushBox(); flushQuote();
      if (heading && heading.level === 'h3') heading.text += ' ' + text;
      else { flushHeading(); heading = { level: 'h3', text, num: null }; }
      continue;
    }
    flushHeading();

    // Epigraph / pull-quote: indented, slightly larger than body.
    if (Math.abs(size - SIZE.epigraph) < 0.3 || (Math.abs(size - SIZE.pull) < 0.3 && indented(x))) {
      flushPara(); flushBox();
      if (quote) quote.text += ' ' + text;
      else quote = { text, cite: null };
      continue;
    }

    // Small indented type: an attribution if a quote is open, else an explainer box.
    if (Math.abs(size - SIZE.small) < 0.4 && indented(x)) {
      flushPara();
      if (quote) {
        quote.cite = (quote.cite ? quote.cite + ' ' : '') + text.replace(/^[—–-]\s*/, '');
        continue;
      }
      if (box) box.text += ' ' + text;
      else box = { text };
      continue;
    }

    // Body copy.
    if (Math.abs(size - SIZE.body) < 0.4 && !indented(x)) {
      flushBox(); flushQuote();
      if (para) {
        const sameCol = Math.abs(para.y - l.y);
        const newPage = l.page !== para.page;
        // Across a page break, continue the sentence unless it clearly ended.
        const ended = /[.!?”"']\s*$/.test(para.text);
        if (newPage ? ended : sameCol > PARA_GAP) { flushPara(); para = { ...l }; }
        else { para.text += ' ' + text; para.y = l.y; para.page = l.page; }
      } else {
        para = { ...l };
      }
      continue;
    }

    flushAll();
  }
  flushAll();

  /* ---- render ---- */
  const toc = [];
  let prologue = '';
  let prologueTitle = null;   // the front matter names itself ("A Note Before We Continue")
  let sources = null;
  let html = '';
  let mode = 'front';          // front-matter until the first chapter
  let sectionNo = 0;
  let inSources = false;

  const render = (b) => {
    switch (b.t) {
      case 'p': return `<p>${esc(b.text)}</p>`;
      case 'h3': return `<h3 class="w-h3">${esc(b.text)}</h3>`;
      case 'box':
        return `<div class="w-box w-box--key"><span class="w-box-label">In plain words</span><p>${esc(b.text)}</p></div>`;
      case 'quote':
        return b.cite
          ? `<div class="w-box w-box--quote"><span class="w-box-label">In their words</span><p>${esc(b.text)}</p><p class="w-sign">— ${esc(b.cite)}</p></div>`
          : `<div class="w-pullquote">${esc(b.text)}</div>`;
      default: return '';
    }
  };

  for (const b of blocks) {
    if (b.t === 'front') {
      mode = 'front';
      // The first front-matter heading titles the whole prologue; the reader
      // renders it in its own header rather than inside the prose.
      if (!prologueTitle) prologueTitle = b.text;
      else prologue += `<h3 class="w-h3">${esc(b.text)}</h3>`;
      continue;
    }

    if (b.t === 'h2') {
      inSources = /sources|further reading/i.test(b.text);
      if (inSources) { mode = 'sources'; continue; }
      mode = 'body';
      sectionNo += 1;
      const num = b.num ?? sectionNo;
      const id = `fg${index + 1}-${num}-${slugify(b.text)}`;
      toc.push({ id, num: String(num), text: b.text });
      html += `<h2 class="w-h2" id="${id}"><span class="w-num">${num}</span>${esc(b.text)}</h2>`;
      continue;
    }

    const out = render(b);
    if (mode === 'front') prologue += out;
    else if (mode === 'sources') sources = (sources ?? '') + out;
    else html += out;
  }

  const strip = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = strip(html).split(/\s+/).filter(Boolean).length;

  // Standfirst: the opening paragraph of the part proper.
  const firstPara = blocks.find((b, i) => b.t === 'p' && blocks.slice(0, i).some((x) => x.t === 'h2'));
  const lead = firstPara ? firstPara.text.replace(/\s+/g, ' ').slice(0, 260) : '';

  return {
    n: index + 1,
    label: meta.label,
    title: meta.title,
    lead,
    words,
    minutes: Math.max(1, Math.round(words / 220)),
    toc,
    prologue: prologue || null,
    prologueTitle,
    prologueTag: null,
    html,
    sources,
  };
}

const parts = chunks.map(buildPart);

parts.forEach((p) =>
  console.log(`part ${p.n}  ${String(p.words).padStart(6)} words  ${String(p.toc.length).padStart(2)} sections  ${p.sources ? 'sources' : '       '}  — ${p.title.slice(0, 52)}`)
);

const total = parts.reduce((a, p) => a + p.words, 0);

mkdirSync('src/data/writing', { recursive: true });
writeFileSync(
  OUT,
  `/* ============================================================
   THE FORGOTTEN GODS
   Generated by scripts/import-forgotten-gods.mjs from the authored
   PDF. Do not hand-edit: re-run the importer instead.

   ${parts.length} parts · ${total.toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`
);

console.log(`\n✓ ${OUT} — ${parts.length} parts, ${total.toLocaleString('en-IN')} words`);
