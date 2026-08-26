/**
 * wars-of-punjab-pdf.mjs
 *
 * Reconstructs one part of "The Wars of Punjab" from its designed PDF, for the
 * fourteen parts whose authored HTML no longer exists on this machine.
 *
 * The PDFs were rendered from HTML whose stylesheet we still have (parts 1 and
 * 2 shipped with their source), so every element in the book has a known,
 * distinct type signature — font face, point size and left edge. That makes the
 * reconstruction a classification problem rather than a guess:
 *
 *   Poppins-Bold  8   alone on its line ......... chapter kicker
 *   Poppins-Bold  8   followed by body text ..... timeline row
 *   Caladea-Bold  18  ........................... section heading (h3)
 *   Poppins-Bold  10  ........................... h4
 *   Poppins-Bold  9   ........................... h5, or a glossary term
 *   Poppins-Bold  7   x≈63 "WON BY" ............. war card banner
 *   Poppins-Bold  7   x≈77 / x≈323 ............... war card fact grid, 2 columns
 *   Poppins-Bold  7   x≈64 / x≈316 "WHY …" ...... win/lose panel, 2 columns
 *   Poppins-Bold  7   x≈67 + Caladea-Bold 11 .... story box
 *   Poppins-Bold  7   x≈64 ...................... note box
 *   Poppins-Bold  6   ........................... honesty label (Certain/Likely/Story)
 *   Caladea-Italic 12 ........................... section lede
 *   Caladea-Bold  33  ........................... drop capital
 *   Caladea-*     10  x≈51 ...................... body paragraph
 *   Caladea-*     10  x≈65 ...................... list item
 *   Poppins-Regular 6 ........................... running head / folio (dropped)
 *
 * Two mupdf details make this work. `preserve-spans` keeps each run of one font
 * as its own span, so inline bold and italic survive intact. And the char-level
 * `walk()` pass recovers word boundaries inside letter-spaced small caps, where
 * the text layer alone gives "W A R O N E" with no way to tell which gaps were
 * spaces — see despace().
 */
import * as mupdf from 'mupdf';
import { readFileSync } from 'node:fs';

/* Left edges, in PDF points, of every column the layout uses. Derived from the
   stylesheet's fixed padding, so they are stable across all sixteen parts. */
const AT = {
  body: (x) => x >= 46 && x <= 58,
  listItem: (x) => x >= 59 && x <= 71,
  boxLabel: (x) => x >= 58 && x <= 72,
  gridLeft: (x) => x >= 72 && x <= 96,
  gridRight: (x) => x >= 306 && x <= 348,
  source: (x) => x >= 72 && x <= 96,
};

const HONESTY = {
  CERTAIN: 'certain',
  LIKELY: 'likely',
  STORY: 'story',
};

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const collapse = (s) => s.replace(/\s+/g, ' ').trim();

/**
 * Rebuild a letter-spaced run of small caps.
 *
 * Letter-spacing puts a gap between every pair of glyphs, and mupdf turns each
 * one into a space — so "WAR ONE" arrives as "W A R O N E" and the real word
 * break is indistinguishable from the rest. It is recoverable from geometry:
 * measured from the space's own origin, a synthetic gap advances by the
 * letter-spacing alone, while a true word space adds the space glyph's width on
 * top. The two cluster far apart, so we split the run's advances at their widest
 * jump. A fixed ratio will not do — letter-spacing runs from .14em to .3em
 * depending on the element, and the clusters move with it.
 */
function despace(chars) {
  const size = chars[0]?.size ?? 8;
  const gaps = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i].c === ' ' && chars[i + 1]) gaps.push(chars[i + 1].x - chars[i].x);
  }

  let cut = Infinity;
  if (gaps.length > 1) {
    const sorted = [...gaps].sort((a, b) => a - b);
    let widest = 0;
    let at = -1;
    for (let i = 0; i + 1 < sorted.length; i++) {
      const d = sorted[i + 1] - sorted[i];
      if (d > widest) { widest = d; at = i; }
    }
    // No jump worth the name means the run is a single word.
    if (widest > 0.10 * size) cut = (sorted[at] + sorted[at + 1]) / 2;
  }

  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch.c !== ' ') { out += ch.c; continue; }
    const next = chars[i + 1];
    if (next && next.x - ch.x > cut) out += ' ';
  }
  return collapse(out);
}

