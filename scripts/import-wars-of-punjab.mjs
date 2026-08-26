/**
 * import-wars-of-punjab.mjs
 *
 * Importer for "The Wars of Punjab" — a sixteen-part military history, one
 * war at a time, delivered as print-first HTML (one file per part) in the
 * author's working folder. Only the parts that have real authored HTML get
 * imported here; the rest of the series is published PDF-first via the
 * manifest in src/data/writing.js until their own source HTML exists.
 *
 * Like the Congress Record importer, this reads real semantic markup —
 * chapters, war fact-cards, honesty labels, win/lose panels, timelines,
 * glossary — and translates the print vocabulary into the site's prose
 * vocabulary in src/components/Prose.css. It is deliberately strict: an
 * unrecognised top-level block throws rather than silently dropping prose.
 *
 * Usage:
 *   node scripts/import-wars-of-punjab.mjs
 *   node scripts/import-wars-of-punjab.mjs "<folder holding build/part-N.html>"
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC_DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/books/Wars of Punjab';
const OUT = 'src/data/writing/wars-of-punjab.js';

const PARTS = [
  { n: 1, file: 'build/part1.html', published: '2026-08-23', label: 'Origins' },
  { n: 2, file: 'build/part2.html', published: '2026-08-24', label: 'Persia & Alexander' },
];

/* ---------- small HTML helpers ---------- */

