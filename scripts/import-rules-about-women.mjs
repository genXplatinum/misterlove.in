/**
 * import-rules-about-women.mjs
 *
 * Importer for "The Rules About Women" — a sixteen-part series in the Living
 * Archive method.
 *
 * The book was planned as ten and grew to sixteen while it was being written,
 * so it was typeset three times over. Parts 1 to 8 kick their chapters with
 * `p.chapnum`, parts 9 to 14 use `p.kicker`, and parts 15 to 16 use
 * `div.kick`. The chapter sections around them also drift — `section.chapter`
 * in the first fourteen, plain `<section id="chapter-N">` in the last two —
 * and the masthead's part-title element goes through `psub` → `subtitle` →
 * `sub`. One importer reads all three, and its strictness is the check that
 * nothing quietly disappears.
 *
 * The sources are finished standalone web pages rather than print HTML, so
 * this throws the page furniture away: masthead, contents nav, series pager,
 * anchor links, and the About-the-Author and What-Comes-Next sections the
 * site supplies around every reader. Part 16's closing "Where This Ends"
 * survives as an afterword.
 *
 * Usage:
 *   node scripts/import-rules-about-women.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SRC_DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/books/Females';
const OUT = 'src/data/writing/rules-about-women.js';
const PUBLISHED = '2026-08-05';
const WORDS_PER_MINUTE = 220;

/* The written parts, and the file each lives in. The chip beside each entry
   in the contents is a short subject label rather than the file title, so
   the row is consistent width. */
const PARTS = [
  { n: 1, label: 'The Question', file: 'part-1-the-question-underneath-the-question.html' },
  { n: 2, label: 'The Origin', file: 'part-2-where-the-rules-came-from.html' },
  { n: 3, label: 'India', file: 'part-3-the-indian-machine.html' },
  { n: 4, label: 'Biology', file: 'part-4-the-bodies-themselves.html' },
  { n: 5, label: 'The Paradox', file: 'part-5-the-paradox-of-the-free-countries.html' },
  { n: 6, label: 'The Old Rules', file: 'part-6-the-case-for-the-old-rules.html' },
  { n: 7, label: 'Feminism', file: 'part-7-what-feminism-actually-claims.html' },
  { n: 8, label: 'The Ledger', file: 'part-8-the-ledger-of-the-equality-project.html' },
  { n: 9, label: 'Descendants', file: 'part-9-the-arithmetic-of-descendants.html' },
  { n: 10, label: 'The Evidence', file: 'part-10-what-the-evidence-says-happens-to-a-woman.html' },
  { n: 11, label: 'The Other Half', file: 'part-11-the-half-nobody-studied.html' },
  { n: 12, label: 'Reputation', file: 'part-12-the-community-with-no-edges.html' },
  { n: 13, label: 'History', file: 'part-13-when-history-ran-the-experiment.html' },
  { n: 14, label: 'What Works', file: 'part-14-what-would-actually-work.html' },
  { n: 15, label: 'The Rebuttal', file: 'part-15-the-case-against-this-series.html' },
  { n: 16, label: 'The Verdict', file: 'part-16-what-survived.html' },
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
      /* Browsers ignore a stray closer with nothing open to match. One source
         file in this series is missing a `</section>`, and the extra it
         provokes here is harmless. */
      if (depth < 1) continue;
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
const deepFindClass = (n, c) => deepFind(n, (child) => hasClass(child, c));
const textOf = (n) => (!isTag(n) ? decode(n) : n.tag === 'br' ? ' ' : n.children.map(textOf).join(''));
const flat = (n) => textOf(n).replace(/\s+/g, ' ').trim();

const slugify = (s) => s.toLowerCase().normalize('NFKD')
  .replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, ' ').trim()
  .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60).replace(/-$/, '');

/* ------------------------------------------------------------------
   Print vocabulary → the site's prose vocabulary.
   ------------------------------------------------------------------ */
/* The book's colour-coded box system. `know` maps to `answer` rather than
   `fact` for the same reason as Punjab History — the reader paints `fact` the
   same green as `simple`, which would merge "here is a hard word" with "here
   is the evidence". */
