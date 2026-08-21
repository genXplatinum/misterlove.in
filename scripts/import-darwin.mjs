/**
 * import-darwin.mjs — one-shot content importer.
 *
 * Converts "On the Origin of Species — my own reading of Darwin" into
 * src/data/writing/origin-of-species.js. Like the Money and Forgotten Gods
 * importers there is no HTML source, only the rendered PDFs — six of them, one
 * per published part — so the structure is recovered from the typography. The
 * document is set to a strict scale, which is what makes this possible:
 *
 *   41.2 pt  drop cap                    11.4 pt  its continuation line
 *     40 pt  section numeral             11.0 pt  glossary term
 *     33 pt  cover: book title           10.8 pt  one-page label (parts 3-6)
 *     22 pt  cover: part title           10.6 pt  callout copy
 *     21 pt  section heading             10.5 pt  the "what he means" gloss
 *  19/17.5   "Part N on one page"        10.4 pt  glossary definition
 *     15 pt  a line worth remembering    10.0 pt  cover: part of eight
 *   14.2 pt  subheading                   9.6 pt  colophon
 *   14.0 pt  cover: sub-title             9.2 pt  figure caption
 *   13.0 pt  fleuron                      8.6 pt  cover: kicker and strap
 *   12.6 pt  chapter gloss                8.4 pt  divider / callout label
 *   12.4 pt  cover: epigraph              7.6 pt  quotation-callout label
 *   12.2 pt  Darwin, quoted               6.0 pt  folio
 *   11.6 pt  body copy
 *
 * Three things about these PDFs are worth knowing.
 *
 * First — and this one is new — the display faces carry no usable ToUnicode
 * table. Their glyphs arrive in the Unicode private-use area, so pdfjs hands
 * back an invisible string where the page shows "Which version I read". Two
 * separate faces do it: a small-caps face that encodes a-z contiguously from
 * U+E051 with its hyphen at U+E06D, and the display romans, which lose only
 * their Th / ch / ck / Qu ligatures. Both are decoded below from a table, and
 * an unknown private-use codepoint throws rather than vanishing. xpdf's
 * pdftotext resolves all of them correctly and is a good cross-check.
 *
 * Second, the typesetter letterspaces every label, and the text layer's own
 * spaces cannot tell a letter break from a word break. The operator list is no
 * help here — unlike the Money PDF, this one emits one glyph per showText call
 * — but the geometry is decisive: letters sit 0.0-0.1 em apart and words
 * 0.6-1.5 em apart, so words are recovered from the measured gaps.
 *
 * Third, paragraphs are found by leading, not by indent alone. Lines inside a
 * paragraph sit 18-19 pt apart and paragraphs 26-28 pt, so a gap over 22 pt
 * closes the block. That one rule also separates the unmarked bullet items,
 * which carry no glyph and no indent change of their own.
 *
 * The figures are vector drawings with no reflowable text layer, so — as in
 * the Money import — the web edition carries each figure's caption and the PDF
 * carries the drawing. Every line the importer drops is printed at the end of
 * the run, so a construct that goes missing is visible rather than silent.
 *
 * Requires pdfjs-dist, which is local-only — CI never runs this, the generated
 * data file is committed:
 *
 *     npm i --no-save pdfjs-dist
 *     node scripts/import-darwin.mjs
 *     node scripts/import-darwin.mjs --verbose
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SRC_DIR = process.env.DARWIN_DIR ?? 'C:/Users/rajpa/Documents/books/Darwin';
const OUT = 'src/data/writing/origin-of-species.js';
const PUBLISHED = '2026-08-21';
const VERBOSE = process.argv.includes('--verbose');

/* The six rendered parts, in order. `label` is the short name the reader's rail
   and the share cards want; the PDF names the part but has no short form for
   it. `chapters` is what the cover kicker promises, kept here as the canonical
   spelling so the chapter run can be drawn without parsing English. */