const esc = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/** Strip tags and collapse whitespace, for word counts and TOC/plain text. */
const textOf = (html) => html
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013')
  .replace(/&#8217;|&rsquo;/g, '\u2019').replace(/&#8216;|&lsquo;/g, '\u2018')
  .replace(/&#8220;|&ldquo;/g, '\u201c').replace(/&#8221;|&rdquo;/g, '\u201d')
  .replace(/\s+/g, ' ')
  .trim();

const wordCount = (html) => (textOf(html).match(/\S+/g) ?? []).length;

const slugify = (s) => textOf(s)
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

/**
 * Find a top-level `<tag ...>...</tag>` starting at or after `from`, matching
 * `openRe` against the opening tag, and return its full text plus the inner
 * HTML — using a real depth count on same-name tags, not a non-greedy regex,
 * so a block that itself contains nested copies of the same tag (facts,
 * why, timeline) still resolves to its own matching close.
 */
function extractBlock(html, openRe, tagName, from = 0) {
  const re = new RegExp(openRe.source, openRe.flags.includes('g') ? openRe.flags : openRe.flags + 'g');
  re.lastIndex = from;
  const m = re.exec(html);
  if (!m) return null;

  const openTagEnd = m.index + m[0].length;
  const tagOpen = new RegExp(`<${tagName}\\b`, 'gi');
  const tagClose = new RegExp(`</${tagName}\\s*>`, 'gi');
  let depth = 1;
  let cursor = openTagEnd;
  while (depth > 0) {
    tagOpen.lastIndex = cursor;
    tagClose.lastIndex = cursor;
    const nextOpen = tagOpen.exec(html);
    const nextClose = tagClose.exec(html);
    if (!nextClose) throw new Error(`Unclosed <${tagName}> starting near index ${m.index}`);
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      cursor = nextClose.index + nextClose[0].length;
    }
  }
  return {
    start: m.index,
    end: cursor,
    full: html.slice(m.index, cursor),
    inner: html.slice(openTagEnd, cursor).replace(new RegExp(`</${tagName}\\s*>$`, 'i'), ''),
  };
}

/** Replace every top-level match of a block with the result of `fn(inner)`. */
function replaceBlocks(html, openRe, tagName, fn) {
  let out = '';
  let cursor = 0;
  for (;;) {
    const block = extractBlock(html, openRe, tagName, cursor);
    if (!block) { out += html.slice(cursor); break; }
    out += html.slice(cursor, block.start) + fn(block.inner, block.full);
    cursor = block.end;
  }
  return out;
}

const CERTAINTY = {
  'c-sure': { cls: 'certain', label: 'Certain' },
  'c-likely': { cls: 'likely', label: 'Likely' },
  'c-story': { cls: 'story', label: 'Story' },
};

/* ---------- block-level translators (print vocabulary -> site vocabulary) ---------- */

function translateSection(rawInner, partN, secIndex) {
  let html = rawInner;

  // 1. Pull the chapter kicker + section h3 (with its optional inline
  //    certainty badge) off the front of the section.
  html = html.replace(/^\s*<h2 class="chapter">[\s\S]*?<\/h2>\s*<div class="h2rule"><\/div>\s*/, '');

  const h3Match = html.match(/^\s*<h3>([\s\S]*?)<\/h3>\s*/);
  if (!h3Match) throw new Error(`Section ${secIndex} of part ${partN} has no leading <h3>`);
  html = html.slice(h3Match[0].length);

  let h3Inner = h3Match[1];
  let tagHtml = '';
  h3Inner = h3Inner.replace(/\s*<span class="certainty (c-[a-z]+)">[^<]*<\/span>\s*$/, (_, cls) => {
    const info = CERTAINTY[cls];
    if (!info) throw new Error(`Unknown certainty class ${cls}`);
    tagHtml = ` <span class="w-lawtag w-lawtag--${info.cls}">${info.label}</span>`;
    return '';
  });
  const title = textOf(h3Inner);
  const id = `wop${partN}-${secIndex}-${slugify(title)}`;

  // 2. wonby + facts -> one w-box--fact, "Won by" promoted to the box label.
  // Both blocks are swapped for a marker token first, then merged in one
  // pass — "@@" is a safe delimiter because encodeURIComponent never emits
  // one, so a plain string search finds the pair without a regex escape.
  html = replaceBlocks(html, /<div class="wonby">/, 'div', (inner) => {
    const val = textOf((inner.match(/<div class="val">([\s\S]*?)<\/div>/) ?? [undefined, ''])[1]);
    return `@@WOP:WONBY:${encodeURIComponent(val)}@@`;
  });

  html = replaceBlocks(html, /<div class="facts">/, 'div', (inner) => {
    const rows = [];
    const rowRe = /<div><div class="k">([\s\S]*?)<\/div><div class="v">([\s\S]*?)<\/div><\/div>/g;
    let rm;
    while ((rm = rowRe.exec(inner))) rows.push([textOf(rm[1]), rm[2].trim()]);
    if (!rows.length) throw new Error(`Empty facts grid in part ${partN} section ${secIndex}`);
    return `@@WOP:FACTS:${encodeURIComponent(JSON.stringify(rows))}@@`;
  });

  html = html.replace(/@@WOP:WONBY:([^@]*)@@\s*@@WOP:FACTS:([^@]*)@@/, (m, wb, factsJson) => {
    const wonBy = decodeURIComponent(wb);
    const rows = JSON.parse(decodeURIComponent(factsJson));
    const body = rows.map(([k, v]) => `<p><strong>${esc(k)}:</strong> ${v}</p>`).join('');
    return `<div class="w-box w-box--fact"><span class="w-box-label">Won by: ${wonBy}</span>${body}</div>`;
  });
  // A war whose card has no separate facts grid (rare) still gets its own box.
  html = html.replace(/@@WOP:WONBY:([^@]*)@@/, (m, wb) =>
    `<div class="w-box w-box--fact"><span class="w-box-label">Won by: ${decodeURIComponent(wb)}</span></div>`);

  // 3. why (win/lose) -> w-sides, two-column, tone-coded.
  html = replaceBlocks(html, /<div class="why">/, 'div', (inner) => {
    const win = extractBlock(inner, /<div class="win">/, 'div');
    const lose = extractBlock(inner, /<div class="lose">/, 'div');
    if (!win || !lose) throw new Error(`"why" box missing win/lose in part ${partN} section ${secIndex}`);
    const side = (block, tone) => {
      const head = textOf((block.inner.match(/<h6>([\s\S]*?)<\/h6>/) ?? [undefined, ''])[1]);
      const rest = block.inner.replace(/<h6>[\s\S]*?<\/h6>/, '');
      return `<div class="w-side w-side--${tone}"><span class="w-who">${esc(head)}</span>${rest}</div>`;
    };
    return `<div class="w-sides w-sides--pair">${side(win, 'b')}${side(lose, 'a')}</div>`;
  });

  // 4. story -> w-myth.
  html = replaceBlocks(html, /<div class="story">/, 'div', (inner) => {
    const tag = textOf((inner.match(/<div class="tag">([\s\S]*?)<\/div>/) ?? [undefined, ''])[1]);
    const ttl = textOf((inner.match(/<div class="ttl">([\s\S]*?)<\/div>/) ?? [undefined, ''])[1]);
    const body = inner.replace(/<div class="tag">[\s\S]*?<\/div>/, '').replace(/<div class="ttl">[\s\S]*?<\/div>/, '');
    return `<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">${esc(tag)}</span>`
      + `<span class="w-myth-title">${esc(ttl)}</span></div><div class="w-myth-body">${body}</div></div>`;
  });

  // 5. note -> a neutral callout box; its "tag" line becomes the box label.
  html = replaceBlocks(html, /<div class="note"[^>]*>/, 'div', (inner) => {
    const tagM = inner.match(/<div class="tag">([\s\S]*?)<\/div>/);
    const label = tagM ? textOf(tagM[1]) : 'Worth knowing';
    const body = tagM ? inner.replace(tagM[0], '') : inner;
    return `<div class="w-box w-box--weigh"><span class="w-box-label">${esc(label)}</span>${body}</div>`;
  });

  // 6. inline certainty badges elsewhere in the body (not just after h3).
  html = html.replace(/<span class="certainty (c-[a-z]+)">[^<]*<\/span>/g, (m, cls) => {
    const info = CERTAINTY[cls];
    if (!info) throw new Error(`Unknown certainty class ${cls}`);
    return `<span class="w-lawtag w-lawtag--${info.cls}">${info.label}</span>`;
  });

  // 7. timeline ("Part N at a glance").
  html = replaceBlocks(html, /<div class="tl">/, 'div', (inner) => {
    const items = [];
    const rowRe = /<div class="tl-row"><div class="tl-date">([\s\S]*?)<\/div><div class="tl-txt">([\s\S]*?)<\/div><\/div>/g;
    let rm;
    while ((rm = rowRe.exec(inner))) items.push(`<div class="w-tl-item"><span class="w-tl-year">${textOf(rm[1])}</span><span class="w-tl-text">${rm[2].trim()}</span></div>`);
    if (!items.length) throw new Error(`Empty timeline in part ${partN} section ${secIndex}`);
    return `<div class="w-timeline">${items.join('')}</div>`;
  });

  // 8. glossary.
  html = html.replace(/<dl class="glossary">([\s\S]*?)<\/dl>/, (m, inner) => {
    const entries = [];
    const entryRe = /<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g;
    let em;
    while ((em = entryRe.exec(inner))) entries.push(`<div class="w-def"><span class="w-def-term">${textOf(em[1])}</span><div class="w-def-body">${em[2].trim()}</div></div>`);
    return `<div class="w-gloss-list">${entries.join('')}</div>`;
  });

  // 9. sources list.
  html = html.replace(/<ul class="srcs">([\s\S]*?)<\/ul>/, (m, inner) => `<ul class="w-srcs">${inner}</ul>`);

  // 9b. tables: strip print sizing, split into a real thead/tbody so the
  // site's header styling and zebra striping both land on the right rows.
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, (m, inner) => {
    const rows = inner.match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
    if (!rows.length) throw new Error(`Empty table in part ${partN} section ${secIndex}`);
    const clean = (row) => row.replace(/\s+style="[^"]*"/g, '');
    const [head, ...body] = rows;
    return `<div class="w-table-scroll"><table class="w-table"><thead>${clean(head)}</thead>`
      + `<tbody>${body.map(clean).join('')}</tbody></table></div>`;
  });

  // 10. lede / dropcap / headings / lists / divider.
  html = html.replace(/<p class="lede">/g, '<p class="w-lead">');
  html = html.replace(/<p class="dropcap">([^<])/, '<p><span class="w-dropcap">$1</span>');
  html = html.replace(/<h4>([\s\S]*?)<\/h4>/g, '<h4 class="w-h4">$1</h4>');
  html = html.replace(/<(ul|ol) class="body">/g, '<$1>');
  html = html.replace(/<div class="divider">[\s\S]*?<\/div>/g, '<hr>');

  // Sanity check: no unrecognised print-only container survived.
  const leftover = html.match(/class="(chapter|wonby|facts|why|win|lose|story|note|tl|tl-row|glossary|srcs|dropcap|lede|divider)"/);
  if (leftover) throw new Error(`Untranslated "${leftover[1]}" block left in part ${partN} section ${secIndex}`);

  const heading = `<h2 class="w-h2" id="${id}"><span class="w-num">${secIndex}</span>${esc(title)}${tagHtml}</h2>`;
  return { id, num: String(secIndex), text: title, html: heading + html.trim() };
}

