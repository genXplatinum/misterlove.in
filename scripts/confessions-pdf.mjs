/**
 * confessions-pdf.mjs
 *
 * Reconstructs one part of "The Confessions, Explained" from its designed PDF.
 *
 * The nine parts were rendered by a ReportLab press module (`la_press.py`, in
 * the book's own build directory) whose styles are still readable, and Parts 1
 * to 5 have no other surviving source — their content modules were lost with an
 * earlier working directory, which is why the book's own `extract.py` reads the
 * shipped PDFs rather than any source. Every element in that design system has
 * a distinct type signature: font face, exact point size, fill colour and left
 * edge. Across all nine parts there are forty-three of them, and each one maps
 * onto exactly one style. So this is a classification, not a guess:
 *
 *   Utopia-Bold  18   ink     x60 ......... front/back-matter heading (h2)
 *   Utopia-Bold  13.6 oxblood x60 ......... numbered section heading (h3)
 *   Utopia-Bold  25   ink     x60 ......... chapter title
 *   Utopia-Bold  69.4 oxblood ............. drop capital
 *   Utopia-Bold  11.8 ink     x60 ......... contents entry
 *   Carlito-Bold  8.6 oxblood x60 ......... chapter label (CHAPTER ONE)
 *   Carlito-Bold  8.6 soft    x80 ......... case-card label inside an argument
 *   Carlito-Bold  8.2 <six colours> x71 ... box label; the colour is the kind
 *   Carlito-Bold  8.8 ink     columns ..... table header
 *   Carlito-Bold  9.5 oxblood centred ..... end-of-part line
 *   Carlito-Reg   7.8 muted   x228 ........ running head (dropped)
 *   Carlito-Reg   8.6 muted   x294 ........ folio (dropped)
 *   Carlito-Reg   8.4 muted   centred ..... colophon line
 *   Charter-*    11.6 ink     x60 ......... body paragraph
 *   Charter-*    11.6 ink     x73 ......... list item (the bullet sits at x62)
 *   Charter-*    12.2 soft    x60 ......... chapter standfirst
 *   Charter-*     9.5 soft    x60 ......... contents subline
 *   Charter-*    10.5 ink     x71 ......... box text
 *   Charter-*    10.5 ink     x80 ......... case-card text
 *   Charter-*    10.6 paper   x73 ......... Remember This text, reversed out
 *   Charter-*     9.7 ink     columns ..... table cell
 *
 * The one thing a type signature cannot give is where a paragraph ends, because
 * `boxtext`, `remtext` and the table cells are all set with `spaceAfter = 0` —
 * inside a box, the gap between two paragraphs is exactly the gap between two
 * wrapped lines. That is recovered geometrically instead; see `endsParagraph`.
 *
 * Parts 6 to 9 still have the Python content modules they were rendered from,
 * so this reconstruction is checkable against ground truth rather than merely
 * plausible. `scripts/verify-confessions.mjs` does that check.
 */
import * as mupdf from 'mupdf';
import { readFileSync } from 'node:fs';

/* ------------------------------------------------------------------ *
 * The design system, as the PDF reports it
 * ------------------------------------------------------------------ */

/* Palette, straight out of la_press.py. The values are exact: ReportLab writes
   the same three bytes on every page of every part. */
const INK = '33,30,25';
const SOFT = '74,68,58';
const MUTED = '122,114,99';
const ACCENT = '122,74,46';
const PAPER = '243,239,230';
const RULE = '218,210,191';

/* The label colour of each of the six boxes. It is the only thing that tells
   them apart, and it is unambiguous. */
const BOX_BY_COLOUR = {
  '63,92,114': 'word',
  '79,107,65': 'real',
  '126,104,53': 'know',
  '138,94,34': 'arg',
  '94,79,107': 'assume',
  [RULE]: 'rem',
};

/* Geometry in points. The frame is 21mm margins on A4; the rest is box
   padding. `width` is the measure text was wrapped to, which is what makes
   the paragraph test below exact rather than approximate. */
const FRAME_L = 59.5276;
const FRAME_W = 476.2205;

