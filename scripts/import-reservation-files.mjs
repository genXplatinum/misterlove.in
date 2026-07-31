/**
 * import-reservation-files.mjs
 *
 * Importer for "The Reservation Files" — a fourteen-part investigation
 * delivered as print-first HTML, one file per part, in the author's
 * working folder.
 *
 * Unlike the PDF-only importers in this repository, these sources are real
 * semantic markup: chapters, callouts, side-by-side arguments, myth cards,
 * timelines and tables all carry their own classes. So this reads the markup
 * rather than reconstructing it from typography, and translates the print
 * vocabulary into the site's prose vocabulary in src/components/Prose.css.
 *
 * What the print edition has and the web edition drops: the cover, the printed
 * contents page (the reader renders its own from `toc`), and the end page (the
 * reader has a pager). Everything else survives, in the author's order.
 *
 * Usage:
 *   node scripts/import-reservation-files.mjs
 *   node scripts/import-reservation-files.mjs "<folder holding _partN-source.html>"
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SRC_DIR = process.argv[2]
  ?? 'C:/Users/rajpa/Documents/books/Reservation Hatao Andolan';
const OUT = 'src/data/writing/reservation-files.js';

/* Everything the manifest and the reader need that the source markup does not
   carry: the editorial label shown in the part chip, and the PDF that ships
   alongside each part. The source's own cover title and cover strapline are
   read from the file, so they can never drift from the published book. */
const PARTS = [
  { n: 1, label: 'The Basics', file: 'The Reservation Files - Part 1 - Ground Zero.pdf' },
  { n: 2, label: 'Origins', file: 'The Reservation Files - Part 2 - Before Caste.pdf' },
  { n: 3, label: 'The Mechanism', file: 'The Reservation Files - Part 3 - How Varna Became Jati.pdf' },
  { n: 4, label: 'Invasions', file: 'The Reservation Files - Part 4 - 1000 Years of Outsiders.pdf' },
  { n: 5, label: 'Colonial Rule', file: 'The Reservation Files - Part 5 - The British Machine.pdf' },
];

const PUBLISHED = '2026-07-31';
const WORDS_PER_MINUTE = 220;

/* ------------------------------------------------------------------
   A very small HTML reader.

   The sources are machine-generated and well-formed, so this only has to
   handle what they actually contain. It is deliberately strict: an unexpected
   tag or an unclosed element throws rather than silently swallowing prose.
   ------------------------------------------------------------------ */
const VOID = new Set(['br', 'hr', 'img', 'col', 'meta', 'link', 'input']);

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', middot: '·', times: '×', deg: '°',
};

const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body) => {
  if (body[0] === '#') {
    const code = body[1] === 'x' || body[1] === 'X'
      ? parseInt(body.slice(2), 16)
      : parseInt(body.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
  }
  return ENTITIES[body.toLowerCase()] ?? whole;
});

const esc = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

function parseAttributes(source) {
  const attrs = {};
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match;
  while ((match = pattern.exec(source))) {
    attrs[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

/** Parse an HTML fragment into a tree of {tag, attrs, children} and strings. */
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
      if (depth !== stack.length - 1) {
        throw new Error(
          `${where}: </${tag}> closes across ${stack.slice(depth + 1).map((n) => n.tag).join(', ')}`
        );
      }
      stack.length = depth;
      continue;
    }

    const tag = opening.toLowerCase();
    const node = { tag, attrs: parseAttributes(rawAttrs), children: [] };
    push(node);
    if (!selfClosing && !VOID.has(tag)) stack.push(node);
  }

  text(html.slice(index));

  if (stack.length !== 1) {
    throw new Error(`${where}: unclosed <${stack[stack.length - 1].tag}>`);
  }
  return root;
}

const isTag = (node) => typeof node === 'object';
const classesOf = (node) => (isTag(node) ? (node.attrs.class ?? '').trim().split(/\s+/).filter(Boolean) : []);
const hasClass = (node, name) => classesOf(node).includes(name);
const elements = (node) => node.children.filter(isTag);
const find = (node, predicate) => elements(node).find(predicate);
const findClass = (node, name) => find(node, (child) => hasClass(child, name));

