/**
 * import-sapiens-reading.mjs — one-shot content importer.
 *
 * Converts "My Own Reading of Sapiens" (eleven authored PDFs, one per part)
 * into src/data/writing/sapiens-reading.js, the way import-money.mjs and
 * import-darwin.mjs recover their pieces from typography rather than markup.
 *
 * Sizes on this document (pages 2 onward — page 1 of every part is a cover
 * and carries none of this):
 *
 *   40 pt  drop cap              10.6 pt  body copy
 *   19 pt  heading (h2)          10.2 pt  standfirst / lead
 * 13.4 pt  sub-heading (h3)      10.1 pt  aside/box body
 *   12 pt  pilcrow (decorative)   9.7 pt  table-row body
 *  8.8 pt  figure axis label (skip)
 *  8.6 pt  figure caption         8.2 pt  table-row label (dates)
 *  8.4 pt  page number "— N —"  6.8-8.6 pt  small-caps kicker/label
 *
 * A kicker at 6.8-8.6 pt is disambiguated by what follows it: before a 19 pt
 * heading it is a print-margin eyebrow (SECTION ONE, WHERE WE LEFT OFF...)
 * and is dropped; before 10.1 pt it opens a callout box (A WORD YOU WILL
 * NEED, MY TAKE...); before 9.7/8.2 pt it is a table-row label and joins
 * whatever table is currently open.
 *
 * Paragraphs are not set with extra leading between them — line-to-line
 * leading is uniform (~1.71x the size) whether or not a new sentence-group
 * starts, except within callout boxes, tables and the like, which do widen
 * the gap (~2.27x) for a real paragraph break. So: gap > size*1.9 starts a
 * new paragraph; anything tighter is a wrapped continuation of the same one.
 *
 * A run in the page's non-dominant body font is emphasis; this importer
 * does not try to recover which of those were italic and which were bold in
 * print — both become <em>. Every part's "Coming Next" page (a teaser for
 * the part that follows, which this importer is about to render in full) is
 * dropped entirely, along with its colophon.
 *
 * Requires pdfjs-dist, which is local-only (like resvg for the OG cards) —
 * CI never runs this, the generated data file is committed:
 *
 *     npm i --no-save pdfjs-dist
 *     node scripts/import-sapiens-reading.mjs
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/books/Sepiends by Yuval Noah Harrari';
const OUT = 'src/data/writing/sapiens-reading.js';
const PUBLISHED = '2026-08-23';

const SHORT_LABEL = {
  1: 'Origins', 2: 'Cognition', 3: 'Foragers', 4: 'Farming',
  5: 'Order & Writing', 6: 'Hierarchy', 7: 'Money & Empire',
  8: 'Religion', 9: 'Science', 10: 'Capitalism', 11: 'The Future',
};

/* The author's own "map: all eleven parts" table, Part One, page 3 — kept
   by hand since it is front matter this importer otherwise skips (page 1
   of every part, cover only, is never processed; this table sits on page 3
   of Part One specifically, ahead of the running text). */
const OUTLINE = [
  { n: 1, blurb: 'Who Harari is, what the whole book stands on, and Chapter 1, where we are still a nervous animal eating other predators\u2019 leftovers.' },
  { n: 2, blurb: 'Chapter 2: The Tree of Knowledge. The heart of the book. It gets a whole part to itself, the way Darwin\u2019s Chapter 4 did.' },
  { n: 3, blurb: 'Chapter 3: what life was like before farming \u00b7 Chapter 4: what happened to every large animal on Earth the moment we arrived.' },
  { n: 4, blurb: 'Chapter 5: History\u2019s Biggest Fraud. His most famous argument \u2014 that farming made life worse. Its own part.' },
  { n: 5, blurb: 'Chapter 6: how millions of strangers were kept in line \u00b7 Chapter 7: why writing had to be invented, and why the first writing was a tax record.' },
  { n: 6, blurb: 'Chapter 8: why every large society ends up with someone on top \u00b7 Chapter 9: whether history is going anywhere.' },
  { n: 7, blurb: 'Chapter 10: money \u00b7 Chapter 11: empire. Two of the three glues that stuck the world together.' },
  { n: 8, blurb: 'Chapter 12: religion, the third glue \u00b7 Chapter 13: why the ideas that won did not win because they were good.' },
  { n: 9, blurb: 'Chapter 14: the Scientific Revolution, which began with an admission \u00b7 Chapter 15: science and conquest, which grew up together.' },
  { n: 10, blurb: 'Chapter 16: capitalism \u00b7 Chapter 17: energy, industry, and what we did to farm animals.' },
  { n: 11, blurb: 'Chapters 18\u201320: family, happiness, and the end of our species \u00b7 plus what I actually think, now that I have finished it.' },
];