const faceOf = (name) => String(name ?? '').replace(/^[A-Z]{6}\+/, '');

/** Letter-spaced runs, keyed so a text-layer span can look up its real wording. */
function despacedRuns(stext) {
  const runs = [];
  stext.walk({
    onChar(c, origin, font, size) {
      const face = faceOf(font?.getName?.());
      const last = runs[runs.length - 1];
      if (last && last.face === face && Math.abs(last.size - size) < 0.05
        && Math.abs(last.y - origin[1]) < 1.5 && origin[0] >= last.x1 - 1) {
        last.chars.push({ c, x: origin[0], size });
        last.x1 = origin[0];
      } else {
        runs.push({
          face, size, y: origin[1], x0: origin[0], x1: origin[0],
          chars: [{ c, x: origin[0], size }],
        });
      }
    },
  });

  /* Keyed on the letters alone, with the left edge kept only to break ties:
     walk() reports a glyph's pen origin while the text layer reports its ink
     box, so the two disagree by up to a point and cannot be matched exactly. */
  const fixed = new Map();
  for (const run of runs) {
    // Only the small-caps sans face is ever letter-spaced in this book, and a
    // genuinely letter-spaced run is almost entirely single characters. Both
    // guards matter: prose that happens to open ", a hill chieftain…" also
    // starts with single letters, and stripping its spaces would ruin it.
    if (!run.face.startsWith('Poppins')) continue;
    const raw = run.chars.map((c) => c.c).join('').trim();
    const tokens = raw.split(/\s+/).filter(Boolean);
    // Every glyph stands alone in a letter-spaced run — punctuation included —
    // so "all tokens are one character" identifies them exactly. Anything
    // looser also matches prose that opens ", a hill chieftain…", and
    // stripping the spaces out of that would wreck the sentence.
    if (tokens.length < 2 || tokens.some((t) => t.length !== 1)) continue;

    const key = raw.replace(/\s+/g, '');
    if (!fixed.has(key)) fixed.set(key, []);
    fixed.get(key).push({ x: run.x0, text: despace(run.chars) });
  }
  return fixed;
}

/** The real wording of a letter-spaced span, if this page had one. */
function despacedText(fixed, raw, x) {
  const found = fixed.get(raw.replace(/\s+/g, ''));
  if (!found) return null;
  let best = found[0];
  for (const candidate of found) {
    if (Math.abs(candidate.x - x) < Math.abs(best.x - x)) best = candidate;
  }
  return best.text;
}

/**
 * One page as ordered blocks. mupdf's blocks correspond to paragraphs and to
 * individual cells, which is exactly the grouping we want; we only regroup the
 * spans inside a block into visual lines, since a heading and the honesty label
 * beside it sit on one line but on different baselines.
 */
function readPage(doc, pageNo) {
  const page = doc.loadPage(pageNo);
  const stext = page.toStructuredText('preserve-spans');
  const fixed = despacedRuns(stext);
  const json = JSON.parse(stext.asJSON());
  const blocks = [];

  for (const block of json.blocks) {
    if (block.type !== 'text') continue;

    const spans = [];
    for (const span of block.lines ?? []) {
      const face = faceOf(span.font?.name);
      const size = span.font?.size ?? 0;
      // The running head and folio are the only 6pt Poppins-Regular on a page.
      if (face === 'Poppins-Regular' && size <= 6) continue;
      const raw = span.text ?? '';
      if (!raw) continue;
      const text = despacedText(fixed, raw, span.bbox.x) ?? raw;
      spans.push({
        face, size, text,
        bold: /Bold/.test(face), italic: /Italic/.test(face),
        x: span.bbox.x, y: span.bbox.y, h: span.bbox.h, w: span.bbox.w,
      });
    }
    if (!spans.length) continue;

    // Group into visual lines by vertical overlap, not by equal baseline.
    const lines = [];
    for (const span of spans) {
      const line = lines.find((l) => {
        const top = Math.max(l.y, span.y);
        const bottom = Math.min(l.y + l.h, span.y + span.h);
        return bottom - top > Math.min(l.h, span.h) * 0.5;
      });
      if (line) {
        line.spans.push(span);
        line.y = Math.min(line.y, span.y);
        line.h = Math.max(line.h, span.h);
      } else {
        lines.push({ y: span.y, h: span.h, spans: [span] });
      }
    }
    for (const line of lines) {
      line.spans.sort((a, b) => a.x - b.x);
      line.x = line.spans[0].x;
      line.page = pageNo;
    }
    lines.sort((a, b) => a.y - b.y);

    blocks.push({
      page: pageNo,
      y: Math.min(...lines.map((l) => l.y)),
      x: Math.min(...lines.map((l) => l.x)),
      lines,
      spans,
    });
  }

  blocks.sort((a, b) => a.y - b.y || a.x - b.x);
  return blocks;
}

