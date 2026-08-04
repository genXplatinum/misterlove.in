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
   their slugs rather than numbered, and part 12 was named to a different
   pattern again, so the mapping is spelled out.

   `label` is the chip beside the part in the contents. Each page carries a
   span of years too, which reads well on its own but is kept out of the chip
   so every row in the contents is labelled the same way. */
const PARTS = [
  { n: 1, label: 'The Land', file: 'part-1-the-land-itself.html' },
  { n: 2, label: 'Harappa', file: 'part-2-harappa.html' },
  { n: 3, label: 'The Vedic Age', file: 'part-3-the-vedic-age-and-the-aryan-question.html' },
  { n: 4, label: 'Antiquity', file: 'part-4-persians-alexander-mauryas.html' },
  { n: 5, label: 'Greeks & Kushans', file: 'part-5-greeks-kushans-and-the-face-of-the-buddha.html' },
  { n: 6, label: 'Sultans & Sufis', file: 'part-6-sultans-and-sufis.html' },
  { n: 7, label: 'The First Gurus', file: 'part-7-guru-nanak-to-guru-arjan.html' },
  { n: 8, label: 'The Khalsa', file: 'part-8-guru-hargobind-to-guru-gobind-singh.html' },
  { n: 9, label: 'The Misls', file: 'part-9-banda-singh-bahadur-to-the-misls.html' },
  { n: 10, label: 'The Sikh Empire', file: 'part-10-ranjit-singh-and-the-fall.html' },
  { n: 11, label: 'Under the Raj', file: 'part-11-british-punjab.html' },
  { n: 12, label: 'Ghadar', file: 'punjab-part-12-ghadar-to-independence.html' },
  { n: 13, label: 'Partition', file: 'part-13-partition-and-indian-punjab.html' },
  { n: 14, label: 'The Diaspora', file: 'part-14-pakistani-punjab-and-the-diaspora.html' },
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
  argument: 'arg',      //   part 12 spells the same box out in full
  assume: 'weigh',      // purple — something taken for granted
  hidden: 'weigh',      //   and calls this one "hidden" instead
  remember: 'remember', // dark — the one thing to take away
};
/* The book's six box colours have to stay six colours here. `fact` was the
   obvious home for the evidence box, but the site paints it the same green as
   `simple`, which would have merged "here is a hard word" with "here is the
   evidence". `answer` is the nearest distinct tone. */

const INLINE = new Set(['strong', 'b', 'em', 'i', 'sup', 'sub', 'br', 'span', 'a', 'code', 'small', 'cite']);

/* Page furniture the site supplies itself. The series was typeset three times
   over — parts 1 to 11 in the original markup, 13 and 14 in a later one, and
   12 in a third of its own — so several of these are the same thing under
   different names: `hero`/`masthead`, `contents`/`toc`, `anchor`/`hash`,
   `rule`/`hrule`/`orn`, `arch`/`archive`. */