const MEASURE = {
  body: { left: FRAME_L, width: FRAME_W },
  bullet: { left: FRAME_L + 13, width: FRAME_W - 13 },
  box: { left: FRAME_L + 11, width: FRAME_W - 22 },
  card: { left: FRAME_L + 20, width: FRAME_W - 40 },
  rem: { left: FRAME_L + 13, width: FRAME_W - 26 },
};

/* Leading of every style that can wrap, from la_press.py. A label wraps as
   readily as a paragraph does — "THE HIDDEN ASSUMPTION — THAT THE STRENGTH OF
   A CONVICTION CAN BE READ OFF THE DRAMA OF THE ACT THAT FOLLOWS IT" runs to
   two lines — so the labels need their leadings here too. */
const LEADING = {
  body: 19.952, bullet: 19.952, boxtext: 16.4, cardtext: 16.4,
  remtext: 16.6, tcell: 14, thead: 11.8, chaptitle: 29.5,
  standfirst: 18.5, h2: 23, h3: 17.5, toctitle: 15, tocsub: 13,
  boxlabel: 11, cardlabel: 11.5, chaplabel: 12, end: 14, endsub: 14,
};

/* Which measure each wrapping style was set to. */
const MEASURE_OF = {
  body: 'body', bullet: 'bullet', boxtext: 'box', cardtext: 'card',
  remtext: 'rem',
};

const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;
const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ------------------------------------------------------------------ *
 * Reading the page
 * ------------------------------------------------------------------ */

const rgb = (c) => (Array.isArray(c)
  ? c.map((v) => Math.round(v * 255)).join(',')
  : String(c));

const faceOf = (font) => String(font?.getName?.() ?? '').replace(/^[A-Z]{6}\+/, '');

const right = (quad, x) => (Array.isArray(quad)
  ? Math.max(quad[2] ?? x, quad[4] ?? x, quad[6] ?? x, x)
  : x);

/**
 * One page as visual lines of typed runs.
 *
 * The structured text is walked character by character rather than read out of
 * `asJSON()`, for two reasons. The JSON rounds every font size to a whole
 * point, which would merge 10.5 box text with 10.6 Remember This text, and
 * 11.6 body with 11.8 contents entries. And it does not carry the fill colour
 * at all, which is the thing that names the six boxes.
 *
 * Runs break on any change of face, size or colour, so inline bold and italic
 * survive intact. ReportLab emits every line as its own text object, so mupdf's
 * blocks are lines here rather than paragraphs; grouping is by baseline
 * instead, since a run's origin y is the baseline it was drawn on and
 * everything on one visual line shares it whatever its point size.
 */
