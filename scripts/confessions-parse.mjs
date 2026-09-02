/**
 * confessions-parse.mjs
 *
 * Turns the classified lines of one part's PDF (see confessions-pdf.mjs) back
 * into the token stream the part was built from — the same vocabulary the
 * book's own content modules use:
 *
 *   ('h2', text) ('h3', text) ('p', html) ('dc', html) ('ul', [html])
 *   ('chap', label, [titleLines], standfirst)
 *   ('word'|'real'|'know', '', [html])       the three simple boxes
 *   ('assume', title, [html])                the hidden-assumption box
 *   ('rem', [html])                          closes every chapter
 *   ('arg', question, framing, [[who, [html]]], [stands, settles, why])
 *   ('table', [headers], [[cells]])
 *   ('toc', title, subline) ('end', text) ('endsub', text)
 *
 * Emitting the author's own tokens rather than HTML directly is what makes the
 * reconstruction checkable: parts 6 to 9 still have the Python modules they
 * were rendered from, so the two streams can be compared token for token.
 */
import {
  mupdf, readFileSync, readPage, inline, plain, collapse, near, continues,
  stitch, MEASURE, LEADING, BOX_BY_COLOUR, SOFT,
} from './confessions-pdf.mjs';

/* Vertical gap that separates two table rows. Rows carry 6pt of padding top
   and bottom on a 14pt leading, so a row break is 26pt against a wrap's 14. */
const ROW_GAP = 20;

/* Horizontal gap that separates two table columns: 7pt of padding on each
   side of the cell edge, against roughly 2.4pt for a space between words. */
const COL_GAP = 8;

/* ------------------------------------------------------------------ *
 * The cover
 * ------------------------------------------------------------------ */

/**
 * Page one of every part is a cover, drawn straight onto the canvas rather
 * than flowed, so none of the body styles appear on it. It carries the only
 * copy of the part's subtitle and blurb, both of which the web edition wants.
 */
function readCover(lines) {
  const at = (size, col) => lines.filter(
    (l) => near(l.runs[0].size, size, 0.05) && (!col || l.runs[0].col === col)
  );
  /* The part line is centred and wraps on the longer titles — Part Three runs
     to two lines — so every line of it is taken, not the first. */
  const subtitle = collapse(at(15.5).map((l) => plain(l.runs)).join(' '));
  const blurb = at(11.4, SOFT).map((l) => plain(l.runs)).join(' ');
  const strap = plain(at(9.2)[0]?.runs ?? []);
  return {
    strap,
    // "Part One — The Restless Heart" → the two halves separately.
    part: subtitle,
    title: subtitle.replace(/^Part\s+\w+\s*[—–-]\s*/, ''),
    blurb: collapse(blurb),
  };
}

/* ------------------------------------------------------------------ *
 * Gathering
 * ------------------------------------------------------------------ */

/** Consecutive lines of one heading style, joined into a single heading. */
function gatherHeading(lines, i, kind) {
  const runs = [...lines[i].runs];
  let j = i + 1;
  while (j < lines.length && lines[j].kind === kind
    && lines[j].page === lines[j - 1].page
    && lines[j].y - lines[j - 1].y <= LEADING[kind] + 2.5
    && near(lines[j].x, lines[i].x, 2.5)) {
    runs.push({ text: ' ', face: '', size: 0, col: '' }, ...lines[j].runs);
    j += 1;
  }
  return [collapse(runs.map((r) => r.text).join('')), j];
}

/** One paragraph of a wrapping style, from `i` forward. */
function gatherParagraph(lines, i, kind, { base, measure } = {}) {
  const collected = [lines[i]];
  let j = i + 1;
  while (j < lines.length && continues(lines[j - 1], lines[j], kind, measure)) {
    collected.push(lines[j]);
    j += 1;
  }
  return [joinLines(collected, base), j];
}

/**
 * Wrapped lines back into one run of prose.
 *
 * Lines are joined with a single space. Hyphenation is off throughout the book
 * and long words are never split, so a line always breaks at a real word
 * boundary and there is never a hyphen to repair.
 */
function joinLines(collected, base) {
  return stitch(collapse(collected.map((l) => inline(l.runs, base)).join(' ')))
    .replace(/\s+([,.;:!?])/g, '$1');
}

/* ------------------------------------------------------------------ *
 * Boxes
 * ------------------------------------------------------------------ */

const BOX_BODY = { rem: 'remtext' };
const bodyKindOf = (box) => BOX_BODY[box] ?? 'boxtext';