const FURNITURE = [
  'hero', 'masthead', 'contents', 'toc', 'seriesnav', 'skip', 'dl',
  'anchor', 'hash', 'rule', 'hrule', 'orn', 'arch', 'archive', 'credit',
];

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
    /* The chapter strapline under its title. Parts 1 to 11 and 13 to 14 call
       it a standfirst; part 12 calls it a kicker and uses `lead` for its own
       opening paragraph instead, which is ordinary prose. */
    if (hasClass(node, 'standfirst') || hasClass(node, 'kicker')) return `<p class="w-lead">${body}</p>`;
    if (hasClass(node, 'sig') || hasClass(node, 'endnote')) return `<p class="w-small">${body}</p>`;
    return `<p>${body}</p>`;
  }

  /* Part 12 sets its "at a glance" spread as a list of year and event, which
     is the timeline the reader already draws for the other series. */
  timeline(node) {
    const rows = elements(node).map((row) => {
      const year = findClass(row, 'tl-year');
      const rest = row.children.filter((child) => child !== year);
      return '<div class="w-tl-item">'
        + (year ? `<div class="w-tl-year">${this.inline(year.children)}</div>` : '')
        + `<div class="w-tl-text">${this.inline(rest)}</div>`
        + '</div>';
    });
    return `<div class="w-timeline">${rows.join('')}</div>`;
  }

  /* Part 12 sets its glossary as a real definition list. The reader has no
     styling for one, so each entry becomes a list item with the term in bold
     — which is how the other parts write their glossaries by hand anyway. */
  glossary(node) {
    const items = [];
    for (const child of elements(node)) {
      if (child.tag === 'dt') { items.push({ term: this.inline(child.children), body: '' }); continue; }
      if (child.tag !== 'dd') this.fail(`<${child.tag}> inside a definition list`);
      if (!items.length) this.fail('a definition with no term before it');
      items[items.length - 1].body = this.inline(child.children);
    }
    if (!items.length) this.fail('an empty definition list');
    return `<ul>${items.map(({ term, body }) => `<li><strong>${term}</strong> ${body}</li>`).join('')}</ul>`;
  }

  list(node) {
    if (hasClass(node, 'tl')) return this.timeline(node);
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
        /* Usually one sentence, but part 12 sets some verdicts as full
           paragraphs, which cannot go through the inline reader. */
        const blocky = child.children.some((c) => isTag(c) && !INLINE.has(c.tag));
        const body = blocky ? this.loose(child.children) : this.inline(child.children);
        parts.push(`<div class="w-verdict">${body}</div>`);
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
      case 'dl': return this.glossary(node);
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
    /* The source's own horizontal scroller, called `table-scroll` in the early
       parts and `tablewrap` later. The site wraps its tables in one of its
       own, so only the table inside is wanted. */
    if (hasClass(node, 'table-scroll') || hasClass(node, 'tablewrap')) return this.blocks(node.children);
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

  /* The masthead carries the part's own title, its strapline and the span of
     years it covers, none of which repeat anywhere else in the page. Parts 1
     to 11 call it a hero and put the part title in an h2 under the series
     name; part 12 calls it a masthead and puts the part title in the h1,
     because it does not print the series name at all. */
  const masthead = deepFind(document, (node) => hasClass(node, 'hero') || hasClass(node, 'masthead'));
  if (!masthead) throw new Error(`${where}: no hero or masthead`);
  const seriesFirst = !!deepFind(masthead, (node) => node.tag === 'h2');
  const heading = deepFind(masthead, (node) => node.tag === (seriesFirst ? 'h2' : 'h1'));
  const title = flat(heading ?? { children: [] })
    .replace(/^Part\s+[\w-]+\s*[—–-]\s*/i, '')
    .replace(/\s*#$/, '');
  const lead = flat(deepFindClass(masthead, 'sub') ?? deepFindClass(masthead, 'blurb') ?? { children: [] });
  const range = flat(deepFindClass(masthead, 'range') ?? deepFindClass(masthead, 'dates') ?? { children: [] });
  if (!title || !lead) throw new Error(`${where}: masthead has no title or strapline`);

  /* Parts 1 to 11 wrap the body in <main>; 12 uses <article class="wrap">. */
  const main = deepFind(document, (node) => node.tag === 'main')
    ?? deepFind(document, (node) => node.tag === 'article')
    ?? document;

  /* Two shapes again. In parts 1 to 11 a `.chapter-open` section holds only
     the chapter's title block and the prose runs flat after it until the next
     one; in 12 to 14 each `.chapter` section contains its whole chapter. */
  const sections = [];
  const openChapter = (node, nested) => ({
    kicker: flat(deepFindClass(node, 'chapnum') ?? { children: [] }),
    title: flat(deepFind(node, (c) => c.tag === 'h2') ?? { children: [] }).replace(/\s*#$/, ''),
    blocks: nested
      ? elements(node).filter((c) => !hasClass(c, 'chapnum') && c.tag !== 'h2')
      : elements(node).filter((c) => hasClass(c, 'standfirst')),
  });

  if (deepFind(main, (node) => hasClass(node, 'chapter-open'))) {
    let current = { kicker: '', title: '', blocks: [] };
    for (const node of elements(main)) {
      if (hasClass(node, 'chapter-open')) {
        sections.push(current);
        current = openChapter(node, false);
        continue;
      }
      current.blocks.push(node);
    }
    sections.push(current);
  } else {
    for (const node of elements(main)) {
      if (hasClass(node, 'chapter')) { sections.push(openChapter(node, true)); continue; }
      /* Anything outside a chapter section is page furniture in these two
         layouts, but it is checked rather than assumed. */
      const stray = io.block(node);
      if (stray) throw new Error(`${where}: prose outside a chapter section: ${stray.slice(0, 80)}`);
    }
  }

  const isChapter = (s) => /^Chapter\b/i.test(s.kicker);
  const firstChapter = sections.findIndex(isChapter);
  if (firstChapter < 1) throw new Error(`${where}: no chapters, or none preceded by front matter`);

  /* Everything before chapter one is the author's own opening. "About" and
     "What comes next" are the site's job — it has a pager and carries the bio
     on every page — but part 14 closes the whole series with an afterword,
     which is the book talking and stays. */
  const isDropped = (s) => /^(About|What comes next)\b/i.test(s.kicker);
  const isReference = (s) => /^Reference\b/i.test(s.kicker);
  const front = sections.slice(0, firstChapter).filter((s) => s.title || s.blocks.length);
  const chapters = sections.filter(isChapter);
  const reference = sections.filter(isReference);
  const closing = sections.slice(firstChapter)
    .filter((s) => !isChapter(s) && !isReference(s) && !isDropped(s) && (s.title || s.blocks.length));

  const prologue = front
    .map((section, index) => (index === 0 || !section.title ? '' : `<h3 class="w-h3">${esc(section.title)}</h3>`)
      + io.blocks(section.blocks))
    .join('');

  const toc = [];
  const chaptered = chapters.map((section, index) => {
    const num = index + 1;
    const id = `ph${n}-${num}-${slugify(section.title)}`;
    toc.push({ id, num: String(num), text: section.title });
    return `<h2 class="w-h2" id="${id}"><span class="w-num">${num}</span>${esc(section.title)}</h2>`
      + io.blocks(section.blocks);
  }).join('');

  /* Part 14's afterword closes the series rather than a chapter, so it is set
     without a number but still belongs in the contents. */
  const html = chaptered + closing.map((section) => {
    const id = `ph${n}-${slugify(section.title)}`;
    toc.push({ id, num: '·', text: section.title });
    return `<h2 class="w-h2" id="${id}">${esc(section.title)}</h2>` + io.blocks(section.blocks);
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
