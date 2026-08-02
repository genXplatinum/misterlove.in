/**
 * import-punjab.mjs
 *
 * Importer for "Punjab: The Whole Truth" — a thirteen-part investigation, of
 * which four are written.
 *
 * No HTML source for this series survives, only the rendered PDFs, so this
 * recovers structure from the typography the way import-forgotten-gods.mjs
 * does: font size and the left edge of the text tell a chapter title from a
 * subheading from body copy from a boxed explainer, and the gap between
 * baselines tells where one paragraph ends and the next begins.
 *
 * Three things about these particular PDFs need care, and all three would
 * corrupt prose silently if ignored:
 *
 *   1. Justified setting splits a line into several text items with no space
 *      between them. Word spaces are restored from the horizontal gap.
 *   2. Line-broken words end in a soft hyphen (U+2010) which must be rejoined,
 *      not kept — otherwise "immedi‐ately" survives into the web edition.
 *   3. Small-caps labels are letterspaced, one item per word, so the spacing
 *      is collapsed inside an item and word breaks come from the item gap.
 *
 * The first two are handled here; the third in punjab-text.mjs.
 *
 * Requires pdfjs-dist, which is local-only — CI never runs this, the generated
 * data file is committed:
 *
 *     npm i --no-save pdfjs-dist
 *     node scripts/import-punjab.mjs
 */
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readLines } from './punjab-text.mjs';

const SRC_DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/Debunk/Punjab - The Whole Truth';
const OUT = 'src/data/writing/punjab.js';
const PUBLISHED = '2026-08-02';
const WORDS_PER_MINUTE = 220;

/* Typography → meaning, measured from the documents. `x` is the left edge of
   the text; a role that can sit at more than one column lists them all. */
/* Left edges drift a little between parts — the running head sits at 171 in
   Part 1 and 179 in Part 4 — so a role is matched on a band, not a point, and
   the bands are ordered most specific first. `to: Infinity` reads "anything
   further right", which is how the furniture in the outer margins is caught. */
const ROLES = [
  { size: 19, from: 55, to: 100, role: 'heading' },
  { size: 13.5, from: 78, to: 100, role: 'pull' },
  { size: 12.5, from: 55, to: 100, role: 'subheading' },
  { size: 12, from: 55, to: 100, role: 'lead' },

  { size: 11, from: 60, to: 66, role: 'body' },
  { size: 11, from: 66, to: 69, role: 'numbered' },
  { size: 11, from: 69, to: 73, role: 'bullet' },
  { size: 11, from: 78, to: 86, role: 'body' },
  { size: 11, from: 73, to: 78, role: 'listCont' },
  { size: 11, from: 86, to: 400, role: 'listCont' },

  { size: 10.5, from: 55, to: 70, role: 'contents' },
  { size: 10.5, from: 78, to: 100, role: 'quote' },

  { size: 10, from: 72, to: 78, role: 'scorecard' },
  { size: 10, from: 78, to: 86, role: 'boxBody' },
  { size: 10, from: 120, to: 400, role: 'scorecardCont' },
  { size: 10, from: 400, to: Infinity, role: 'byline' },

  { size: 9, from: 55, to: 70, role: 'footnote' },
  { size: 9, from: 70, to: 100, role: 'footnote' },
  { size: 9, from: 200, to: Infinity, role: 'folio' },

  { size: 8.5, from: 60, to: 67, role: 'kicker' },
  { size: 8.5, from: 67, to: 72, role: 'tableHead' },
  { size: 8.5, from: 72, to: 78, role: 'refBullet' },
  { size: 8.5, from: 78, to: 100, role: 'refCont' },

  { size: 8, from: 55, to: 100, role: 'caption' },

  { size: 7.5, from: 78, to: 81.5, role: 'boxLabel' },
  { size: 7.5, from: 81.5, to: 100, role: 'verdictLabel' },
  { size: 7.5, from: 120, to: Infinity, role: 'runningHead' },
];

function roleOf(line) {
  for (const r of ROLES) {
    if (r.size !== line.size) continue;
    if (line.x >= r.from && line.x < r.to) return r.role;
  }
  return null;
}

/* Furniture the web edition has its own version of. */
const DROP = new Set(['runningHead', 'folio', 'contents']);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const slugify = (s) => s
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9\s-]/g, ' ')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 60)
  .replace(/-$/, '');

