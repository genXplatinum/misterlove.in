/**
 * import-independence.mjs — one-shot content importer.
 *
 * Third piece, third source format. Like The Forgotten Gods this exists only as
 * PDFs, but it is a far more typeset book: numbered chapters, indented callout
 * boxes with letterspaced small-cap labels, verdict panels, pull-quotes with
 * attributions, bullet lists and real multi-column tables.
 *
 * Structure is recovered from typography — font size for the heading level,
 * x-offset for indented devices, and item-level x gaps within a line to rebuild
 * table columns (the reason this reads the PDF itself rather than reusing the
 * shared line extractor, which joins a whole row into one string).
 *
 * Reads the twelve per-part PDFs rather than the merged book: each is measured
 * independently, so a part typeset with different margins can't be misread.
 *
 * Emits src/data/writing/independence.js in the same shape as the other two
 * importers, so all three render through the identical Prose vocabulary.
 *
 *     npm i --no-save pdfjs-dist
 *     node scripts/import-independence.mjs "<folder of Part NN *.pdf>"
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/books/Independence';
const OUT = 'src/data/writing/independence.js';

/* Typography → meaning, measured from the documents. */
const S = {
  chapter: 17,     // chapter title            → h2
  section: 10,     // section heading          → h3
  lead: 10.8,      // chapter standfirst
  body: 10.5,      // body copy
  boxBody: 9.9,    // callout body
  boxLabel: 7.4,   // letterspaced callout label
  tableHead: 7.8,  // letterspaced table header
  tableCell: 9.2,
  front: 12.5,     // "AUTHOR'S NOTE", "WHAT IS INSIDE PART ONE"
  quote: 10,       // block quotation (indented, distinguished from h3 by x)
};

const BODY_X = 71;      // the text column
const INDENT = 8;       // beyond this is an indented device
const PARA_GAP = 17;    // baseline gap that starts a new paragraph
const RUNNING_HEAD = /^HOW INDIA BECAME FREE/i;

/** Callout label → the tone it maps onto in Prose.css. Matched against the
    collapsed, space-free form, since letterspacing makes word breaks unreliable;
    the clean label shown to the reader comes from this table, not the PDF. */
const BOX_TONE = [
  [/SIMPLESTWORDS|INPLAIN/, 'simple', 'In the simplest words'],
  [/^VERDICT/, 'answer', 'Verdict'],
  [/COUNTERPOINT|OTHERSIDE/, 'weigh', 'The honest counterpoint'],
  [/CAUTION/, 'worry', 'A word of caution'],
  [/COMINGNEXT|WHATSNEXT/, 'aim', 'Coming next'],
  [/PEOPLESAY|THECLAIM/, 'arg', 'What people say'],
  [/WHYTHENAME|POLITICALFIGHT/, 'key', 'Why even the name is contested'],
];

/**
 * The PDF drops the space either side of a styled run, so bold and italic
 * phrases weld themselves to their neighbours ("roughly24 percentof",
 * "isFALSE", "emperorBahadur"). Repair the unambiguous cases only, and keep
 * the forms that legitimately mix cases or digits.
 */
const CAMEL_KEEP = { 'You Tube': 'YouTube', 'Whats App': 'WhatsApp', 'I NA': 'INA', 'M Ps': 'MPs' };

function repair(s) {
  let out = s
    .replace(/([a-z,;.])(\d)/g, '$1 $2')        // "in1858" → "in 1858"
    .replace(/(\d)([a-z]{2,})/g, '$1 $2')       // "1859only" → "1859 only"; "1940s" untouched
    .replace(/([a-z])([A-Z])/g, '$1 $2');       // "isFALSE" → "is FALSE"
  for (const [broken, fixed] of Object.entries(CAMEL_KEEP)) out = out.split(broken).join(fixed);
  return out.replace(/\s{2,}/g, ' ');
}

const esc = (s) => repair(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);

/* ---- Decoding letterspaced small caps -------------------------------------
   The typesetter tracks these labels out by putting a space after every
   letter — and then drops that space at a word boundary. So
   "I NT H ES I M P L E S TW O R D S" is "IN THE SIMPLEST WORDS": the word
   breaks are exactly where two letters sit adjacent. A few labels lose that
   signal entirely (every letter spaced), so those fall back to a greedy split
   against the small closed vocabulary these headings actually use. */