const BOX_TONES = {
  word: 'simple',       // blue — a hard word explained
  real: 'number',       // green — a big number made ordinary
  know: 'answer',       // brown — the actual evidence
  arg: 'arg',           // orange — the field disagrees
  assume: 'weigh',      // purple — a hidden assumption
  remember: 'remember', // dark — the one thing to carry away
};

const INLINE = new Set(['strong', 'b', 'em', 'i', 'sup', 'sub', 'br', 'span', 'a', 'code', 'small', 'cite']);

/* Page furniture the site supplies itself. Names doubled up across the
   three markup generations. */
const FURNITURE = [
  'masthead', 'contents', 'skip', 'dl',
  'anchor', 'hash', 'hrule', 'rule', 'arch',
  'signoff', 'end', 'endline', 'serial', 'foot', 'ft', 'lb',
  'toc', 'authcard', 'authorcard', 'byline', 'by', 'nm',
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
      /* the "#" anchor beside every heading belongs to the source */
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
    /* Chapter straplines: standfirst in every generation, plus lead/lede
       aliases that appear inside argument-side blocks and front matter. */
    if (hasClass(node, 'standfirst') || hasClass(node, 'lead') || hasClass(node, 'lede')) {
      return `<p class="w-lead">${body}</p>`;
    }
    if (hasClass(node, 'sig') || hasClass(node, 'endnote')) return `<p class="w-small">${body}</p>`;
    /* Front-matter title/subtitle rendered as headings — kickers, not chapter
       numbers, so they read as sub-headings. `psub`/`subtitle`/`sub` are the
       three names the masthead's part-title carries, but they also appear
       inside front matter for a second-level heading. */
    if (hasClass(node, 'kicker') || hasClass(node, 'chapnum') || hasClass(node, 'kick')
        || hasClass(node, 'cn')) {
      /* handled by the section splitter, not as inline content */
      return '';
    }
    return `<p>${body}</p>`;
  }

  list(node) {
    const items = elements(node).map((item) => {
      if (item.tag !== 'li') this.fail(`<${item.tag}> inside a list`);
      const blocks = item.children.filter((c) => isTag(c) && !INLINE.has(c.tag));
      if (!blocks.length) return `<li>${this.inline(item.children)}</li>`;
      return `<li>${this.loose(item.children)}</li>`;
    }).join('');
    return `<${node.tag === 'ol' ? 'ol' : 'ul'}>${items}</${node.tag === 'ol' ? 'ol' : 'ul'}>`;
  }

  /* The argument box sets each position as a `.side` with a `.who` label
     and closes with a `.verdict` for where the evidence stands. */
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
      /* Front matter and back matter set their own secondary headings as h2;
         the reader reserves h2 for chapters, so they demote to h3. */
      case 'h2': return `<h3 class="w-h3">${this.inline(node.children)}</h3>`;
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
    /* Boxes are set as `<aside>` in this series and as `<div>` in the
       earlier ones; both need to pass through the block reader. */
    if (node.tag !== 'div' && node.tag !== 'section' && node.tag !== 'aside') {
      this.fail(`unexpected block <${node.tag}>`);
    }

    if (hasClass(node, 'box') || hasClass(node, 'remember')) return this.box(node);
    if (hasClass(node, 'pull')) return `<div class="w-pullquote">${this.inline(node.children)}</div>`;
    /* Back matter and part 15+16 chapters set straplines and leads on divs
       instead of paragraphs. Treat the div content the same as the p case. */
    if (hasClass(node, 'lead') || hasClass(node, 'lede') || hasClass(node, 'standfirst')) {
      return `<p class="w-lead">${this.inline(node.children)}</p>`;
    }
    /* Secondary kickers/kicks that are content headings within a section,
       not the section's own kicker (which was extracted before we got here). */
    if (hasClass(node, 'kick') || hasClass(node, 'kicker') || hasClass(node, 'chapnum')
        || hasClass(node, 'cn') || hasClass(node, 'fm-title')) {
      return `<h3 class="w-h3">${this.inline(node.children)}</h3>`;
    }
    if (hasClass(node, 'fm-sub')) return `<p class="w-lead">${this.inline(node.children)}</p>`;
    if (hasClass(node, 'sig')) return `<p class="w-small">${this.inline(node.children)}</p>`;
    /* Horizontal scroller around a table: unwrap; the site's own reader
       supplies its own. `tablewrap` and `tw` are the two names it goes by. */
    if (hasClass(node, 'tw') || hasClass(node, 'tablewrap') || hasClass(node, 'table-scroll')) {
      return this.blocks(node.children);
    }
    /* A soft break between movements of a chapter. */
    if (hasClass(node, 'newpage') || hasClass(node, 'divider')) return '<hr class="w-soft" />';
    /* Wrappers that only carry their children through. */
    if (hasClass(node, 'wrap')) return this.blocks(node.children);
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

  /* The masthead carries the part-title in one of three elements, depending
     on when the part was typeset. The strapline is `blurb` or `desc`. */
  const masthead = deepFind(document, (node) => hasClass(node, 'masthead'));
  if (!masthead) throw new Error(`${where}: no masthead`);
  const titleEl = deepFindClass(masthead, 'psub')
    ?? deepFindClass(masthead, 'subtitle')
    ?? deepFindClass(masthead, 'sub');
  const title = flat(titleEl ?? { children: [] }).replace(/^Part\s+[\w-]+\s*[—–-]\s*/i, '');
  const lead = flat(deepFindClass(masthead, 'blurb') ?? deepFindClass(masthead, 'desc') ?? { children: [] });
  if (!title || !lead) throw new Error(`${where}: masthead has no title or strapline`);

  const main = deepFind(document, (node) => node.tag === 'main')
    ?? deepFind(document, (node) => node.tag === 'article')
    ?? document;

  /* Section extractor. Every generation nests the chapter inside its own
     section; the differences are the class name of that section and the
     element that carries its kicker text. */
  const sections = [];
  const openSection = (node) => {
    /* Kicker: p.chapnum (1-8), p.kicker (9-14), div.kick (15-16), div.cn (16 front) */
    const kickEl = deepFindClass(node, 'chapnum')
      ?? deepFindClass(node, 'kicker')
      ?? deepFindClass(node, 'kick')
      ?? deepFindClass(node, 'cn');
    const kicker = flat(kickEl ?? { children: [] });
    const heading = deepFind(node, (c) => c.tag === 'h2');
    const title = flat(heading ?? { children: [] }).replace(/\s*#$/, '');
    /* Parts 15 to 16 wrap the whole chapter body in a wrapper div — most
       commonly `.chapter-open` or `.front` for chapters, `.back.newpage` for
       reference sections. Unwrap those to a flat list of children, then drop
       the kicker and heading (the importer emits its own h2). */
    const WRAPPERS = ['chapter-open', 'front', 'back', 'newpage'];
    const unwrap = (nodes) => nodes.flatMap((c) => {
      if (!isTag(c)) return [c];
      /* If a child is a page-break wrapper or a section-body wrapper, take
         its contents up a level so headings and prose become siblings again. */
      if (WRAPPERS.some((w) => hasClass(c, w))) return unwrap(elements(c));
      return [c];
    });
    const blocks = unwrap(elements(node)).filter((c) => c !== kickEl && c !== heading);
    return { kicker, title, blocks };
  };

  /* One source file has an unmarked outer `<section>` that closes early, so
     its first inner section leaks into a sibling `<div class="wrap">`. Rather
     than model that quirk, walk the whole subtree gathering sections without
     descending into ones already found. */
  const gather = (parent) => {
    for (const node of elements(parent)) {
      if (node.tag === 'section') {
        if (hasClass(node, 'contents') || hasClass(node, 'toc')) continue;
        /* An unnamed wrapper section that has other sections inside it is
           just page furniture; descend into it. */
        const nested = elements(node).some((c) => c.tag === 'section');
        const named = hasClass(node, 'chapter') || hasClass(node, 'back') || hasClass(node, 'fm')
          || /\bchapter-\d+\b/.test(node.attrs.id ?? '') || node.attrs.id === 'front';
        if (nested && !named) { gather(node); continue; }
        sections.push(openSection(node));
        continue;
      }
      gather(node);
    }
  };
  gather(main);

  /* Classify sections. A chapter carries a "Chapter N" kicker; front matter
     comes before the first chapter and carries "Before…", "Where we left
     off", "Why I wrote this" or the like; reference sections after the last
     chapter carry the timeline and glossary; About and What-comes-next are
     dropped; Part 16's "The close / Where This Ends" survives as an
     afterword. */
  const isChapter = (s) => /^Chapter\b/i.test(s.kicker);
  /* Timelines and glossaries — whether the source calls them out as reference
     matter in the kicker or names them in the title. */
  const isReference = (s) => /^(Reference|Timeline|Glossary)\b/i.test(s.kicker)
    || /\b(Timeline|Glossary)\b/i.test(s.title)
    || /^(When These Tools Were Named|The Evidence Grade|The Series, Part by Part)/i.test(s.title);
  const isBio = (s) => /^About\b|Living Archive|About the Author/i.test(s.kicker)
    || /^About the Author$/i.test(s.title);
  const isTeaser = (s) => /^What comes next\b/i.test(s.kicker)
    || /^What Comes Next|^Part \d+ — /i.test(s.title);
  const isDropped = (s) => isBio(s) || isTeaser(s);

  const firstChapter = sections.findIndex(isChapter);
  if (firstChapter < 1) throw new Error(`${where}: no chapters, or none preceded by front matter`);

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
    const id = `rw${n}-${num}-${slugify(section.title)}`;
    toc.push({ id, num: String(num), text: section.title });
    return `<h2 class="w-h2" id="${id}"><span class="w-num">${num}</span>${esc(section.title)}</h2>`
      + io.blocks(section.blocks);
  }).join('');

  const html = chaptered + closing.map((section) => {
    const id = `rw${n}-${slugify(section.title)}`;
    toc.push({ id, num: '·', text: section.title });
    return `<h2 class="w-h2" id="${id}">${esc(section.title)}</h2>` + io.blocks(section.blocks);
  }).join('');

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
    title,
    lead,
    words,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    published: PUBLISHED,
    toc,
    prologue,
    prologueTitle: front.find((s) => s.title)?.title ?? 'Author’s note',
    prologueTag: `Author’s note · The Rules About Women, Part ${n}`,
    html,
    sources,
  };
}