/** Inline markup for a run of spans, with the split runs stitched back up. */
function inline(spans) {
  let out = '';
  for (const span of spans) {
    let text = esc(span.text);
    if (span.bold && span.italic) text = `<strong><em>${text}</em></strong>`;
    else if (span.bold) text = `<strong>${text}</strong>`;
    else if (span.italic) text = `<em>${text}</em>`;
    out += text;
  }
  // A ligature is emitted as its own span, so "fi" arrives split in two.
  return out
    .replace(/<\/strong><strong>/g, '')
    .replace(/<\/em><em>/g, '')
    .replace(/<\/strong><\/em><em><strong>/g, '');
}

/** Join a block's wrapped lines back into one run of prose. */
function flow(lines) {
  let out = '';
  for (const line of lines) {
    const text = inline(line.spans);
    if (!out) { out = text; continue; }
    // A line ending in a hyphen is a compound broken across the measure.
    out += out.replace(/<[^>]+>/g, '').endsWith('-') ? text : ` ${text}`;
  }
  return collapse(out);
}

const plain = (block) => collapse(block.lines.map((l) => l.spans.map((s) => s.text).join('')).join(' '));

function kindOf(block) {
  const first = block.lines[0].spans[0];
  const { face, size } = first;
  const all = block.spans;

  if (all.every((s) => !/^(Poppins|Caladea)/.test(s.face))) return 'divider';
  if (face === 'Caladea-Bold' && size >= 26) return 'dropcap';
  if (face === 'Caladea-Bold' && size >= 16 && size < 26) return 'h3';

  if (face === 'Poppins-Bold' && size === 8) {
    return all.some((s) => s.face.startsWith('Caladea')) ? 'timeline' : 'kicker';
  }
  if (face === 'Poppins-Bold' && size === 10) return 'h4';
  if (face === 'Poppins-Bold' && size === 9) return 'h5';
  if (face === 'Poppins-Bold' && size === 6) return 'badge';
  if (face === 'Poppins-Bold' && size === 7) {
    /* Several small-caps labels side by side is a table header. Every other
       label in the book stands alone in its block, and a heading that wraps
       keeps the same left edge — so it is the horizontal spread that tells
       them apart, not the count. Cells sit on slightly different baselines,
       so the whole block is considered rather than its first line. */
    const labels = all.filter((s) => s.face === 'Poppins-Bold' && s.size === 7);
    const spread = Math.max(...labels.map((s) => s.x)) - Math.min(...labels.map((s) => s.x));
    return labels.length >= 2 && spread > 20 ? 'thead' : 'label';
  }
  if (face === 'Poppins-Regular' && size === 8) return 'cite';

  if (face === 'Caladea-Italic' && size === 12) return 'lede';
  if (face.startsWith('Caladea') && size === 8) return 'source';
  if (face.startsWith('Caladea') && size === 12) return 'lede';
  return 'para';
}

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

function badgeHtml(text) {
  const key = collapse(text).toUpperCase();
  const tone = HONESTY[key];
  return tone ? ` <span class="w-lawtag w-lawtag--${tone}">${esc(collapse(text))}</span>` : '';
}