/**
 * One box, from its label line to the last line of its last paragraph.
 *
 * A box that splits across a page carries its label only on the first
 * fragment, and its text simply continues at the top of the next page — which
 * is why the box ends at the first line that is not part of it rather than at
 * a page boundary. Two boxes never sit back to back; the book's own
 * verification refuses that, so a label always follows ordinary text.
 */
function gatherBox(lines, i) {
  const kind = BOX_BY_COLOUR[lines[i].runs[0].col];
  const [label, afterLabel] = gatherHeading(lines, i, 'boxlabel');
  const bodyKind = bodyKindOf(kind);

  const paras = [];
  const cards = [];
  let j = afterLabel;
  let card = null;

  while (j < lines.length) {
    const line = lines[j];
    if (line.kind === 'cardlabel') {
      const [who, next] = gatherHeading(lines, j, 'cardlabel');
      card = { who, paras: [] };
      cards.push(card);
      j = next;
      continue;
    }
    if (line.kind === 'cardtext') {
      const [html, next] = gatherParagraph(lines, j, 'cardtext');
      (card ? card.paras : paras).push(html);
      j = next;
      continue;
    }
    if (line.kind === bodyKind) {
      const [html, next] = gatherParagraph(lines, j, bodyKind);
      paras.push(html);
      j = next;
      // Anything after the last card belongs to the box again, not the card.
      card = null;
      continue;
    }
    break;
  }
  return [{ kind, label, paras, cards }, j];
}

/** The three-part verdict that closes an argument box, split off its body. */
function splitArgument(box) {
  const question = box.label.replace(/^THE ARGUMENT\s*[—–-]\s*/i, '');
  const verdictAt = box.paras.findIndex((p) => p.startsWith('<b>Where things stand:'));
  const framing = verdictAt === -1 ? box.paras : box.paras.slice(0, verdictAt);
  const verdict = verdictAt === -1 ? [] : box.paras.slice(verdictAt);
  return {
    question,
    framing,
    cases: box.cards.map((c) => [c.who, c.paras]),
    verdict: verdict.map((p) => p.replace(/^<b>[^<]*:<\/b>\s*/, '')),
    verdictLabels: verdict.map((p) => (p.match(/^<b>([^<]*):<\/b>/) ?? [undefined, ''])[1]),
  };
}

/* ------------------------------------------------------------------ *
 * Tables
 * ------------------------------------------------------------------ */

/**
 * One table, from its header row to the last cell of its last row.
 *
 * Columns come out of the geometry rather than being assumed: cells carry 7pt
 * of padding on each side, so a gap of more than 8pt between two runs on a
 * line is a column boundary, while a space between two words is about 2.4pt at
 * this size. The distinct left edges found that way, clustered, are the
 * columns. Rows are separated the same way vertically — 6pt of padding above
 * and below a 14pt leading.
 *
 * A table that runs over a page repeats its header, which is dropped rather
 * than read as a row.
 */
function gatherTable(lines, i) {
  const rows = [];
  let j = i;
  let cur = null;
  let headerText = null;

  while (j < lines.length && (lines[j].kind === 'tcell' || lines[j].kind === 'thead')) {
    const line = lines[j];
    const prev = lines[j - 1];
    const newRow = !cur
      || line.page !== prev.page
      || line.y - prev.y > ROW_GAP
      || (line.kind === 'thead') !== (prev.kind === 'thead');

    if (newRow) {
      cur = { head: line.kind === 'thead', cells: [] };
      rows.push(cur);
    }

    /* Split the line into cells on the column gaps, then merge each into the
       cell it continues. A wrapped cell restarts at its own column's edge, so
       matching on left edge is what keeps the columns straight. */
    const groups = [];
    for (const run of line.runs) {
      const last = groups[groups.length - 1];
      if (last && run.x - last.x1 < COL_GAP) {
        last.runs.push(run);
        last.x1 = Math.max(last.x1, run.x1);
      } else {
        groups.push({ x: run.x, x1: run.x1, runs: [run] });
      }
    }
    for (const group of groups) {
      const cell = cur.cells.find((c) => near(c.x, group.x, 3));
      if (cell) cell.lines.push(group.runs);
      else cur.cells.push({ x: group.x, lines: [group.runs] });
    }
    j += 1;
  }

  const columns = [];
  for (const row of rows) {
    for (const cell of row.cells) {
      if (!columns.some((c) => near(c, cell.x, 3))) columns.push(cell.x);
    }
  }
  columns.sort((a, b) => a - b);

  /* A header is set entirely in the label bold and a first column entirely in
     the body bold; neither is emphasis, and tagging them as such would put a
     <b> round every row label in the book. */
  const render = (row) => {
    const out = columns.map(() => '');
    for (const cell of row.cells) {
      const at = columns.findIndex((c) => near(c, cell.x, 3));
      const base = (row.head || at === 0) ? 'bold' : 'roman';
      out[at] = stitch(collapse(cell.lines.map((runs) => inline(runs, base)).join(' ')));
    }
    return out;
  };

  const head = rows.find((r) => r.head);
  const headers = head ? render(head) : columns.map(() => '');
  headerText = headers.join(' ');
  const body = rows
    .filter((r) => !r.head)
    .map(render)
    // A repeated header on a continuation page arrives as an ordinary row.
    .filter((cells) => cells.join(' ') !== headerText);

  return [{ headers, rows: body }, j];
}

