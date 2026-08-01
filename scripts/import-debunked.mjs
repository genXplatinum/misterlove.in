/**
 * import-debunked.mjs
 *
 * Importer for "Debunked", the eleven-part field guide to modern claims made
 * about ancient India. Like The Reservation Files and the Sikhism series, the
 * sources are print-first HTML rather than PDFs to be reverse-engineered.
 *
 * Unlike those, this series was typeset in two different templates as it was
 * written, and the second one arrived mid-series:
 *
 *   Parts 1 to 7   the original field-guide template — a title page, foreword
 *                  and contents set with .section-num, chapters set with
 *                  .chapnum, and the claim apparatus in .claim-box, .test-box,
 *                  .danger-box, .note-box, .define and .trick.
 *   Parts 8 to 11  the later template, the same one the Sikhism series uses —
 *                  a cover, a running foot, and five numbered .step rules per
 *                  chapter. Part 11 adds the glossary devices.
 *
 * Both are read here, into one vocabulary, so the web edition is consistent
 * even though the print edition is not. It is deliberately strict: an
 * unrecognised construct throws rather than silently dropping prose.
 *
 * What the web edition drops: the title page or cover, the printed contents
 * list (the reader renders its own from `toc`), the running feet and page
 * numbers, and the printed "end of part" rule.
 *
 * Usage:
 *   node scripts/import-debunked.mjs
 *   node scripts/import-debunked.mjs "<folder holding Part_NN.html>"
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SRC_DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/Debunk';
const OUT = 'src/data/writing/debunked.js';

/* The editorial label shown in each part chip. Everything else — the title,
   the strapline, the chapter list — is read from the source, so it cannot
   drift from the published book. */
const PARTS = [
  { n: 1, label: 'The Method' },
  { n: 2, label: 'Flying Machines' },
  { n: 3, label: 'Weapons' },
  { n: 4, label: 'Medicine' },
  { n: 5, label: 'Astronomy' },
  { n: 6, label: 'Mathematics' },
  { n: 7, label: 'History' },
  { n: 8, label: 'Cows and Plants' },
  { n: 9, label: 'The Quantum Guru' },
  { n: 10, label: 'Priority Claims' },
  { n: 11, label: 'Conclusion' },
];

/* Every English part was typeset in the same run on 1 June 2026; the Hindi
   editions of parts 1 to 7 predate it. The print run is the date the book
   itself carries, which is what the rest of this shelf publishes. */
const PUBLISHED = '2026-06-01';
const WORDS_PER_MINUTE = 220;

/* ------------------------------------------------------------------
   A very small HTML reader.
   ------------------------------------------------------------------ */
const VOID = new Set(['br', 'hr', 'img', 'col', 'meta', 'link', 'input']);
const RAW_TEXT = new Set(['style', 'script']);

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', middot: '·', times: '×', deg: '°',
  frac12: '½', sup2: '²', sup3: '³', pi: 'π', alpha: 'α', beta: 'β',
  minus: '−', plusmn: '±', ne: '≠', le: '≤', ge: '≥', rarr: '→',
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

function deepFind(node, predicate) {
  for (const child of elements(node)) {
    if (predicate(child)) return child;
    const nested = deepFind(child, predicate);
    if (nested) return nested;
  }
  return undefined;
}
const deepFindClass = (node, name) => deepFind(node, (child) => hasClass(child, name));

function textOf(node) {
  if (!isTag(node)) return decode(node);
  if (node.tag === 'br') return ' ';
  return node.children.map(textOf).join('');
}
const flat = (node) => textOf(node).replace(/\s+/g, ' ').trim();

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

/* The print CSS renders straight quotes; the site sets real ones everywhere
   else. Run once over finished markup, never per text node, because the
   author quotes across inline tags. Anything between < and > is skipped. */
function smartenHtml(html) {
  let out = '';
  let open = true;
  for (let i = 0; i < html.length; i += 1) {
    const c = html[i];
    if (c === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) throw new Error('smart quotes: unterminated tag');
      out += html.slice(i, end + 1);
      i = end;
      continue;
    }
    if (c === '"') { out += open ? '“' : '”'; open = !open; continue; }
    if (c === "'") { out += '’'; continue; }
    out += c;
  }
  // An unbalanced count means a quotation opens in one field and closes in
  // another; reported rather than silently mis-set.
  if (!open) throw new Error('smart quotes: an unclosed double quote');
  return out;
}