/* Callout kicker (despaced, uppercased) \u2192 the reader's tone vocabulary.
   Four of these match the site's established six (Money's IN SIMPLE WORDS,
   KEY NUMBERS, MYTH CHECK families); the rest are this piece's own devices,
   matched to the nearest tone by what the box actually does. */
const TONES = [
  [/^AWORDYOUWILLNEED/, 'simple'],
  [/^INREALTERMS/, 'number'],
  [/^THETHINGNOBODYQUESTIONS/, 'remember'],
  [/^HISPOINT,?INMYWORDS/, 'quote'],
  [/^INHARARI'?SOWNWORDS/, 'quote'],
  [/^MYTAKE/, 'interp'],
  [/^WHERETHISPARTFITS/, 'aim'],
  [/^WHATIAMPROMISINGYOU/, 'aim'],
  [/^HOWWEACTUALLYKNOWTHIS/, 'fact'],
  [/^WORTHREMEMBERING/, 'key'],
  [/^THEARGUMENT,?STEPBYSTEP/, 'key'],
];

/* Kickers that sit in the print margin ahead of a heading rather than
   opening a box. Matched after despacing, so punctuation is stripped. */
const EYEBROW = /^(SECTION(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)|WHEREWELEFTOFF|BEFOREWESTART|REFERENCE|PART(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN)OFELEVEN.*|MYOWNREADING.*)/;

/* A table's own column header, printed the same way as a row label —
   recognised by exact phrase and dropped rather than turned into a row
   with no body. */
const HEADER_ROW = /^(WORDWHATITMEANS|WHENWHAT|PARTWHATITCOVERS)$/;

const round1 = (n) => Math.round(n * 10) / 10;
const near = (n, target, tol = 0.08) => Math.abs(n - target) <= tol;

const clean = (s) => s.replace(/\s+/g, ' ').trim();
const esc = (s) => clean(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Unlike esc(), does not trim — a run's own leading/trailing space is often
// the only space between it and its neighbour (a font switch for emphasis
// can split "naming. History" into two adjacent items with the space
// living at one item's edge), so trimming per-run swallows real word gaps.
// The source PDF itself drops the odd sentence break — "What he meansHe is
// not..." with no space or stop between them, presumably a lost period at
// export time. A lowercase letter running straight into a capitalised word
// is not otherwise a pattern that occurs in this document's English prose,
// so it is safe to treat as exactly that and repair it here.
const escInline = (s) => s.replace(/\s+/g, ' ').replace(/([a-z])([A-Z][a-z])/g, '$1 $2')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const titleCase = (s) => s.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, sep, c) => sep + c.toUpperCase());

function slugify(s, prefix) {
  const base = s.toLowerCase().normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
  return `${prefix}-${base}`;
}

/** One page's items grouped into visual lines, each carrying size, y and
    the dominant/alternate font names so emphasis can be told from body. */
async function pageLines(page) {
  const content = await page.getTextContent();
  const lines = [];
  let cur = null;
  for (const item of content.items) {
    if (!item.str) continue;
    const y = round1(item.transform[5]);
    const size = Math.abs(item.transform[0]);
    if (!cur || Math.abs(y - cur.y) > 0.5) {
      if (cur) lines.push(cur);
      cur = { y, size, parts: [] };
    }
    if (item.str.trim()) cur.size = size; // keep the size of real glyphs, not spacer runs
    cur.parts.push({ text: item.str, font: item.fontName, size });
  }
  if (cur) lines.push(cur);
  return lines.filter((l) => l.parts.some((p) => p.text.trim()));
}

