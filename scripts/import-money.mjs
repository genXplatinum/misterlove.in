/**
 * import-money.mjs — one-shot content importer.
 *
 * Converts "The Architecture of Money, Power and the Dollar" into
 * src/data/writing/architecture-of-money.js. Like the Forgotten Gods and
 * Patriarchy importers, no HTML source survives — only the rendered PDF — so
 * the structure is recovered from the typography. The document is unusually
 * regular, which is what makes this possible:
 *
 *     33 pt  part cover title          9.8 pt  body copy (x=51)
 *     19 pt  chapter title             9.2 pt  front-matter copy
 *     16 pt  stat-strip numerals       9.1 pt  callout copy (indented)
 *   12.4 pt  part cover blurb          8.8 pt  wide callout copy / glossary term
 *   12.2 pt  pull quote                8.7 pt  glossary definition
 *   11.9 pt  section heading           8.6 pt  small notes and source lines
 *   11.2 pt  chapter standfirst        8.4 pt  table body
 *     10 pt  subheading                8.2 pt  table caption
 *      9 pt  subheading (numbered)     8.1 pt  table header
 *                                      7.5 pt  callout label / figure caption
 *                                      7.2 pt  stat-strip captions
 *
 * Two quirks of this particular PDF are worth knowing.
 *
 * First, the callout labels and chapter kickers are letterspaced, and pdfjs's
 * text layer turns "CASE STUDY" into "C A S E S T U D Y" — the word breaks are
 * indistinguishable from the letter breaks. The operator list still carries the
 * real string, so every page also gets a lookup built from getOperatorList(),
 * and letterspaced lines are resolved through it. An unresolved label throws.
 *
 * Second, the typesetter used U+2010 for a hyphen it inserted to wrap a word
 * and U+002D for a hyphen the author wrote. So "labour‐/er's" rejoins as
 * "labourer's" and "sandal-/maker" as "sandal-maker", with no word list.
 *
 * The thirteen figures are vector charts with no text layer, so the web edition
 * carries each figure's caption — which in this report says what the chart
 * shows and what to notice in it — and the PDF carries the chart. The download
 * button on the piece page is the complete document.
 *
 * Requires pdfjs-dist, which is local-only (like resvg for the OG cards) — CI
 * never runs this, the generated data file is committed:
 *
 *     npm i --no-save pdfjs-dist
 *     node scripts/import-money.mjs
 *     node scripts/import-money.mjs "<path to the PDF>"
 */
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SRC = process.argv[2]
  ?? 'C:/Users/rajpa/Documents/books/Money Files/The Architecture of Money.pdf';
const OUT = 'src/data/writing/architecture-of-money.js';
const PUBLISHED = '2026-08-08';

/* The parts as the author set them out, in cover order. The PDF names each
   part but has no short label for it, and the reader's rail wants one. */
const PARTS = [
  { label: 'Foundations', title: 'What Money Actually Is' },
  { label: 'One Currency', title: 'How the World Organised Around One Currency' },
  { label: 'America', title: 'Why America Won' },
  { label: 'The Challengers', title: 'Why Everyone Else Failed' },
  { label: 'Exchange Rates', title: 'Currencies, Exchange Rates and Prices' },
  { label: 'Debt', title: 'The Debt Map of the World' },
  { label: 'India', title: 'India' },
  { label: 'The Verdict', title: 'Can the Monopoly Be Broken?' },
  { label: 'Reference', title: 'Glossary, Timeline and Data' },
];

/* Callout label → the reader's tone vocabulary. Three of these match the
   author's printed colour (grey case studies, purple myth checks, red
   uncomfortable parts); the other three match its meaning exactly. */
const TONES = [
  [/^IN SIMPLE WORDS/, 'simple'],
  [/^KEY NUMBERS/, 'number'],
  [/^KEY INSIGHT/, 'key'],
  [/^CASE STUDY/, 'weigh'],
  [/^MYTH CHECK/, 'remember'],
  [/^THE UNCOMFORTABLE PART/, 'worry'],
  // One-offs. The author names a callout freely where the standing five do not
  // fit — mostly through Part VII, where the argument turns to India.
  [/^THE MEASURABLE CONSEQUENCES/, 'number'],
  [/^THE NUMBERS, WITHOUT SPIN/, 'number'],
  [/^KEY LESSON/, 'answer'],
  [/^THE FIVE LESSONS/, 'answer'],
  [/^THE REALISTIC DESTINATION/, 'answer'],
  [/^THE ONE STRENGTH NOBODY COUNTS/, 'key'],
  [/^READING THE SWOT HONESTLY/, 'aim'],
];