const smartenText = (s) => smartenHtml(esc(s))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** Titles are set in capitals on some covers and have to be recased. */
const MINOR = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from',
  'in', 'into', 'nor', 'of', 'on', 'or', 'the', 'to', 'up', 'vs', 'with']);
const titleCase = (s) => (s === s.toUpperCase()
  ? s.toLowerCase().split(/\s+/).filter(Boolean)
    .map((w, i, all) => (i > 0 && i < all.length - 1 && MINOR.has(w)
      ? w : w.replace(/[a-z]/, (c) => c.toUpperCase())))
    .join(' ')
  : s);

const INLINE = new Set(['strong', 'b', 'em', 'i', 'sup', 'sub', 'br', 'span', 'a', 'small', 'code']);

/* Print callout → prose tone. The two templates name the same devices
   differently, so both vocabularies map into one set of tones. */
const BOX_TONES = {
  'claim-box': 'claim',       // the claim under examination
  'danger-box': 'worry',      // a claim that can get somebody killed
  'test-box': 'aim',          // questions back to the reader
  'note-box': 'key',          // why a step matters
  define: 'simple',           // a word explained on the spot
  // What the record does support, once the inflation is stripped off. Part 6
  // calls this a credit box and Part 11 a real box; it is one device.
  'credit-box': 'answer',
  'real-box': 'answer',
  'pattern-box': 'remember',  // a recurring shape of bad argument
};

class Importer {
  constructor(where) {
    this.where = where;
    this.warnings = [];
  }

  fail(message) { throw new Error(`${this.where}: ${message}`); }
  warn(message) { if (!this.warnings.includes(message)) this.warnings.push(message); }