/** Regular vs. emphasis font per (size) on this page, by character count. */
function dominantFonts(lines) {
  const bySize = new Map();
  for (const line of lines) {
    for (const p of line.parts) {
      if (!p.text.trim()) continue;
      const key = round1(p.size);
      const counts = bySize.get(key) ?? new Map();
      counts.set(p.font, (counts.get(p.font) ?? 0) + p.text.length);
      bySize.set(key, counts);
    }
  }
  const dominant = new Map();
  for (const [size, counts] of bySize) {
    let best = null, bestN = -1;
    for (const [font, n] of counts) if (n > bestN) { best = font; bestN = n; }
    dominant.set(size, best);
  }
  return dominant;
}

/** A line's parts rendered to inline HTML, wrapping the non-dominant font
    in <em>. Adjacent same-styled parts are merged before escaping. Reads
    dominant fonts off the line itself (stamped per-page at extraction
    time), not a map threaded through the caller — a paragraph, box or
    table can span a page break, and font resource names are local to each
    page, so a map captured on the first page would misjudge every run on
    the next. */
function inlineHtml(line) {
  const regularFont = line.dominant.get(round1(line.size));
  const runs = [];
  for (const p of line.parts) {
    const emphasis = p.text.trim() && p.font !== regularFont;
    const last = runs[runs.length - 1];
    if (last && last.emphasis === emphasis) last.text += p.text;
    else runs.push({ text: p.text, emphasis });
  }
  return runs.map((r) => (r.emphasis ? `<em>${escInline(r.text)}</em>` : escInline(r.text))).join('');
}

const ROLE_BY_SIZE = [
  [40, 'dropcap'], [19, 'h2'], [13.4, 'h3'], [10.8, 'h3'], [12, 'skip'],
  [10.6, 'body'], [10.2, 'lead'], [10.1, 'aside'], [9.7, 'table'],
  [8.8, 'skip'], // the one figure's internal axis labels — decorative, not prose
  [8.6, 'caption'], [8.4, 'pagenum'],
];
// 8.2pt is deliberately left to fall through to the generic 'kicker' role
// below: timeline dates ("300,000 years ago") sit at this size and behave
// exactly like a table-row label (start a new row), unlike the 9.7pt
// description text that follows them (which continues the open row).
function roleOf(size) {
  // 7.12, 6.78, 9.02, 9.2 and 9.6pt sit close enough to real kicker/lead/
  // table sizes that the shared tolerance below would misclassify them, so
  // they get their own tight checks. All are figure-diagram micro-content —
  // axis labels, bar values, category tags ("things that copy themselves",
  // "lions, big cats", "50" / "150" / "no ceiling") — with no home in the
  // prose. Every figure in this document is a vector chart recovered only
  // as its caption, same as the money and forgotten-gods imports.
  if ([7.12, 6.78, 9.02, 9.2, 9.6].some((t) => near(size, t, 0.03))) return 'skip';
  for (const [target, role] of ROLE_BY_SIZE) if (near(size, target)) return role;
  if (size >= 6.5 && size <= 8.6) return 'kicker';
  return 'unknown';
}