/* The dictionary is built from the book's own body text (see buildLexicon),
   so the splitter knows exactly the words these headings use — including
   names like "Jinnah" and "Khilafat" no general word list would carry. */
const LEXICON = new Set([
  'a', 'i', 'is', 'it', 'in', 'to', 'of', 'on', 'or', 'as', 'at', 'by', 'and', 'the',
  'no', 'not', 'was', 'but', 'for', 'its', 'his', 'her', 'one', 'two', 'all', 'any',
  'true', 'false', 'half', 'mostly', 'misleading', 'still', 'debated', 'unproven',
  'verdict', 'year', 'event', 'leader', 'where', 'community', 'evidence', 'group',
  'share', 'word', 'words', 'means', 'meant', 'shows', 'roughly', 'who', 'what',
  'both', 'sides', 'side', 'usually', 'important', 'missed', 'correction',
  'documented', 'stated', 'young', 'life', 'description', 'structural', 'turning',
  'point', 'genuine', 'achievement', 'permanent', 'damage', 'over', 'under',
  // The chapter kickers ("CHAPTER SEVEN") depend on these being splittable.
  'chapter', 'closing', 'one', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve',
]);

/**
 * Split a run-together string into words, choosing the segmentation that
 * prefers longer dictionary words (length², so "important" beats "import"+"ant").
 * Unknown runs are kept whole rather than shredded.
 */
function vocabSplit(s) {
  const n = s.length;
  const lower = s.toLowerCase();
  const best = Array.from({ length: n + 1 }, () => null);
  best[0] = { score: 0, from: -1, word: '' };

  for (let i = 0; i < n; i++) {
    if (!best[i]) continue;
    for (let j = i + 1; j <= n; j++) {
      const w = lower.slice(i, j);
      // Accept regular inflections of a known stem, so a word the dictionary
      // saw only in the singular still segments in the plural.
      const known = LEXICON.has(w)
        || (w.length > 3 && /(s|ed|ly|ing)$/.test(w) && LEXICON.has(w.replace(/(s|ed|ly|ing)$/, '')));
      // Unknown segments are allowed but scored badly, so they only win when
      // nothing else fits.
      const score = best[i].score + (known ? w.length * w.length : -w.length);
      if (!best[j] || score > best[j].score) best[j] = { score, from: i, word: s.slice(i, j) };
    }
  }

  const out = [];
  for (let i = n; i > 0; i = best[i].from) out.unshift(best[i].word);
  return out.join(' ');
}

/** Small-caps splits a word after its first letter: "N OTE" → "NOTE". */
const mergeSmallCaps = (s) => s.replace(/\b([B-HJ-Z])\s([A-Z]{2,})\b/g, '$1$2');