/** Join wrapped lines, healing the soft hyphens that justified setting adds. */
function joinLines(lines) {
  let out = '';
  for (const line of lines) {
    if (!out) { out = line; continue; }
    if (out.endsWith('\u2010')) { out = out.slice(0, -1) + line; continue; }
    // A real hyphenated compound broken across lines keeps its hyphen.
    if (/[a-z]-$/.test(out) && /^[a-z]/.test(line)) { out += line; continue; }
    out += ` ${line}`;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Consecutive lines of one role become blocks. Within a role, a baseline gap
 * wider than twice the type size starts a new block — that is the difference
 * between a wrapped line and a new paragraph.
 */
function blocksOf(lines) {
  const blocks = [];
  let current = null;
  let lastY = null;
  let lastPage = null;

  const unknown = new Map();
  for (const line of lines) {
    const role = roleOf(line);
    if (!role) {
      // Collected rather than thrown one at a time, so a single run reports
      // every unmapped role in the document instead of just the first.
      const key = `${line.size}pt x${Math.round(line.x)}`;
      if (!unknown.has(key)) unknown.set(key, []);
      if (unknown.get(key).length < 3) unknown.get(key).push(line.text.slice(0, 80));
      continue;
    }
    /* Furniture is skipped without disturbing the run in progress: the
       running head sits at the top of every page, and closing the block on it
       would break every paragraph that continues across a page turn. */
    if (DROP.has(role)) continue;

    /* Within a page, a baseline gap wider than twice the type size ends the
       run. Across a page break the y-coordinate resets, so the gap says
       nothing — there, the sentence decides: prose that stops mid-word or
       without terminal punctuation is the same paragraph, continued. */
    const turned = current && line.page !== lastPage;
    const tail = current?.lines[current.lines.length - 1] ?? '';
    const continues = turned && /[‐]$|[^.!?:”’"']$/.test(tail);

    const broke = current?.role !== role
      || (turned ? !continues : lastY !== null && lastY - line.y > line.size * 2);

    if (broke) {
      current = { role, lines: [], page: line.page };
      blocks.push(current);
    }
    current.lines.push(line.text);
    current.y ??= line.y;
    lastY = line.y;
    lastPage = line.page;
  }

  if (unknown.size) {
    const report = [...unknown.entries()]
      .map(([key, samples]) => `  ${key}\n${samples.map((s) => `      "${s}"`).join('\n')}`)
      .join('\n');
    throw new Error(`${unknown.size} unmapped typographic role(s):\n${report}`);
  }
  return blocks.map((b) => ({ role: b.role, text: joinLines(b.lines), page: b.page, y: b.y }));
}

/* ------------------------------------------------------------------
   Blocks → prose markup.
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   Tables.

   A table puts several cells on one baseline, so it cannot be read off the
   line list — one "line" there is a whole row with the columns run together,
   and a cell that wraps continues on later baselines under its own column
   only. Both are recovered from the raw items: cells cluster into columns by
   their left edge, and a new row begins wherever the leftmost column does.
   ------------------------------------------------------------------ */
const TABLE_SIZE = 9.5;
const COLUMN_TOLERANCE = 6;

function tableFrom(items) {
  const cells = items.filter((i) => i.size === TABLE_SIZE).sort((a, b) => b.y - a.y || a.x - b.x);
  if (!cells.length) return null;

  const columns = [];
  for (const cell of [...cells].sort((a, b) => a.x - b.x)) {
    const last = columns[columns.length - 1];
    if (last && Math.abs(cell.x - last) <= COLUMN_TOLERANCE) continue;
    columns.push(cell.x);
  }
  // One column is a timeline, not a table; the caller handles that.
  if (columns.length < 2) return null;

  const columnOf = (cell) => {
    let best = 0;
    for (let c = 1; c < columns.length; c += 1) {
      if (Math.abs(cell.x - columns[c]) < Math.abs(cell.x - columns[best])) best = c;
    }
    return best;
  };

  /* Rows are separated by vertical gaps, not by whether the first column
     happens to be filled: a cell that wraps onto a second line leaves the
     other columns empty on that baseline, and keying on column 0 would break
     the wrapped text off into a row of its own. Measured, a wrapped line sits
     ~14pt below its own first line and a new row ~26pt below the last. */
  const baselines = [...new Set(cells.map((c) => Math.round(c.y)))].sort((a, b) => b - a);
  const bands = [];
  for (const y of baselines) {
    const last = bands[bands.length - 1];
    if (last && last.top - y <= TABLE_SIZE * 1.9) { last.floor = y; continue; }
    bands.push({ top: y, floor: y });
  }
  if (!bands.length) return null;

  return bands.map((band, index) => {
    const ceiling = band.top + 1;
    const floor = index + 1 < bands.length ? bands[index + 1].top : -Infinity;
    const row = columns.map(() => []);
    for (const cell of cells) {
      if (cell.y > ceiling || cell.y <= floor) continue;
      row[columnOf(cell)].push(cell);
    }
    return row.map((stack) => joinLines(
      stack.sort((a, b) => b.y - a.y || a.x - b.x).map((c) => c.str)
    ));
  });
}

/**
 * Wrapped continuations are a separate role because they sit at their own
 * x-offset, but they are not separate content. A list continuation belongs to
 * the item above it; a scorecard continuation is the first line of the body
 * below it, which shares a baseline with its verdict label.
 */
function coalesce(blocks) {
  const out = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (b.role === 'listCont' && prev && ['bullet', 'numbered'].includes(prev.role)) {
      prev.text = joinLines([prev.text, b.text]);
      continue;
    }
    if (b.role === 'refCont' && prev?.role === 'refBullet') {
      prev.text = joinLines([prev.text, b.text]);
      continue;
    }
    if (b.role === 'listCont' && prev) { prev.text = joinLines([prev.text, b.text]); continue; }
    out.push({ ...b });
  }
  // Scorecard continuations attach forwards, so they are resolved in a second
  // pass once every block is in place.
  const merged = [];
  for (let i = 0; i < out.length; i += 1) {
    const b = out[i];
    if (b.role === 'scorecardCont') {
      const next = out[i + 1];
      if (next?.role === 'scorecard') { next.text = joinLines([b.text, next.text]); continue; }
      const prev = merged[merged.length - 1];
      if (prev) { prev.text = joinLines([prev.text, b.text]); continue; }
    }
    merged.push(b);
  }
  return merged;
}

function render(blocks) {
  const out = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    // Grid blocks carry `rows` instead of `text`.
    const body = b.text === undefined ? '' : esc(b.text);
    switch (b.role) {
      case 'lead':
        out.push(`<p class="w-lead">${body}</p>`);
        break;
      case 'body':
        out.push(`<p>${body}</p>`);
        break;
      case 'subheading':
        out.push(`<h3 class="w-h3">${body}</h3>`);
        break;
      case 'bullet':
      case 'numbered': {
        // Consecutive items of the same kind are one list.
        const kind = b.role;
        const items = [];
        let j = i;
        while (j < blocks.length && blocks[j].role === kind) {
          items.push(blocks[j].text.replace(/^[••]\s*/, '').replace(/^\d+\.\s*/, '').trim());
          j += 1;
        }
        i = j - 1;
        const tag = kind === 'numbered' ? 'ol' : 'ul';
        out.push(`<${tag}>${items.filter(Boolean).map((it) => `<li>${esc(it)}</li>`).join('')}</${tag}>`);
        break;
      }
      case 'quote':
        out.push(`<div class="w-box w-box--quote"><p>${body}</p></div>`);
        break;
      case 'caption':
        out.push(`<h4 class="w-h4">${body}</h4>`);
        break;
      case 'footnote':
        out.push(`<p class="w-small">${body}</p>`);
        break;
      case 'refBullet': {
        const items = [];
        let j = i;
        while (j < blocks.length && blocks[j].role === 'refBullet') {
          items.push(blocks[j].text.replace(/^[••]\s*/, '').trim());
          j += 1;
        }
        i = j - 1;
        out.push(`<ul>${items.filter(Boolean).map((it) => `<li>${esc(it)}</li>`).join('')}</ul>`);
        break;
      }
      case 'verdictLabel': {
        // A verdict labels the scorecard entry that follows it.
        const next = blocks[i + 1];
        if (next && ['scorecard', 'body'].includes(next.role)) {
          i += 1;
          out.push('<div class="w-box w-box--weigh">'
            + `<span class="w-box-label">${body}</span><p>${esc(next.text)}</p></div>`);
        } else {
          out.push(`<p class="w-small">${body}</p>`);
        }
        break;
      }
      case 'tableRows': {
        const width = Math.max(...b.rows.map((r) => r.length));
        out.push('<figure class="w-figure"><div class="w-table-scroll"><table class="w-table"><tbody>'
          + b.rows.map((r) => `<tr>${r.map((c, k) => `<td${k === 0 ? ' class="w-hi"' : ''}>${esc(c)}</td>`).join('')}${'<td></td>'.repeat(width - r.length)}</tr>`).join('')
          + '</tbody></table></div></figure>');
        break;
      }
      case 'timelineRows':
        out.push('<div class="w-timeline">' + b.rows.map((r) => {
          const m = r.match(/^((?:c\.\s*)?[\d,]+(?:\s*(?:BCE|CE))?(?:\s*[–-]\s*[\d,]+(?:\s*(?:BCE|CE))?)?|\d{1,2} \w+ \d{4})\s+(.*)$/);
          return m
            ? `<div class="w-tl-item"><div class="w-tl-year">${esc(m[1])}</div><div class="w-tl-text">${esc(m[2])}</div></div>`
            : `<div class="w-tl-item"><div class="w-tl-text">${esc(r)}</div></div>`;
        }).join('') + '</div>');
        break;
      case 'pull':
        out.push(`<div class="w-pullquote">${body}</div>`);
        break;
      case 'boxLabel': {
        const next = blocks[i + 1];
        if (next?.role === 'boxBody') {
          i += 1;
          out.push(
            '<div class="w-box w-box--key">'
            + `<span class="w-box-label">${body}</span><p>${esc(next.text)}</p>`
            + '</div>'
          );
        } else {
          out.push(`<p class="w-small">${body}</p>`);
        }
        break;
      }
      case 'boxBody':
        out.push(`<div class="w-box w-box--key"><p>${body}</p></div>`);
        break;
      case 'scorecard':
        out.push(`<div class="w-box w-box--weigh"><p>${body}</p></div>`);
        break;
      case 'byline':
        out.push(`<span class="w-attrib">${body}</span>`);
        break;
      default:
        throw new Error(`no renderer for role "${b.role}"`);
    }
  }
  return out.join('');
}

/* ------------------------------------------------------------------
   Reading one part.
   ------------------------------------------------------------------ */
function sectionsOf(blocks) {
  const sections = [];
  let current = null;
  for (const b of blocks) {
    if (b.role === 'kicker') { current = { kicker: b.text, title: '', blocks: [] }; sections.push(current); continue; }
    if (b.role === 'heading' && current && !current.title) { current.title = b.text; continue; }
    if (b.role === 'heading') { current = { kicker: '', title: b.text, blocks: [] }; sections.push(current); continue; }
    if (!current) continue;   // cover matter, already captured
    current.blocks.push(b);
  }
  return sections;
}

async function importPart(file, n) {
  const pages = await readLines(join(SRC_DIR, file));
  const lines = pages.flatMap((p) => p.lines.map((l) => ({ ...l, page: p.page })));

  // The cover is page 1 and is the only source for the part's own identity.
  const cover = pages[0].lines;
  const at = (size) => cover.find((l) => l.size === size)?.text ?? '';
  const title = cover.filter((l) => l.size === 24).map((l) => l.text).join(' ');
  const lead = at(10.5);
  if (!title || !lead) throw new Error(`part ${n}: cover has no title or strapline`);

  /* Tables and timelines are both set at 9.5pt and both have to come from the
     raw items, because a table puts several cells on one baseline and a line
     list cannot represent that. They are built per page and then dropped back
     into the block stream at the position their first row occupies. */
  const gridBlocks = [];
  for (const page of pages.slice(1)) {
    const grid = page.items.filter((i) => i.size === TABLE_SIZE);
    if (!grid.length) continue;
    const rows = tableFrom(page.items);
    const y = Math.max(...grid.map((i) => i.y));
    if (rows) {
      const header = page.items.filter((i) => i.size === 8.5 && i.x > 67 && i.x < 72);
      gridBlocks.push({ role: 'tableRows', rows, page: page.page, y: header.length ? Math.max(y, ...header.map((h) => h.y)) : y });
    } else {
      const byY = new Map();
      for (const cell of grid.sort((a, b) => b.y - a.y || a.x - b.x)) {
        const key = String(Math.round(cell.y));
        if (!byY.has(key)) byY.set(key, []);
        byY.get(key).push(cell.str);
      }
      gridBlocks.push({ role: 'timelineRows', rows: [...byY.values()].map((r) => r.join(' ')), page: page.page, y });
    }
  }

  const gridPages = new Set(gridBlocks.map((g) => g.page));
  const flow = lines.filter((l) => l.page > 1
    && !(l.size === TABLE_SIZE && gridPages.has(l.page))
    && !(l.size === 8.5 && l.x > 67 && l.x < 72));

  const blocks = coalesce([...blocksOf(flow), ...gridBlocks]
    .sort((a, b) => a.page - b.page || b.y - a.y));
  const sections = sectionsOf(blocks);
  if (!sections.length) throw new Error(`part ${n}: no sections`);

  const firstChapter = sections.findIndex((s) => /^CHAPTER\b/i.test(s.kicker));
  if (firstChapter < 1) throw new Error(`part ${n}: no chapters, or no front matter before them`);

  const front = sections.slice(0, firstChapter);
  const chapters = sections.slice(firstChapter);

  const prologue = front
    .map((s, index) => (index === 0 ? '' : `<h3 class="w-h3">${esc(s.title)}</h3>`) + render(s.blocks))
    .join('<hr class="w-soft" />');

  const toc = [];
  const html = chapters.map((s, index) => {
    const num = index + 1;
    const id = `pj${n}-${num}-${slugify(s.title)}`;
    toc.push({ id, num: String(num), text: s.title });
    return `<h2 class="w-h2" id="${id}"><span class="w-num">${num}</span>${esc(s.title)}</h2>${render(s.blocks)}`;
  }).join('');

  const strip = (m) => m.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const words = strip(`${prologue} ${html}`).split(/\s+/).filter(Boolean).length;

  return {
    n,
    label: '',
    title,
    lead,
    words,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    published: PUBLISHED,
    toc,
    prologue,
    prologueTitle: front[0].title,
    prologueTag: `${front[0].kicker} · Punjab: The Whole Truth, Part ${n}`,
    html,
    sources: '',
  };
}

/* ------------------------------------------------------------------
   Build.
   ------------------------------------------------------------------ */
const LABELS = ['Before the Name', 'Porus to the Huns', 'The Invasion Highway', 'Gurus and the Khalsa'];
const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.pdf')).sort();

const parts = [];
for (const [index, file] of files.entries()) {
  const part = await importPart(file, index + 1);
  part.label = LABELS[index] ?? part.title;
  parts.push(part);
}

for (const part of parts) {
  if (part.toc.length < 4) throw new Error(`Part ${part.n} recovered only ${part.toc.length} chapters`);
  if (part.words < 3000) throw new Error(`Part ${part.n} is unexpectedly short (${part.words} words)`);
  if (!part.prologue) throw new Error(`Part ${part.n} recovered no front matter`);
  const stranded = `${part.prologue} ${part.html}`.match(/.{0,60}\u2010.{0,20}/g);
  if (stranded) {
    throw new Error(
      `Part ${part.n} still contains ${stranded.length} soft hyphen(s):\n`
      + stranded.slice(0, 6).map((s) => `      \u2026${s}`).join('\n')
    );
  }
  if (new Set(part.toc.map((t) => t.id)).size !== part.toc.length) throw new Error(`Part ${part.n} has duplicate ids`);
}

const totalWords = parts.reduce((sum, p) => sum + p.words, 0);
const output = `/* ============================================================
   PUNJAB: THE WHOLE TRUTH
   Generated by scripts/import-punjab.mjs from the authored PDFs.
   Do not hand-edit: re-run the importer.

   ${parts.length} published parts · ${totalWords.toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, output, 'utf8');

console.log(`✓ ${OUT}`);
for (const p of parts) {
  console.log(`  Part ${p.n} — ${p.title.slice(0, 30).padEnd(30)} ${String(p.toc.length).padStart(2)} chapters · ${p.words.toLocaleString('en-IN').padStart(7)} words`);
}
console.log(`  ${parts.length} parts · ${totalWords.toLocaleString('en-IN')} words · ${parts.reduce((s, p) => s + p.minutes, 0)} min`);