/** Import one part's PDF into { title, html, words }. */
async function importPart(filePath, partNum, partTitle, knownTerms) {
  const data = new Uint8Array(readFileSync(filePath));
  const doc = await getDocument({ data, useSystemFonts: true }).promise;

  const out = [];
  let dropQueue = [];
  let box = null;      // { tone, paras: [ [line,...] ] }
  let table = null;     // { rows: [ {label, body: [line,...]} ] }
  let para = null;      // current open <p>/<h*> accumulator: { role, lines: [] }
  let stop = false;
  let idCount = 0;
  const toc = [];
  // "A WORD YOU WILL NEED — X" box labels are multi-item lines, so X comes
  // out properly spaced ("Imagined Reality"). The same term reappears later
  // as a single glued item in the end-of-part glossary table ("IMAGINED
  // REALITY" as one run, no item boundary to recover) — so every term this
  // importer sees said correctly gets remembered, keyed by its despaced
  // compact form, and the glossary row falls back to that spelling.
  let words = 0;
  const unknownSizes = new Set();

  const nextId = (text) => { idCount += 1; return slugify(text || `s${idCount}`, `sr-p${partNum}`); };

  function flushPara() {
    if (!para || !para.lines.length) { para = null; return; }
    const html = para.lines.map((l) => inlineHtml(l)).join(' ');
    words += html.split(/\s+/).filter(Boolean).length;
    if (para.role === 'h2') {
      const text = para.lines.map((l) => l.parts.map((p) => p.text).join('')).join(' ');
      const id = nextId(text);
      toc.push({ id, num: String(toc.length + 1), text: clean(text) });
      out.push(`<h2 class="w-h2" id="${id}"><span class="w-num">${toc.length}</span>${html}</h2>`);
    } else if (para.role === 'h3') {
      const text = para.lines.map((l) => l.parts.map((p) => p.text).join('')).join(' ');
      out.push(`<h3 class="w-h3" id="${nextId(text)}">${html}</h3>`);
    } else if (para.role === 'lead') {
      out.push(`<p class="w-lead">${html}</p>`);
    } else if (para.role === 'caption') {
      // The figure's "FIGURE N" kicker shares a baseline with the caption's
      // opening words in this document, so it arrives fused onto the first
      // line rather than as a line of its own — strip it back off here.
      const stripped = html.replace(/^(?:<em>)?\s*F\s*I\s*G\s*U\s*R\s*E\s*\d+\s*(?:<\/em>)?\s*/i, '');
      out.push(`<figure class="w-figure"><figcaption class="w-caption">${stripped}</figcaption></figure>`);
    } else {
      let cap = '';
      if (dropQueue.length) {
        const letter = dropQueue.shift();
        cap = `<span class="w-dropcap">${esc(letter)}</span>`;
      }
      out.push(`<p>${cap}${html}</p>`);
    }
    para = null;
  }

  function closeBox() {
    if (!box) return;
    // A kicker this importer cannot place opens a box speculatively (see
    // the "otherwise" fallthrough below) and it can turn out to belong to
    // neither a box nor a table — most often a vector chart's stray label,
    // caught here because nothing at all followed it before the next role
    // change. Better to drop it silently than publish an empty callout.
    if (!box.paras.length) { box = null; return; }
    const body = box.paras.map((lines) => `<p>${lines.map((l) => inlineHtml(l)).join(' ')}</p>`).join('');
    words += body.split(/\s+/).filter(Boolean).length;
    out.push(`<div class="w-box w-box--${box.tone}"><span class="w-box-label">${esc(box.label)}</span>${body}</div>`);
    box = null;
  }

  function closeTable() {
    if (!table) return;
    // Same idea as the empty-box guard above: a chart's category labels and
    // bar values look exactly like a run of table-row labels with nothing
    // ever filling their bodies (the numbers and captions around them are
    // diagram furniture already dropped as unrecognised, non-prose sizes).
    // A row with no body text was never a real row.
    table.rows = table.rows.filter((r) => r.body.length);
    if (!table.rows.length) { table = null; return; }
    const looksDate = table.rows.every((r) => /\d/.test(r.label) || /(BC|AD)$/i.test(r.label));
    const looksPart = table.rows.every((r) => /^part\s*\d/i.test(r.label));
    const headers = looksDate ? ['When', 'What'] : looksPart ? ['Part', 'What it covers'] : ['Word', 'What it means'];
    const rows = table.rows.map((r) => {
      const body = r.body.map((l) => inlineHtml(l)).join(' ');
      words += (r.label + ' ' + body).split(/\s+/).filter(Boolean).length;
      let label = r.label;
      if (looksPart) {
        // "PART1" → "Part 1": the label item had no letter/digit gap to
        // recover a space from (see the kicker-despacing note above).
        label = label.replace(/^part\s*(\d+)$/i, 'Part $1');
      } else if (!looksDate) {
        // A glossary term: prefer the spelling recovered from its own "A
        // word you will need" box (multi-item, correctly spaced) over the
        // glued single-item table label, and title-case whatever is left.
        const compactLabel = label.toUpperCase().replace(/[^A-Z0-9]/g, '');
        label = knownTerms.get(compactLabel) ?? titleCase(label);
      }
      return `<tr><td>${esc(label)}</td><td>${body}</td></tr>`;
    }).join('');
    out.push(`<figure class="w-figure"><div class="w-table-scroll"><table class="w-table"><thead><tr><th>${headers[0]}</th><th>${headers[1]}</th></tr></thead><tbody>${rows}</tbody></table></div></figure>`);
    table = null;
  }

  function closeAll() { flushPara(); closeBox(); closeTable(); }

  for (let p = 2; p <= doc.numPages && !stop; p += 1) {
    const page = await doc.getPage(p);
    const lines = await pageLines(page);
    const dominant = dominantFonts(lines);
    for (const l of lines) l.dominant = dominant;

    for (let i = 0; i < lines.length && !stop; i += 1) {
      const line = lines[i];
      const size = line.size;
      const role = roleOf(size);
      const rawText = line.parts.map((pt) => pt.text).join('');
      const text = clean(rawText);
      const nextLine = lines[i + 1];
      const nextRole = nextLine ? roleOf(nextLine.size) : null;

      if (role === 'kicker') {
        // A letterspaced word arrives as its own text item, with the
        // letter-gaps already baked in as real spaces ("P R O M I S I N G"),
        // and no separator between one word-item and the next ("...G" butts
        // straight against "Y O U") — so despacing *within* each item and
        // rejoining items *with* a space recovers the word. But not every
        // item here is letterspaced: a table-row label like a timeline date
        // ("13.5 bn years ago") is one ordinary, already-correctly-spaced
        // item, and running the same despace over it would weld it into
        // "13.5bnyearsago". So only despace an item that looks letterspaced
        // in the first place. Token *count* is not a safe signal — a short
        // word like "AM" or "TO" letterspaces to only two tokens, same as a
        // real two-word item — but token *length* is: a run of single (or
        // occasionally glyph-merged double) letters never reaches the length
        // of an ordinary English word, so the longest token in the item is
        // what actually distinguishes the two.
        const display = line.parts.filter((p) => p.text.trim()).map((p) => {
          const tokens = p.text.trim().split(/\s+/);
          const looksLetterspaced = Math.max(...tokens.map((t) => t.length)) <= 3;
          return looksLetterspaced ? p.text.replace(/\s+/g, '') : p.text.trim();
        }).join(' ');
        const compact = display.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (compact === 'COMINGNEXT') { closeAll(); stop = true; break; }
        if (EYEBROW.test(compact)) continue; // print-margin eyebrow, dropped
        if (HEADER_ROW.test(compact)) continue; // the table's own header row

        const toneEntry = TONES.find(([re]) => re.test(compact));
        if (toneEntry || nextRole === 'aside') {
          closeAll();
          box = { tone: toneEntry ? toneEntry[1] : 'simple', label: display, paras: [] };
          if (/^AWORDYOUWILLNEED/.test(compact)) {
            const suffix = display.split('—')[1] ?? '';
            for (const term of suffix.split(/,| AND /i).map((t) => t.trim()).filter(Boolean)) {
              knownTerms.set(term.toUpperCase().replace(/[^A-Z0-9]/g, ''), titleCase(term));
            }
          }
          continue;
        }
        // otherwise: a table-row label
        closeBox(); flushPara();
        if (!table) table = { rows: [] };
        table.rows.push({ label: display, body: [] });
        continue;
      }

      if (role === 'pagenum' || role === 'skip') continue;

      if (role === 'unknown') {
        unknownSizes.add(round1(size));
        // Small sizes here are diagram-internal labels (axis captions, tiny
        // species names inside a family-tree figure) with no home in the
        // prose — safe to drop. Anything larger is unrecognised body text,
        // and must not vanish silently: fold it into the open paragraph
        // (or a fresh one) as plain prose rather than losing it.
        if (size < 7) continue;
        closeBox(); closeTable();
        if (!para || !['body', 'aside'].includes(para.role)) { flushPara(); para = { role: 'body', lines: [] }; }
        para.lines.push(line);
        continue;
      }

      if (role === 'dropcap') { dropQueue.push(text); continue; }

      if (role === 'caption') {
        if (!para || para.role !== 'caption') { closeAll(); para = { role: 'caption', lines: [] }; }
        para.lines.push(line);
        continue;
      }

      if (role === 'table') {
        if (table) {
          const last = table.rows[table.rows.length - 1];
          last.body.push(line);
        } else {
          // a stray table-body line with no open table and no label: treat as body prose
          closeBox(); closeTable();
          if (!para || para.role !== 'body') { flushPara(); para = { role: 'body', lines: [] }; }
          para.lines.push(line);
        }
        continue;
      }

      // headings and standfirst always start fresh, and may wrap to 2+ lines
      if (role === 'h2' || role === 'h3' || role === 'lead') {
        if (!para || para.role !== role) { closeAll(); para = { role, lines: [] }; }
        para.lines.push(line);
        continue;
      }

      // A quote box is set in the main body size, not the smaller aside
      // size every other box uses — a direct quotation reads like running
      // prose in this document, so its own content is role 'body' here.
      if (box && (role === 'aside' || (role === 'body' && box.tone === 'quote'))) {
        const paras = box.paras;
        const last = paras[paras.length - 1];
        const gap = last ? last.at(-1).y - line.y : Infinity;
        if (last && gap <= size * 1.9) last.push(line);
        else paras.push([line]);
        continue;
      }

      // body prose (or a stray aside line with no box open)
      closeBox(); closeTable();
      if (!para || para.role !== 'body') { flushPara(); para = { role: 'body', lines: [] }; }
      const lastLine = para.lines[para.lines.length - 1];
      if (lastLine && lastLine.y - line.y > size * 1.9) { flushPara(); para = { role: 'body', lines: [line] }; }
      else para.lines.push(line);
    }
  }
  closeAll();

  if (unknownSizes.size) {
    console.warn(`  part ${partNum}: unrecognised sizes ${[...unknownSizes].join(', ')}`);
  }

  return { html: out.join(''), toc, words };
}

