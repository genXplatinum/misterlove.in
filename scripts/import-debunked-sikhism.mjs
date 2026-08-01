/**
 * import-debunked-sikhism.mjs
 *
 * Importer for "Debunked — Sikhism", a thirteen-part series delivered as
 * print-first HTML, one file per part, in the author's working folder.
 *
 * Like The Reservation Files and unlike the older PDF-only importers, these
 * sources are real markup rather than typography to be reverse-engineered, so
 * this reads the tags. The print vocabulary is small and completely regular —
 * every chapter is a claim box followed by five numbered steps — which is why
 * this reader is strict: an unrecognised construct throws rather than quietly
 * dropping prose.
 *
 * What the print edition has and the web edition drops: the cover, the printed
 * contents page (the reader renders its own from `toc`), the running feet, and
 * the "End of Part N" rule. Everything else survives, in the author's order.
 *
 * Usage:
 *   node scripts/import-debunked-sikhism.mjs
 *   node scripts/import-debunked-sikhism.mjs "<folder holding Sikh_Part_0N.html>"
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SRC_DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/Debunk';
const OUT = 'src/data/writing/debunked-sikhism.js';

/* Everything the manifest and the reader need that the source does not carry:
   the editorial label shown in the part chip, and the PDF that ships with the
   part. The cover's own title and strapline are read from the file, so they
   can never drift from the published book. */
const PARTS = [
  { n: 1, label: 'Identity', file: 'Sikh_Part_01.pdf' },
  { n: 2, label: 'Guru Nanak', file: 'Sikh_Part_02.pdf' },
  { n: 3, label: 'The Eight Gurus', file: 'Sikh_Part_03.pdf' },
];

const PUBLISHED = { 1: '2026-06-02', 2: '2026-08-02', 3: '2026-08-02' };
const WORDS_PER_MINUTE = 220;

/* ------------------------------------------------------------------
   A very small HTML reader.

   The sources are machine-generated and well-formed, so this only has to
   handle what they actually contain. It is deliberately strict: an unexpected
   tag or an unclosed element throws rather than silently swallowing prose.
   ------------------------------------------------------------------ */
const VOID = new Set(['br', 'hr', 'img', 'col', 'meta', 'link', 'input']);
const RAW_TEXT = new Set(['style', 'script']);

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

/** First descendant matching a predicate, at any depth. */
function deepFind(node, predicate) {
  for (const child of elements(node)) {
    if (predicate(child)) return child;
    const nested = deepFind(child, predicate);
    if (nested) return nested;
  }
  return undefined;
}
const deepFindClass = (node, name) => deepFind(node, (child) => hasClass(child, name));

/** Visible text of a subtree, whitespace-collapsed. A <br> reads as a space. */
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
   else, and a page of Gurbani transliteration in typewriter quotes next to the
   site's own curly ones looks like a mistake.

   This runs once over finished markup rather than over each text node, because
   the author quotes across inline tags \u2014 "<em>ek panth, do kaaj</em>" would
   never pair if each node were smartened alone, and a possessive that opens a
   text node ("</strong>'s") would never be seen at all. Anything between < and
   > is skipped, so attribute values and tag names are untouched. */
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
    if (c === '"') { out += open ? '\u201c' : '\u201d'; open = !open; continue; }
    if (c === "'") {
      // A possessive or a contraction sits against a letter or digit; the
      // author never uses single quotation marks, so everything else is one
      // too, and the right single quote is correct either way.
      out += '\u2019';
      continue;
    }
    out += c;
  }
  if (!open) throw new Error('smart quotes: an unclosed double quote');
  return out;
}

/** The same, for a plain-text field: a title, a strapline, a contents entry. */
const smartenText = (s) => smartenHtml(esc(s))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** Inline markup that survives into the web edition. */
const INLINE = new Set(['strong', 'b', 'em', 'i', 'sup', 'sub', 'br', 'span', 'a']);

class Importer {
  constructor(where) {
    this.where = where;
    this.warnings = [];
  }

  fail(message) {
    throw new Error(`${this.where}: ${message}`);
  }

  warn(message) {
    this.warnings.push(message);
  }