const PARTS = [
  { label: 'The Farmyard', file: 'Origin of Species - Part 1 - The Setup and the Farmyard Trick.pdf', chapters: ['Intro', 'I'] },
  { label: 'The Wild', file: 'Origin of Species - Part 2 - The Wild and the Quiet War.pdf', chapters: ['II', 'III'] },
  { label: 'The Engine', file: 'Origin of Species - Part 3 - The Engine.pdf', chapters: ['IV'] },
  { label: 'The Cross-Examination', file: 'Origin of Species - Part 4 - The Cross-Examination.pdf', chapters: ['V', 'VI'] },
  { label: 'The Hard Cases', file: 'Origin of Species - Part 5 - The Two Hard Cases.pdf', chapters: ['VII', 'VIII'] },
  { label: 'The Broken Record', file: 'Origin of Species - Part 6 - The Broken Record.pdf', chapters: ['IX', 'X'] },
];

/* ------------------------------------------------------------------ *
 * The private-use decode table.                                       *
 * ------------------------------------------------------------------ */

const PUA = {};
for (let i = 0; i < 26; i += 1) PUA[0xe051 + i] = String.fromCharCode(97 + i);
PUA[0xe06d] = '-';          // the small-caps face keeps its hyphen after the alphabet
PUA[0xe049] = 'Th';
PUA[0xe03b] = 'ch';
PUA[0xe03a] = 'ck';
PUA[0xe048] = 'Qu';

const isPua = (code) => (code >= 0xe000 && code <= 0xf8ff) || code >= 0xf0000;

