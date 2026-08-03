/**
 * import-punjab-history.mjs
 *
 * Importer for "The Complete History of Punjab" — a fourteen-part history, of
 * which three are written.
 *
 * This series is not the same book as "Punjab: The Whole Truth" (slug
 * `punjab`). That one is a thirteen-part argument about the disputes; this is
 * a fourteen-part narrative history at four times the length per part. They
 * share a subject and nothing else.
 *
 * The sources are standalone web pages rather than print HTML — each is a
 * finished, self-contained article with its own stylesheet, contents list and
 * download button. So this reads the markup and throws all the page furniture
 * away: the hero, the contents nav, the series pager, the anchor links and the
 * author bio are all things the site already provides around the prose.
 *
 * It is deliberately strict: an unrecognised construct throws rather than
 * silently dropping prose, and it reports every unmapped class in one run.
 *
 * Usage:
 *   node scripts/import-punjab-history.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SRC_DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/books/Punjab history';
const OUT = 'src/data/writing/punjab-history.js';
const PUBLISHED = '2026-08-04';
const WORDS_PER_MINUTE = 220;

/* The written parts, and the file each lives in. The web pages are named for
   their slugs rather than numbered, so the mapping is spelled out.

   `label` is the chip beside the part in the contents. The hero of each page
   carries a span of years instead, which reads well on its own but not next
   to the fourteen unwritten parts in the manifest outline, which can only be
   named by subject. So the chips are subjects throughout. */
const PARTS = [
  { n: 1, label: 'The Land', file: 'part-1-the-land-itself.html' },
  { n: 2, label: 'Harappa', file: 'part-2-harappa.html' },
  { n: 3, label: 'The Vedic Age', file: 'part-3-the-vedic-age-and-the-aryan-question.html' },
];

/* ------------------------------------------------------------------
   A very small, strict HTML reader.
   ------------------------------------------------------------------ */
const VOID = new Set(['br', 'hr', 'img', 'col', 'meta', 'link', 'input']);
const RAW_TEXT = new Set(['style', 'script']);

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', middot: '·', times: '×', deg: '°', minus: '−',
  frac12: '½', sup2: '²', pound: '£', eacute: 'é', uuml: 'ü', rarr: '→',
  szlig: 'ß', ouml: 'ö', auml: 'ä', ccedil: 'ç', aacute: 'á', iacute: 'í',
};