/** First descendant carrying a class, at any depth. */
function deepFindClass(node, name) {
  for (const child of elements(node)) {
    if (hasClass(child, name)) return child;
    const nested = deepFindClass(child, name);
    if (nested) return nested;
  }
  return undefined;
}

/** Visible text of a subtree, whitespace-collapsed. A <br> reads as a space. */
function textOf(node) {
  if (!isTag(node)) return decode(node);
  if (node.tag === 'br') return ' ';
  return node.children.map(textOf).join('');
}
const flat = (node) => textOf(node).replace(/\s+/g, ' ').trim();

/* Covers are set in capitals, so the part title has to be recased for the
   web. Small words stay down unless they open or close the title. */
const MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into',
  'nor', 'of', 'on', 'onto', 'or', 'over', 'the', 'to', 'up', 'v', 'vs', 'with',
]);

const titleCase = (s) => {
  const words = s.toLowerCase().split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => (
      index > 0 && index < words.length - 1 && MINOR_WORDS.has(word)
        ? word
        : word.replace(/[a-z]/, (c) => c.toUpperCase())
    ))
    .join(' ');
};

const slugify = (s) => s
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9\s-]/g, ' ')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 68)
  .replace(/-$/, '');

/* ------------------------------------------------------------------
   Print vocabulary → prose vocabulary.
   ------------------------------------------------------------------ */

/* The three colours of truth, plus the neutral and emphatic panels. Every
   callout in the source carries exactly one of these alongside `box`. */
const BOX_TONES = {
  fact: 'fact',
  interp: 'interp',
  claim: 'claim',
  note: 'key',
  dark: 'answer',
  brandbox: 'aim',
};

const VERDICTS = { 'v-false': 'false', 'v-half': 'half', 'v-true': 'true' };

/* A handful of callouts take their colour from an inline style rather than a
   tone class. The colour is the meaning, so it is read rather than dropped. */