function importPart({ n, file, published, label }) {
  const path = resolve(SRC_DIR, file);
  const raw = readFileSync(path, 'utf8');

  const cover = raw.match(/<section class="cover">([\s\S]*?)<\/section>/);
  if (!cover) throw new Error(`No cover section in ${file}`);
  const title = textOf((cover[1].match(/<h1>([\s\S]*?)<\/h1>/) ?? [undefined, ''])[1]).replace(/\s+/g, ' ');
  const lead = textOf((cover[1].match(/<div class="sub">([\s\S]*?)<\/div>/) ?? [undefined, ''])[1]);

  let body = raw.replace(/<section class="cover">[\s\S]*?<\/section>\s*/, '');
  body = body.replace(/^[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*$/, '');
  body = body.replace(/<!--[\s\S]*?-->/g, '');

  const sections = [];
  const secRe = /<section[^>]*>/g;
  let sm;
  const openings = [];
  while ((sm = secRe.exec(body))) openings.push(sm.index);
  for (const start of openings) {
    const block = extractBlock(body, /<section[^>]*>/, 'section', start);
    sections.push(block.inner);
  }

  const toc = [];
  const htmlParts = [];
  sections.forEach((secHtml, i) => {
    const { id, num, text, html } = translateSection(secHtml, n, i + 1);
    toc.push({ id, num, text });
    htmlParts.push(html);
  });

  const html = htmlParts.join('');
  const words = wordCount(html);
  const minutes = Math.max(1, Math.round(words / 220));

  return { n, label, title, lead, published, toc, html, words, minutes };
}

const parts = PARTS.map(importPart);

const out = `/* ============================================================
   THE WARS OF PUNJAB — EVERY WAR FOUGHT ON THE SOIL OF PUNJAB
   Generated by scripts/import-wars-of-punjab.mjs from the authored
   print-HTML sources. Do not hand-edit: re-run the importer.

   ${parts.length} of 16 parts imported so far · ${parts.reduce((a, p) => a + p.words, 0).toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`;

writeFileSync(resolve(OUT), out, 'utf8');

for (const p of parts) {
  console.log(`Part ${p.n}: "${p.title}" — ${p.toc.length} sections, ${p.words.toLocaleString('en-IN')} words, ~${p.minutes} min`);
}
console.log(`\nWrote ${OUT}`);