const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (whole, body) => {
  if (body[0] === '#') {
    const code = body[1] === 'x' || body[1] === 'X'
      ? parseInt(body.slice(2), 16)
      : parseInt(body.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
  }
  return ENTITIES[body.toLowerCase()] ?? whole;
});

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function parseAttributes(source) {
  const attrs = {};
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match;
  while ((match = pattern.exec(source))) {
    attrs[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

function parse(html, where) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const pattern = /<!--[\s\S]*?-->|<\/([a-zA-Z][-a-zA-Z0-9]*)\s*>|<([a-zA-Z][-a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/g;
  let index = 0;
  let match;

  const push = (node) => stack[stack.length - 1].children.push(node);
  const text = (raw) => { if (raw) push(raw); };

  while ((match = pattern.exec(html))) {
    text(html.slice(index, match.index));
    index = pattern.lastIndex;
    const [whole, closing, opening, rawAttrs, selfClosing] = match;
    if (whole.startsWith('<!--')) continue;

    if (closing) {
      const tag = closing.toLowerCase();
      if (VOID.has(tag)) continue;
      const depth = stack.findLastIndex((node) => node.tag === tag);
      if (depth < 1) throw new Error(`${where}: stray </${tag}>`);
      stack.length = depth;
      continue;
    }

    const tag = opening.toLowerCase();
    const node = { tag, attrs: parseAttributes(rawAttrs), children: [] };
    push(node);

    if (!selfClosing && RAW_TEXT.has(tag)) {
      const end = html.toLowerCase().indexOf(`</${tag}`, index);
      if (end === -1) throw new Error(`${where}: unclosed <${tag}>`);
      node.children.push(html.slice(index, end));
      index = html.indexOf('>', end) + 1;
      pattern.lastIndex = index;
      continue;
    }
    if (!selfClosing && !VOID.has(tag)) stack.push(node);
  }
  text(html.slice(index));
  return root;
}

const isTag = (n) => typeof n === 'object';
const classesOf = (n) => (isTag(n) ? (n.attrs.class ?? '').trim().split(/\s+/).filter(Boolean) : []);
const hasClass = (n, c) => classesOf(n).includes(c);
const elements = (n) => n.children.filter(isTag);
const find = (n, p) => elements(n).find(p);
const findClass = (n, c) => find(n, (child) => hasClass(child, c));
function deepFind(node, predicate) {
  for (const child of elements(node)) {
    if (predicate(child)) return child;
    const nested = deepFind(child, predicate);
    if (nested) return nested;
  }
  return undefined;
}
const textOf = (n) => (!isTag(n) ? decode(n) : n.tag === 'br' ? ' ' : n.children.map(textOf).join(''));
const flat = (n) => textOf(n).replace(/\s+/g, ' ').trim();

const slugify = (s) => s.toLowerCase().normalize('NFKD')
  .replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, ' ').trim()
  .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60).replace(/-$/, '');

/* ------------------------------------------------------------------
   Print vocabulary → the site's prose vocabulary.
   ------------------------------------------------------------------ */
/* The book's colour-coded box system, mapped onto the boxes the reader
   already has. The author's own descriptions are in the comments. */
const BOX_TONES = {
  word: 'simple',       // blue — explains a hard word
  real: 'number',       // green — makes an unimaginable number ordinary
  know: 'answer',       // brown — shows the actual evidence
  arg: 'arg',           // orange — the experts disagree
  assume: 'weigh',      // purple — something taken for granted
  remember: 'remember', // dark — the one thing to take away
};
/* The book's six box colours have to stay six colours here. `fact` was the
   obvious home for the evidence box, but the site paints it the same green as
   `simple`, which would have merged "here is a hard word" with "here is the
   evidence". `answer` is the nearest distinct tone. */

const INLINE = new Set(['strong', 'b', 'em', 'i', 'sup', 'sub', 'br', 'span', 'a', 'code', 'small', 'cite']);

/* Page furniture the site supplies itself, and the two back-matter sections
   that are the author's sign-off rather than the book. */
const FURNITURE = ['hero', 'contents', 'seriesnav', 'skip', 'dl', 'anchor', 'rule'];

class Importer {
  constructor(where) { this.where = where; this.unmapped = new Map(); }

  fail(message) { throw new Error(`${this.where}: ${message}`); }

  note(node) {
    const key = `${node.tag}.${classesOf(node).join('.') || '(none)'}`;
    if (!this.unmapped.has(key)) this.unmapped.set(key, flat(node).slice(0, 70));
  }

  inline(nodes) {
    return nodes.map((node) => {
      if (!isTag(node)) return esc(decode(node)).replace(/\s+/g, ' ');
      if (!INLINE.has(node.tag)) this.fail(`unexpected <${node.tag}> inside inline copy`);
      if (node.tag === 'br') return '<br />';
      /* The anchor-link "#" beside every heading belongs to the source page. */
      if (hasClass(node, 'anchor')) return '';
      if (node.tag === 'span') return this.inline(node.children);
      if (node.tag === 'a') {
        const href = node.attrs.href ?? '';
        if (!/^https?:\/\//.test(href)) return this.inline(node.children);
        return `<a class="w-cite" href="${esc(href)}" rel="noopener">${this.inline(node.children)}</a>`;
      }
      const tag = node.tag === 'b' ? 'strong'
        : node.tag === 'i' ? 'em'
          : node.tag === 'small' || node.tag === 'cite' ? 'span' : node.tag;
      return `<${tag}>${this.inline(node.children)}</${tag}>`;
    }).join('').replace(/\s+/g, ' ').trim();
  }

  paragraph(node) {
    const body = this.inline(node.children);
    if (!body) return '';
    if (hasClass(node, 'standfirst')) return `<p class="w-lead">${body}</p>`;
    if (hasClass(node, 'sig') || hasClass(node, 'endnote')) return `<p class="w-small">${body}</p>`;
    return `<p>${body}</p>`;
  }

  list(node) {
    const items = elements(node).map((item) => {
      if (item.tag !== 'li') this.fail(`<${item.tag}> inside a list`);
      const blocks = item.children.filter((c) => isTag(c) && !INLINE.has(c.tag));
      /* A list item is usually a run of inline copy, but a few carry a nested
         list or paragraph, which has to survive. */
      if (!blocks.length) return `<li>${this.inline(item.children)}</li>`;
      return `<li>${this.loose(item.children)}</li>`;
    }).join('');
    return `<${node.tag === 'ol' ? 'ol' : 'ul'}>${items}</${node.tag === 'ol' ? 'ol' : 'ul'}>`;
  }

  /* The argument box sets each position as a `.side` with a `.who` label, and
     closes with a `.verdict` saying where things actually stand. */
  sides(nodes) {
    const panels = nodes.map((side, index) => {
      const who = findClass(side, 'who');
      const rest = side.children.filter((child) => child !== who);
      return `<div class="w-side w-side--${index === 0 ? 'a' : 'b'}">`
        + (who ? `<span class="w-who">${this.inline(who.children)}</span>` : '')
        + this.loose(rest)
        + '</div>';
    });
    return `<div class="w-sides${panels.length === 2 ? ' w-sides--pair' : ''}">${panels.join('')}</div>`;
  }

  box(node) {
    const tone = classesOf(node).map((c) => BOX_TONES[c]).find(Boolean);
    if (!tone) this.fail(`a box with no known tone: ${classesOf(node).join('.')}`);

    const parts = [];
    let run = [];
    const flushSides = () => {
      if (run.length) parts.push(this.sides(run));
      run = [];
    };
    for (const child of elements(node)) {
      if (hasClass(child, 'side')) { run.push(child); continue; }
      flushSides();
      if (hasClass(child, 'lbl')) {
        parts.push(`<span class="w-box-label">${this.inline(child.children)}</span>`);
        continue;
      }
      if (hasClass(child, 'verdict')) {
        parts.push(`<div class="w-verdict">${this.inline(child.children)}</div>`);
        continue;
      }
      parts.push(this.block(child));
    }
    flushSides();
    return `<div class="w-box w-box--${tone}">${parts.join('')}</div>`;
  }

  table(node) {
    let caption = '';
    const rows = [];
    const collect = (parent) => {
      for (const child of elements(parent)) {
        if (child.tag === 'caption') { caption = this.inline(child.children); continue; }
        if (child.tag === 'colgroup' || child.tag === 'col') continue;
        if (['thead', 'tbody', 'tfoot'].includes(child.tag)) { collect(child); continue; }
        if (child.tag !== 'tr') this.fail(`<${child.tag}> inside a table`);
        rows.push(elements(child).map((cell) => {
          if (cell.tag !== 'th' && cell.tag !== 'td') this.fail(`<${cell.tag}> in a row`);
          const span = Number(cell.attrs.colspan ?? 1);
          return {
            tag: cell.tag,
            span: Number.isInteger(span) && span > 1 ? span : 1,
            html: this.inline(cell.children),
          };
        }));
      }
    };
    collect(node);
    if (!rows.length) this.fail('an empty table');

    const cell = ({ tag, span, html }) => `<${tag}${span > 1 ? ` colspan="${span}"` : ''}>${html}</${tag}>`;
    const headed = rows[0].every((c) => c.tag === 'th');
    const head = headed ? `<thead><tr>${rows[0].map(cell).join('')}</tr></thead>` : '';
    const body = (headed ? rows.slice(1) : rows).map((r) => `<tr>${r.map(cell).join('')}</tr>`).join('');
    return '<figure class="w-figure">'
      + (caption ? `<figcaption class="w-table-caption">${caption}</figcaption>` : '')
      + `<div class="w-table-scroll"><table class="w-table">${head}<tbody>${body}</tbody></table></div>`
      + '</figure>';
  }

  block(node) {
    if (!isTag(node)) {
      if (decode(node).trim()) this.fail(`loose text: "${flat(node).slice(0, 60)}"`);
      return '';
    }
    if (FURNITURE.some((c) => hasClass(node, c))) return '';

    switch (node.tag) {
      case 'p': return this.paragraph(node);
      case 'h3': return `<h3 class="w-h3">${this.inline(node.children)}</h3>`;
      case 'h4': return `<h4 class="w-h4">${this.inline(node.children)}</h4>`;
      case 'ul':
      case 'ol': return this.list(node);
      case 'table': return this.table(node);
      case 'hr': return '<hr class="w-soft" />';
      case 'blockquote': return `<div class="w-pullquote">${this.inline(node.children)}</div>`;
      case 'figure': return this.blocks(node.children);
      default: break;
    }
    if (node.tag !== 'div' && node.tag !== 'section') this.fail(`unexpected block <${node.tag}>`);

    if (hasClass(node, 'box') || hasClass(node, 'remember')) return this.box(node);
    if (hasClass(node, 'pull')) return `<div class="w-pullquote">${this.inline(node.children)}</div>`;
    /* The author signing off his own note, which the other series keep too. */
    if (hasClass(node, 'sig')) return `<p class="w-small">${this.inline(node.children)}</p>`;
    /* A "◆ ◆ ◆" break between movements of a chapter — the reader draws its
       own rule for this rather than setting the glyphs. */
    if (hasClass(node, 'divider')) return '<hr class="w-soft" />';
    /* `.table-scroll` is the source's own horizontal scroller; the site wraps
       its tables in one of its own, so only the table inside is wanted. */
    if (hasClass(node, 'table-scroll')) return this.blocks(node.children);
    if (!flat(node)) return '';

    this.note(node);
    return this.loose(node.children);
  }

  blocks(nodes) { return nodes.map((n) => this.block(n)).join(''); }

  /** Blocks, with any loose inline text gathered into paragraphs. */
  loose(nodes) {
    const out = [];
    let run = [];
    const flush = () => {
      if (!run.length) return;
      const body = this.inline(run);
      if (body) out.push(`<p>${body}</p>`);
      run = [];
    };
    for (const node of nodes) {
      if (!isTag(node) || INLINE.has(node.tag)) { run.push(node); continue; }
      flush();
      out.push(this.block(node));
    }
    flush();
    return out.join('');
  }
}

/* ------------------------------------------------------------------
   Reading one part.
   ------------------------------------------------------------------ */
function importPart({ n, label, file }) {
  const path = join(SRC_DIR, file);
  if (!existsSync(path)) throw new Error(`Missing source for part ${n}: ${path}`);
  const raw = readFileSync(path, 'utf8');
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error(`Part ${n}: no <body>`);

  const where = `part ${n}`;
  const io = new Importer(where);
  const document = parse(bodyMatch[1], where);

  /* The hero carries the part's own title, its strapline and the span of time
     it covers — none of which repeat anywhere else in the page. */
  const hero = deepFind(document, (node) => hasClass(node, 'hero'));
  if (!hero) throw new Error(`${where}: no hero`);
  const heading = deepFind(hero, (node) => node.tag === 'h2');
  const title = flat(heading ?? { children: [] }).replace(/^Part\s+\w+\s*[—–-]\s*/i, '');
  const lead = flat(deepFindClass(hero, 'sub') ?? { children: [] });
  const range = flat(deepFindClass(hero, 'range') ?? { children: [] });
  if (!title || !lead) throw new Error(`${where}: hero has no title or strapline`);

  const main = deepFind(document, (node) => node.tag === 'main');
  if (!main) throw new Error(`${where}: no <main>`);

  /* Chapters open with a `.chapter-open` section and then run flat until the
     next one, so the document is split on those rather than nested inside. */
  const sections = [];
  let current = { kicker: '', title: '', blocks: [] };
  for (const node of elements(main)) {
    if (hasClass(node, 'chapter-open')) {
      sections.push(current);
      current = {
        kicker: flat(findClass(node, 'chapnum') ?? { children: [] }),
        title: flat(find(node, (c) => c.tag === 'h2') ?? { children: [] }),
        id: node.attrs.id ?? '',
        blocks: elements(node).filter((c) => hasClass(c, 'standfirst')),
      };
      continue;
    }
    current.blocks.push(node);
  }
  sections.push(current);

  const isChapter = (s) => /^Chapter\b/i.test(s.kicker);
  const firstChapter = sections.findIndex(isChapter);
  if (firstChapter < 1) throw new Error(`${where}: no chapters, or none preceded by front matter`);

  /* Everything before chapter one is the author's own opening. The closing
     "What comes next" and "About the Author" are the site's job — it has a
     pager and carries the bio on every page. */
  const front = sections.slice(0, firstChapter).filter((s) => s.title || s.blocks.length);
  const chapters = sections.filter(isChapter);
  const reference = sections.filter((s) => /^Reference\b/i.test(s.kicker));

  const prologue = front
    .map((section, index) => (index === 0 || !section.title ? '' : `<h3 class="w-h3">${esc(section.title)}</h3>`)
      + io.blocks(section.blocks))
    .join('');

  const toc = [];
  const html = chapters.map((section, index) => {
    const num = index + 1;
    const id = `ph${n}-${num}-${slugify(section.title)}`;
    toc.push({ id, num: String(num), text: section.title });
    return `<h2 class="w-h2" id="${id}"><span class="w-num">${num}</span>${esc(section.title)}</h2>`
      + io.blocks(section.blocks);
  }).join('');

  /* The timeline and the glossary are reference matter the reader keeps in
     its own block, below the prose rather than inside it. */
  const sources = reference
    .map((section) => (section.title ? `<h3 class="w-h3">${esc(section.title)}</h3>` : '') + io.blocks(section.blocks))
    .join('');

  if (io.unmapped.size) {
    throw new Error(
      `${where}: ${io.unmapped.size} unmapped construct(s):\n`
      + [...io.unmapped.entries()].map(([k, v]) => `      ${k}  "${v}"`).join('\n')
    );
  }

  const words = `${prologue} ${html}`.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ')
    .split(/\s+/).filter(Boolean).length;

  return {
    n,
    label,
    range,
    title,
    lead,
    words,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    published: PUBLISHED,
    toc,
    prologue,
    prologueTitle: front.find((s) => s.title)?.title ?? 'Author’s note',
    prologueTag: `Author’s note · The Complete History of Punjab, Part ${n}`,
    html,
    sources,
  };
}

function deepFindClass(node, name) {
  return deepFind(node, (child) => hasClass(child, name));
}

/* ------------------------------------------------------------------
   Build.
   ------------------------------------------------------------------ */
const parts = PARTS.map(importPart);

for (const [index, part] of parts.entries()) {
  if (part.n !== index + 1) throw new Error(`Parts must be contiguous from 1; found ${part.n}`);
  if (part.toc.length < 5) throw new Error(`Part ${part.n} recovered only ${part.toc.length} chapters`);
  if (part.words < 10000) throw new Error(`Part ${part.n} is short (${part.words} words)`);
  if (!part.prologue) throw new Error(`Part ${part.n} recovered no front matter`);
  if (!part.sources) throw new Error(`Part ${part.n} recovered no timeline or glossary`);
  if (new Set(part.toc.map((t) => t.id)).size !== part.toc.length) {
    throw new Error(`Part ${part.n} has duplicate chapter ids`);
  }
  for (const entry of part.toc) {
    if (!part.html.includes(`id="${entry.id}"`)) throw new Error(`Part ${part.n}: ${entry.id} has no heading`);
  }
}

const totalWords = parts.reduce((sum, p) => sum + p.words, 0);
const output = `/* ============================================================
   THE COMPLETE HISTORY OF PUNJAB
   Generated by scripts/import-punjab-history.mjs from the authored HTML.
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
  console.log(
    `  Part ${String(p.n).padStart(2)} — ${p.title.slice(0, 34).padEnd(34)} `
    + `${String(p.toc.length).padStart(2)} chapters · ${p.words.toLocaleString('en-IN').padStart(7)} words`
  );
}
console.log(`  ${parts.length} parts · ${totalWords.toLocaleString('en-IN')} words · ${parts.reduce((s, p) => s + p.minutes, 0)} min`);