async function main() {
  const files = readdirSync(DIR)
    .filter((f) => f.endsWith('.pdf'))
    .map((f) => {
      const m = f.match(/Part (\d+) - (.+)\.pdf$/);
      return { file: f, n: Number(m[1]), title: m[2] };
    })
    .sort((a, b) => a.n - b.n);

  const parts = [];
  let totalWords = 0;
  const knownTerms = new Map(); // shared across parts, in file order — see importPart

  for (const { file, n, title } of files) {
    console.log(`Importing part ${n}: ${title}`);
    const { html, toc, words } = await importPart(`${DIR}/${file}`, n, title, knownTerms);
    totalWords += words;
    parts.push({
      n,
      label: SHORT_LABEL[n],
      title,
      lead: OUTLINE[n - 1].blurb,
      words,
      minutes: Math.round(words / 220),
      published: PUBLISHED,
      toc,
      html,
      sources: null,
    });
  }

  const banner = `/* ============================================================
   MY OWN READING OF SAPIENS
   Generated by scripts/import-sapiens-reading.mjs from the authored PDFs.
   Do not hand-edit: re-run the importer instead.

   11 parts \u00b7 ${totalWords.toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`;
  writeFileSync(OUT, banner);
  console.log(`\nWrote ${OUT} \u2014 ${totalWords.toLocaleString('en-IN')} words across ${parts.length} parts.`);
}

main();