/* ------------------------------------------------------------------
   Build.
   ------------------------------------------------------------------ */
const parts = PARTS.map(importPart);

for (const [index, part] of parts.entries()) {
  if (part.n !== index + 1) throw new Error(`Parts must be contiguous from 1; found ${part.n}`);
  if (part.toc.length < 5) throw new Error(`Part ${part.n} recovered only ${part.toc.length} chapters`);
  if (part.words < 8000) throw new Error(`Part ${part.n} is short (${part.words} words)`);
  if (!part.prologue) throw new Error(`Part ${part.n} recovered no front matter`);
  if (new Set(part.toc.map((t) => t.id)).size !== part.toc.length) {
    throw new Error(`Part ${part.n} has duplicate chapter ids`);
  }
  for (const entry of part.toc) {
    if (!part.html.includes(`id="${entry.id}"`)) throw new Error(`Part ${part.n}: ${entry.id} has no heading`);
  }
}

const totalWords = parts.reduce((sum, p) => sum + p.words, 0);
const output = `/* ============================================================
   THE RULES ABOUT WOMEN
   Generated by scripts/import-rules-about-women.mjs from the authored HTML.
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
    `  Part ${String(p.n).padStart(2)} — ${p.title.slice(0, 40).padEnd(40)} `
    + `${String(p.toc.length).padStart(2)} chapters · ${p.words.toLocaleString('en-IN').padStart(7)} words`
  );
}
console.log(`  ${parts.length} parts · ${totalWords.toLocaleString('en-IN')} words · ${parts.reduce((s, p) => s + p.minutes, 0)} min`);