const round = (n) => Math.round(n * 10) / 10;
const near = (n, target, tol = 0.25) => Math.abs(n - target) <= tol;

/* The document's sizes are a tenth of a point apart in places — 8.7 pt glossary
   definitions against 8.8 pt terms, 9.1 pt callout copy against 9.2 pt timeline
   years — so size tests have to be exact rather than approximate. Anything
   looser silently swallows one construct into another. */
const EXACT = 0.04;

const clean = (s) => s
  .replace(/\u00ad/g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s+([,.;:!?%])/g, '$1')
  .trim();

const esc = (s) => clean(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const slugify = (s) => s
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .slice(0, 72);

const despace = (s) => s.replace(/\s+/g, '');

/** True for display type the typesetter spaced out letter by letter. */
function letterspaced(text) {
  const tokens = text.split(' ').filter(Boolean);
  return tokens.length >= 4 && tokens.every((token) => token.length <= 2);
}

/* Which column a table cell sits in. Numeric columns in this document are set
   flush right, so a figure can start nearer the *next* column's left edge than
   its own — "45" in a column headed at x=272 lands at x=359, with the following
   column headed at x=446. Matching the closest header puts it in the wrong
   column; taking the last column that starts at or before it does not. */
function columnOf(anchors, x) {
  let index = 0;
  for (let i = 1; i < anchors.length; i += 1) {
    // A centred cell starts to the left of its own header, and by more the
    // wider the column is, so the boundary sits a quarter of the way back into
    // the gutter rather than on the header's own edge.
    const slack = (anchors[i] - anchors[i - 1]) * 0.25;
    if (x >= anchors[i] - slack) index = i;
  }
  return index;
}

/** One row's text, gathered into the columns the header established. */
function byColumn(items, anchors) {
  const columns = new Map();
  for (const item of items) {
    if (!item.str.trim()) continue;
    const at = columnOf(anchors, item.transform[4]);
    if (!columns.has(at)) columns.set(at, []);
    columns.get(at).push(item);
  }
  return [...columns.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([at, group]) => [at, joinItems(group)])
    .filter(([, text]) => text);
}

/** Index of the column anchor nearest a position. */
function nearest(anchors, x) {
  let index = 0;
  let best = Infinity;
  anchors.forEach((anchor, i) => {
    const distance = Math.abs(anchor - x);
    if (distance < best) { best = distance; index = i; }
  });
  return index;
}

/** Rejoin two lines of one paragraph, honouring the two kinds of hyphen. */
function glue(left, right) {
  if (!left) return right;
  if (!right) return left;
  if (left.endsWith('\u2010')) return left.slice(0, -1) + right;   // typesetter's wrap
  if (left.endsWith('-') && /^[a-z]/.test(right)) return left + right; // author's hyphen
  if (/^[,.;:!?)}\]]/.test(right)) return left + right;
  return `${left} ${right}`;
}

/* Word-space recovery. pdfjs concatenates adjacent runs without a space when a
   bold or italic span starts mid-sentence, so measure the gap instead. */
function joinItems(items) {
  let text = '';
  let end = null;
  for (const item of items) {
    if (!item.str) continue;
    const gap = end === null ? 0 : item.transform[4] - end;
    if (text && !/\s$/.test(text) && !/^\s/.test(item.str) && gap > 1.2) text += ' ';
    text += item.str;
    end = item.transform[4] + (item.width ?? 0);
  }
  return clean(text);
}

/** Split a row into cells wherever the typesetter left a column gutter. */
function splitCells(items) {
  const cells = [];
  let current = [];
  let end = null;
  for (const item of items) {
    if (end !== null && item.transform[4] - end > 3.5 && current.some((i) => i.str.trim())) {
      cells.push({ x: round(current.find((i) => i.str.trim()).transform[4]), text: joinItems(current) });
      current = [];
    }
    current.push(item);
    end = item.transform[4] + (item.width ?? 0);
  }
  if (current.some((i) => i.str.trim())) {
    cells.push({ x: round(current.find((i) => i.str.trim()).transform[4]), text: joinItems(current) });
  }
  return cells.filter((c) => c.text);
}

const ORDINALS = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9,
  TEN: 10, ELEVEN: 11, TWELVE: 12, THIRTEEN: 13, FOURTEEN: 14, FIFTEEN: 15,
  SIXTEEN: 16, SEVENTEEN: 17, EIGHTEEN: 18, NINETEEN: 19, TWENTY: 20,
  THIRTY: 30, FORTY: 40,
};