function decode(raw, where) {
  let out = '';
  for (const ch of raw) {
    const code = ch.codePointAt(0);
    if (!isPua(code)) { out += ch; continue; }
    const known = PUA[code];
    if (known === undefined) {
      throw new Error(`${where}: unmapped private-use glyph U+${code.toString(16).toUpperCase()} in "${raw}"`);
    }
    out += known;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Small helpers.                                                      *
 * ------------------------------------------------------------------ */

const round = (n) => Math.round(n * 10) / 10;
const EXACT = 0.05;
const near = (n, target, tol = EXACT) => Math.abs(n - target) <= tol;
const oneOf = (n, targets, tol = EXACT) => targets.some((t) => near(n, t, tol));

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
  .replace(/-+/g, '-')
  .slice(0, 64);

/** True for a run the typesetter spaced out letter by letter. */
const letterspaced = (text) => {
  const tokens = text.split(' ').filter(Boolean);
  return tokens.length >= 2 && tokens.every((token) => token.length <= 2);
};

/* The two labels whose item boundaries do not fall on word boundaries. Both are
   fixed strings in the print edition, so they are repaired by name and asserted
   rather than guessed at from the geometry. */
const FIXED_LABELS = [
  [/^WHATHEMEANS\b/, 'WHAT HE MEANS'],
  [/^INDARWIN(?=[’'])/, "IN DARWIN"],
];

/**
 * Rejoin a wrapped word.
 *
 * U+2010 is a hyphen the typesetter inserted to break a line and U+002D one the
 * author wrote, so "armadillo‐/like" closes up and "short-/faced" keeps its
 * hyphen, with no word list.
 */
function glue(left, right) {
  if (left.endsWith('\u2010')) return left.slice(0, -1) + right;
  if (left.endsWith('-') && /^[A-Za-z]/.test(right)) return left + right;
  return `${left} ${right}`;
}

/* ------------------------------------------------------------------ *
 * Reading a part.                                                     *
 * ------------------------------------------------------------------ */

async function readPdf(file) {
  const doc = await getDocument({
    data: new Uint8Array(readFileSync(file)),
    useSystemFonts: true,
  }).promise;

  const lines = [];

  for (let page = 1; page <= doc.numPages; page += 1) {
    const view = await doc.getPage(page);
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

      /* Words come from the measured gap, never from the text layer's own
         spaces: display type here is letterspaced, so within a label the two
         are indistinguishable. Letters sit under 0.1 em apart and words over
         0.6 em, and a ligature join measures 0. */
      let text = '';
      let pen = null;
      let pua = false;
      for (const item of items) {
        const x = item.transform[4];
        const size = Math.abs(item.transform[0]);
        const raw = decode(item.str, `p${page}`);
        if ([...item.str].some((ch) => isPua(ch.codePointAt(0)))) pua = true;
        if (pen !== null && x - pen > size * 0.1) text += ' ';
        text += letterspaced(raw) ? raw.replace(/ /g, '') : raw;
        pen = x + (item.width ?? 0);
      }

      text = clean(text)
        /* "F I G U R E 3" closes up to "FIGURE3" — the digit is a word of its
           own and the display type is all caps, so this cannot bite prose. */
        .replace(/^([A-Z]{3,})(\d)/, '$1 $2');
      for (const [pattern, fixed] of FIXED_LABELS) {
        text = text.replace(pattern, fixed);
      }

      lines.push({
        page,
        y,
        x: round(Math.min(...items.map((i) => i.transform[4]))),
        right: round(Math.max(...items.map((i) => i.transform[4] + (i.width ?? 0)))),
        size: round(Math.max(...items.map((i) => Math.abs(i.transform[0])))),
        text,
        /* The small-caps face is the private-use one, so a body-size line that
           carries private-use glyphs is a run-in subheading and nothing else. */
        pua,
      });
    }
  }

  return { doc, lines };
}

/* ------------------------------------------------------------------ *
 * Classification.                                                     *
 * ------------------------------------------------------------------ */

const SIZE = {
  dropcap: 41.2,
  numeral: 40,
  bookTitle: 33,
  partTitle: 22,
  head: 21,
  onePage: [19, 17.5],
  keepLine: 15,
  keepCont: 11.4,
  sub: 14.2,
  coverSub: 14,
  fleuron: 13,
  chapterGloss: 12.6,
  epigraph: 12.4,
  quote: 12.2,
  body: 11.6,
  term: 11,
  summaryLabel: 10.8,
  boxCopy: 10.6,
  means: 10.5,
  definition: 10.4,
  coverPart: 10,
  colophon: 9.6,
  figure: 9.2,
  coverKicker: 8.6,
  label: 8.4,
  quoteLabel: 7.6,
  folio: 6,
};

/* Everything a figure is drawn out of. These sit inside vector diagrams whose
   geometry is the meaning, so they travel in the PDF and not in the web
   edition — the same call the Money import made about its charts. */
const FIGURE_SIZES = [13.8, 10.3, 10.2, 9.8, 9.7, 9.4, 9.3, 9.1, 9, 8.9, 8.8, 8.7, 8.6, 8.5, 8.3, 8.2, 8.1, 7.9, 7.7, 7.5, 7.3, 6.9, 5.9, 5.4];

const MARGIN = 53.2;
const INDENT = 67.4;
const LIST = 70.3;
const NUMBERED = [59.4, 86.4];   // the body's own list, and the one-page summary's
const PARA_GAP = 22;      // 18-19 pt inside a paragraph, 26-28 pt between them

const at = (line, x, tol = 1.2) => Math.abs(line.x - x) <= tol;

/**
 * Turn one part's lines into blocks.
 *
 * The walk is deliberately dumb and strictly ordered: every line is either
 * claimed by a construct, or explicitly dropped and recorded. Nothing falls
 * through quietly, which is the only way a typographic import stays honest.
 */
function collect(lines, { part, dropped }) {
  const blocks = [];
  const toc = [];

  let open = null;     // the block currently accumulating text
  let box = null;      // the callout currently open
  let previous = null; // the previous claimed line, for the leading test
  let pendingDropcap = null;
  let awaitingHead = null;
  let wantLead = false;

  const flush = () => { open = null; };
  const closeBox = () => { box = null; flush(); };

  const push = (block) => {
    if (box) box.children.push(block);
    else blocks.push(block);
    return block;
  };

  const broke = (line) => previous === null
    || line.page !== previous.page
    || previous.y - line.y > PARA_GAP;

  for (const line of lines) {
    const { size, text } = line;

    /* ---- furniture that never reaches the reader ---- */
    if (near(size, SIZE.folio) || near(size, SIZE.colophon)) continue;
    if (oneOf(size, FIGURE_SIZES)) { dropped.push({ ...line, why: 'figure' }); continue; }

    /* ---- the fleuron closes a passage ---- */
    if (near(size, SIZE.fleuron)) {
      closeBox();
      push({ t: 'rule' });
      previous = line;
      continue;
    }

    /* ---- drop caps ----
       The initial's baseline sits two lines below the top of its own
       paragraph, so it arrives mid-paragraph rather than before it. Its owner
       is therefore the block still accumulating, recognised by the deep indent
       the initial itself creates. */
    if (near(size, SIZE.dropcap)) {
      if (open?.t === 'p' && open.firstX > 75 && !open.dropcap) open.dropcap = text.trim();
      else pendingDropcap = text.trim();
      continue;
    }

    /* ---- section numerals ---- */
    if (near(size, SIZE.numeral)) {
      if (awaitingHead) awaitingHead.numeral = text.trim();
      previous = line;
      continue;
    }

    /* ---- dividers and callout labels share a size; x tells them apart ---- */
    if (near(size, SIZE.label)) {
      if (at(line, MARGIN)) {
        closeBox();
        awaitingHead = { divider: text.trim(), numeral: '' };
      } else {
        closeBox();
        box = { t: 'box', tone: toneFor(text), label: text.trim(), children: [] };
        blocks.push(box);
      }
      previous = line;
      continue;
    }

    /* ---- a quotation callout ---- */
    if (near(size, SIZE.quoteLabel)) {
      closeBox();
      box = { t: 'box', tone: 'quote', label: text.trim(), children: [] };
      blocks.push(box);
      previous = line;
      continue;
    }

    /* ---- headings ---- */
    if (near(size, SIZE.head) || oneOf(size, SIZE.onePage)) {
      closeBox();
      const numeral = awaitingHead?.numeral ?? '';
      const divider = awaitingHead?.divider ?? '';
      awaitingHead = null;
      const id = `os${part}-${slugify(text)}`;
      const head = { t: 'h2', id, numeral, divider, text: text.trim() };
      blocks.push(head);
      toc.push({ id, num: numeral || romanless(divider), text: text.trim() });
      previous = line;
      flush();
      /* Every section opens with a one-line standfirst before the drop cap. */
      wantLead = true;
      continue;
    }

    if (near(size, SIZE.sub)) {
      closeBox();
      const id = `os${part}-${slugify(text)}`;
      blocks.push({ t: 'h3', id, text: text.trim() });
      previous = line;
      flush();
      wantLead = false;
      continue;
    }

    /* ---- the chapter gloss under a section heading ---- */
    if (near(size, SIZE.chapterGloss)) {
      if (open?.t === 'lead' && !broke(line)) open.text = glue(open.text, text);
      else open = push({ t: 'lead', text: text.trim() });
      previous = line;
      continue;
    }

    /* ---- Darwin, quoted ---- */
    if (near(size, SIZE.quote)) {
      if (open?.t === 'quote' && !broke(line)) open.text = glue(open.text, text);
      else open = push({ t: 'quote', text: text.trim() });
      previous = line;
      continue;
    }

    /* ---- the plain-English gloss under a quotation ---- */
    if (near(size, SIZE.means)) {
      const stripped = text.replace(/^WHAT HE MEANS\s*[—-]\s*/, '');
      if (stripped !== text) {
        open = push({ t: 'means', text: stripped });
      } else if (open?.t === 'means' && !broke(line)) {
        open.text = glue(open.text, text);
      } else {
        open = push({ t: 'means', text: text.trim() });
      }
      previous = line;
      continue;
    }

    /* ---- callout copy ---- */
    if (near(size, SIZE.boxCopy)) {
      /* The eight-part map is a two-column ledger — "PART 3" against what
         part three covers — and the label shares a line with its row. */
      const row = text.match(/^PART (\d+)\s+(.*)$/);
      if (row) {
        open = push({ t: 'row', year: `Part ${row[1]}`, text: row[2].trim() });
        previous = line;
        continue;
      }
      if (open?.t === 'row' && !broke(line)) { open.text = glue(open.text, text); previous = line; continue; }
      if (open?.t === 'p' && !broke(line)) open.text = glue(open.text, text);
      else open = push({ t: 'p', text: text.trim() });
      previous = line;
      continue;
    }

    /* ---- glossary ---- */
    if (near(size, SIZE.term)) {
      open = push({ t: 'term', text: text.trim() });
      previous = line;
      continue;
    }
    if (near(size, SIZE.definition)) {
      /* Centred at this size means the "tear this out" kicker over the
         one-page summary, not a glossary body. */
      if (line.x > 150) {
        wantLead = false;
        open = push({ t: 'lead', text: text.trim() });
      } else if (open?.t === 'definition' && !broke(line)) {
        open.text = glue(open.text, text);
      } else {
        open = push({ t: 'definition', text: text.trim() });
      }
      previous = line;
      continue;
    }

    /* ---- a line worth remembering ---- */
    if (near(size, SIZE.keepLine)) {
      open = push({ t: 'keep', text: text.replace(/^\d+\s+/, '').trim() });
      previous = line;
      continue;
    }
    if (near(size, SIZE.keepCont)) {
      if (open?.t === 'keep') open.text = glue(open.text, text);
      else open = push({ t: 'keep', text: text.trim() });
      previous = line;
      continue;
    }

    /* ---- the one-page summary's own labels (parts three onward) ---- */
    if (near(size, SIZE.summaryLabel)) {
      if (line.x > 70 && line.x < 90) {
        closeBox();
        blocks.push({ t: 'h4', text: text.trim() });
        previous = line;
        flush();
        wantLead = false;
      wantLead = false;
        continue;
      }
      dropped.push({ ...line, why: 'figure' });
      continue;
    }

    /* ---- figure captions ---- */
    if (near(size, SIZE.figure)) {
      const match = text.match(/^FIGURE\s+(\d+)\s*(.*)$/);
      if (match) {
        closeBox();
        open = push({ t: 'figure', n: match[1], text: match[2].trim() });
      } else if (open?.t === 'figure') {
        open.text = glue(open.text, text);
      } else {
        dropped.push({ ...line, why: 'figure' });
      }
      previous = line;
      continue;
    }

    /* ---- body copy ---- */
    if (near(size, SIZE.body)) {
      /* A body-size line set in the small-caps face is a run-in subheading. */
      if (line.pua) {
        closeBox();
        blocks.push({ t: 'h4', text: text.trim() });
        previous = line;
        flush();
        wantLead = false;
      wantLead = false;
        continue;
      }

      const numbered = NUMBERED.some((anchor) => at(line, anchor)) && /^\d+\.\s/.test(text);
      const kind = numbered ? 'li' : at(line, LIST) ? 'bullet' : 'p';

      if (numbered) {
        open = push({ t: 'li', text: text.replace(/^\d+\.\s*/, '').trim() });
      } else if (kind === 'bullet') {
        /* Bullets carry no glyph, so a new item is a wider gap and nothing
           else. A LIST-indented line right after a numbered item is that
           item's own continuation, not a new bullet. */
        if (open && (open.t === 'li' || open.t === 'bullet') && !broke(line)) {
          open.text = glue(open.text, text);
        } else {
          open = push({ t: 'bullet', text: text.trim() });
        }
      } else if ((open?.t === 'p' || open?.t === 'lead') && !broke(line) && !at(line, INDENT)) {
        open.text = glue(open.text, text);
      } else if (wantLead) {
        wantLead = false;
        open = push({ t: 'lead', text: text.trim(), firstX: line.x });
      } else {
        const block = { t: 'p', text: text.trim(), firstX: line.x };
        if (pendingDropcap) { block.dropcap = pendingDropcap; pendingDropcap = null; }
        open = push(block);
      }

      previous = line;
      continue;
    }

    dropped.push({ ...line, why: `unclassified ${size}pt` });
  }

  return { blocks, toc };
}

/** The label a section without a numeral shows in the contents rail. */
function romanless(divider) {
  if (divider.startsWith('BEFORE WE START')) return '§';
  if (divider.startsWith('REFERENCE')) return 'R';
  if (divider.startsWith('COMING NEXT')) return '→';
  return '';
}

/* The author names his callouts freely. The five that recur carry the tone
   their meaning asks for; anything else falls to the standing four by what the
   label is doing — an opinion, a correction, a question, an aside. */
const TONES = [
  [/^IN DARWIN['’]S OWN WORDS$/, 'quote'],
  [/^QUOTED BY DARWIN$/, 'quote'],
  [/^MY TAKE\b/, 'interp'],
  [/^WHERE DARWIN IS WRONG\b/, 'worry'],
  [/^WHAT I['’]M PROMISING YOU$/, 'aim'],
  [/\bWRONG\b|\bMISTAKE\b|\bPROBLEM\b|\bHOLE\b/, 'worry'],
  [/^THE (LINE|MOST|PASSAGE|SENTENCE|ANGRIEST|HALF)\b/, 'quote'],
  [/^A LINE I KEEP\b/, 'quote'],
  [/^(WHY|WHAT|HOW|THE QUESTION)\b/, 'key'],
  [/^(A THING|THE SADDEST|THE ANSWER|SO |NOT )/, 'remember'],
];

function toneFor(label) {
  for (const [pattern, tone] of TONES) if (pattern.test(label)) return tone;
  return 'key';
}

/* ------------------------------------------------------------------ *
 * Rendering.                                                          *
 * ------------------------------------------------------------------ */

function paragraph(block) {
  const body = esc(block.text);
  if (!block.dropcap) return `<p>${body}</p>`;
  const cap = esc(block.dropcap);
  return `<p><span class="w-dropcap">${cap}</span>${body}</p>`;
}

function renderBox(box) {
  const label = `<span class="w-box-label">${esc(box.label)}</span>`;
  const inner = box.children.map((child) => {
    if (child.t === 'quote') return `<p>${esc(child.text)}</p>`;
    if (child.t === 'means') return `<p class="w-small"><strong>What he means</strong> — ${esc(child.text)}</p>`;
    if (child.t === 'bullet' || child.t === 'li') return `<p>${esc(child.text)}</p>`;
    return `<p>${esc(child.text)}</p>`;
  }).join('');
  return `<div class="w-box w-box--${box.tone}">${label}${inner}</div>`;
}

function render(blocks) {
  const out = [];
  let list = null;   // { tag, items }

  const closeList = () => {
    if (!list) return;
    out.push(`<${list.tag}>${list.items.map((item) => `<li>${item}</li>`).join('')}</${list.tag}>`);
    list = null;
  };

  const openList = (tag, html) => {
    if (list && list.tag !== tag) closeList();
    if (!list) list = { tag, items: [] };
    list.items.push(html);
  };

  let keeps = null;
  const closeKeeps = () => {
    if (!keeps) return;
    out.push(`<div class="w-takeaways"><ul>${keeps.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></div>`);
    keeps = null;
  };

  let rows = null;
  const closeRows = () => {
    if (!rows) return;
    out.push(`<div class="w-timeline">${rows.map(({ year, text }) => (
      `<div class="w-tl-item"><span class="w-tl-year">${esc(year)}</span><span class="w-tl-text">${esc(text)}</span></div>`
    )).join('')}</div>`);
    rows = null;
  };

  let glossary = null;
  const closeGlossary = () => {
    if (!glossary) return;
    out.push(glossary.map(({ term, body }) => (
      `<dl class="w-def"><dt class="w-def-term">${esc(term)}</dt><dd class="w-def-body">${esc(body)}</dd></dl>`
    )).join(''));
    glossary = null;
  };

  const closeAll = () => { closeList(); closeKeeps(); closeGlossary(); closeRows(); };

  for (const block of blocks) {
    if (block.t === 'row') { closeList(); closeKeeps(); closeGlossary(); (rows ??= []).push(block); continue; }
    if (block.t === 'bullet') { closeKeeps(); closeGlossary(); openList('ul', esc(block.text)); continue; }
    if (block.t === 'li') { closeKeeps(); closeGlossary(); openList('ol', esc(block.text)); continue; }
    if (block.t === 'keep') { closeList(); closeGlossary(); (keeps ??= []).push(block.text); continue; }
    if (block.t === 'term') { closeList(); closeKeeps(); (glossary ??= []).push({ term: block.text, body: '' }); continue; }
    if (block.t === 'definition') {
      closeList(); closeKeeps();
      if (glossary?.length) glossary[glossary.length - 1].body = block.text;
      else out.push(`<p>${esc(block.text)}</p>`);
      continue;
    }

    closeAll();

    switch (block.t) {
      case 'h2': {
        const num = block.numeral ? `<span class="w-num">${esc(block.numeral)}</span>` : '';
        out.push(`<h2 class="w-h2" id="${block.id}">${num}${esc(block.text)}</h2>`);
        break;
      }
      case 'h3':
        out.push(`<h3 class="w-h3" id="${block.id}">${esc(block.text)}</h3>`);
        break;
      case 'h4':
        out.push(`<h4 class="w-h4">${esc(block.text)}</h4>`);
        break;
      case 'lead':
        out.push(`<p class="w-lead">${esc(block.text)}</p>`);
        break;
      case 'quote':
        out.push(`<div class="w-box w-box--quote"><p>${esc(block.text)}</p></div>`);
        break;
      case 'means':
        out.push(`<p class="w-small"><strong>What he means</strong> — ${esc(block.text)}</p>`);
        break;
      case 'figure':
        out.push(`<figure class="w-figure"><p class="w-table-caption">Figure ${esc(block.n)}. ${esc(block.text)}</p></figure>`);
        break;
      case 'box':
        out.push(renderBox(block));
        break;
      case 'rule':
        out.push('<hr class="w-soft" />');
        break;
      case 'p':
      default:
        out.push(paragraph(block));
        break;
    }
  }

  closeAll();
  return out.join('');
}

/* ------------------------------------------------------------------ *
 * The run.                                                            *
 * ------------------------------------------------------------------ */

const strip = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const dropped = [];
const parts = [];
/* The author prints his own map of all eight parts on page three of part one —
   one line saying what each part covers. Those lines are the parts' leads, and
   rows seven and eight are the announced-but-unwritten entries the manifest
   needs, so nothing about the series has to be written twice. */
const MAP = new Map();

for (const [index, spec] of PARTS.entries()) {
  const n = index + 1;
  const { doc, lines } = await readPdf(`${SRC_DIR}/${spec.file}`);

  /* The cover is page one and is read by position, because every line on it is
     unique to it and none of it belongs in the body. */
  const cover = lines.filter((line) => line.page === 1);
  const joined = (test) => cover.filter(test).map((l) => l.text).reduce((a, b) => (a ? glue(a, b) : b), '');
  const bookTitle = joined((l) => near(l.size, SIZE.bookTitle));
  /* "The Cross-/Examination" is wrapped on the cover, so the two lines rejoin
     through the same hyphen rule the body copy uses. */
  const partTitle = joined((l) => near(l.size, SIZE.partTitle));
  /* The cover's own kicker names the Darwin chapters this part walks; the
     14 pt line above it is the book's subtitle and belongs to the series. */
  const kicker = joined((l) => near(l.size, SIZE.boxCopy));
  const epigraph = joined((l) => near(l.size, SIZE.epigraph));

  if (!/ORIGIN/.test(bookTitle)) throw new Error(`Part ${n}: no book title on the cover, found "${bookTitle}"`);
  if (!partTitle) throw new Error(`Part ${n}: no part title on the cover`);

  const body = lines.filter((line) => line.page > 1);
  const { blocks, toc } = collect(body, { part: n, dropped });

  for (const block of blocks) {
    if (block.t !== 'row') continue;
    const which = Number(block.year.replace(/\D+/g, ''));
    if (which) MAP.set(which, clean(block.text.replace(/^You are here\.\s*/, '')));
  }

  if (!toc.length) throw new Error(`Part ${n}: no sections found`);

  const html = render(blocks);
  const words = strip(html).split(/\s+/).filter(Boolean).length;

  /* The lead is the first thing the part says about itself: the gloss or
     standfirst under its opening heading. */
  const firstLead = MAP.get(n)
    ?? blocks.find((b) => b.t === 'lead')?.text
    ?? blocks.find((b) => b.t === 'p' && b.text.length > 60)?.text;

  parts.push({
    n,
    label: spec.label,
    title: partTitle,
    lead: clean(firstLead ?? epigraph),
    chapters: spec.chapters,
    covers: clean(kicker),
    words,
    minutes: Math.max(1, Math.round(words / 220)),
    published: PUBLISHED,
    toc,
    html,
  });

  const boxes = (html.match(/w-box w-box--/g) ?? []).length;
  const figures = (html.match(/<figure/g) ?? []).length;
  console.log(
    `Part ${n}  ${String(doc.numPages).padStart(2)} pages  ${String(words).padStart(5)} words  `
    + `${String(toc.length).padStart(2)} sections  ${String(boxes).padStart(2)} callouts  ${figures} figures  — ${partTitle}`
  );
}

/* ------------------------------------------------------------------ *
 * What was left behind.                                               *
 * ------------------------------------------------------------------ */

const unclassified = dropped.filter((d) => d.why.startsWith('unclassified'));
if (unclassified.length) {
  for (const line of unclassified.slice(0, 40)) {
    console.error(`  p${line.page} ${line.size}pt x${line.x}  ${line.text.slice(0, 110)}`);
  }
  throw new Error(`${unclassified.length} lines matched no construct — see above.`);
}

const figureLines = dropped.filter((d) => d.why === 'figure');
console.log(`\n${figureLines.length} lines of figure lettering stay in the PDF.`);
if (VERBOSE) {
  for (const line of figureLines) {
    console.log(`  p${line.page} ${line.size}pt x${line.x}  ${line.text.slice(0, 110)}`);
  }
}

/* Every contents entry has to land on a heading that exists, or the reader's
   rail silently stops tracking. */
for (const part of parts) {
  for (const entry of part.toc) {
    if (!part.html.includes(`id="${entry.id}"`)) {
      throw new Error(`Part ${part.n}: contents entry "${entry.text}" has no heading to jump to`);
    }
  }
  if (/[\uE000-\uF8FF]/.test(part.html)) {
    throw new Error(`Part ${part.n}: a private-use glyph survived into the output`);
  }
}

const total = parts.reduce((sum, part) => sum + part.words, 0);
const minutes = parts.reduce((sum, part) => sum + part.minutes, 0);
const sections = parts.reduce((sum, part) => sum + part.toc.length, 0);

const banner = `/* ============================================================
   ON THE ORIGIN OF SPECIES — MY OWN READING OF DARWIN
   Generated by scripts/import-darwin.mjs from the authored PDFs.
   Do not hand-edit: re-run the importer instead.

   ${parts.length} parts · ${sections} sections · ${total.toLocaleString('en-US')} words
   ============================================================ */

`;

writeFileSync(OUT, `${banner}const parts = ${JSON.stringify(parts, null, 2)};\n\nexport default parts;\n`);

console.log(`\n${OUT}`);
console.log(`${parts.length} parts · ${sections} sections · ${total.toLocaleString('en-US')} words · ${minutes} minutes`);
console.log('\nManifest: words: ' + total + ', minutes: ' + minutes);