const TONE_BY_BACKGROUND = [
  [/--brandlite|#F5EDFB/i, 'aim'],
  [/--factlite/i, 'fact'],
  [/--interplite/i, 'interp'],
  [/--claimlite/i, 'claim'],
];

/* The colour-code reminder prints FACT / INTERPRETATION / CONTESTED CLAIM in
   their own colours mid-sentence. Without them the paragraph loses its point. */
const INLINE_TONES = [
  [/--fact\b/i, 'fact'],
  [/--interp\b/i, 'interp'],
  [/--claim\b/i, 'claim'],
];

/** Inline markup that survives into the web edition, unchanged. */
const INLINE = new Set(['strong', 'b', 'em', 'i', 'sup', 'sub', 'br', 'span', 'a', 'code']);

class Importer {
  constructor(where) {
    this.where = where;
    this.warnings = [];
  }

  fail(message) {
    throw new Error(`${this.where}: ${message}`);
  }

  /** Inline content: text plus the handful of tags that mean something. */
  inline(nodes) {
    return nodes.map((node) => {
      if (!isTag(node)) return esc(decode(node)).replace(/\s+/g, ' ');
      if (!INLINE.has(node.tag)) {
        this.fail(`unexpected <${node.tag}> inside inline copy`);
      }
      if (node.tag === 'br') return '<br />';
      if (node.tag === 'span') {
        if (hasClass(node, 'dc')) {
          return `<span class="w-dropcap">${this.inline(node.children)}</span>`;
        }
        // A gloss set back to normal weight inside an emphasised table cell.
        if (/font-weight\s*:\s*400/.test(node.attrs.style ?? '')) {
          return `<span class="w-plain">${this.inline(node.children)}</span>`;
        }
        return this.inline(node.children);
      }
      if (node.tag === 'a') {
        const href = node.attrs.href ?? '';
        if (!/^https?:\/\//.test(href)) return this.inline(node.children);
        return `<a class="w-cite" href="${esc(href)}" rel="noopener">${this.inline(node.children)}</a>`;
      }
      const tag = node.tag === 'b' ? 'strong' : node.tag === 'i' ? 'em' : node.tag;
      const style = node.attrs.style ?? '';
      const tone = style ? INLINE_TONES.find(([pattern]) => pattern.test(style))?.[1] : null;
      const attrs = tone ? ` class="w-tone-${tone}"` : '';
      return `<${tag}${attrs}>${this.inline(node.children)}</${tag}>`;
    }).join('').replace(/\s+/g, ' ').trim();
  }

  paragraph(node, { lead = false } = {}) {
    const body = this.inline(node.children);
    if (!body) return '';
    if (hasClass(node, 'sourceline')) return `<p class="w-srcline">${body}</p>`;
    if (hasClass(node, 'attrib')) return `<span class="w-attrib">${body}</span>`;
    if (hasClass(node, 'tnote')) return `<p class="w-tnote">${body}</p>`;
    if (hasClass(node, 'small')) return `<p class="w-small">${body}</p>`;
    if (lead || hasClass(node, 'lead')) return `<p class="w-lead">${body}</p>`;
    return `<p>${body}</p>`;
  }

  list(node) {
    const items = elements(node)
      .map((item) => {
        if (item.tag !== 'li') this.fail(`<${item.tag}> inside a list`);
        return `<li>${this.blocksOrInline(item)}</li>`;
      })
      .join('');
    return `<${node.tag}>${items}</${node.tag}>`;
  }

  /** A list item is usually inline copy, but may hold whole blocks. */
  blocksOrInline(node) {
    const hasBlocks = elements(node).some((child) => !INLINE.has(child.tag));
    return hasBlocks ? this.blocks(node.children) : this.inline(node.children);
  }

  box(node) {
    const style = node.attrs.style ?? '';
    const tone = classesOf(node).map((name) => BOX_TONES[name]).find(Boolean)
      ?? TONE_BY_BACKGROUND.find(([pattern]) => pattern.test(style))?.[1];
    if (!tone) this.fail(`callout with no recognised tone: ${classesOf(node).join(' ')}`);

    const parts = [];
    for (const child of node.children) {
      if (!isTag(child)) continue;
      if (hasClass(child, 'boxlabel')) {
        // The print label opens with a ■ that the coloured rule already says.
        const label = this.inline(child.children).replace(/^[■▪◼]\s*/, '');
        parts.unshift(`<span class="w-box-label">${label}</span>`);
      } else if (hasClass(child, 'boxtitle')) {
        parts.push(`<span class="w-box-title">${this.inline(child.children)}</span>`);
      } else {
        parts.push(this.block(child));
      }
    }
    return `<div class="w-box w-box--${tone}">${parts.join('')}</div>`;
  }

  side(node) {
    const variant = hasClass(node, 'side-a') ? 'a' : hasClass(node, 'side-b') ? 'b' : null;
    if (!variant) this.fail('a .side panel declares neither side-a nor side-b');
    const inner = node.children
      .filter(isTag)
      .map((child) => (hasClass(child, 'who')
        ? `<span class="w-who">${this.inline(child.children)}</span>`
        : this.block(child)))
      .join('');
    return `<div class="w-side w-side--${variant}">${inner}</div>`;
  }

  sides(node) {
    const panels = elements(node).map((side) => {
      if (!hasClass(side, 'side')) this.fail(`<${side.tag}> inside a .sides group`);
      return this.side(side);
    });
    // Two opposed panels read as a pair on a wide screen; three or more stack.
    const pair = panels.length === 2 ? ' w-sides--pair' : '';
    return `<div class="w-sides${pair}">${panels.join('')}</div>`;
  }

  myth(node) {
    const head = findClass(node, 'mhead');
    const body = findClass(node, 'mbody');
    if (!head || !body) this.fail('a myth card is missing its head or body');

    const tag = findClass(head, 'mtag');
    const title = findClass(head, 'mtitle');
    if (!title) this.fail('a myth card has no title');

    const inner = body.children
      .filter(isTag)
      .map((child) => {
        const verdict = classesOf(child).map((name) => VERDICTS[name]).find(Boolean);
        if (hasClass(child, 'verdict')) {
          if (!verdict) this.fail('a verdict chip declares no result');
          return `<span class="w-verdict w-verdict--${verdict}">${this.inline(child.children)}</span>`;
        }
        return this.block(child);
      })
      .join('');

    return '<div class="w-myth">'
      + '<div class="w-myth-head">'
      + (tag ? `<span class="w-myth-tag">${this.inline(tag.children)}</span>` : '')
      + `<span class="w-myth-title">${this.inline(title.children)}</span>`
      + '</div>'
      + `<div class="w-myth-body">${inner}</div>`
      + '</div>';
  }

  timeline(node) {
    const rows = elements(node).map((row) => {
      if (!hasClass(row, 'tlrow')) this.fail(`<${row.tag}> inside a timeline`);
      const year = findClass(row, 'tlyear');
      const text = findClass(row, 'tltext');
      if (!year || !text) this.fail('a timeline row is missing its year or its text');
      return '<div class="w-tl-item">'
        + `<div class="w-tl-year">${this.inline(year.children)}</div>`
        + `<div class="w-tl-text">${this.inline(text.children)}</div>`
        + '</div>';
    });
    return `<div class="w-timeline">${rows.join('')}</div>`;
  }

  stats(node) {
    const cells = elements(node).map((stat) => {
      if (!hasClass(stat, 'stat')) this.fail(`<${stat.tag}> inside a stat strip`);
      const big = findClass(stat, 'big');
      const cap = findClass(stat, 'cap');
      if (!big) this.fail('a stat cell has no figure');
      return '<div class="w-stat">'
        + `<span class="w-stat-big">${this.inline(big.children)}</span>`
        + (cap ? `<span class="w-stat-cap">${this.inline(cap.children)}</span>` : '')
        + '</div>';
    });
    return `<div class="w-stats">${cells.join('')}</div>`;
  }

  /** The five-line summary that closes every part. */
  nichod(node) {
    const label = findClass(node, 'boxlabel');
    const list = find(node, (child) => child.tag === 'ol' || child.tag === 'ul');
    if (!list) this.fail('the closing summary has no list');
    return '<div class="w-takeaways">'
      + (label ? `<h3>${this.inline(label.children)}</h3>` : '')
      + this.list(list)
      + '</div>';
  }

  pull(node) {
    const inner = node.children
      .filter(isTag)
      .map((child) => (hasClass(child, 'attrib')
        ? `<span class="w-attrib">${this.inline(child.children)}</span>`
        : this.inline(child.children)))
      .join(' ');
    return `<div class="w-pullquote">${inner}</div>`;
  }

  table(node) {
    let caption = '';
    const rows = [];

    const collect = (parent) => {
      for (const child of elements(parent)) {
        if (child.tag === 'caption') { caption = this.inline(child.children); continue; }
        if (child.tag === 'colgroup' || child.tag === 'col') continue;
        if (child.tag === 'thead' || child.tag === 'tbody' || child.tag === 'tfoot') {
          collect(child);
          continue;
        }
        if (child.tag !== 'tr') this.fail(`<${child.tag}> inside a table`);
        rows.push(elements(child).map((cell) => {
          if (cell.tag !== 'th' && cell.tag !== 'td') this.fail(`<${cell.tag}> inside a table row`);
          const span = Number(cell.attrs.colspan ?? 1);
          return {
            tag: cell.tag,
            span: Number.isInteger(span) && span > 1 ? span : 1,
            // `td.num` is the source's emphasis for a figure or a key term.
            hi: hasClass(cell, 'num'),
            html: this.inline(cell.children),
          };
        }));
      }
    };
    collect(node);

    if (!rows.length) this.fail('an empty table');

    const cell = ({ tag, span, hi, html }) => {
      const attrs = [
        hi && tag === 'td' ? ' class="w-hi"' : '',
        span > 1 ? ` colspan="${span}"` : '',
      ].join('');
      return `<${tag}${attrs}>${html}</${tag}>`;
    };

    const headed = rows[0].every((c) => c.tag === 'th');
    const head = headed ? `<thead><tr>${rows[0].map(cell).join('')}</tr></thead>` : '';
    const body = (headed ? rows.slice(1) : rows)
      .map((row) => `<tr>${row.map(cell).join('')}</tr>`)
      .join('');

    return '<figure class="w-figure">'
      + (caption ? `<figcaption class="w-table-caption">${caption}</figcaption>` : '')
      + `<div class="w-table-scroll"><table class="w-table">${head}<tbody>${body}</tbody></table></div>`
      + '</figure>';
  }

  /** One block-level node from the print source. */
  block(node) {
    if (!isTag(node)) {
      if (decode(node).trim()) this.fail(`loose text outside a block: "${flat(node).slice(0, 60)}"`);
      return '';
    }

    switch (node.tag) {
      case 'p': return this.paragraph(node);
      case 'h2': return `<h3 class="w-h3">${this.inline(node.children)}</h3>`;
      case 'h3': return `<h4 class="w-h4">${this.inline(node.children)}</h4>`;
      case 'ul':
      case 'ol': return this.list(node);
      case 'table': return this.table(node);
      case 'hr': return '<hr class="w-soft" />';
      case 'figure': return this.blocks(node.children);
      default: break;
    }

    if (node.tag !== 'div' && node.tag !== 'section') {
      this.fail(`unexpected block <${node.tag}>`);
    }

    if (hasClass(node, 'box')) return this.box(node);
    if (hasClass(node, 'sides')) return this.sides(node);
    // A panel that stands alone rather than opposite its counterpart.
    if (hasClass(node, 'side')) return `<div class="w-sides">${this.side(node)}</div>`;
    if (hasClass(node, 'myth')) return this.myth(node);
    if (hasClass(node, 'tl')) return this.timeline(node);
    if (hasClass(node, 'stats')) return this.stats(node);
    if (hasClass(node, 'nichod')) return this.nichod(node);
    if (hasClass(node, 'pull')) return this.pull(node);
    if (hasClass(node, 'srcs')) return this.blocks(node.children);
    // A layout-only spacer or rule carries nothing a web reader needs.
    if (hasClass(node, 'spacer')) return '';
    if (!flat(node)) return '';

    this.fail(`unrecognised block <div class="${classesOf(node).join(' ')}">`);
    return '';
  }

  blocks(nodes) {
    return nodes.map((node) => this.block(node)).join('');
  }
}

/* ------------------------------------------------------------------
   Reading one part.
   ------------------------------------------------------------------ */

/** The heading strip that opens every chapter, front-matter page and appendix. */
function readHead(section) {
  const head = findClass(section, 'chaphead');
  if (!head) return null;
  const kicker = findClass(head, 'chapnum');
  const title = find(head, (child) => child.tag === 'h1');
  const standfirst = findClass(head, 'standfirst');
  return {
    kicker: kicker ? flat(kicker) : '',
    title: title ? flat(title) : '',
    standfirst: standfirst ? flat(standfirst) : '',
    node: head,
  };
}

const withoutHead = (section, head) => section.children.filter((child) => child !== head.node);

function importPart({ n, label, file }) {
  const path = resolve(SRC_DIR, `_part${n}-source.html`);
  if (!existsSync(path)) throw new Error(`Missing source for part ${n}: ${path}`);

  const raw = readFileSync(path, 'utf8');
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error(`Part ${n}: no <body> in ${path}`);

  const where = `part ${n}`;
  const io = new Importer(where);
  const body = parse(bodyMatch[1], where);

  let cover = null;
  const front = [];
  const chapters = [];
  let appendix = null;

  for (const section of elements(body)) {
    if (hasClass(section, 'cover')) { cover = section; continue; }
    // The printed end page is replaced by the reader's own colophon.
    if (hasClass(section, 'endpage')) continue;

    const head = readHead(section);
    if (!head) {
      if (flat(section)) throw new Error(`${where}: a section with no heading strip`);
      continue;
    }

    if (head.kicker === 'APPENDIX') { appendix = { ...head, section }; continue; }
    if (/^CHAPTER\b/i.test(head.kicker)) { chapters.push({ ...head, section }); continue; }
    // Everything else before Chapter One is front matter. The printed contents
    // page is dropped: the reader builds its own from `toc`.
    if (/^contents$/i.test(head.title)) continue;
    if (chapters.length) throw new Error(`${where}: front matter after Chapter One — "${head.title}"`);
    front.push({ ...head, section });
  }

  if (!cover) throw new Error(`${where}: no cover`);
  if (!chapters.length) throw new Error(`${where}: no chapters`);
  if (!front.length) throw new Error(`${where}: no front matter`);

  const coverTitle = titleCase(flat(deepFindClass(cover, 'ptitle') ?? { children: [] }));
  const coverSub = flat(deepFindClass(cover, 'sub') ?? { children: [] });
  if (!coverTitle || !coverSub) throw new Error(`${where}: the cover has no title or strapline`);

  /* Front matter becomes the prologue. The first block's title heads the
     section; any later block keeps its own heading inside it. */
  const prologue = front
    .map(({ title, section }, index) => (index === 0 ? '' : `<h3 class="w-h3">${esc(title)}</h3>`)
      + io.blocks(withoutHead(section, front[index])))
    .join('<hr class="w-soft" />');

  const toc = [];
  const html = chapters
    .map(({ title, standfirst, section }, index) => {
      const number = index + 1;
      const id = `rf${n}-${number}-${slugify(title)}`;
      toc.push({ id, num: String(number), text: title });
      return `<h2 class="w-h2" id="${id}"><span class="w-num">${number}</span>${esc(title)}</h2>`
        + (standfirst ? `<p class="w-lead">${esc(standfirst)}</p>` : '')
        + io.blocks(withoutHead(section, chapters[index]));
    })
    .join('');

  const sources = appendix
    ? (appendix.standfirst ? `<p>${esc(appendix.standfirst)}</p>` : '')
      + io.blocks(withoutHead(appendix.section, appendix))
    : '';

  const pdfPath = resolve(SRC_DIR, file);
  if (!existsSync(pdfPath)) throw new Error(`${where}: missing PDF ${pdfPath}`);
  const pdfSize = `${Math.round(statSync(pdfPath).size / 1024)} KB`;

  const strip = (markup) => markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = strip(`${prologue} ${html}`).split(/\s+/).filter(Boolean).length;

  return {
    part: {
      n,
      label,
      title: coverTitle,
      lead: coverSub,
      words,
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      published: PUBLISHED,
      pdf: `the-reservation-files-part-${n}.pdf`,
      pdfSize,
      pdfLabel: `Part ${n} PDF`,
      toc,
      prologue,
      prologueTitle: front[0].title,
      prologueTag: `${front[0].kicker.toLowerCase().replace(/\b[a-z]/, (c) => c.toUpperCase())} · The Reservation Files, Part ${n}`,
      html,
      sources,
    },
    source: { path, pdfPath, chapters: chapters.length, warnings: io.warnings },
  };
}

/* ------------------------------------------------------------------
   Build.
   ------------------------------------------------------------------ */
const imported = PARTS.map(importPart);
const parts = imported.map((entry) => entry.part);

/* Guardrails. A silent drop here would publish a part with a chapter missing
   and nothing to show for it. */
for (const [index, part] of parts.entries()) {
  if (part.n !== index + 1) throw new Error(`Parts must be contiguous from 1; found ${part.n} at ${index}`);
  if (part.toc.length < 8) throw new Error(`Part ${part.n} recovered only ${part.toc.length} chapters`);
  if (part.words < 6000) throw new Error(`Part ${part.n} is unexpectedly short (${part.words} words)`);
  if (!part.sources) throw new Error(`Part ${part.n} recovered no sources appendix`);
  if (!part.prologue) throw new Error(`Part ${part.n} recovered no front matter`);
  if (new Set(part.toc.map((t) => t.id)).size !== part.toc.length) {
    throw new Error(`Part ${part.n} has duplicate chapter ids`);
  }
  for (const entry of part.toc) {
    if (!part.html.includes(`id="${entry.id}"`)) {
      throw new Error(`Part ${part.n}: contents entry ${entry.id} has no heading`);
    }
  }
}

const totalWords = parts.reduce((sum, part) => sum + part.words, 0);

const output = `/* ============================================================
   THE RESERVATION FILES — A COMPLETE, HONEST HISTORY
   Generated by scripts/import-reservation-files.mjs from the
   authored print-HTML sources. Do not hand-edit: re-run the
   importer.

   ${parts.length} published parts · ${totalWords.toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, output, 'utf8');

console.log(`✓ ${OUT}`);
for (const { part } of imported) {
  console.log(
    `  Part ${part.n} — ${part.title.padEnd(24)} ${String(part.toc.length).padStart(2)} chapters · `
    + `${part.words.toLocaleString('en-IN').padStart(7)} words · ${String(part.minutes).padStart(3)} min · ${part.pdfSize}`
  );
}
console.log(`  ${parts.length} parts · ${totalWords.toLocaleString('en-IN')} words total`);
