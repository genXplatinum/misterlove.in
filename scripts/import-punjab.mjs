/**
 * import-punjab.mjs
 *
 * Importer for "Punjab: The Whole Truth" — a thirteen-part investigation, all
 * thirteen of which are written.
 *
 * The series was first published as PDFs and this importer used to recover the
 * prose from their typography. It no longer has to: the authored HTML for
 * every written part survives, and it is real semantic markup — chapters,
 * scorecards, timelines, side-by-side panels and evidence tables all carry
 * their own classes. So this reads the markup, which is both faithful and far
 * less likely to mangle a word than measuring baselines ever was.
 *
 * It is deliberately strict: an unrecognised construct throws rather than
 * silently dropping prose, and it reports every unmapped class in one run.
 *
 * What the web edition drops: the cover, the printed contents (the reader
 * builds its own from `toc`), the running foot, and the author bio and contact
 * blocks the site already carries on every page.
 *
 * Usage:
 *   node scripts/import-punjab.mjs
 *   node scripts/import-punjab.mjs "<folder holding partN.html>"
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/* The book's own folder. The sources used to be read from a session scratchpad,
   which is temporary and was very nearly lost once — the authored HTML now
   lives with the book and is the only copy this reads. */
const SRC_DIR = process.argv[2]
  ?? 'C:/Users/rajpa/Documents/books/The Punjab Files/_source-html';
const OUT = 'src/data/writing/punjab.js';
const PUBLISHED = '2026-08-02';
const WORDS_PER_MINUTE = 220;
const LAST_PART = 13;

/* The editorial label in each part chip. Everything else — title, strapline,
   chapter list — is read from the source and cannot drift from the book. */