function chapterNumber(words) {
  return words.split(/[-\s]+/).reduce((total, word) => {
    const value = ORDINALS[word];
    if (value === undefined) throw new Error(`Unreadable chapter numeral: "${words}"`);
    return total + value;
  }, 0);
}

/* ------------------------------------------------------------------ *
 * Read the PDF into positioned lines, plus a per-page lookup that can *
 * undo the letterspacing pdfjs cannot see through.                    *
 * ------------------------------------------------------------------ */

async function readPdf(file) {
  const doc = await getDocument({
    data: new Uint8Array(readFileSync(file)),
    useSystemFonts: true,
  }).promise;

  const lines = [];
  const spaced = new Map();   // page → Map(despaced text → real text)

  for (let page = 1; page <= doc.numPages; page += 1) {
    const view = await doc.getPage(page);

    /* The operator list still holds the real words. Keep the runs in order and
       untrimmed: a label with an emphasised word inside it arrives as three
       runs ("…DOES ", "NOT", " MEAN") and only the spaces they carry can put
       it back together. */
    const runs = [];
    const ops = await view.getOperatorList();
    for (let i = 0; i < ops.fnArray.length; i += 1) {
      if (ops.fnArray[i] !== OPS.showText) continue;
      const raw = ops.argsArray[i][0]
        .map((glyph) => (typeof glyph === 'number' ? '' : (glyph.unicode ?? '')))
        .join('')
        .replace(/\s+/g, ' ');
      if (despace(raw)) runs.push({ key: despace(raw), raw });
    }
    spaced.set(page, runs);

    const rows = new Map();
    for (const item of (await view.getTextContent()).items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const key = [...rows.keys()].find((candidate) => Math.abs(candidate - y) <= 2) ?? y;
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(item);
    }

    for (const [y, items] of [...rows.entries()].sort((a, b) => b[0] - a[0])) {
      items.sort((a, b) => a.transform[4] - b.transform[4]);
      const cells = splitCells(items);
      lines.push({
        page,
        y,
        x: round(Math.min(...items.map((i) => i.transform[4]))),
        size: round(Math.max(...items.map((i) => Math.abs(i.transform[0])))),
        cellsRaw: cells.map((c) => ({ ...c, page, y })),
        // Kept for tables, which are split by the header's column positions
        // rather than by the gaps between words: a right-aligned figure can sit
        // close enough to its neighbour that no gap is visible at all.
        items,
        text: clean(cells.map((c) => c.text).join(' ')),
        cells,
      });
    }
  }

  return { doc, lines, spaced };
}

const { doc, lines, spaced } = await readPdf(SRC);

if (doc.numPages !== 117) {
  throw new Error(`Expected the 117-page final PDF; found ${doc.numPages} pages.`);
}

/** Recover a letterspaced line's real words from the operator list. */
function unspace(line) {
  const want = despace(line.text);
  const runs = spaced.get(line.page) ?? [];
  for (let start = 0; start < runs.length; start += 1) {
    if (!want.startsWith(runs[start].key)) continue;
    let key = '';
    let raw = '';
    for (let i = start; i < runs.length && key.length < want.length; i += 1) {
      key += runs[i].key;
      raw += runs[i].raw;
      if (key === want) return clean(raw);
      if (!want.startsWith(key)) break;
    }
  }
  throw new Error(`p${line.page}: cannot unspace "${line.text}"`);
}

/* ------------------------------------------------------------------ *
 * Split the document at its part covers.                              *
 * ------------------------------------------------------------------ */

const coverPages = [...new Set(lines.filter((l) => near(l.size, 33, 0.5)).map((l) => l.page))];
if (coverPages.length !== PARTS.length) {
  throw new Error(`Expected ${PARTS.length} part covers; found ${coverPages.length}`);
}

/* ------------------------------------------------------------------ *
 * Classify one run of lines into blocks.                              *
 * ------------------------------------------------------------------ */