function unspace(raw) {
  const t = raw.trim();
  const letters = t.replace(/\s/g, '');
  if (letters.length < 2) return t;
  // Letterspaced text is mostly spaces; ordinary text is not.
  if ((t.length - letters.length) / letters.length < 0.5) {
    return mergeSmallCaps(t.replace(/\s{2,}/g, ' '));
  }

  // The typesetter's own word breaks (a missing space between two letters) look
  // usable but are not: small-cap ligature runs like "Rta" in "IMPORTANT" fake
  // a break mid-word, and once the string is fragmented the dictionary can no
  // longer repair it. So drop every space and resegment the whole run, keeping
  // punctuation as natural boundaries.
  return letters
    .split(/([^A-Za-z0-9]+)/)
    .map((seg) => (/[A-Za-z]/.test(seg) ? vocabSplit(seg) : seg))
    .join(' ')
    .replace(/\s*([,;:.!?])\s*/g, '$1 ')
    .replace(/\s*([“"'’])\s*/g, ' $1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Collapsed, space-free form — what tone/verdict matching runs against. */
const flat = (s) => s.replace(/[\s.,]/g, '').toUpperCase();

const titleCase = (s) =>
  s.toLowerCase().replace(/(^|[\s(“"-])([a-z])/g, (_, a, b) => a + b.toUpperCase());

const WORDS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9, TEN: 10, ELEVEN: 11, TWELVE: 12 };

/* ---------------- read one PDF, keeping item positions ---------------- */

async function readPdf(file) {
  const doc = await getDocument({ data: new Uint8Array(readFileSync(file)), useSystemFonts: true }).promise;
  const lines = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const rows = new Map();

    for (const it of (await page.getTextContent()).items) {
      if (!it.str.trim()) continue;
      const y = Math.round(it.transform[5]);
      const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push({
        x: it.transform[4],
        w: it.width ?? 0,
        str: it.str,
        size: Math.abs(it.transform[0]) || it.height || 0,
      });
    }

    [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([y, items]) => {
        items.sort((a, b) => a.x - b.x);

        // Split into cells wherever a horizontal gap opens up — this is what
        // makes table columns recoverable.
        const cells = [];
        let cur = { x: items[0].x, text: items[0].str };
        let end = items[0].x + items[0].w;
        for (const it of items.slice(1)) {
          if (it.x - end > 6) {
            cells.push({ x: Math.round(cur.x), text: cur.text.replace(/\s+/g, ' ').trim() });
            cur = { x: it.x, text: it.str };
          } else {
            cur.text += it.str;
          }
          end = it.x + it.w;
        }
        cells.push({ x: Math.round(cur.x), text: cur.text.replace(/\s+/g, ' ').trim() });

        const text = cells.map((c) => c.text).join(' ').replace(/\s+/g, ' ').trim();
        if (!text) return;

        lines.push({
          page: p,
          y,
          x: Math.round(items[0].x),
          size: Math.round(Math.max(...items.map((i) => i.size)) * 10) / 10,
          text,
          cells: cells.filter((c) => c.text),
        });
      });
  }
  return lines;
}

/* ---------------- build one part ---------------- */

function buildPart(lines, n, meta) {
  // Drop the cover page, running heads and folios.
  const body = lines.filter(
    (l) => l.page > 1 && !RUNNING_HEAD.test(l.text) && !/^\d{1,3}$/.test(l.text)
  );

  const blocks = [];
  let para = null, box = null, list = null, table = null, quote = null, heading = null;
  let kicker = null;

  const flushPara = () => { if (para) { blocks.push({ t: 'p', text: para.text }); para = null; } };
  const flushList = () => { if (list) { blocks.push({ t: 'ul', items: list }); list = null; } };
  const flushBox = () => { if (box) { blocks.push({ t: 'box', ...box }); box = null; } };
  const flushQuote = () => { if (quote) { blocks.push({ t: 'quote', ...quote }); quote = null; } };
  const flushTable = () => {
    if (table && table.rows.length) blocks.push({ t: 'table', ...table });
    table = null;
  };
  const flushHead = () => { if (heading) { blocks.push(heading); heading = null; } };
  const flushAll = () => { flushHead(); flushPara(); flushList(); flushBox(); flushQuote(); flushTable(); };

  /** Join a wrapped line, honouring the soft hyphen the typesetter emits. */
  const glue = (a, b) => (/[‐-]$/.test(a) ? a.replace(/[‐-]$/, '') + b : `${a} ${b}`);

  for (const l of body) {
    const { size, x, text, cells } = l;
    const indented = x > BODY_X + INDENT;

    // Letterspaced kicker above a chapter title. The tolerance is tight on
    // purpose: table headers are 7.8pt and would otherwise be read as kickers,
    // which silently swallows every table in the book.
    if (Math.abs(size - 8) < 0.15 && !indented) {
      flushAll();
      kicker = unspace(text);
      continue;
    }

    // Front-matter heading — names the prologue
    if (Math.abs(size - S.front) < 0.4) {
      flushAll();
      blocks.push({ t: 'front', text: titleCase(unspace(text)) });
      continue;
    }

    // Chapter title (h2), may wrap
    if (Math.abs(size - S.chapter) < 0.6) {
      flushPara(); flushList(); flushBox(); flushQuote(); flushTable();
      if (heading?.t === 'h2') heading.text = glue(heading.text, text);
      else { flushHead(); heading = { t: 'h2', text, kicker }; kicker = null; }
      continue;
    }

    // Table header (letterspaced, in the text column)
    if (Math.abs(size - S.tableHead) < 0.15 && !indented && cells.length >= 2) {
      flushPara(); flushList(); flushBox(); flushQuote(); flushTable();
      table = { head: cells.map((c) => titleCase(unspace(c.text))), cols: cells.map((c) => c.x), rows: [] };
      continue;
    }

    // Small type carries three different things: source bullets, the glossary
    // (a two-column table with no header row) and timeline table rows.
    if (Math.abs(size - S.tableCell) < 0.35) {
      if (/^[•·]/.test(text)) {
        flushPara(); flushBox(); flushQuote(); flushTable();
        (list ??= []).push(text.replace(/^[•·]\s*/, ''));
        continue;
      }
      if (list && indented && cells.length === 1) {
        list[list.length - 1] = glue(list[list.length - 1], text);
        continue;
      }

      // A headerless run of two-column rows is the word list — start a table
      // from the row's own column positions.
      if (!table && cells.length >= 2) {
        flushPara(); flushList(); flushBox(); flushQuote();
        table = { head: null, cols: cells.map((c) => c.x), rows: [] };
      }

      if (table) {
        const row = Array.from({ length: table.cols.length }, () => '');
        for (const c of cells) {
          let best = 0;
          table.cols.forEach((cx, i) => {
            if (Math.abs(c.x - cx) < Math.abs(c.x - table.cols[best])) best = i;
          });
          row[best] = row[best] ? glue(row[best], c.text) : c.text;
        }
        // A row that fills only a later column is the previous row wrapping.
        const last = table.rows[table.rows.length - 1];
        if (last && !row[0]) {
          row.forEach((v, i) => { if (v) last[i] = last[i] ? glue(last[i], v) : v; });
        } else {
          table.rows.push(row);
        }
        continue;
      }
    }
    if (table && Math.abs(size - S.tableCell) >= 0.35) flushTable();

    // Callout label (letterspaced, indented)
    if (Math.abs(size - S.boxLabel) < 0.3 && indented) {
      flushPara(); flushList(); flushQuote();
      const label = unspace(text);
      const code = flat(label);
      // The verdict result is set deeper than the label that introduces it.
      if (box && box.code.startsWith('VERDICT') && x > BODY_X + 20) { box.verdict = label; continue; }
      flushBox();
      const hit = BOX_TONE.find(([re]) => re.test(code));
      box = { code, tone: hit ? hit[1] : 'key', label: hit ? hit[2] : titleCase(label), text: '', verdict: null };
      continue;
    }

    // Callout body
    if (Math.abs(size - S.boxBody) < 0.3 && indented) {
      flushPara(); flushList();
      if (box) box.text = box.text ? glue(box.text, text) : text;
      else box = { rawLabel: '', tone: 'key', label: 'Note', text, verdict: null };
      continue;
    }

    // Block quotation (indented, body-ish size) and its attribution
    if (Math.abs(size - S.quote) < 0.35 && x > BODY_X + 25) {
      flushPara(); flushList(); flushBox();
      if (quote) quote.text = glue(quote.text, text);
      else quote = { text, cite: null };
      continue;
    }
    if (Math.abs(size - S.tableHead) < 0.3 && x > BODY_X + 25 && quote) {
      quote.cite = quote.cite ? glue(quote.cite, text) : text.replace(/^[—–-]\s*/, '');
      continue;
    }

    // Chapter standfirst
    if (Math.abs(size - S.lead) < 0.3) {
      flushList(); flushBox(); flushQuote();
      if (para?.lead) para.text = glue(para.text, text);
      else { flushPara(); para = { text, y: l.y, page: l.page, lead: true }; }
      continue;
    }

    // Bullet list
    if (Math.abs(size - S.body) < 0.35 && /^[•·]/.test(text)) {
      flushPara(); flushBox(); flushQuote();
      (list ??= []).push(text.replace(/^[•·]\s*/, ''));
      continue;
    }
    if (list && Math.abs(size - S.body) < 0.35 && indented) {
      list[list.length - 1] = glue(list[list.length - 1], text);
      continue;
    }

    // Section heading (h3) — same size as a quotation, told apart by x
    if (Math.abs(size - S.section) < 0.3 && !indented) {
      flushPara(); flushList(); flushBox(); flushQuote();
      if (heading?.t === 'h3') heading.text = glue(heading.text, text);
      else { flushHead(); heading = { t: 'h3', text }; }
      continue;
    }
    flushHead();

    // Body copy
    if (Math.abs(size - S.body) < 0.35 && !indented) {
      flushList(); flushBox(); flushQuote();
      if (para && !para.lead) {
        const gap = para.page === l.page ? para.y - l.y : 0;
        const ended = /[.!?”"’']\s*$/.test(para.text);
        if (para.page !== l.page ? ended : gap > PARA_GAP) { flushPara(); para = { text, y: l.y, page: l.page }; }
        else { para.text = glue(para.text, text); para.y = l.y; para.page = l.page; }
      } else {
        flushPara();
        para = { text, y: l.y, page: l.page };
      }
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
  let chapterNo = 0;

  const renderBox = (b) => {
    const label = esc(b.label);
    const verdict = b.verdict ? `<span class="w-big">${esc(titleCase(b.verdict))}</span>` : '';
    return `<div class="w-box w-box--${b.tone}"><span class="w-box-label">${label}</span>${verdict}<p>${esc(b.text)}</p></div>`;
  };

  const renderTable = (b) => {
    // The glossary has no header row of its own; name its columns so the
    // table still reads as one.
    const cols = b.head ?? ['Word', 'What it means'];
    const head = `<thead><tr>${cols.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>`;
    const rows = b.rows
      .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
      .join('');
    return `<figure class="w-figure"><div class="w-table-scroll"><table class="w-table">${head}<tbody>${rows}</tbody></table></div></figure>`;
  };

  const render = (b) => {
    switch (b.t) {
      case 'p': return `<p${b.lead ? ' class="w-lead"' : ''}>${esc(b.text)}</p>`;
      case 'h3': return `<h3 class="w-h3">${esc(b.text)}</h3>`;
      case 'ul': return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
      case 'box': return renderBox(b);
      case 'table': return renderTable(b);
      case 'quote':
        return b.cite
          ? `<div class="w-box w-box--quote"><span class="w-box-label">In their words</span><p>${esc(b.text)}</p><p class="w-sign">— ${esc(b.cite)}</p></div>`
          : `<div class="w-pullquote">${esc(b.text)}</div>`;
      default: return '';
    }
  };

  for (const b of blocks) {
    if (b.t === 'front') {
      // "What Is Inside Part One" is a contents page — the site builds its own.
      mode = /what is inside|contents/i.test(b.text) ? 'skip' : 'front';
      if (mode === 'front' && !prologueTitle) prologueTitle = b.text;
      continue;
    }

    if (b.t === 'h2') {
      const k = (b.kicker || '').toUpperCase();
      if (/^SOURCES|SOURCE LIST/.test(k) || /^sources/i.test(b.text)) { mode = 'sources'; continue; }
      mode = 'body';
      // Only the numbered chapters get a numeral; the front and closing
      // sections ("How To Read This Book", "Closing") are headings without one.
      // No \b: if the dictionary failed to split the kicker it arrives as
      // "CHAPTERSEVEN", and that is still a chapter.
      const isChapter = k.startsWith('CHAPTER');
      let num = null;
      if (isChapter) {
        chapterNo += 1;
        num = WORDS[k.replace(/^CHAPTER\s*/, '').trim()] ?? chapterNo;
      }
      const id = `in${n}-${num ?? slugify(k || 'sec')}-${slugify(b.text)}`;
      toc.push({ id, num: num === null ? null : String(num), text: b.text });
      html += `<h2 class="w-h2" id="${id}">`
        + (num === null ? '' : `<span class="w-num">${num}</span>`)
        + `${esc(b.text)}</h2>`;
      continue;
    }

    // Sources are introduced by a section heading, not a chapter title.
    if (b.t === 'h3' && /^sources\b|sources used/i.test(b.text)) { mode = 'sources'; continue; }

    if (mode === 'skip') continue;
    const out = render(b);
    if (mode === 'front') prologue += out;
    else if (mode === 'sources') sources = (sources ?? '') + out;
    else html += out;
  }

  const strip = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = strip(html).split(/\s+/).filter(Boolean).length;
  // The standfirst should come from the first real chapter — not from the
  // "How To Read This Book" preamble or the "Where Part One Left Us" recap
  // that opens the later parts, both of which sit before chapter one.
  const firstChapter = blocks.findIndex(
    (b) => b.t === 'h2' && (b.kicker ?? '').toUpperCase().startsWith('CHAPTER')
  );
  const after = firstChapter === -1 ? 0 : firstChapter;
  const leadBlock =
    blocks.find((b, i) => i > after && b.t === 'p' && b.lead)
    ?? blocks.find((b, i) => i > after && b.t === 'p');

  return {
    n,
    label: meta.label,
    title: meta.title,
    lead: leadBlock ? repair(leadBlock.text).replace(/\s+/g, ' ').slice(0, 260) : '',
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

/* ---------------- run ---------------- */

// Titles come from the author's own 00-BOOK-PLAN.md, not from the filenames.
const META = [
  { label: 'Before 1857', title: 'Before the Storm' },
  { label: 'The Two-Nation Idea', title: 'Where the Two-Nation Idea Was Born' },
  { label: 'Gandhi Arrives', title: 'Gandhi Arrives' },
  { label: 'The 1930s', title: 'Castes, Constitutions and Cracks' },
  { label: 'The Betrayal Charges', title: 'Bhagat Singh and Bose' },
  { label: 'The War Years', title: 'The War Years — Who Did What' },
  { label: 'The Big Claim', title: 'Did the War Give Us Freedom?' },
  { label: 'Partition', title: 'How Partition Actually Happened' },
  { label: 'The Leaders', title: 'What Each Leader Actually Believed' },
  { label: 'Two Countries', title: 'Why Pakistan Became Muslim-Only and India Did Not' },
  { label: 'Gandhi the Man', title: 'Gandhi the Man — Every Personal Charge' },
  { label: 'The Verdict', title: 'The Final Ledger' },
];

const files = readdirSync(SRC_DIR)
  .filter((f) => /^Part \d+.*\.pdf$/i.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

// Pass one: read every part and learn the book's vocabulary from its body
// copy, so the label decoder can resegment run-together small caps using the
// author's actual words rather than a generic word list.
const perPart = [];
for (const file of files) perPart.push(await readPdf(join(SRC_DIR, file)));

const freq = new Map();
for (const lines of perPart) {
  for (const l of lines) {
    if (Math.abs(l.size - S.body) > 0.35 && Math.abs(l.size - S.boxBody) > 0.35) continue;
    for (const raw of l.text.toLowerCase().match(/[a-z][a-z’']*/g) ?? []) {
      const w = raw.replace(/[’']/g, '');
      if (w.length >= 2) freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
}
// The PDFs occasionally emit two words run together ("Plasseywas less a battle").
// Those artifacts are near-unique, and if they enter the dictionary the
// length-squared scoring happily prefers them over the correct split. Requiring
// a few sightings keeps them out.
for (const [w, n] of freq) if (n >= 2) LEXICON.add(w);
console.log(`lexicon: ${LEXICON.size.toLocaleString('en-IN')} words learned from the text\n`);

// Pass two: build.
const parts = [];
for (const [i, lines] of perPart.entries()) {
  const part = buildPart(lines, i + 1, META[i]);
  parts.push(part);
  console.log(
    `part ${String(part.n).padStart(2)}  ${String(part.words).padStart(6)} words  ` +
    `${String(part.toc.length).padStart(2)} ch  ` +
    `${String((part.html.match(/w-box/g) || []).length).padStart(3)} box  ` +
    `${String((part.html.match(/<table/g) || []).length).padStart(2)} tbl  ` +
    `${part.sources ? 'src' : '   '}  — ${part.title.slice(0, 44)}`
  );
}

const total = parts.reduce((a, p) => a + p.words, 0);

mkdirSync('src/data/writing', { recursive: true });
writeFileSync(
  OUT,
  `/* ============================================================
   HOW INDIA BECAME FREE AND WHY IT WAS CUT IN TWO
   Generated by scripts/import-independence.mjs from the authored
   PDFs. Do not hand-edit: re-run the importer instead.

   ${parts.length} parts · ${total.toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`
);

console.log(`\n✓ ${OUT} — ${parts.length} parts, ${total.toLocaleString('en-IN')} words`);