/** Split a run of two-column blocks into their left and right stacks. */
function columns(blocks) {
  const left = blocks.filter((b) => !AT.gridRight(b.x));
  const right = blocks.filter((b) => AT.gridRight(b.x));
  return [left, right];
}

/**
 * Turn a column of blocks into list items. The layout gives every item the same
 * left edge as its own continuation lines, so the only separator is the extra
 * leading between items — comfortably wider than the line height.
 */
function itemise(blocks) {
  const lines = blocks.flatMap((b) => b.lines);
  lines.sort((a, b) => a.page - b.page || a.y - b.y);

  const items = [];
  let previous = null;
  for (const line of lines) {
    let starts;
    if (!previous) starts = true;
    else if (line.page !== previous.page) {
      // Across a column or page break the vertical gap means nothing. Every
      // item in these lists opens with a bold lead-in, so that is the signal.
      starts = line.spans[0].bold;
    } else {
      starts = line.y - previous.y > 17;
    }
    if (starts) items.push([line]);
    else items[items.length - 1].push(line);
    previous = line;
  }
  return items.map((group) => flow(group));
}

export function parsePdfPart(pdfPath) {
  const doc = mupdf.Document.openDocument(readFileSync(pdfPath), 'application/pdf');

  /* ---- cover: the part's own title and standfirst ---- */
  const cover = readPage(doc, 0);
  const coverLines = cover.flatMap((b) => b.lines).sort((a, b) => a.y - b.y);
  /* Spans within a line butt straight up against each other — a ligature is a
     span of its own — so only the line breaks are worth a space. */
  const coverText = (keep) => {
    const rows = coverLines
      .map((l) => l.spans.filter(keep).map((s) => s.text).join(''))
      .filter(Boolean);
    return collapse(rows.reduce((acc, row) => (
      // A title set over two lines can break inside a hyphenated name.
      !acc ? row : acc + (acc.endsWith('-') ? '' : ' ') + row
    ), ''));
  };

  const coverSpans = cover.flatMap((b) => b.spans);
  const biggest = Math.max(...coverSpans.filter((s) => s.face === 'Caladea-Bold').map((s) => s.size));
  const title = coverText((s) => s.face === 'Caladea-Bold' && s.size === biggest);
  const lead = coverText((s) => s.face === 'Caladea-Italic' && s.size >= 12);

  /* ---- body ---- */
  const blocks = [];
  for (let p = 1; p < doc.countPages(); p++) blocks.push(...readPage(doc, p));

  const sections = [];
  let current = null;
  const open = (heading, badge) => {
    current = { title: heading, badge, html: [] };
    sections.push(current);
  };
  const push = (html) => { if (current) current.html.push(html); };

  let pendingDropcap = null;
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    const kind = kindOf(block);

    /* A kicker only marks that a section is starting; the heading names it. */
    if (kind === 'kicker') { i++; continue; }

    if (kind === 'h3') {
      const heads = block.lines[0].spans.filter((s) => s.face !== 'Poppins-Bold' || s.size !== 6);
      const badge = block.spans.find((s) => s.face === 'Poppins-Bold' && s.size === 6);
      const extra = block.lines.slice(1).flatMap((l) => l.spans).filter((s) => s.face.startsWith('Caladea'));
      open(collapse([...heads, ...extra].map((s) => s.text).join(' ')), badge ? collapse(badge.text) : null);
      i++;
      continue;
    }

    if (!current) { i++; continue; }

    if (kind === 'dropcap') { pendingDropcap = plain(block); i++; continue; }
    if (kind === 'divider') { push('<hr class="w-soft">'); i++; continue; }

    if (kind === 'lede') {
      // A standfirst that wraps past a column break arrives as several blocks.
      const run = [];
      while (i < blocks.length && kindOf(blocks[i]) === 'lede') { run.push(...blocks[i].lines); i++; }
      push(`<p class="w-lead">${flow(run)}</p>`);
      continue;
    }
    if (kind === 'h4') { push(`<h4 class="w-h4">${esc(plain(block))}</h4>`); i++; continue; }

    if (kind === 'h5') {
      // A glossary term and an h5 share a size; only the body that follows
      // separates them — definitions run at 9pt, ordinary prose at 10pt.
      const next = blocks[i + 1];
      const isTerm = next && kindOf(next) === 'para' && next.lines[0].spans[0].size === 9 && AT.body(next.x);
      if (isTerm) {
        /* A term opens an entry and everything after it belongs to that
           entry until the next term, since a definition long enough to wrap
           past a page break arrives as more than one block. */
        const defs = [];
        let entry = null;
        while (i < blocks.length) {
          const at = blocks[i];
          const what = kindOf(at);
          if (what === 'h5') {
            entry = { term: plain(at), lines: [] };
            defs.push(entry);
            i++;
          } else if (entry && what === 'para' && AT.body(at.x)
            && at.lines[0].spans[0].size === 9) {
            entry.lines.push(...at.lines);
            i++;
          } else break;
        }
        push(`<div class="w-gloss-list">${defs.map((d) => `<div class="w-def">`
          + `<span class="w-def-term">${esc(d.term)}</span>`
          + `<p class="w-def-body">${flow(d.lines)}</p></div>`).join('')}</div>`);
        continue;
      }
      push(`<h5 class="w-h5">${esc(plain(block))}</h5>`);
      i++;
      continue;
    }

    if (kind === 'timeline') {
      const rows = [];
      while (i < blocks.length && kindOf(blocks[i]) === 'timeline') {
        const b = blocks[i];
        const year = b.spans.filter((s) => s.face === 'Poppins-Bold' && s.size === 8);
        const rest = b.lines.map((l) => ({ ...l, spans: l.spans.filter((s) => !year.includes(s)) }))
          .filter((l) => l.spans.length);
        rows.push(`<div class="w-tl-item"><span class="w-tl-year">${esc(collapse(year.map((s) => s.text).join(' ')))}</span>`
          + `<span class="w-tl-text">${flow(rest)}</span></div>`);
        i++;
      }
      push(`<div class="w-timeline">${rows.join('')}</div>`);
      continue;
    }

    if (kind === 'thead') {
      /* A header cell can wrap onto a second line, and a wide one can land in
         a block of its own, so the whole header band is collected first and
         its spans clustered into columns by left edge. */
      const headSpans = [];
      let j = i;
      while (j < blocks.length && blocks[j].y < block.y + 30
        && blocks[j].spans.every((s) => s.face === 'Poppins-Bold' && s.size === 7)) {
        headSpans.push(...blocks[j].spans);
        j++;
      }

      const cols = [];
      for (const span of headSpans.sort((a, b) => a.x - b.x || a.y - b.y)) {
        const col = cols.find((c) => Math.abs(c.x - span.x) < 8);
        if (col) { col.spans.push(span); col.x = Math.min(col.x, span.x); }
        else cols.push({ x: span.x, spans: [span] });
      }
      const headings = cols.map((c) => collapse(c.spans.sort((a, b) => a.y - b.y).map((s) => s.text).join(' ')));

      const columnOf = (x) => {
        let col = 0;
        for (let c = 0; c < cols.length; c++) if (x + 4 >= cols[c].x) col = c;
        return col;
      };

      /* Body rows: a row's cells can be split across blocks, so group the
         blocks that start on the same baseline back into one row. */
      const rowBlocks = [];
      while (j < blocks.length && blocks[j].x >= 56
        && ['para', 'badge', 'source'].includes(kindOf(blocks[j]))) {
        rowBlocks.push(blocks[j]); j++;
      }
      const rows = [];
      for (const b of rowBlocks) {
        const row = rows.find((r) => Math.abs(r.y - b.y) < 8);
        if (row) row.blocks.push(b);
        else rows.push({ y: b.y, blocks: [b] });
      }

      const body = rows.map(({ blocks: rb }) => {
        const cells = cols.map(() => []);
        for (const span of rb.flatMap((b) => b.spans)) {
          const target = cells[columnOf(span.x)];
          const last = target[target.length - 1];
          if (last && Math.abs(last.y - span.y) < 5) last.spans.push(span);
          else target.push({ y: span.y, spans: [span] });
        }
        return `<tr>${cells.map((lines) => `<td>${flow(lines.sort((a, b) => a.y - b.y))}</td>`).join('')}</tr>`;
      });

      push('<div class="w-table-scroll"><table class="w-table"><thead><tr>'
        + headings.map((h) => `<th>${esc(sentenceCase(h))}</th>`).join('')
        + `</tr></thead><tbody>${body.join('')}</tbody></table></div>`);
      i = j;
      continue;
    }

    if (kind === 'label') {
      /* The banner puts its label and its value on one line, so read the label
         from its own spans rather than from the whole block. */
      const labelSpans = block.lines[0].spans.filter((s) => s.face === 'Poppins-Bold' && s.size === 7);
      const text = collapse(labelSpans.map((s) => s.text).join(' '));
      const upper = text.toUpperCase();

      /* Win/lose panel: two headings sharing a baseline, in two columns. */
      const twin = blocks[i + 1];
      if (twin && kindOf(twin) === 'label' && Math.abs(twin.y - block.y) < 6 && AT.gridRight(twin.x)) {
        let heads = [block, twin];
        let j = i + 2;
        // A long heading wraps onto its own block directly beneath.
        while (j < blocks.length && kindOf(blocks[j]) === 'label' && blocks[j].y - block.y < 24) {
          heads.push(blocks[j]); j++;
        }
        const body = [];
        while (j < blocks.length && (AT.gridLeft(blocks[j].x) || AT.gridRight(blocks[j].x))
          && !['label', 'h3', 'kicker', 'h4', 'thead'].includes(kindOf(blocks[j]))) {
          body.push(blocks[j]); j++;
        }
        const [lh, rh] = columns(heads);
        const [lb, rb] = columns(body);
        const side = (headBlocks, bodyBlocks, tone) => {
          const label = collapse(headBlocks.map((b) => plain(b)).join(' '));
          const items = itemise(bodyBlocks);
          return `<div class="w-side w-side--${tone}"><span class="w-who">${esc(label)}</span>`
            + `<ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul></div>`;
        };
        push(`<div class="w-sides w-sides--pair">${side(lh, lb, 'b')}${side(rh, rb, 'a')}</div>`);
        i = j;
        continue;
      }

      /* War card: the WON BY banner, then the fact grid beneath it. */
      if (upper === 'WON BY') {
        const value = block.lines[0].spans.filter((s) => s.face.startsWith('Caladea'));
        let j = i + 1;
        if (!value.length && j < blocks.length && kindOf(blocks[j]) === 'para') {
          value.push(...blocks[j].spans); j++;
        }
        const facts = [];
        while (j < blocks.length && (AT.gridLeft(blocks[j].x) || AT.gridRight(blocks[j].x))
          && ['label', 'para'].includes(kindOf(blocks[j]))) {
          facts.push(blocks[j]); j++;
        }
        const [lf, rf] = columns(facts);
        /* A key opens a cell, and everything after it belongs to that cell
           until the next key. The renderer breaks a wrapped value across
           blocks unpredictably — sometimes one per line — so walking the
           labels is the only safe way to pair them. */
        const pair = (stack) => {
          const cells = [];
          for (const b of stack) {
            const isKey = b.spans.every((s) => s.face === 'Poppins-Bold' && s.size === 7);
            if (isKey) cells.push({ key: plain(b), lines: [] });
            else if (cells.length) cells[cells.length - 1].lines.push(...b.lines);
          }
          return cells.map((c) => [c.key, flow(c.lines)]);
        };
        const rows = [];
        const lp = pair(lf);
        const rp = pair(rf);
        for (let k = 0; k < Math.max(lp.length, rp.length); k++) {
          if (lp[k]) rows.push(lp[k]);
          if (rp[k]) rows.push(rp[k]);
        }
        const body = rows.map(([k, v]) => `<p><strong>${esc(titleCase(k))}:</strong> ${v}</p>`).join('');
        push(`<div class="w-box w-box--fact"><span class="w-box-label">Won by: ${esc(collapse(value.map((s) => s.text).join('')))}</span>${body}</div>`);
        i = j;
        continue;
      }

      /* Story box, or a plain note: the story carries a display title. */
      let j = i + 1;
      const titleBlock = blocks[j];
      const isStory = titleBlock && titleBlock.lines[0].spans[0].face === 'Caladea-Bold'
        && titleBlock.lines[0].spans[0].size >= 11 && titleBlock.lines[0].spans[0].size < 16;
      if (isStory) j++;

      const body = [];
      while (j < blocks.length && !AT.body(blocks[j].x)
        && !['label', 'h3', 'h4', 'kicker', 'thead', 'timeline'].includes(kindOf(blocks[j]))) {
        body.push(blocks[j]); j++;
      }
      const paras = body.map((b) => `<p>${flow(b.lines)}</p>`).join('');

      if (isStory) {
        push(`<div class="w-myth"><div class="w-myth-head">`
          + `<span class="w-myth-tag">${esc(text)}</span>`
          + `<span class="w-myth-title">${esc(plain(titleBlock))}</span></div>`
          + `<div class="w-myth-body">${paras}</div></div>`);
      } else {
        push(`<div class="w-box w-box--weigh"><span class="w-box-label">${esc(text)}</span>${paras}</div>`);
      }
      i = j;
      continue;
    }

    if (kind === 'source') {
      const items = [];
      while (i < blocks.length && kindOf(blocks[i]) === 'source') {
        items.push(`<li>${flow(blocks[i].lines)}</li>`);
        i++;
      }
      push(`<ul class="w-srcs">${items.join('')}</ul>`);
      continue;
    }

    if (kind === 'cite') { push(`<p class="w-srcline">${esc(plain(block))}</p>`); i++; continue; }

    /* Body prose, blockquotes and lists. */
    if (kind === 'para') {
      const first = block.lines[0].spans[0];

      /* A verse quote: indented italic, sometimes several stanzas long, and
         closed by its source line in the small sans face. */
      const isQuote = (b) => {
        const s = b.lines[0].spans[0];
        return s.face === 'Caladea-Italic' && s.size === 10 && !AT.body(b.x);
      };
      if (isQuote(block)) {
        const lines = [];
        while (i < blocks.length && kindOf(blocks[i]) === 'para' && isQuote(blocks[i])) {
          lines.push(...blocks[i].lines); i++;
        }
        let credit = '';
        if (i < blocks.length && kindOf(blocks[i]) === 'cite') {
          credit = `<span class="w-srcline">${esc(plain(blocks[i]))}</span>`;
          i++;
        }
        push(`<div class="w-box w-box--quote">${lines.map((l) => `<p>${inline(l.spans)}</p>`).join('')}${credit}</div>`);
        continue;
      }

      if (AT.listItem(block.x) && first.size === 10) {
        const group = [];
        while (i < blocks.length && kindOf(blocks[i]) === 'para'
          && (AT.listItem(blocks[i].x) || /^\d+\.\s/.test(plain(blocks[i])))
          && blocks[i].lines[0].spans[0].size === 10) {
          group.push(blocks[i]); i++;
        }
        const ordered = /^\d+\.\s/.test(plain(group[0]));
        const items = itemise(group).map((t) => t.replace(/^\d+\.\s*/, ''));
        push(`<${ordered ? 'ol' : 'ul'}>${items.map((t) => `<li>${t}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
        continue;
      }

      let html = flow(block.lines);
      if (pendingDropcap) {
        html = `<span class="w-dropcap">${esc(pendingDropcap)}</span>${html}`;
        pendingDropcap = null;
      }
      push(`<p>${html}</p>`);
      i++;
      continue;
    }

    i++;
  }

  return { title, lead, sections };
}

/**
 * The print edition sets its fact keys and table headings in small caps, so the
 * PDF only preserves the upper-cased form. The web edition sets them in
 * sentence case, matching the two parts whose authored source survives.
 */
function titleCase(label) {
  const text = collapse(label).toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const sentenceCase = titleCase;

export { badgeHtml, esc, collapse };