function readPage(doc, pageNo) {
  const page = doc.loadPage(pageNo - 1);
  const stext = page.toStructuredText('preserve-spans');
  const runs = [];
  let cur = null;

  /* Whitespace-only runs are kept. The space between a bold lead-in and the
     italic word after it is drawn in the roman face, so it is a run of its
     own — dropping it closes the gap and welds two words together. */
  const close = () => {
    if (cur) runs.push(cur);
    cur = null;
  };

  stext.walk({
    onChar(ch, origin, font, size, quad, colour) {
      const face = faceOf(font);
      const col = rgb(colour);
      const [x, y] = origin;
      /* A run also breaks on a horizontal jump. Two table cells side by side
         are the same face, size and colour on the same baseline, and nothing
         is drawn between them, so without this the whole header row arrives as
         one word: "DateEventWhere it". Seven points of cell padding on each
         side puts a column boundary at fourteen points minimum, where a space
         between two words is about a quarter of the point size. */
      if (cur && cur.face === face && near(cur.size, size, 0.01) && cur.col === col
        && near(cur.y, y, 0.6) && x >= cur.x1 - 0.6 && x - cur.x1 < size * 0.75) {
        cur.text += ch;
        cur.xs.push(x);
        cur.x1 = right(quad, x);
      } else {
        close();
        cur = {
          face, size, col, y, x,
          x1: right(quad, x),
          /* One pen origin per character. Consecutive origins differ by that
             character's advance, so the exact width of any prefix of a run can
             be read straight off the page — which is what the paragraph test
             below needs, and what no font metric guessed from outside would
             give as reliably. */
          xs: [x],
          text: ch,
          bold: /Bold/.test(face),
          italic: /Italic/.test(face),
        };
      }
    },
  });
  close();

  const lines = [];
  for (const run of runs.sort((a, b) => a.y - b.y || a.x - b.x)) {
    const last = lines[lines.length - 1];
    if (last && near(last.y, run.y, 0.6)) last.runs.push(run);
    else lines.push({ y: run.y, page: pageNo, runs: [run] });
  }
  const out = [];
  for (const line of lines) {
    line.runs.sort((a, b) => a.x - b.x);
    // A line's own leading and trailing spaces are furniture; the ones between
    // two words are not, and stay.
    while (line.runs.length && !line.runs[0].text.trim()) line.runs.shift();
    while (line.runs.length && !line.runs[line.runs.length - 1].text.trim()) line.runs.pop();
    if (!line.runs.length) continue;
    line.x = line.runs[0].x;
    line.x1 = Math.max(...line.runs.map((r) => r.x1));
    line.kind = classify(line);
    out.push(line);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Classification
 * ------------------------------------------------------------------ */

const isCharter = (f) => f.startsWith('CharterBT');
const isUtopia = (f) => f.startsWith('Utopia');

/** The style a line was set in, from its first run plus its left edge. */
function classify(line) {
  const { face, size, col } = line.runs[0];
  const x = line.x;

  if (face === 'Carlito-Regular' && near(size, 7.8) && col === MUTED) return 'runhead';
  if (face === 'Carlito-Regular' && near(size, 8.6) && col === MUTED) return 'folio';
  if (face === 'Carlito-Regular' && near(size, 8.4) && col === MUTED) return 'endsub';
  if (face === 'Carlito-Bold' && near(size, 9.5) && col === ACCENT) return 'end';
  if (face === 'Carlito-Bold' && near(size, 8.6) && col === ACCENT) return 'chaplabel';
  if (face === 'Carlito-Bold' && near(size, 8.6) && col === SOFT) return 'cardlabel';
  if (face === 'Carlito-Bold' && near(size, 8.8) && col === INK) return 'thead';
  if (face === 'Carlito-Bold' && near(size, 8.2) && BOX_BY_COLOUR[col]) return 'boxlabel';

  if (isUtopia(face) && near(size, 18) && col === INK) return 'h2';
  if (isUtopia(face) && near(size, 13.6) && col === ACCENT) return 'h3';
  if (isUtopia(face) && near(size, 25) && col === INK) return 'chaptitle';
  if (isUtopia(face) && near(size, 11.8) && col === INK) return 'toctitle';
  if (isUtopia(face) && size > 50 && col === ACCENT) return 'dropcap';

  if (isCharter(face) && near(size, 12.2) && col === SOFT) return 'standfirst';
  if (isCharter(face) && near(size, 9.5) && col === SOFT) return 'tocsub';
  if (isCharter(face) && near(size, 10.6) && col === PAPER) return 'remtext';
  if (isCharter(face) && near(size, 9.7) && col === INK) return 'tcell';
  if (isCharter(face) && near(size, 10.5) && col === INK) {
    return near(x, MEASURE.card.left, 2) ? 'cardtext' : 'boxtext';
  }
  if (isCharter(face) && near(size, 11.6) && col === INK) {
    /* A list item's bullet is drawn in the body face at the body size, two
       points inside the frame, and sits on the item's own first baseline —
       so it arrives as part of that line rather than beside it. */
    return near(x, FRAME_L + 2, 1.5) && line.runs[0].text.trimStart().startsWith('•')
      ? 'bullet' : 'body';
  }
  return 'unknown';
}

/* ------------------------------------------------------------------ *
 * Inline markup
 * ------------------------------------------------------------------ */

/**
 * A line's runs as one string of inline HTML.
 *
 * Runs are concatenated with no separator: each carries its own leading and
 * trailing spaces, and the space before an italic word normally lives at the
 * end of the run before it. Adjacent runs of the same weight are stitched back
 * together afterwards, which matters wherever one emphasised phrase was split
 * across a colour or kerning boundary.
 *
 * `base` is the style's own face, and marks what counts as emphasis rather
 * than as the ordinary setting. A standfirst and a contents subline are both
 * set entirely in the italic, and a table's first column entirely in the bold;
 * tagging those as emphasis would italicise a whole paragraph that was never
 * emphasised at all.
 */
function inline(runs, base = 'roman') {
  const baseBold = base === 'bold' || base === 'bolditalic';
  const baseItalic = base === 'italic' || base === 'bolditalic';
  let out = '';
  for (const run of runs) {
    let text = esc(run.text);
    const bold = run.bold && !baseBold;
    const italic = run.italic && !baseItalic;
    if (bold && italic) text = `<b><i>${text}</i></b>`;
    else if (bold) text = `<b>${text}</b>`;
    else if (italic) text = `<i>${text}</i>`;
    out += text;
  }
  return stitch(out);
}

/** Close up markup that was split across runs, or across a line break. */
const stitch = (html) => html
  .replace(/<\/i><\/b>(\s*)<b><i>/g, '$1')
  .replace(/<\/b>(\s*)<b>/g, '$1')
  .replace(/<\/i>(\s*)<i>/g, '$1')
  // The space that separates an emphasised phrase from what follows it can
  // fall inside the run that carries the emphasis; put it back outside.
  .replace(/<(b|i)>(\s+)/g, '$2<$1>')
  .replace(/(\s+)<\/(b|i)>/g, '</$2>$1')
  .replace(/<(b|i)><\/\1>/g, '');

/** Plain text of a run of runs, for headings, labels and word counts. */
const plain = (runs) => collapse(runs.map((r) => r.text).join(''));

/* ------------------------------------------------------------------ *
 * Where a paragraph ends
 * ------------------------------------------------------------------ */

/** A line as one flat list of characters with their pen origins. */
function chars(line) {
  const out = [];
  for (const run of line.runs) {
    [...run.text].forEach((c, k) => out.push({ c, x: run.xs[k] ?? run.x1 }));
  }
  return out;
}

/**
 * Width of one space on a line, measured off the page rather than assumed.
 *
 * A space between two words is a real glyph with a real pen origin, so its
 * advance is the distance to the character after it. Where a line holds no
 * space at all — a one-word line — Charter's space is very close to a quarter
 * of the point size.
 */
function spaceWidth(line) {
  const cs = chars(line);
  for (let i = 0; i + 1 < cs.length; i++) {
    if (cs[i].c === ' ' && cs[i + 1].c !== ' ') return cs[i + 1].x - cs[i].x;
  }
  return line.runs[0].size * 0.25;
}

/**
 * Width of the first word of a line, exactly.
 *
 * Every character's pen origin is known, so the advance of the opening word is
 * the distance from the first character to the space that ends it — including
 * a word split across two runs by a change of face, since the characters are
 * flattened first.
 */
function firstWordWidth(line) {
  const cs = chars(line);
  for (let i = 1; i < cs.length; i++) {
    if (cs[i].c === ' ') return cs[i].x - cs[0].x;
  }
  return line.x1 - line.x;
}

/**
 * Did this line end because the paragraph ran out, or because the next word
 * would not fit?
 *
 * Everything in this book is set left-aligned with hyphenation off and long
 * words unsplit, so a line breaks at exactly one point: the moment the next
 * word would push it past its measure. Turned round, that becomes a test. If
 * the first word of the following line *would* have fitted on this one, then
 * this line ended on purpose and a paragraph ends here.
 *
 * It matters because inside a box or a Remember This there is no vertical gap
 * between paragraphs at all — both are set with `spaceAfter = 0` — so geometry
 * is the only evidence there is.
 *
 * The test is asked to clear the measure by SLACK rather than to reach it
 * exactly. A line's recorded right edge is the ink of its last glyph, which is
 * a shade narrower than the advance ReportLab was adding up, so a word that
 * missed fitting by a hair would otherwise look as though it had fitted and
 * split one paragraph into two. Erring the other way merely joins two
 * paragraphs, which the vertical gap catches wherever there is one to read.
 *
 * So the test cannot produce a false positive: within a paragraph the next
 * word demonstrably did not fit. It can miss a break, when a paragraph's last
 * line ends within SLACK of the measure. For body text the vertical gap
 * catches those, since `body` carries a 6.5pt `spaceAfter`; inside a box
 * nothing does, and a missed break there merges two paragraphs into one.
 */
const SLACK = 0.5;

function endsParagraph(line, next, measure) {
  const edge = MEASURE[measure].left + MEASURE[measure].width;
  return line.x1 + spaceWidth(line) + firstWordWidth(next) + SLACK <= edge;
}

/**
 * A lead-in that always opens a paragraph of its own.
 *
 * These are devices of the book's method rather than ordinary prose: the three
 * verdict lines that close every Argument box, the "why it matters" that closes
 * every Word Box, the two halves of every How We Actually Know This, and the
 * term being defined at the head of a Word Box. All are a short phrase closed
 * by a colon, and none of them occurs mid-sentence — which is why the rule also
 * requires the line above to have finished one.
 *
 * A title is not a lead-in. "Book Twelve: a deliberate refusal to close the
 * question" is ordinary prose that happens to name a book, and splitting on it
 * would be wrong — so a phrase of two or more words that are all capitalised
 * is refused. "Scaled up:", "The debt:", "Augustine states the reason:" and
 * "Competens:" all pass; only the title form does not.
 *
 * The rule is needed because the geometric test below cannot see a break where
 * a paragraph's last line happened to fill its measure, and inside a box there
 * is no vertical gap to fall back on. Measured against the four parts whose
 * source survives, it recovers about half of those and creates none.
 */
const LEAD_IN_RE = /^[“"‘']?([A-Z][^:]{0,34}):\s/;

function isLeadIn(text) {
  const m = text.match(LEAD_IN_RE);
  if (!m) return false;
  const parts = m[1].split(/\s+/);
  return parts.length < 2 || parts.some((w) => /^[a-z]/.test(w));
}
const SENTENCE_END = /[.?!][)”"’']?$/;

/**
 * Should `next` join `line` as a wrapped continuation of the same paragraph?
 *
 * Three things have to hold: the same style, the same left edge, and either a
 * gap tight enough to be a wrap or — where the style has no paragraph gap to
 * read — a line that filled its measure.
 *
 * Inside a box there is one more, and it is exact. `Box.split()` divides a box
 * at a flow boundary, never inside one, so box text that resumes at the top of
 * a new page always begins a fresh paragraph. Body text is not like that:
 * ReportLab splits an ordinary paragraph wherever the page runs out.
 */
function continues(line, next, kind, measureName) {
  if (next.kind !== kind) return false;
  const measure = measureName ?? MEASURE_OF[kind];
  if (!measure) return false;
  if (!near(next.x, MEASURE[measure].left, 2.5)) return false;
  if (next.page !== line.page) {
    if (measure !== 'body' && measure !== 'bullet') return false;
  } else {
    const gap = next.y - line.y;
    if (gap < 0 || gap > LEADING[kind] + 2.5) return false;
  }
  if (measure !== 'body' && measure !== 'bullet'
    && SENTENCE_END.test(plain(line.runs)) && isLeadIn(plain(next.runs))) {
    return false;
  }
  return !endsParagraph(line, next, measure);
}

/* ------------------------------------------------------------------ *
 * Drop capitals
 * ------------------------------------------------------------------ */

/**
 * The first paragraph of a chapter is set round a three-line drop capital: the
 * opening lines are indented past it at a narrower measure, and the rest of the
 * paragraph runs full width underneath. The letter itself is drawn separately,
 * so it arrives as its own run with no text attached to it.
 *
 * Both the indent and the point where the measure widens are derived from the
 * letter, not assumed: the indented lines all start at the same x, which is the
 * cap's own width plus a 5pt gap.
 */
function dropCapMeasure(capRun) {
  const indent = (capRun.x1 - capRun.x) + 5;
  return { left: FRAME_L + indent, width: FRAME_W - indent };
}

export {
  mupdf, readFileSync,
  readPage, classify, inline, stitch, plain, collapse, esc, near,
  continues, endsParagraph, spaceWidth, firstWordWidth, dropCapMeasure,
  BOX_BY_COLOUR, MEASURE, MEASURE_OF, LEADING, FRAME_L, FRAME_W,
  INK, SOFT, MUTED, ACCENT, PAPER, RULE,
};