/* ------------------------------------------------------------------ *
 * The main walk
 * ------------------------------------------------------------------ */

/**
 * Every line of the part, in reading order, with the running head and folio
 * dropped. Both are the only 7.8pt and 8.6pt muted Carlito on a page, so they
 * are identified by style rather than by position.
 */
function bodyLines(doc) {
  const lines = [];
  for (let p = 2; p <= doc.countPages(); p++) {
    for (const line of readPage(doc, p)) {
      if (line.kind === 'runhead' || line.kind === 'folio') continue;
      lines.push(line);
    }
  }
  return lines;
}

/** A drop-capital paragraph: the cap, the indented opening, and the tail. */
function gatherDropCap(lines, i) {
  /* The cap is drawn after the lines it indents — its baseline sits level with
     the third of them — so the indented run is found first and the letter is
     picked up on the way past. */
  const head = [lines[i]];
  let j = i + 1;
  while (j < lines.length && lines[j].kind === 'body'
    && near(lines[j].x, lines[i].x, 2.5)
    && lines[j].y - lines[j - 1].y <= LEADING.body + 2.5) {
    head.push(lines[j]);
    j += 1;
  }

  let letter = '';
  if (j < lines.length && lines[j].kind === 'dropcap') {
    letter = plain(lines[j].runs);
    j += 1;
  }

  const tail = [];
  while (j < lines.length && lines[j].kind === 'body'
    && near(lines[j].x, MEASURE.body.left, 2.5)) {
    const previous = tail.length ? tail[tail.length - 1] : head[head.length - 1];
    // The first tail line continues the indented run above it: same paragraph,
    // same right edge, only the left margin changes.
    if (tail.length === 0) {
      const gap = lines[j].page === previous.page ? lines[j].y - previous.y : 0;
      if (gap > LEADING.body + 2.5 || gap < 0) break;
    } else if (!continues(previous, lines[j], 'body')) {
      break;
    }
    tail.push(lines[j]);
    j += 1;
  }

  return [letter + joinLines([...head, ...tail]), j];
}