function collect(source, { front = false } = {}) {
  const blocks = [];
  const toc = [];

  let para = null;      // open body paragraph
  let list = null;      // open bullet list
  let box = null;       // open callout
  let table = null;     // open table
  let figure = null;    // open figure caption
  let stat = null;      // open stat strip
  let glossary = null;  // open glossary group
  let grid = null;      // open side-by-side quadrant lists (the SWOT page)
  let timeline = null;  // open dated sequence
  let kicker = null;    // the chapter numeral waiting for its title
  let chapter = null;   // current chapter number, for section ids
  let expectLead = false;
  let inGlossary = false;
  let sectionSeq = 0;

  /* A callout can hold copy, a stat strip and a table of its own, so blocks
     drain into whichever container is currently open, in the order they were
     read. */
  const closeBoxPara = () => {
    if (box?.para) box.blocks.push({ t: 'p', text: box.para.text });
    if (box) box.para = null;
  };
  const sink = (block) => {
    if (box) { closeBoxList(); closeBoxPara(); box.blocks.push(block); } else blocks.push(block);
  };

  const flushPara = () => { if (para) blocks.push({ t: 'p', text: para.text }); para = null; };
  const flushList = () => { if (list?.items.length) blocks.push({ t: 'ul', items: list.items }); list = null; };
  const flushFigure = () => { if (figure) blocks.push({ t: 'figure', text: figure.text }); figure = null; };
  const flushStat = () => {
    if (stat?.values.length) {
      const captions = stat.captions.length
        ? stat.values.map((_, i) => stat.captions.map((row) => row[i] ?? '').join(' ').trim())
        : [];
      sink({ t: 'stat', values: stat.values, captions });
    }
    stat = null;
  };
  /* The glossary snakes: the left column runs to the foot of the page and the
     text carries on at the head of the right one, so a term can sit at the
     bottom of one column with its definition at the top of the next, and the
     last entry of a group can be finished by the first line of the group after
     it. One pointer follows that thread, and it has to survive the flush. The
     blocks hold entry objects by reference, which is what lets a later line
     still reach an entry already pushed. */
  let glossaryOpen = null;

  const flushGlossary = () => {
    if (glossary?.cells.length) {
      const entries = [];
      const column = (cell) => (cell.x < 300 ? 0 : 1);
      const stream = [...glossary.cells].sort((a, b) => (
        (a.page - b.page) || (column(a) - column(b)) || (b.y - a.y)
      ));
      for (const cell of stream) {
        if (cell.term) {
          glossaryOpen = { term: cell.text, def: '' };
          entries.push(glossaryOpen);
        } else if (glossaryOpen) {
          glossaryOpen.def = glue(glossaryOpen.def, cell.text);
        }
      }
      if (entries.length) blocks.push({ t: 'glossary', entries });
    }
    glossary = null;
  };
  const flushGrid = () => {
    if (grid?.columns.some((c) => c.items.length)) blocks.push({ t: 'grid', columns: grid.columns });
    grid = null;
  };
  const flushTimeline = () => {
    if (timeline?.items.length) sink({ t: 'timeline', items: timeline.items });
    timeline = null;
  };
  /* A table that runs over a page break repeats its header on the new page.
     Where that happens, keep it as one table rather than two. */
  const flushTable = () => {
    if (table && table.rows.length) {
      const into = box ? box.blocks : blocks;
      const last = into[into.length - 1];
      const repeat = last?.t === 'table' && !table.caption
        && JSON.stringify(last.head) === JSON.stringify(table.head);
      if (repeat) {
        last.rows.push(...table.rows);
        if (table.note) last.note = last.note ? glue(last.note, table.note) : table.note;
      } else {
        sink({ t: 'table', ...table });
      }
    }
    table = null;
  };
  const flushBox = () => {
    if (box) {
      flushTimeline();
      flushStat();
      flushTable();
      closeBoxList();
      closeBoxPara();
      blocks.push({ t: 'box', label: box.label, tone: box.tone, blocks: box.blocks });
    }
    box = null;
  };
  const flushInline = () => { flushPara(); flushList(); flushStat(); };
  const flushAll = () => {
    flushInline(); flushTimeline(); flushBox(); flushTable();
    flushFigure(); flushGlossary(); flushGrid();
  };

  /** Body and callout copy share one paragraph machine. */
  const addCopy = (line, { newPara }) => {
    const open = box ? box.para : para;
    if (!open || newPara) {
      if (box) {
        closeBoxPara();
        box.para = { text: line.text, y: line.y, page: line.page };
      } else {
        flushPara();
        para = { text: line.text, y: line.y, page: line.page };
      }
      return;
    }
    open.text = glue(open.text, line.text);
    open.y = line.y;
    open.page = line.page;
  };

  /* Inside a callout the left edge does three jobs: copy sits at the callout's
     own margin, a first line indents a little, and a list item indents a little
     with its continuation indented further. The marker settles which is which. */
  const closeBoxList = () => {
    if (box?.list?.items.length) box.blocks.push({ t: box.list.type, items: box.list.items });
    if (box) box.list = null;
  };

  const addBoxCopy = (line) => {
    const base = box.baseX ?? (box.baseX = line.x);
    const bullet = line.text.match(/^[•▸]\s*/);
    const numeral = line.x > base + 2 && line.text.match(/^(\d+)\.\s*/);

    if (bullet || numeral) {
      closeBoxPara();
      const type = bullet ? 'ul' : 'ol';
      if (box.list?.type !== type) { closeBoxList(); box.list = { type, items: [], itemX: line.x }; }
      box.list.itemX = line.x;
      box.list.items.push(clean(line.text.slice((bullet ?? numeral)[0].length)));
      return;
    }
    if (box.list && line.x > box.list.itemX + 4) {
      const last = box.list.items.length - 1;
      box.list.items[last] = glue(box.list.items[last], line.text);
      return;
    }
    closeBoxList();
    addCopy(line, { newPara: line.x > base + 4 || brokeParagraph(line, box.para) });
  };

  /** A gap wider than the leading means the copy started a new paragraph. */
  const brokeParagraph = (line, open) => {
    if (!open) return true;
    if (open.page !== line.page) return /[.!?…”")\]]$/.test(open.text);
    return open.y - line.y > 15;
  };

  for (const line of source) {
    const { size, x, y, text } = line;

    if (y > 800 || y < 40) continue;                 // running head, folio
    if (size <= 1.5) continue;                       // structure marker
    if (!text) continue;

    /* ---- chapter kicker: "CHAPTER ONE", or "REFERENCE" ---- */
    if (near(size, 8, EXACT) && x <= 55) {
      flushAll();
      const words = unspace(line);
      kicker = /^REFERENCE$/i.test(words) ? null : chapterNumber(words.replace(/^CHAPTER\s+/i, ''));
      continue;
    }

    /* ---- chapter title ---- */
    if (near(size, 19, 0.4)) {
      flushAll();
      // The front matter has headings but no chapters, and the reader gives the
      // prologue its own header, so nothing there wants a numbered plate.
      if (front) {
        sectionSeq += 1;
        blocks.push({ t: 'h3', id: `am-front-${sectionSeq}`, text });
        continue;
      }
      chapter = kicker;
      sectionSeq = 0;
      const num = chapter ?? toc.length + 1;
      const id = `am-${slugify(text)}`;
      toc.push({ id, num: String(num), text });
      blocks.push({ t: 'h2', id, num: String(num), text });
      kicker = null;
      expectLead = true;
      // Only one chapter is set as two columns of term and definition.
      inGlossary = /^Glossary\b/i.test(text);
      continue;
    }

    /* ---- chapter standfirst ---- */
    if (near(size, 11.2, EXACT)) {
      flushInline(); flushBox(); flushTable(); flushFigure();
      if (expectLead) {
        const last = blocks[blocks.length - 1];
        if (last?.t === 'lead') last.text = glue(last.text, text);
        else blocks.push({ t: 'lead', text });
      } else {
        addCopy(line, { newPara: brokeParagraph(line, para) });
      }
      continue;
    }
    if (!near(size, 11.2, EXACT)) expectLead = expectLead && false;

    /* ---- section heading ---- */
    if (near(size, 11.9, EXACT)) {
      flushAll();
      sectionSeq += 1;
      blocks.push({ t: 'h3', id: `am-s${chapter ?? 0}-${sectionSeq}`, text });
      continue;
    }

    /* ---- subheading: 10 pt, or a numbered 9 pt run in the body column ---- */
    if (near(size, 10, EXACT) || (near(size, 9, EXACT) && x <= 55)) {
      flushAll();
      blocks.push({ t: 'h4', text });
      continue;
    }

    /* ---- pull quote ---- */
    if (near(size, 12.2, EXACT)) {
      flushInline(); flushBox(); flushTable(); flushFigure();
      const last = blocks[blocks.length - 1];
      if (last?.t === 'quote') last.text = glue(last.text, text);
      else blocks.push({ t: 'quote', text });
      continue;
    }

    /* ---- callout label, or figure caption: both 7.5 pt ---- */
    if (near(size, 7.5, EXACT)) {
      if (x >= 60) {
        flushAll();
        const label = unspace(line);
        const tone = TONES.find(([pattern]) => pattern.test(label))?.[1];
        if (!tone) throw new Error(`p${line.page}: unknown callout "${label}"`);
        box = { label, tone, blocks: [], para: null };
      } else {
        flushInline(); flushBox(); flushTable();
        if (figure) figure.text = glue(figure.text, text);
        else figure = { text };
      }
      continue;
    }

    /* ---- stat strip: big numerals over two lines of caption ---- */
    if (near(size, 16, 0.4)) {
      flushStat();
      stat = { values: line.cells.map((c) => c.text), captions: [] };
      continue;
    }
    if (near(size, 7.2, 0.1)) {
      if (!stat) throw new Error(`p${line.page}: stat caption with no strip — "${text}"`);
      stat.captions.push(line.cells.map((c) => c.text));
      continue;
    }

    /* ---- tables ---- */
    if (near(size, 8.2, EXACT) && x <= 55) {
      flushAll();
      table = { caption: text, head: null, rows: [], note: null };
      continue;
    }
    /* A table inside a callout carries no caption of its own — the callout's
       label is already doing that job — so its header row opens it. A header
       that wraps arrives as two lines; the wider one sets the columns. */
    if (near(size, 8.1, EXACT)) {
      if (table?.rows.length) flushTable();
      if (!table) table = { caption: null, head: null, rows: [], note: null };
      if (!table.head) {
        table.head = line.cells.map((c) => c.text);
        table.anchors = line.cells.map((c) => c.x);
      } else if (line.cells.length > table.anchors.length) {
        const [head, anchors] = [table.head, table.anchors];
        table.anchors = line.cells.map((c) => c.x);
        table.head = line.cells.map((c) => c.text);
        head.forEach((cell, i) => {
          if (!cell) return;
          const at = nearest(table.anchors, anchors[i]);
          table.head[at] = glue(cell, table.head[at]);
        });
      } else {
        for (const [at, text] of byColumn(line.items, table.anchors)) {
          table.head[at] = glue(table.head[at], text);
        }
      }
      continue;
    }
    if (near(size, 8.4, EXACT) && table) {
      // A cell that wraps puts its remainder on the next line, close under the
      // row it belongs to; a genuinely new row sits a full line-height below.
      table.anchors ??= line.cells.map((c) => c.x);
      const previous = table.rows[table.rows.length - 1];
      const continues = previous && table.lastY !== undefined && table.lastY - y < 15;
      const row = continues ? previous : Array.from({ length: table.anchors.length }, () => '');
      for (const [at, text] of byColumn(line.items, table.anchors)) {
        row[at] = row[at] ? glue(row[at], text) : text;
      }
      if (!continues) table.rows.push(row);
      table.lastY = y;
      continue;
    }
    if (near(size, 7.6, EXACT) && table) {
      table.note = table.note ? glue(table.note, text) : text;
      continue;
    }

    /* ---- glossary: 8.8 pt term over 8.7 pt definition, in two columns that
           are independent flows rather than rows — the left column keeps
           running while the right one is on a different entry entirely. So
           collect the cells and resolve each column separately on flush. ---- */
    if (inGlossary && (near(size, 8.8, EXACT) || near(size, 8.7, EXACT))) {
      flushInline(); flushTable(); flushFigure();
      if (!glossary) glossary = { cells: [] };
      for (const column of [0, 1]) {
        const own = line.items.filter((i) => i.str.trim() && (i.transform[4] < 300 ? 0 : 1) === column);
        if (!own.length) continue;
        // A definition can carry a bold word at the term's own size, so a line
        // counts as a term only when the whole column is set that way.
        const term = own.every((i) => near(round(Math.abs(i.transform[0])), 8.8, EXACT));
        glossary.cells.push({
          page: line.page, y: line.y, x: own[0].transform[4], text: joinItems(own), term,
        });
      }
      continue;
    }

    /* ---- dated sequences: a 9.2 pt year over its 9.1 pt entry, both indented.
           The reader already owns a timeline, so use it rather than a panel. ---- */
    if (near(size, 9.2, EXACT) && x >= 56) {
      flushList();
      closeBoxPara();
      if (!timeline) timeline = { items: [], x };
      timeline.items.push({ year: text, text: '' });
      continue;
    }
    if (timeline && near(size, 9.1, EXACT) && x >= 56) {
      const item = timeline.items[timeline.items.length - 1];
      item.text = glue(item.text, text);
      continue;
    }

    /* ---- quadrant headings, side by side: the SWOT page ---- */
    if (near(size, 8.6, EXACT) && x >= 56 && line.cells.length >= 2
        && line.cells.every((c) => letterspaced(c.text))) {
      flushAll();
      grid = {
        anchors: line.cells.map((c) => c.x),
        columns: line.cells.map((c) => ({ head: unspace({ ...line, text: c.text }), items: [] })),
      };
      continue;
    }

    /* ---- the quadrants themselves: two independent bulleted lists whose rows
           do not line up, so each cell goes to the column it sits under ---- */
    if (near(size, 8.4, EXACT) && grid) {
      for (const cell of line.cells) {
        const column = grid.columns[nearest(grid.anchors, cell.x)];
        if (/^[•▸]$/.test(cell.text)) { column.items.push(''); continue; }
        const marker = cell.text.match(/^[•▸]\s*/);
        if (marker) { column.items.push(clean(cell.text.slice(marker[0].length))); continue; }
        if (!column.items.length) column.items.push('');
        const last = column.items.length - 1;
        column.items[last] = glue(column.items[last], cell.text);
      }
      continue;
    }

    /* ---- small type at 8.6 pt does three jobs: the source list, the note that
           sits under a stat strip, and ordinary copy inside a callout. It is
           settled here, before the indent test below, because a wrapped source
           line is indented too and would otherwise open a panel of its own. ---- */
    if (near(size, 8.6, EXACT)) {
      if (text.startsWith('▸')) {
        flushPara();
        if (!list) list = { items: [] };
        list.items.push(clean(text.replace(/^▸\s*/, '')));
        continue;
      }
      if (list && x >= 60) {
        list.items[list.items.length - 1] = glue(list.items[list.items.length - 1], text);
        continue;
      }
      flushTable();
      if (box) addBoxCopy(line);
      else addCopy(line, { newPara: brokeParagraph(line, para) });
      continue;
    }

    /* ---- callout copy: indented small type under an open callout ---- */
    if (size >= 8.65 && size <= 9.4 && x >= 56) {
      if (!box) {
        // An indented panel the author left unlabelled.
        flushAll();
        box = { label: null, tone: 'key', blocks: [], para: null };
      }
      flushTable();
      addBoxCopy(line);
      continue;
    }

    /* ---- body copy; 9.2 pt is the tighter setting used under numbered
           subheadings and through the front matter ---- */
    if (near(size, 9.8, EXACT) || (near(size, 9.2, EXACT) && x <= 55)) {
      if (text.startsWith('▸')) {
        flushPara(); flushBox();
        if (!list) list = { items: [] };
        list.items.push(clean(text.replace(/^▸\s*/, '')));
        continue;
      }
      if (list && x >= 64) {
        list.items[list.items.length - 1] = glue(list.items[list.items.length - 1], text);
        continue;
      }
      flushList(); flushBox(); flushTable(); flushFigure(); flushGlossary();
      addCopy(line, { newPara: x >= 58 || brokeParagraph(line, para) });
      continue;
    }

    throw new Error(`p${line.page} y=${y}: unclassified ${size}pt at x=${x} — "${text.slice(0, 70)}"`);
  }

  flushAll();
  return { blocks, toc };
}

/* ------------------------------------------------------------------ *
 * Render blocks to the reader's prose vocabulary.                     *
 * ------------------------------------------------------------------ */

function table(rows, { head, caption, note }) {
  const thead = head ? `<thead><tr>${head.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>` : '';
  const body = rows.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  return `<figure class="w-figure">${caption ? `<p class="w-table-caption">${esc(caption)}</p>` : ''}`
    + `<div class="w-table-scroll"><table class="w-table">${thead}<tbody>${body}</tbody></table></div>`
    + `${note ? `<p class="w-fn">${esc(note)}</p>` : ''}</figure>`;
}

function render(blocks, { dropcap = false } = {}) {
  let capped = !dropcap;
  let inside = false;

  const one = (block) => {
    switch (block.t) {
      case 'h2':
        capped = !dropcap;
        return `<h2 class="w-h2" id="${block.id}"><span class="w-num">${block.num}</span>${esc(block.text)}</h2>`;
      case 'h3':
        return `<h3 class="w-h3" id="${block.id}">${esc(block.text)}</h3>`;
      case 'h4':
        return `<h4 class="w-h4">${esc(block.text)}</h4>`;
      case 'lead':
        return `<p class="w-lead">${esc(block.text)}</p>`;
      case 'quote':
        return `<div class="w-pullquote">${esc(block.text)}</div>`;
      case 'ul':
      case 'ol':
        return `<${block.t}>${block.items.map((i) => `<li>${esc(i)}</li>`).join('')}</${block.t}>`;
      case 'p': {
        const html = esc(block.text);
        // The dropcap belongs to the chapter's opening paragraph, never to copy
        // that happens to sit first inside a callout.
        if (capped || inside || !/^[A-Za-z]/.test(html)) return `<p>${html}</p>`;
        capped = true;
        return `<p><span class="w-dropcap">${html[0]}</span>${html.slice(1)}</p>`;
      }
      case 'figure':
        return `<figure class="w-figure"><p class="w-table-caption">${esc(block.text)}</p></figure>`;
      case 'stat':
        return table([block.captions], { head: block.values });
      case 'table':
        return table(block.rows, block);
      case 'glossary':
        return table(block.entries.map((e) => [e.term, e.def]), { head: ['Term', 'What it means'] });
      case 'timeline':
        return `<div class="w-timeline">${block.items.map((i) => (
          `<div class="w-tl-item"><span class="w-tl-year">${esc(i.year)}</span>`
          + `<span class="w-tl-text">${esc(i.text)}</span></div>`
        )).join('')}</div>`;
      case 'grid':
        return block.columns.map((column) => `<h4 class="w-h4">${esc(column.head)}</h4>`
          + `<ul>${column.items.filter(Boolean).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`).join('');
      case 'box': {
        const label = block.label ? `<span class="w-box-label">${esc(block.label)}</span>` : '';
        inside = true;
        const body = block.blocks.map(one).join('');
        inside = false;
        return `<div class="w-box w-box--${block.tone}">${label}${body}</div>`;
      }
      default:
        throw new Error(`unrenderable block ${block.t}`);
    }
  };

  return blocks.map(one).join('');
}

/* ------------------------------------------------------------------ *
 * Build the parts.                                                    *
 * ------------------------------------------------------------------ */

const pageLines = (from, to) => lines.filter((l) => l.page >= from && l.page <= to);

/** A part cover: 33 pt title, 12.4 pt blurb, and a run of chapter names. */
function readCover(page) {
  const cover = lines.filter((l) => l.page === page);
  const title = cover.filter((l) => near(l.size, 33, 0.5)).map((l) => l.text).join(' ');
  const lead = cover.filter((l) => near(l.size, 12.4, 0.1)).reduce((a, l) => glue(a, l.text), '');
  return { title: clean(title), lead: clean(lead) };
}

const strip = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// Pages 2 and 3 are the author's note and the guide to the report's devices.
// Page 1 is the cover and page 4 the printed contents, which the reader's own
// rail replaces.
const front = collect(pageLines(2, 3), { front: true });
// The reader prints "Author's Note" as the prologue's own header, so drop the
// printed one rather than showing it twice.
const frontBlocks = front.blocks.filter((b) => !(b.t === 'h3' && /^Author[’']s Note$/i.test(b.text)));
const prologue = render(frontBlocks);

const parts = coverPages.map((cover, index) => {
  const end = (coverPages[index + 1] ?? doc.numPages + 1) - 1;
  const meta = PARTS[index];
  const printed = readCover(cover);
  const { blocks, toc } = collect(pageLines(cover + 1, end));
  const html = render(blocks, { dropcap: true });
  const words = strip(html).split(/\s+/).filter(Boolean).length;

  return {
    n: index + 1,
    label: meta.label,
    title: meta.title,
    lead: printed.lead,
    words,
    minutes: Math.max(1, Math.round(words / 220)),
    published: PUBLISHED,
    toc,
    prologue: index === 0 ? prologue : null,
    prologueTitle: index === 0 ? "Author's Note" : null,
    prologueTag: index === 0 ? 'Before we begin · The Architecture of Money' : null,
    html,
    sources: null,
  };
});

/* ---- checks the author would want to fail loudly ---- */
const chapters = parts.flatMap((p) => p.toc).filter((e) => Number(e.num) > 0);
const numbered = parts.slice(0, 8).flatMap((p) => p.toc).map((e) => Number(e.num));
numbered.forEach((n, i) => {
  if (n !== i + 1) throw new Error(`Chapter numbering broke at ${n} (expected ${i + 1})`);
});
if (numbered.length !== 44) throw new Error(`Expected 44 chapters; found ${numbered.length}`);

const total = parts.reduce((a, p) => a + p.words, 0);
const boxes = parts.reduce((a, p) => a + (p.html.match(/w-box w-box--/g) ?? []).length, 0);
const tables = parts.reduce((a, p) => a + (p.html.match(/<table/g) ?? []).length, 0);

parts.forEach((p) => console.log(
  `part ${p.n}  ${String(p.words).padStart(6)} words  ${String(p.toc.length).padStart(2)} chapters  — ${p.title}`,
));

mkdirSync('src/data/writing', { recursive: true });
writeFileSync(
  OUT,
  `/* ============================================================
   THE ARCHITECTURE OF MONEY, POWER AND THE DOLLAR
   Generated by scripts/import-money.mjs from the authored PDF.
   Do not hand-edit: re-run the importer instead.

   ${parts.length} parts · ${chapters.length} chapters · ${total.toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`,
);

console.log(`\n✓ ${OUT}`);
console.log(`  ${parts.length} parts · ${chapters.length} chapters · ${total.toLocaleString('en-IN')} words`);
console.log(`  ${boxes} callouts · ${tables} tables`);