const LABELS = {
  1: 'Before the Name',
  2: 'Antiquity',
  3: 'The Highway',
  4: 'The Gurus',
  5: 'The Empire',
  6: 'Under the Raj',
  7: 'Partition',
  8: 'Redrawing',
  9: 'Bhindranwale',
  10: 'The Dark Decade',
  11: 'The Network',
  12: 'The Arithmetic',
  13: 'Punjab Now',
};

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
function deepFindClass(node, name) {
  for (const child of elements(node)) {
    if (hasClass(child, name)) return child;
    const nested = deepFindClass(child, name);
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
   Print vocabulary → prose vocabulary.
   ------------------------------------------------------------------ */
const BOX_TONES = {
  remember: 'remember',   // carry this forward
  disputed: 'claim',      // a contested figure or claim
  simple: 'simple',       // a term explained on the spot
  testbox: 'aim',         // questions back to the reader
  verse: 'quote',         // a quoted verse
  note: 'key',
};

/* The scorecard chips: what the evidence did to the claim. */
const TAGS = { t: 'true', f: 'false', p: 'half', n: 'half' };

/* Evidence grading used in the Bhindranwale and Dark Decade parts. */
const GRADES = { doc: 'fact', fab: 'claim', inf: 'interp' };

/* Parts 11 and 13 sort claims by what the record actually did to them. The
   three print statuses are the site's three colours of truth. */
const STATUSES = { proved: 'fact', alleged: 'interp', denied: 'claim' };

/* Part 12 audits a proposal claim by claim and Part 13 grades every claim the
   series made. Print draws six shades; the site carries the three it already
   uses, plus grey for a question the evidence leaves open. */
const VERDICT_TONES = {
  't-true': 'fact', 't-most': 'fact', pass: 'fact',
  't-half': 'interp', 't-mis': 'interp', marg: 'interp',
  't-false': 'claim', fail: 'claim',
  't-open': 'open',
};

const INLINE = new Set(['strong', 'b', 'em', 'i', 'sup', 'sub', 'br', 'span', 'a', 'code', 'small']);

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
      if (node.tag === 'span') {
        const tag = classesOf(node).map((c) => TAGS[c]).find(Boolean);
        if (hasClass(node, 'tag') && tag) {
          return `<span class="w-verdict w-verdict--${tag}">${this.inline(node.children)}</span>`;
        }
        const grade = classesOf(node).map((c) => GRADES[c]).find(Boolean);
        if (grade) return `<span class="w-tone-${grade}">${this.inline(node.children)}</span>`;
        /* A verdict named mid-sentence: print sets it bold and coloured, and
           the colour is the whole point of it. */
        const tone = classesOf(node).map((c) => VERDICT_TONES[c]).find(Boolean);
        if (tone) return `<strong class="w-tone-${tone}">${this.inline(node.children)}</strong>`;
        return this.inline(node.children);
      }
      if (node.tag === 'a') {
        const href = node.attrs.href ?? '';
        if (!/^https?:\/\//.test(href)) return this.inline(node.children);
        return `<a class="w-cite" href="${esc(href)}" rel="noopener">${this.inline(node.children)}</a>`;
      }
      const tag = node.tag === 'b' ? 'strong' : node.tag === 'i' ? 'em' : node.tag === 'small' ? 'span' : node.tag;
      return `<${tag}>${this.inline(node.children)}</${tag}>`;
    }).join('').replace(/\s+/g, ' ').trim();
  }

  paragraph(node) {
    const body = this.inline(node.children);
    if (!body) return '';
    if (hasClass(node, 'lead')) return `<p class="w-lead">${body}</p>`;
    if (hasClass(node, 'sig')) return `<span class="w-attrib">${body}</span>`;
    if (hasClass(node, 'corr') || hasClass(node, 'small') || hasClass(node, 'center')) {
      return `<p class="w-small">${body}</p>`;
    }
    // An evidence-graded paragraph keeps the colour that grades it.
    const grade = classesOf(node).map((c) => GRADES[c]).find(Boolean);
    if (grade) return `<p class="w-srcline w-tone-${grade}">${body}</p>`;
    return `<p>${body}</p>`;
  }

  list(node) {
    const items = elements(node).map((item) => {
      if (item.tag !== 'li') this.fail(`<${item.tag}> inside a list`);
      const blocks = elements(item).some((c) => !INLINE.has(c.tag));
      return `<li>${blocks ? this.blocks(item.children) : this.inline(item.children)}</li>`;
    }).join('');
    return `<${node.tag}>${items}</${node.tag}>`;
  }

  box(node) {
    const tone = classesOf(node).map((c) => BOX_TONES[c]).find(Boolean) ?? 'key';
    const parts = [];
    /* A verse box sets its lines as loose text broken by <br> rather than
       wrapping them in a paragraph, so loose runs are gathered into one
       instead of being rejected as stray prose. */
    let loose = [];
    const flush = () => {
      if (!loose.length) return;
      const body = this.inline(loose);
      if (body) parts.push(`<p>${body}</p>`);
      loose = [];
    };

    for (const child of node.children) {
      if (isTag(child) && (hasClass(child, 'lbl') || hasClass(child, 'lbl2'))) {
        flush();
        parts.push(`<span class="w-box-label">${this.inline(child.children)}</span>`);
        continue;
      }
      if (!isTag(child) || INLINE.has(child.tag)) { loose.push(child); continue; }
      flush();
      parts.push(this.block(child));
    }
    flush();
    return `<div class="w-box w-box--${tone}">${parts.join('')}</div>`;
  }

  /** A scorecard entry: the claim, then what the evidence did to it. */
  verdict(node) {
    const claim = findClass(node, 'claim');
    const body = findClass(node, 'body');
    if (!claim || !body) this.fail('a scorecard entry missing its claim or its body');
    return '<div class="w-myth">'
      + `<div class="w-myth-head"><span class="w-myth-title">${this.inline(claim.children)}</span></div>`
      + `<div class="w-myth-body">${this.blocks(body.children)}</div>`
      + '</div>';
  }

  /** Two readings of the same event, set against each other. */
  twoside(node) {
    // The block may open with its own header bar, above both panels.
    const head = findClass(node, 'hd');
    const panels = elements(node).filter((s) => s !== head).map((side) => {
      const variant = hasClass(side, 'sideA') ? 'a' : hasClass(side, 'sideB') ? 'b' : null;
      if (!variant) this.fail(`<${side.tag}> inside a two-side block`);
      const inner = side.children.filter(isTag).map((child) => (
        hasClass(child, 'hd') || hasClass(child, 'lbl2')
          ? `<span class="w-who">${this.inline(child.children)}</span>`
          : this.block(child)
      )).join('');
      return `<div class="w-side w-side--${variant}">${inner}</div>`;
    });
    return (head ? `<h4 class="w-h4">${this.inline(head.children)}</h4>` : '')
      + `<div class="w-sides${panels.length === 2 ? ' w-sides--pair' : ''}">${panels.join('')}</div>`;
  }

  /* Two panels that are the same shape underneath: a heading, then one
     labelled row per claim. In "status" the label is the verdict and carries
     the colour; in "audit" it is the thing being tested. */
  rows(node, { keyClass, rowClass, tone }) {
    const head = findClass(node, 'hd');
    const lines = elements(node)
      .filter((row) => row !== head && hasClass(row, rowClass))
      .map((row) => {
        const key = findClass(row, keyClass);
        const rest = row.children.filter((child) => child !== key);
        const colour = tone ? classesOf(row).map((c) => STATUSES[c]).find(Boolean) : null;
        const label = key
          ? `<strong${colour ? ` class="w-tone-${colour}"` : ''}>${this.inline(key.children)}</strong> `
          : '';
        return `<p>${label}${this.inline(rest)}</p>`;
      });
    if (!lines.length) this.fail(`a ${rowClass} panel with no rows`);
    return '<div class="w-box w-box--key">'
      + (head ? `<span class="w-box-label">${this.inline(head.children)}</span>` : '')
      + lines.join('')
      + '</div>';
  }

  timeline(node) {
    const rows = elements(node).map((row) => {
      const year = findClass(row, 'y');
      const rest = row.children.filter((c) => c !== year);
      return '<div class="w-tl-item">'
        + (year ? `<div class="w-tl-year">${this.inline(year.children)}</div>` : '')
        + `<div class="w-tl-text">${this.inline(rest)}</div>`
        + '</div>';
    });
    return `<div class="w-timeline">${rows.join('')}</div>`;
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
          const grade = classesOf(cell).map((c) => GRADES[c]).find(Boolean);
          return {
            tag: cell.tag,
            span: Number.isInteger(span) && span > 1 ? span : 1,
            grade,
            html: this.inline(cell.children),
          };
        }));
      }
    };
    collect(node);
    if (!rows.length) this.fail('an empty table');

    const cell = ({ tag, span, grade, html }) => {
      const attrs = [
        grade ? ` class="w-tone-${grade}"` : '',
        span > 1 ? ` colspan="${span}"` : '',
      ].join('');
      return `<${tag}${attrs}>${html}</${tag}>`;
    };
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
    switch (node.tag) {
      case 'p': return this.paragraph(node);
      case 'h3': return `<h3 class="w-h3">${this.inline(node.children)}</h3>`;
      case 'h4': return `<h4 class="w-h4">${this.inline(node.children)}</h4>`;
      case 'ul':
      case 'ol': return this.list(node);
      case 'table': return this.table(node);
      case 'hr': return '<hr class="w-soft" />';
      case 'figure': return this.blocks(node.children);
      default: break;
    }
    if (node.tag !== 'div' && node.tag !== 'section') this.fail(`unexpected block <${node.tag}>`);

    if (hasClass(node, 'box') || hasClass(node, 'note') || hasClass(node, 'testbox') || hasClass(node, 'verse')) {
      return this.box(node);
    }
    if (hasClass(node, 'verdict')) return this.verdict(node);
    if (hasClass(node, 'status')) return this.rows(node, { keyClass: 'k', rowClass: 'row', tone: true });
    if (hasClass(node, 'audit')) return this.rows(node, { keyClass: 'q', rowClass: 'line' });
    if (hasClass(node, 'twoside')) return this.twoside(node);
    if (hasClass(node, 'timeline')) return this.timeline(node);
    /* "finis" is the couplet that closes the last part, and the whole series. */
    if (hasClass(node, 'pullquote') || hasClass(node, 'finis')) {
      return `<div class="w-pullquote">${this.inline(node.children)}</div>`;
    }
    if (hasClass(node, 'lbl')) return `<span class="w-box-label">${this.inline(node.children)}</span>`;
    // Layout furniture the reader replaces with its own.
    if (['rule', 'foot', 'toc', 'bio', 'contact', 'cover'].some((c) => hasClass(node, c))) return '';
    if (!flat(node)) return '';

    /* Part 9 builds its evidence test as rows of heading and value. They are
       plain divs holding loose text, so they read as a labelled line. */
    if (hasClass(node, 'th')) return `<span class="w-box-label">${this.inline(node.children)}</span>`;
    if (hasClass(node, 'tv')) return `<p>${this.inline(node.children)}</p>`;
    if (hasClass(node, 'tb')) return this.loose(node.children);

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
function importPart(n) {
  const path = join(SRC_DIR, `part${n}.html`);
  if (!existsSync(path)) throw new Error(`Missing source for part ${n}: ${path}`);
  const raw = readFileSync(path, 'utf8');
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error(`Part ${n}: no <body>`);

  const where = `part ${n}`;
  const io = new Importer(where);
  const body = parse(bodyMatch[1], where);

  const cover = deepFindClass(body, 'cover');
  if (!cover) throw new Error(`${where}: no cover`);
  /* The cover's h1 is the series title, which every part shares. The part's
     own name and strapline are in the part-number block below it. */
  const partno = deepFindClass(cover, 'partno');
  const title = flat(deepFindClass(partno ?? cover, 't') ?? { children: [] });
  const lead = flat(deepFindClass(partno ?? cover, 'd') ?? { children: [] });
  if (!title || !lead) throw new Error(`${where}: cover has no title or strapline`);

  /* The document is a flat run of headings and blocks rather than nested
     sections, so it is split on the chapter headings themselves. */
  const top = elements(body).filter((node) => node !== cover);
  const sections = [];
  let current = { kicker: '', title: '', blocks: [] };
  for (const node of top) {
    if (node.tag === 'h2') {
      const num = findClass(node, 'chnum') ?? deepFindClass(node, 'chnum');
      const rest = node.children.filter((c) => c !== num);
      sections.push(current);
      current = { kicker: num ? flat(num) : '', title: flat({ children: rest }), blocks: [] };
      continue;
    }
    current.blocks.push(node);
  }
  sections.push(current);

  /* The author's note and the introduction are set as headings too, so a
     chapter is identified by carrying a chapter number, not by being an h2.
     Everything before the first numbered chapter is front matter. */
  const isChapter = (s) => /^Chapter\b/i.test(s.kicker);
  const firstChapter = sections.findIndex(isChapter);
  if (firstChapter < 1) throw new Error(`${where}: no chapters, or none preceded by front matter`);
  const front = sections.slice(0, firstChapter).filter((s) => s.title || s.blocks.length);
  const chapters = sections.filter(isChapter);
  /* "Reference" holds the sources list and "The Living Archive" the author
     bio, which the site carries on every page — neither is a chapter. */

  /* The closing sources list is the reader's own sources block, not prose. */
  const sourceLists = [];
  for (const s of sections.filter((x) => /^Referenceb/i.test(x.kicker))) strip(s.blocks);
  const strip = (blocks) => blocks.filter((b) => {
    if (isTag(b) && b.tag === 'ul' && hasClass(b, 'srcs')) { sourceLists.push(b); return false; }
    return true;
  });

  const prologue = front
    .map((section, index) => (index === 0 || !section.title ? '' : `<h3 class="w-h3">${esc(section.title)}</h3>`)
      + io.blocks(strip(section.blocks)))
    .join('');

  const toc = [];
  const html = chapters.map((section, index) => {
    const num = index + 1;
    const id = `pj${n}-${num}-${slugify(section.title)}`;
    toc.push({ id, num: String(num), text: section.title });
    return `<h2 class="w-h2" id="${id}"><span class="w-num">${num}</span>${esc(section.title)}</h2>`
      + io.blocks(strip(section.blocks));
  }).join('');

  /* "Reference" is the sources section: grouped lists under their own
     subheadings. It goes to the reader's sources block, not the prose. */
  const reference = sections.filter((s) => /^Reference\b/i.test(s.kicker));
  const sources = reference.map((s) => io.blocks(s.blocks)).join('')
    + sourceLists.map((list) => io.list(list)).join('');

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
    label: LABELS[n] ?? title,
    title,
    lead,
    words,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    published: PUBLISHED,
    toc,
    prologue,
    prologueTitle: front.find((s) => s.title)?.title ?? 'Author’s note',
    prologueTag: `Author’s note · Punjab: The Whole Truth, Part ${n}`,
    html,
    sources,
  };
}

/* ------------------------------------------------------------------
   Build.
   ------------------------------------------------------------------ */
const parts = [];
for (let n = 1; n <= LAST_PART; n += 1) parts.push(importPart(n));

for (const [index, part] of parts.entries()) {
  if (part.n !== index + 1) throw new Error(`Parts must be contiguous from 1; found ${part.n}`);
  if (part.toc.length < 6) throw new Error(`Part ${part.n} recovered only ${part.toc.length} chapters`);
  if (part.words < 5000) throw new Error(`Part ${part.n} is short (${part.words} words)`);
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
   PUNJAB: THE WHOLE TRUTH
   Generated by scripts/import-punjab.mjs from the authored HTML.
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
    `  Part ${String(p.n).padStart(2)} — ${p.title.slice(0, 30).padEnd(30)} `
    + `${String(p.toc.length).padStart(2)} chapters · ${p.words.toLocaleString('en-IN').padStart(7)} words`
    + `${p.sources ? '' : '  (no sources)'}`
  );
}
console.log(`  ${parts.length} parts · ${totalWords.toLocaleString('en-IN')} words · ${parts.reduce((s, p) => s + p.minutes, 0)} min`);