/** The whole token stream of one part. */
function tokenise(lines) {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    switch (line.kind) {
      case 'h2': {
        const [text, next] = gatherHeading(lines, i, 'h2');
        out.push(['h2', text]);
        i = next;
        break;
      }
      case 'h3': {
        const [text, next] = gatherHeading(lines, i, 'h3');
        out.push(['h3', text]);
        i = next;
        break;
      }
      case 'chaplabel': {
        const [label, afterLabel] = gatherHeading(lines, i, 'chaplabel');
        const titleLines = [];
        let j = afterLabel;
        while (j < lines.length && lines[j].kind === 'chaptitle') {
          titleLines.push(plain(lines[j].runs));
          j += 1;
        }
        let standfirst = '';
        if (j < lines.length && lines[j].kind === 'standfirst') {
          const [text, next] = gatherParagraphLoose(lines, j, 'standfirst', 'italic');
          standfirst = text;
          j = next;
        }
        out.push(['chap', titleCase(label), titleLines, standfirst]);
        i = j;
        break;
      }
      case 'toctitle': {
        const [title, afterTitle] = gatherHeading(lines, i, 'toctitle');
        let subline = '';
        let j = afterTitle;
        if (j < lines.length && lines[j].kind === 'tocsub') {
          const [text, next] = gatherParagraphLoose(lines, j, 'tocsub', 'italic');
          subline = text;
          j = next;
        }
        out.push(['toc', title, subline]);
        i = j;
        break;
      }
      case 'boxlabel': {
        const [box, next] = gatherBox(lines, i);
        if (box.kind === 'arg') out.push(['arg', splitArgument(box)]);
        else if (box.kind === 'rem') out.push(['rem', box.paras]);
        else if (box.kind === 'assume') {
          out.push(['assume', box.label.replace(/^THE HIDDEN ASSUMPTION\s*[—–-]\s*/i, ''), box.paras]);
        } else out.push([box.kind, '', box.paras]);
        i = next;
        break;
      }
      case 'thead':
      case 'tcell': {
        const [table, next] = gatherTable(lines, i);
        out.push(['table', table.headers, table.rows]);
        i = next;
        break;
      }
      case 'bullet': {
        const items = [];
        let j = i;
        while (j < lines.length && lines[j].kind === 'bullet') {
          /* The bullet glyph opens the first run of the item's own first line;
             strip it, and let the line start where the text does so the fit
             test measures the item's measure and not the bullet's indent. */
          const [head, ...rest] = lines[j].runs;
          const cut = head.text.indexOf('•') + 1;
          const shorn = {
            ...head,
            text: head.text.slice(cut).replace(/^\s+/, ''),
            xs: head.xs.slice(cut + (head.text.slice(cut).length - head.text.slice(cut).replace(/^\s+/, '').length)),
          };
          shorn.x = shorn.xs[0] ?? MEASURE.bullet.left;
          const first = {
            ...lines[j],
            x: shorn.x,
            runs: shorn.text ? [shorn, ...rest] : rest,
          };
          const collected = [first];
          let k = j + 1;
          // A wrapped list line is ordinary body type indented to the list's
          // own measure, so it is that measure the fit test has to use.
          while (k < lines.length
            && continues(lines[k - 1], lines[k], 'body', 'bullet')) {
            collected.push(lines[k]);
            k += 1;
          }
          items.push(joinLines(collected));
          j = k;
        }
        out.push(['ul', items]);
        i = j;
        break;
      }
      case 'body': {
        // A drop cap indents its opening lines by the width of the letter,
        // which is never less than forty points. Nothing else in the book
        // indents body type that far.
        if (line.x > MEASURE.body.left + 30) {
          const [html, next] = gatherDropCap(lines, i);
          out.push(['dc', html]);
          i = next;
        } else {
          const [html, next] = gatherParagraph(lines, i, 'body');
          out.push(['p', html]);
          i = next;
        }
        break;
      }
      case 'end':
      case 'endsub': {
        const [text, next] = gatherHeading(lines, i, line.kind);
        out.push([line.kind, text]);
        i = next;
        break;
      }
      case 'dropcap':
        // A cap with no indented run before it never happens; skip defensively.
        i += 1;
        break;
      default:
        throw new Error(
          `Unclassified line on page ${line.page}: `
          + `${line.runs[0].face} ${line.runs[0].size} ${line.runs[0].col} `
          + `x=${line.x.toFixed(1)} ${JSON.stringify(plain(line.runs).slice(0, 60))}`
        );
    }
  }
  return out;
}

/** A centred or otherwise non-measured style: join on the vertical gap alone. */
function gatherParagraphLoose(lines, i, kind, base) {
  const collected = [lines[i]];
  let j = i + 1;
  while (j < lines.length && lines[j].kind === kind
    && lines[j].page === lines[j - 1].page
    && lines[j].y - lines[j - 1].y <= LEADING[kind] + 3) {
    collected.push(lines[j]);
    j += 1;
  }
  return [joinLines(collected, base), j];
}

/**
 * "CHAPTER ONE" back to "Chapter One".
 *
 * The press module upper-cases every label as it draws it, so the original
 * case cannot be read back off the page. For a chapter label it does not need
 * to be: the vocabulary is the word "Chapter" and one number word, and there
 * is exactly one right answer.
 */
const titleCase = (s) => s.toLowerCase()
  .replace(/(^|[\s—–-])([a-z])/g, (_, sep, c) => sep + c.toUpperCase());

/** Parse one part's PDF into its cover and its token stream. */
export function parsePart(file) {
  const doc = mupdf.Document.openDocument(readFileSync(file), 'application/pdf');
  const cover = readCover(readPage(doc, 1));
  const tokens = tokenise(bodyLines(doc));
  return { cover, tokens, pages: doc.countPages() };
}

export { tokenise, bodyLines, readCover, joinLines };