  inline(nodes) {
    return nodes.map((node) => {
      if (!isTag(node)) return esc(decode(node)).replace(/\s+/g, ' ');
      if (!INLINE.has(node.tag)) this.fail(`unexpected <${node.tag}> inside inline copy`);
      if (node.tag === 'br') return '<br />';
      // A citation line under a quotation keeps its role; every other span in
      // the body prose is a print colour or size hint the stylesheet sets.
      if (node.tag === 'span') {
        if (hasClass(node, 'cite')) return `<span class="w-attrib">${this.inline(node.children)}</span>`;
        return this.inline(node.children);
      }
      if (node.tag === 'small') return `<span class="w-plain">${this.inline(node.children)}</span>`;
      if (node.tag === 'a') {
        const href = node.attrs.href ?? '';
        if (!/^https?:\/\//.test(href)) return this.inline(node.children);
        return `<a class="w-cite" href="${esc(href)}" rel="noopener">${this.inline(node.children)}</a>`;
      }
      const tag = node.tag === 'b' ? 'strong' : node.tag === 'i' ? 'em' : node.tag;
      return `<${tag}>${this.inline(node.children)}</${tag}>`;
    }).join('').replace(/\s+/g, ' ').trim();
  }

  paragraph(node) {
    const body = this.inline(node.children);
    if (!body) return '';
    if (hasClass(node, 'dropcap')) return `<p class="w-lead">${body}</p>`;
    if (hasClass(node, 'quiet') || hasClass(node, 'center')) return `<p class="w-small">${body}</p>`;

    const style = node.attrs.style ?? '';
    if (!style) return `<p>${body}</p>`;
    if (/^—\s*End of Part \d+\s*—$/.test(flat(node))) return '';
    if (/font-size:\s*(9|10|11)pt/.test(style) || /color:\s*#[59][05]/.test(style)) {
      return `<p class="w-small">${body}</p>`;
    }
    if (/text-align:\s*center/.test(style)) return `<p class="w-small">${body}</p>`;
    if (/^(margin|color|font-style|padding)/.test(style)) return `<p>${body}</p>`;
    this.warn(`paragraph with an unmapped style, kept as body copy: ${style}`);
    return `<p>${body}</p>`;
  }

  list(node) {
    const items = elements(node).map((item) => {
      if (item.tag !== 'li') this.fail(`<${item.tag}> inside a list`);
      return `<li>${this.blocksOrInline(item)}</li>`;
    }).join('');
    const tag = node.tag === 'ol' ? 'ol' : 'ul';
    return `<${tag}>${items}</${tag}>`;
  }

  blocksOrInline(node) {
    const blocks = elements(node).some((child) => !INLINE.has(child.tag));
    return blocks ? this.blocks(node.children) : this.inline(node.children);
  }

  /**
   * A callout. The older template sets its body as loose text after the label
   * rather than wrapping it in a paragraph, so loose runs are gathered into
   * one instead of being rejected as stray prose.
   */
  box(node, tone) {
    let label = '';
    const parts = [];
    let loose = [];
    const flush = () => {
      if (!loose.length) return;
      const body = this.inline(loose);
      if (body) parts.push(`<p>${body}</p>`);
      loose = [];
    };

    /* Most callouts name themselves in a .label or .tag span. The note box
       does not: it opens with its heading set in bold capitals, inline with
       the copy that follows. That is the same device, so it reads the same. */
    const first = node.children.find((child) => isTag(child) || decode(child).trim());
    const inlineHeading = !deepFind(node, (c) => hasClass(c, 'label') || hasClass(c, 'tag'))
      && isTag(first) && (first.tag === 'b' || first.tag === 'strong')
      && flat(first) === flat(first).toUpperCase()
      ? first
      : null;

    for (const child of node.children) {
      if (isTag(child) && (hasClass(child, 'label') || hasClass(child, 'tag'))) {
        flush();
        label = `<span class="w-box-label">${this.inline(child.children)}</span>`;
        continue;
      }
      if (child === inlineHeading) {
        label = `<span class="w-box-label">${this.inline(child.children).replace(/\.$/, '')}</span>`;
        continue;
      }
      if (!isTag(child) || INLINE.has(child.tag)) { loose.push(child); continue; }
      flush();
      parts.push(this.block(child));
    }
    flush();

    if (!label) this.fail(`a ${tone} callout with no label`);
    return `<div class="w-box w-box--${tone}">${label}${parts.join('')}</div>`;
  }

  /** A quotation, with its citation line if it carries one. */
  quote(node) {
    const parts = [];
    let loose = [];
    const flush = () => {
      if (!loose.length) return;
      const body = this.inline(loose);
      if (body) parts.push(`<p>${body}</p>`);
      loose = [];
    };
    for (const child of node.children) {
      if (isTag(child) && hasClass(child, 'cite')) {
        flush();
        parts.push(`<span class="w-attrib">${this.inline(child.children)}</span>`);
        continue;
      }
      if (!isTag(child) || INLINE.has(child.tag)) { loose.push(child); continue; }
      flush();
      parts.push(this.block(child));
    }
    flush();
    return `<div class="w-box w-box--quote">${parts.join('')}</div>`;
  }

  /**
   * One of the ten logical tricks, numbered. The myth card already carries a
   * counter and a title over a body, which is exactly this device.
   */
  trick(node) {
    const head = find(node, (child) => child.tag === 'h4');
    if (!head) this.fail('a trick card with no heading');
    const counter = findClass(head, 'counter-tag');
    const title = head.children.filter((child) => child !== counter);
    const body = node.children.filter((child) => child !== head);
    return '<div class="w-myth">'
      + '<div class="w-myth-head">'
      + (counter ? `<span class="w-myth-tag">${this.inline(counter.children)}</span>` : '')
      + `<span class="w-myth-title">${this.inline(title)}</span>`
      + '</div>'
      + `<div class="w-myth-body">${this.blocks(body)}</div>`
      + '</div>';
  }

  /**
   * The numbered rules each later-template chapter is built from. Usually the
   * five debunking steps; Part 11's chapter on talking to people you love
   * numbers its rules the same way and reads the same on the page.
   */
  step(node) {
    const text = flat(node);
    const match = text.match(/^(?:Step|Rule)\s+(\d+)\s*[—-]\s*(.+)$/);
    if (!match) this.fail(`a step rule that is not "Step N — Title": "${text}"`);
    return '<p class="w-step">'
      + `<span class="w-step-n">${esc(match[1])}</span>`
      + `<span class="w-step-t">${esc(match[2])}</span>`
      + '</p>';
  }

  /** One entry in Part 11's cross-series glossary. */
  glossary(node) {
    const term = findClass(node, 'term');
    const dates = findClass(node, 'dates');
    const body = findClass(node, 'body');
    if (!term || !body) this.fail('a glossary entry missing its term or its body');
    // A term over its definition is a description list, so it is marked up as
    // one — a <dt>/<dd> pair is only valid inside a <dl>.
    return '<dl class="w-def">'
      + `<dt class="w-def-term">${this.inline(term.children)}`
      + (dates ? `<span class="w-def-dates">${this.inline(dates.children)}</span>` : '')
      + '</dt>'
      + `<dd class="w-def-body">${this.blocksOrInline(body)}</dd>`
      + '</dl>';
  }

  /**
   * The epigraph facing Chapter One. The two templates build it differently —
   * the original wraps the quotation in a blockquote with a .cite under it and
   * a note after the ornament; the later one sets the quotation as loose text
   * broken by <br>, with the gloss in a .who span. Both reduce to the same
   * thing: an opening quotation, then one or more credits under it.
   */
  epigraph(node) {
    const quotation = [];
    const credits = [];

    for (const child of node.children) {
      // Loose text and its line breaks are the quotation itself. In the later
      // template the quotation is set directly in the epigraph and broken with
      // <br>, so a break here is a line of verse, not a new field.
      if (!isTag(child) || child.tag === 'br' || INLINE.has(child.tag)) {
        if (isTag(child) && (hasClass(child, 'who') || hasClass(child, 'cite'))) {
          credits.push(this.inline(child.children));
          continue;
        }
        quotation.push(child);
        continue;
      }
      // The ✦ ✦ ✦ rule only separates the quotation from the note under it.
      if (hasClass(child, 'ornament')) continue;
      if (child.tag === 'blockquote') {
        const cite = deepFindClass(child, 'cite');
        quotation.push(...child.children.filter((c) => c !== cite));
        if (cite) credits.push(this.inline(cite.children));
        continue;
      }
      credits.push(this.inline(child.children));
    }

    const opening = this.inline(quotation);
    if (!opening) this.fail('an epigraph with no quotation');
    if (!credits.filter(Boolean).length) this.fail('an epigraph with no attribution');
    return `<div class="w-pullquote">${opening}`
      + credits.filter(Boolean).map((line) => `<span class="w-attrib">${line}</span>`).join('')
      + '</div>';
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
          if (cell.tag !== 'th' && cell.tag !== 'td') this.fail(`<${cell.tag}> inside a table row`);
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
    const body = (headed ? rows.slice(1) : rows).map((row) => `<tr>${row.map(cell).join('')}</tr>`).join('');
    return '<figure class="w-figure">'
      + (caption ? `<figcaption class="w-table-caption">${caption}</figcaption>` : '')
      + `<div class="w-table-scroll"><table class="w-table">${head}<tbody>${body}</tbody></table></div>`
      + '</figure>';
  }

  block(node) {
    if (!isTag(node)) {
      if (decode(node).trim()) this.fail(`loose text outside a block: "${flat(node).slice(0, 60)}"`);
      return '';
    }

    switch (node.tag) {
      case 'p': return this.paragraph(node);
      case 'h3': return `<h3 class="w-h3">${this.inline(node.children)}</h3>`;
      case 'h4': return `<h4 class="w-h4">${this.inline(node.children)}</h4>`;
      case 'ul': return hasClass(node, 'toc') ? '' : this.list(node);
      case 'ol': return this.list(node);
      case 'table': return this.table(node);
      case 'blockquote': return this.quote(node);
      // The printed rule and the ✦ ✦ ✦ ornament are the same soft break.
      case 'hr': return '<hr class="w-soft" />';
      default: break;
    }

    if (node.tag !== 'div' && node.tag !== 'section') this.fail(`unexpected block <${node.tag}>`);

    const tone = classesOf(node).map((name) => BOX_TONES[name]).find(Boolean);
    if (tone) return this.box(node, tone);
    if (hasClass(node, 'trick')) return this.trick(node);
    if (hasClass(node, 'step')) return this.step(node);
    if (hasClass(node, 'glossary-entry')) return this.glossary(node);
    if (hasClass(node, 'epigraph')) return this.epigraph(node);
    if (hasClass(node, 'section-divider')) return `<h3 class="w-h3">${this.inline(node.children)}</h3>`;
    if (hasClass(node, 'ornament')) return '<hr class="w-soft" />';
    // Page furniture: the reader has its own header, pager and contents.
    if (['pageno', 'foot', 'toc-line', 'chapnum', 'chapter-num', 'section-num'].some((c) => hasClass(node, c))) return '';
    if (!flat(node)) return '';

    this.fail(`unrecognised block <div class="${classesOf(node).join(' ')}">`);
    return '';
  }

  blocks(nodes) { return nodes.map((node) => this.block(node)).join(''); }
}

/* ------------------------------------------------------------------
   Reading one part.
   ------------------------------------------------------------------ */

/** A printed page, minus its heading strip and its running foot. */
function readPage(page) {
  const kicker = elements(page).find((c) => ['chapnum', 'chapter-num', 'section-num'].some((n) => hasClass(c, n)));
  const heading = find(page, (child) => child.tag === 'h2');
  const dropped = new Set([kicker, heading].filter(Boolean));
  return {
    kicker: kicker ? flat(kicker) : '',
    title: heading ? flat(heading) : '',
    body: page.children.filter((child) => !dropped.has(child)),
    node: page,
  };
}

/** Wrap a run of sections into one prologue, each after the first titled. */
const joinFront = (io, pages) => pages
  .map((page, index) => (index === 0 ? '' : `<h3 class="w-h3">${esc(page.title)}</h3>`) + io.blocks(page.body))
  .join('<hr class="w-soft" />');

function importPart({ n, label }) {
  const path = resolve(SRC_DIR, `Part_${String(n).padStart(2, '0')}.html`);
  if (!existsSync(path)) throw new Error(`Missing source for part ${n}: ${path}`);

  const raw = readFileSync(path, 'utf8');
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error(`Part ${n}: no <body> in ${path}`);

  const where = `part ${n}`;
  const io = new Importer(where);
  const body = parse(bodyMatch[1], where);
  const docTitle = decode((raw.match(/<title>([^<]*)<\/title>/i) ?? [])[1] ?? '');

  const cover = findClass(body, 'cover');
  const titlepage = find(body, (c) => hasClass(c, 'page') && hasClass(c, 'titlepage'));
  if (!cover && !titlepage) throw new Error(`${where}: neither a cover nor a title page`);

  let title;
  let lead;
  if (cover) {
    title = flat(deepFind(cover, (c) => c.tag === 'h1') ?? { children: [] });
    lead = flat(deepFindClass(cover, 'sub') ?? { children: [] });
  } else {
    /* The original template's title page carries the part name in
       .title-subtitle for parts 2 to 7 — but Part 1 puts the whole series'
       subtitle there instead, because it is the volume that introduces the
       series. The document title names the part in every case, so it is the
       authority, with the title page as the fallback. */
    const named = docTitle.match(/:\s*(.+)$/);
    title = titleCase(named
      ? named[1].trim()
      : flat(deepFindClass(titlepage, 'title-subtitle') ?? { children: [] }));
    lead = flat(deepFindClass(titlepage, 'title-blurb') ?? { children: [] });
  }
  if (!title || !lead) throw new Error(`${where}: the cover has no title or strapline`);

  const front = [];
  const chapters = [];
  let epigraph = null;
  let closing = null;

  for (const section of elements(body)) {
    if (RAW_TEXT.has(section.tag)) continue;
    if (section === cover || section === titlepage) continue;
    if (!hasClass(section, 'page')) io.fail(`unexpected top-level <${section.tag}>`);

    const page = readPage(section);
    if (!page.kicker && deepFindClass(section, 'epigraph')) { epigraph = page; continue; }
    if (/^(Chapter|Glossary|Part)\s+[0-9IVX]+$/i.test(page.kicker)) { chapters.push(page); continue; }
    if (/^(Closing|END OF PART \d+)$/i.test(page.kicker)) { closing = page; continue; }
    if (/^(Foreword|Contents)/i.test(page.kicker)) { front.push(page); continue; }
    io.fail(`a page with an unrecognised kicker: "${page.kicker || '(none)'}"`);
  }

  if (!front.length) throw new Error(`${where}: no front matter`);
  if (!chapters.length) throw new Error(`${where}: no chapters`);

  /* The printed contents list is dropped — the reader builds its own — but the
     note under it explains the method, and that a web reader still needs. The
     list itself is removed by Importer.block, so only the notes survive. */
  const prologue = smartenHtml(
    joinFront(io, front) + (epigraph ? io.blocks(epigraph.body) : '')
  )
    // The original template rules a line under every heading; the web edition
    // sets its own, so an opening rule is a stray.
    .replace(/^(?:<hr class="w-soft" \/>)+/, '');

  const toc = [];
  let numbered = 0;
  const chapterHtml = chapters.map((page) => {
    // Part 11 closes with unnumbered movements (the glossaries, the note);
    // they belong in the contents but must not claim a chapter number.
    const isChapter = /^Chapter/i.test(page.kicker);
    if (isChapter) numbered += 1;
    const id = `db${n}-${slugify(page.kicker)}-${slugify(page.title)}`;
    toc.push({ id, num: isChapter ? String(numbered).padStart(2, '0') : '—', text: smartenText(page.title) });
    return `<h2 class="w-h2" id="${id}">`
      + (isChapter ? `<span class="w-num">${numbered}</span>` : '')
      + `${esc(page.title)}</h2>`
      + io.blocks(page.body);
  }).join('');

  /* The older template closes with a page that recaps the part and then lists
     its sources under a heading; the sources go to the reader's own sources
     block and the recap closes the article. */
  let closingHtml = '';
  let sources = '';
  if (closing) {
    const heads = closing.body.filter((c) => isTag(c) && c.tag === 'h3');
    const sourcesHead = heads.find((h) => /sources/i.test(flat(h)));
    const recap = [];
    const sourceBody = [];
    let bucket = recap;
    for (const child of closing.body) {
      if (child === sourcesHead) { bucket = sourceBody; continue; }
      bucket.push(child);
    }
    const id = `db${n}-closing`;
    toc.push({ id, num: '—', text: smartenText(closing.title) });
    closingHtml = `<h2 class="w-h2" id="${id}">${esc(closing.title)}</h2>` + io.blocks(recap);
    sources = smartenHtml(io.blocks(sourceBody));
  }

  const html = smartenHtml(chapterHtml + closingHtml);

  const pdfName = `Part_${String(n).padStart(2, '0')}.pdf`;
  if (!existsSync(resolve(SRC_DIR, pdfName))) throw new Error(`${where}: missing PDF ${pdfName}`);

  const strip = (markup) => markup
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const words = strip(`${prologue} ${html} ${sources}`).split(/\s+/).filter(Boolean).length;

  return {
    part: {
      n,
      label,
      title: smartenText(title),
      lead: smartenText(lead),
      words,
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      published: PUBLISHED,
      toc,
      prologue,
      prologueTitle: smartenText(front[0].title),
      prologueTag: `${front[0].kicker.replace(/\s+of part \d+/i, '')} · Debunked, Part ${n}`
        .replace(/^([a-z])/, (c) => c.toUpperCase()),
      html,
      sources,
    },
    source: {
      path, docTitle, template: cover ? 'later' : 'original',
      chapters: chapters.length, warnings: io.warnings,
    },
  };
}

/* ------------------------------------------------------------------
   Build.
   ------------------------------------------------------------------ */
const imported = PARTS.map(importPart);
const parts = imported.map((entry) => entry.part);

for (const [index, part] of parts.entries()) {
  if (part.n !== index + 1) throw new Error(`Parts must be contiguous from 1; found ${part.n} at ${index}`);
  if (part.toc.length < 5) throw new Error(`Part ${part.n} recovered only ${part.toc.length} sections`);
  if (part.words < 3000) throw new Error(`Part ${part.n} is unexpectedly short (${part.words} words)`);
  if (!part.prologue) throw new Error(`Part ${part.n} recovered no front matter`);
  if (new Set(part.toc.map((t) => t.id)).size !== part.toc.length) {
    throw new Error(`Part ${part.n} has duplicate section ids`);
  }
  for (const entry of part.toc) {
    if (!part.html.includes(`id="${entry.id}"`)) {
      throw new Error(`Part ${part.n}: contents entry ${entry.id} has no heading`);
    }
  }
}

const totalWords = parts.reduce((sum, part) => sum + part.words, 0);

const output = `/* ============================================================
   DEBUNKED — A FIELD GUIDE
   Generated by scripts/import-debunked.mjs from the authored
   print-HTML sources. Do not hand-edit: re-run the importer.

   ${parts.length} parts · ${totalWords.toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, output, 'utf8');

console.log(`✓ ${OUT}`);
for (const { part, source } of imported) {
  console.log(
    `  Part ${String(part.n).padStart(2)} [${source.template.padEnd(8)}] ${part.title.slice(0, 34).padEnd(34)} `
    + `${String(source.chapters).padStart(2)} sections · ${part.words.toLocaleString('en-IN').padStart(7)} words`
    + `${part.sources ? '' : '  (no sources page)'}`
  );
  for (const warning of source.warnings) console.log(`     ! ${warning}`);
}
console.log(
  `  ${parts.length} parts · ${totalWords.toLocaleString('en-IN')} words · `
  + `${parts.reduce((sum, part) => sum + part.minutes, 0)} min`
);