  /** Inline content: text plus the handful of tags that mean something. */
  inline(nodes) {
    return nodes.map((node) => {
      if (!isTag(node)) return esc(decode(node)).replace(/\s+/g, ' ');
      if (!INLINE.has(node.tag)) this.fail(`unexpected <${node.tag}> inside inline copy`);
      if (node.tag === 'br') return '<br />';
      // Every span in the body prose is a print colour or size hint; the
      // stylesheet already sets those, so only the words survive.
      if (node.tag === 'span') return this.inline(node.children);
      if (node.tag === 'a') {
        const href = node.attrs.href ?? '';
        if (!/^https?:\/\//.test(href)) return this.inline(node.children);
        return `<a class="w-cite" href="${esc(href)}" rel="noopener">${this.inline(node.children)}</a>`;
      }
      const tag = node.tag === 'b' ? 'strong' : node.tag === 'i' ? 'em' : node.tag;
      return `<${tag}>${this.inline(node.children)}</${tag}>`;
    }).join('').replace(/\s+/g, ' ').trim();
  }

  /* The print edition sets a handful of paragraphs with an inline style rather
     than a class. Each one is a device the web edition already has a name for;
     anything else keeps its words and loses its styling, with a warning, so a
     new device in a later part is reported rather than silently flattened. */
  paragraph(node) {
    const body = this.inline(node.children);
    if (!body) return '';

    const style = node.attrs.style ?? '';
    if (!style) return `<p>${body}</p>`;

    // The author's signature under the foreword.
    if (/^—\s*Lovepreet Singh$/.test(flat(node))) return `<p class="w-sign">${body}</p>`;
    // The printed "End of Part N" rule; the reader has a pager instead.
    if (/^—\s*End of Part \d+\s*—$/.test(flat(node))) return '';
    // A note set smaller than the body — the six-step explainer on the
    // contents page, and the closing's parting line.
    if (/font-size:\s*10pt/.test(style)) return `<p class="w-small">${body}</p>`;
    if (/text-align:\s*center/.test(style)) return `<p class="w-small">${body}</p>`;
    if (/^color:|;\s*color:/.test(style) && !/font-size/.test(style)) return `<p>${body}</p>`;

    this.warn(`paragraph with an unmapped style, kept as body copy: ${style}`);
    return `<p>${body}</p>`;
  }

  list(node) {
    const items = elements(node).map((item) => {
      if (item.tag !== 'li') this.fail(`<${item.tag}> inside a list`);
      return `<li>${this.inline(item.children)}</li>`;
    }).join('');
    return `<${node.tag}>${items}</${node.tag}>`;
  }

  /** The claim under examination, and the definition boxes that support it. */
  box(node, tone) {
    const parts = [];
    for (const child of node.children) {
      if (!isTag(child)) {
        if (decode(child).trim()) this.fail(`loose text inside a callout: "${flat(child).slice(0, 60)}"`);
        continue;
      }
      if (hasClass(child, 'label')) {
        parts.unshift(`<span class="w-box-label">${this.inline(child.children)}</span>`);
      } else if (child.tag === 'p') {
        parts.push(this.paragraph(child));
      } else if (child.tag === 'ul' || child.tag === 'ol') {
        parts.push(this.list(child));
      } else {
        this.fail(`<${child.tag}> inside a callout`);
      }
    }
    if (!parts.some((part) => part.startsWith('<span'))) this.fail('a callout with no label');
    return `<div class="w-box w-box--${tone}">${parts.join('')}</div>`;
  }

  /** A Gurbani citation, or a quotation from a named source. */
  quote(node) {
    return `<div class="w-box w-box--quote">${this.blocksOrInline(node)}</div>`;
  }

  blocksOrInline(node) {
    const blocks = elements(node).some((child) => !INLINE.has(child.tag));
    if (!blocks) return `<p>${this.inline(node.children)}</p>`;
    return this.blocks(node.children);
  }

  /**
   * Every chapter is built from the same five steps. In print they are a
   * letterspaced rule; here they keep their number, which is the thing that
   * makes the method legible — the reader can see the same five moves being
   * made ten times over.
   */
  step(node) {
    const text = flat(node);
    const match = text.match(/^Step\s+(\d+)\s*—\s*(.+)$/);
    if (!match) this.fail(`a step rule that is not "Step N — Title": "${text}"`);
    return '<p class="w-step">'
      + `<span class="w-step-n">${esc(match[1])}</span>`
      + `<span class="w-step-t">${esc(match[2])}</span>`
      + '</p>';
  }

  /** The single-line scripture epigraph that faces Chapter One. */
  epigraph(node) {
    // The line itself, then its translation, its citation, and the author's
    // gloss. In print those are separated by <br> and by size; the last two
    // are only separated by size, so .who starts a line of its own too.
    const lines = [];
    let current = [];
    const flush = () => { if (current.length) { lines.push(current); current = []; } };
    for (const child of node.children) {
      if (isTag(child) && child.tag === 'br') { flush(); continue; }
      if (isTag(child) && hasClass(child, 'who')) { flush(); lines.push([child]); continue; }
      if (isTag(child) || decode(child).trim()) current.push(child);
    }
    flush();
    if (lines.length < 2) this.fail('an epigraph with nothing under its opening line');

    const rendered = lines.map((line) => this.inline(line)).filter(Boolean);
    if (rendered.length !== 4) {
      this.fail(`an epigraph of ${rendered.length} lines, expected the line, its translation, its citation and the gloss`);
    }
    const [opening, translation, ...credits] = rendered;
    // The translation is a sentence and has to stay readable; the citation and
    // the author's gloss are credits, and take the credit setting.
    return `<div class="w-pullquote">${opening}`
      + `<span class="w-gloss">${translation}</span>`
      + credits.map((line) => `<span class="w-attrib">${line}</span>`).join('')
      + '</div>';
  }

  /** One block-level node from the print source. */
  block(node) {
    if (!isTag(node)) {
      if (decode(node).trim()) this.fail(`loose text outside a block: "${flat(node).slice(0, 60)}"`);
      return '';
    }

    switch (node.tag) {
      case 'p': return this.paragraph(node);
      case 'h3': return `<h3 class="w-h3">${this.inline(node.children)}</h3>`;
      case 'h4': return `<h4 class="w-h4">${this.inline(node.children)}</h4>`;
      case 'ul':
      case 'ol': return this.list(node);
      case 'blockquote': return this.quote(node);
      case 'hr': return '<hr class="w-soft" />';
      default: break;
    }

    if (node.tag !== 'div') this.fail(`unexpected block <${node.tag}>`);

    if (hasClass(node, 'claim-box')) return this.box(node, 'claim');
    if (hasClass(node, 'define')) return this.box(node, 'simple');
    if (hasClass(node, 'step')) return this.step(node);
    if (hasClass(node, 'epigraph')) return this.epigraph(node);
    // The running foot and the printed contents lines are page furniture: the
    // reader has its own header and builds its own table of contents.
    if (hasClass(node, 'foot') || hasClass(node, 'toc-line')) return '';
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

/** A printed page, minus its heading strip and its running foot. */
function readPage(page) {
  const kicker = findClass(page, 'chapter-num');
  const heading = find(page, (child) => child.tag === 'h2');
  const dropped = new Set([kicker, heading].filter(Boolean));
  return {
    kicker: kicker ? flat(kicker) : '',
    title: heading ? flat(heading) : '',
    body: page.children.filter((child) => !dropped.has(child)),
  };
}

function importPart({ n, label, file }) {
  const path = resolve(SRC_DIR, `Sikh_Part_0${n}.html`);
  if (!existsSync(path)) throw new Error(`Missing source for part ${n}: ${path}`);

  const raw = readFileSync(path, 'utf8');
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error(`Part ${n}: no <body> in ${path}`);

  const where = `part ${n}`;
  const io = new Importer(where);
  const body = parse(bodyMatch[1], where);

  let cover = null;
  let foreword = null;
  let contents = null;
  let epigraph = null;
  let closing = null;
  const chapters = [];

  for (const section of elements(body)) {
    if (RAW_TEXT.has(section.tag)) continue;
    if (hasClass(section, 'cover')) { cover = section; continue; }
    if (!hasClass(section, 'page')) io.fail(`unexpected top-level <${section.tag}>`);

    const page = readPage(section);
    if (/^Foreword$/i.test(page.kicker)) { foreword = page; continue; }
    if (/^Contents$/i.test(page.kicker)) { contents = page; continue; }
    if (/^Closing$/i.test(page.kicker)) { closing = page; continue; }
    if (/^Chapter\s+\d+$/i.test(page.kicker)) { chapters.push(page); continue; }
    if (deepFindClass(section, 'epigraph')) { epigraph = page; continue; }
    io.fail(`a page with an unrecognised kicker: "${page.kicker || '(none)'}"`);
  }

  if (!cover) throw new Error(`${where}: no cover`);
  if (!foreword) throw new Error(`${where}: no foreword`);
  if (!epigraph) throw new Error(`${where}: no epigraph`);
  if (!closing) throw new Error(`${where}: no closing`);
  if (!chapters.length) throw new Error(`${where}: no chapters`);

  // The cover sets the title over two lines; a <br> reads as a space here.
  const coverTitle = flat(deepFind(cover, (c) => c.tag === 'h1') ?? { children: [] });
  const coverSub = flat(deepFindClass(cover, 'sub') ?? { children: [] });
  if (!coverTitle || !coverSub) throw new Error(`${where}: the cover has no title or strapline`);

  /* The prologue is the foreword, then the epigraph that faces Chapter One.
     The printed contents page is dropped — the reader builds its own — but its
     closing note explains the five-step method every chapter follows, and that
     is the one thing on the page a web reader still needs. It is lifted into a
     keyed callout so that it does not read as a postscript to the foreword's
     signature, which is what it would be if it stayed body copy. */
  const method = (contents?.body ?? []).filter((child) => isTag(child) && child.tag === 'p');
  if (method.length !== 1) io.fail(`the contents page carries ${method.length} notes, expected 1`);
  const prologue = smartenHtml(io.blocks(foreword.body)
    + `<div class="w-box w-box--key"><p>${io.inline(method[0].children)}</p></div>`
    + io.blocks(epigraph.body));

  const toc = [];
  const chapterHtml = chapters.map((page, index) => {
    const number = index + 1;
    const id = `ds${n}-${number}-${slugify(page.title)}`;
    toc.push({ id, num: String(number).padStart(2, '0'), text: smartenText(page.title) });
    return `<h2 class="w-h2" id="${id}"><span class="w-num">${number}</span>${esc(page.title)}</h2>`
      + io.blocks(page.body);
  }).join('');

  /* The closing page carries three things: the author's summing-up, the
     sources, and a look ahead. The sources belong in the reader's own sources
     block; the rest closes the article as an unnumbered final section. */
  const headings = elements(closing.body ? { children: closing.body } : closing)
    .filter((child) => child.tag === 'h3');
  const sourcesHead = headings.find((h) => /sources/i.test(flat(h)));
  if (!sourcesHead) throw new Error(`${where}: the closing page has no sources heading`);

  const closingBody = [];
  const sourceBody = [];
  let bucket = closingBody;
  for (const child of closing.body) {
    if (child === sourcesHead) { bucket = sourceBody; continue; }
    // "What's Next" ends the sources and returns to the closing prose.
    if (isTag(child) && child.tag === 'h3' && bucket === sourceBody) { bucket = closingBody; }
    bucket.push(child);
  }

  const closingId = `ds${n}-closing`;
  toc.push({ id: closingId, num: '—', text: smartenText(closing.title) });
  const html = smartenHtml(chapterHtml
    + `<h2 class="w-h2" id="${closingId}">${esc(closing.title)}</h2>`
    + io.blocks(closingBody));

  const sources = smartenHtml(io.blocks(sourceBody));

  const pdfPath = resolve(SRC_DIR, file);
  if (!existsSync(pdfPath)) throw new Error(`${where}: missing PDF ${pdfPath}`);

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
      title: smartenText(coverTitle),
      lead: smartenText(coverSub),
      words,
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      published: PUBLISHED[n],
      toc,
      prologue,
      prologueTitle: smartenText(foreword.title),
      prologueTag: `Foreword · The Sikhism Series, Part ${n}`,
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
  if (part.toc.length !== 11) throw new Error(`Part ${part.n} recovered ${part.toc.length} sections, expected 10 chapters and a closing`);
  if (part.words < 6000) throw new Error(`Part ${part.n} is unexpectedly short (${part.words} words)`);
  if (!part.sources) throw new Error(`Part ${part.n} recovered no sources`);
  if (!part.prologue) throw new Error(`Part ${part.n} recovered no foreword`);
  if (!part.prologue.includes('w-pullquote')) throw new Error(`Part ${part.n} lost its epigraph`);
  const steps = (part.html.match(/class="w-step"/g) ?? []).length;
  if (steps !== 50) throw new Error(`Part ${part.n} recovered ${steps} step rules, expected 50`);
  const claims = (part.html.match(/w-box--claim/g) ?? []).length;
  if (claims !== 10) throw new Error(`Part ${part.n} recovered ${claims} claim boxes, expected 10`);
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
   DEBUNKED — SIKHISM
   Generated by scripts/import-debunked-sikhism.mjs from the
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
for (const { part, source } of imported) {
  console.log(
    `  Part ${part.n} — ${part.title.padEnd(24)} ${String(source.chapters).padStart(2)} chapters · `
    + `${part.words.toLocaleString('en-IN').padStart(7)} words · ${String(part.minutes).padStart(3)} min`
  );
  for (const warning of source.warnings) console.log(`    ! ${warning}`);
}
console.log(
  `  ${parts.length} parts · ${totalWords.toLocaleString('en-IN')} words · `
  + `${parts.reduce((sum, part) => sum + part.minutes, 0)} min`
);
