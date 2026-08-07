/**
 * import-shot-arguments.mjs
 *
 * Importer for the Shot Arguments shelf — the studies that live at /books.
 *
 * Each study takes one famous sentence out of one famous book, digs out the
 * axioms hidden underneath it, builds the argument at its strongest, and only
 * then attacks it. The sources are single-file print documents typeset for A4
 * (the same ones the PDFs are rendered from), so this throws the print
 * furniture away — cover, contents page, page rules — and keeps the argument.
 *
 * The print vocabulary is small and consistent across the shelf:
 *
 *   section.cover           the printed cover                  → dropped
 *   section.front           "how to read this"                 → prologue
 *   section.front.toc       the printed contents               → dropped
 *   section.part            one numbered part                  → one chapter
 *     div.part-num            "Part 04" / "Appendix"             → the kicker
 *     h2.part-title           the part's title
 *     div.part-lede           its strapline                      → w-lead
 *     h3 > span.n             "Axiom 7" / "5.14"                 → w-h3 + w-num
 *     div.box.oneline         the point in one line              → w-box--key
 *     div.box.plain           "say it simple"                    → w-box--simple
 *     div.box.steel           the best case FOR                  → w-box--claim
 *     div.box.crack           the honest weaknesses              → w-box--worry
 *     div.box.note            an aside from the author           → w-box--remember
 *     div.box.pullquote       the quoted sentence itself         → w-pullquote
 *     div.stat-row > div.stat a strip of numbers                 → w-stats
 *     td.verdict-h/m/b        holds / partly / fails             → w-tone-*
 *
 * The last part of every study is its appendix — glossary, timeline and
 * sources — which becomes the reader's collapsible sources block rather than a
 * chapter, so the argument ends where the argument ends.
 *
 * Usage:
 *   node scripts/import-shot-arguments.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/books/shot argumens';
const OUT_DIR = 'src/data/books';
const WORDS_PER_MINUTE = 220;

/* One entry per book on the shelf. The prose lives in the source files; the
   facts that the printed cover carries — the sentence under the knife, where
   it comes from, how many axioms came out of it — are declared here, because
   the cover itself is thrown away. */
const BOOKS = [
  {
    slug: 'sapiens',
    studies: [
      {
        n: 1,
        file: 'the-wheat-bargain.html',
        slug: 'the-wheat-bargain',
        title: 'The Wheat Bargain',
        subtitle: 'Harari’s “biggest fraud”, taken apart',
        label: 'Chapter 5',
        /* Where in the book, only — the reader's citation already names the
           book and its author, so repeating them here reads as a stutter. */
        source: 'Chapter 5, “History’s Biggest Fraud”',
        sentence: 'The Agricultural Revolution was history’s biggest fraud.',
        secondary: 'We did not domesticate wheat. It domesticated us.',
        lead:
          'One sentence, eleven hidden axioms, and a verdict on each. The argument is '
          + 'steelmanned twice before it is attacked, then tested against Mehrgarh, the '
          + 'Indus Valley and the water table under Punjab.',
        axioms: 11,
        verdict: 'Half survives. The half that survives is aimed at you.',
        published: '2026-08-07',
        pdf: 'the-wheat-bargain.pdf',
        pdfSize: '0.4 MB',
        pdfLabel: 'The study, as printed',
      },
      {
        n: 2,
        file: 'the-imagined-order.html',
        slug: 'the-imagined-order',
        title: 'The Imagined Order',
        subtitle: 'Harari’s “common imagination”, taken apart',
        label: 'Chapters 2 & 6',
        /* The sentence is written in Chapter 2; the machinery it describes is
           argued in Chapter 6, and neither reads correctly without the other. */
        source: 'Chapters 2 and 6, “The Tree of Knowledge” and “Building Pyramids”',
        sentence:
          'There are no gods in the universe, no nations, no money, no human rights, no laws, '
          + 'and no justice outside the common imagination of human beings.',
        lead:
          'One sentence, twelve hidden axioms, and a verdict on each. The argument is '
          + 'steelmanned twice before it is attacked, then tested against Yap, Ireland in '
          + '1970, Zimbabwe, Yugoslavia, Salomon v Salomon and Nuremberg.',
        axioms: 12,
        verdict: 'The observation holds. The word “fiction” does not — and it is the word doing all the work.',
        published: '2026-08-07',
        pdf: 'the-imagined-order.pdf',
        pdfSize: '0.4 MB',
        pdfLabel: 'The study, as printed',
      },
    ],
  },
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
const textOf = (n) => (!isTag(n) ? decode(n) : n.tag === 'br' ? ' ' : n.children.map(textOf).join(''));
const flat = (n) => textOf(n).replace(/\s+/g, ' ').trim();

const slugify = (s) => s.toLowerCase().normalize('NFKD')
  .replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, ' ').trim()
  .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60).replace(/-$/, '');

/* ------------------------------------------------------------------
   Print vocabulary → the site's prose vocabulary.
   ------------------------------------------------------------------ */
/* The document's four-colour box system, plus the author's aside.
   `steel` maps to `claim` and `crack` to `worry` because that is exactly what
   the two are: the strongest version of a contested claim, and the honest
   list of what is wrong with it. */
const BOX_TONES = {
  oneline: 'key',       // oxblood — the point in one sentence
  plain: 'simple',      // blue — the same idea in everyday words
  steel: 'claim',       // clay — the best case FOR the argument
  crack: 'worry',       // clay-dark — where it breaks
  note: 'remember',     // violet — an aside from the author
};

/* Table cells that carry a verdict, coloured rather than merely worded. */
const VERDICT_TONES = {
  'verdict-h': 'w-tone-fact',    // holds
  'verdict-m': 'w-tone-interp',  // partly, or contested
  'verdict-b': 'w-tone-claim',   // fails
};

/* The same three states, as data. The load diagram at the top of a study is
   drawn from the author's own scorecard table rather than from anything
   restated by hand, so the picture cannot drift from the argument. */
const VERDICT_GRADES = {
  'verdict-h': 'holds',
  'verdict-m': 'partly',
  'verdict-b': 'fails',
};

const INLINE = new Set(['strong', 'b', 'em', 'i', 'sup', 'sub', 'br', 'span', 'a', 'code', 'small', 'cite']);

/* Furniture the site supplies around every reader, or that only exists to
   make an A4 page break in the right place. */
const FURNITURE = ['toc-row', 'toc-sub', 'cs', 'attr', 'cover-inner'];

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
      /* Print-only spans: the section number beside a heading is lifted out by
         the heading reader, and a bare span is only ever a font-size tweak. */
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

  /** The opening paragraph of a part, set with a printed drop capital. */
  dropcap(body) {
    const match = body.match(/^([A-Za-z“"‘'])/);
    if (!match) return `<p>${body}</p>`;
    return `<p><span class="w-dropcap">${match[1]}</span>${body.slice(1)}</p>`;
  }

  paragraph(node) {
    const body = this.inline(node.children);
    if (!body) return '';
    if (hasClass(node, 'dropcap')) return this.dropcap(body);
    if (hasClass(node, 'part-lede') || hasClass(node, 'lede')) return `<p class="w-lead">${body}</p>`;
    return `<p>${body}</p>`;
  }

  list(node) {
    const items = elements(node).map((item) => {
      if (item.tag !== 'li') this.fail(`<${item.tag}> inside a list`);
      const blocks = item.children.filter((c) => isTag(c) && !INLINE.has(c.tag));
      if (!blocks.length) return `<li>${this.inline(item.children)}</li>`;
      return `<li>${this.loose(item.children)}</li>`;
    }).join('');
    const tag = node.tag === 'ol' ? 'ol' : 'ul';
    return `<${tag}>${items}</${tag}>`;
  }

  box(node) {
    const tone = classesOf(node).map((c) => BOX_TONES[c]).find(Boolean);
    if (!tone) this.fail(`a box with no known tone: ${classesOf(node).join('.')}`);

    const parts = elements(node).map((child) => {
      if (hasClass(child, 'lbl')) {
        return `<span class="w-box-label">${this.inline(child.children)}</span>`;
      }
      return this.block(child);
    });
    return `<div class="w-box w-box--${tone}">${parts.join('')}</div>`;
  }

  /** A strip of headline numbers: the figure, then what it means. */
  stats(node) {
    const cards = elements(node).map((stat) => {
      if (!hasClass(stat, 'stat')) this.fail(`<${stat.tag}> inside a stat row`);
      const big = findClass(stat, 'big');
      const cap = findClass(stat, 'cap');
      if (!big || !cap) this.fail('a stat with no figure or no caption');
      return '<span class="w-stat">'
        + `<span class="w-stat-big">${this.inline(big.children)}</span>`
        + `<span class="w-stat-cap">${this.inline(cap.children)}</span>`
        + '</span>';
    });
    return `<div class="w-stats">${cards.join('')}</div>`;
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
          const tone = classesOf(cell).map((c) => VERDICT_TONES[c]).find(Boolean);
          const body = this.inline(cell.children);
          return {
            tag: cell.tag,
            span: Number.isInteger(span) && span > 1 ? span : 1,
            /* A verdict cell is coloured, not just worded — the same three
               colours the scorecard uses everywhere else. */
            html: tone ? `<strong class="${tone}">${body}</strong>` : body,
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

  /** A section heading, whose printed number becomes a chip beside it. */
  heading(node) {
    const numbered = findClass(node, 'n');
    const rest = node.children.filter((child) => child !== numbered);
    const title = this.inline(rest).replace(/^[\u00a0\s]+/, '');
    if (!numbered) return `<h3 class="w-h3">${title}</h3>`;
    return '<h3 class="w-h3 w-h3--num">'
      + `<span class="w-num">${this.inline(numbered.children)}</span>`
      + `<span>${title}</span></h3>`;
  }

  block(node) {
    if (!isTag(node)) {
      if (decode(node).trim()) this.fail(`loose text: "${flat(node).slice(0, 60)}"`);
      return '';
    }
    if (FURNITURE.some((c) => hasClass(node, c))) return '';

    switch (node.tag) {
      case 'p': return this.paragraph(node);
      case 'h3': return this.heading(node);
      case 'h4': return `<h4 class="w-h4">${this.inline(node.children)}</h4>`;
      case 'ul':
      case 'ol': return this.list(node);
      case 'table': return this.table(node);
      case 'hr': return '<hr class="w-soft" />';
      case 'blockquote': return `<div class="w-pullquote">${this.inline(node.children)}</div>`;
      case 'figure': return this.blocks(node.children);
      case 'svg': return '';
      default: break;
    }
    if (node.tag !== 'div' && node.tag !== 'section' && node.tag !== 'aside') {
      this.fail(`unexpected block <${node.tag}>`);
    }

    if (hasClass(node, 'pullquote')) return `<div class="w-pullquote">${this.inline(node.children)}</div>`;
    if (hasClass(node, 'box')) return this.box(node);
    if (hasClass(node, 'stat-row')) return this.stats(node);
    if (hasClass(node, 'part-lede')) return `<p class="w-lead">${this.inline(node.children)}</p>`;
    /* The printed "· · ·" between movements of a part. */
    if (hasClass(node, 'divider')) return '<hr class="w-soft" />';
    /* Signed off either as one run of inline copy or as a few short
       paragraphs, depending on which generation of the print template the
       study was set in. Both end up as the same small type. */
    if (hasClass(node, 'colophon')) {
      const paragraphs = elements(node).filter((c) => !INLINE.has(c.tag));
      if (!paragraphs.length) return `<p class="w-small">${this.inline(node.children)}</p>`;
      return paragraphs.map((c) => {
        if (c.tag !== 'p') this.fail(`<${c.tag}> inside the colophon`);
        return `<p class="w-small">${this.inline(c.children)}</p>`;
      }).join('');
    }
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
   The scorecard.

   Every study closes by grading each axiom it dug out. That table is the one
   place the whole argument is stated as data, so it is read back out here and
   shipped alongside the prose: the reader draws its load diagram from these
   rows, which means the diagram and the chapter can never disagree.
   ------------------------------------------------------------------ */
function deepTables(node, found = []) {
  for (const child of elements(node)) {
    if (child.tag === 'table') found.push(child);
    else deepTables(child, found);
  }
  return found;
}

function readScorecard(chapters, where) {
  const rowsOf = (table) => {
    const rows = [];
    const walk = (parent) => {
      for (const child of elements(parent)) {
        if (['thead', 'tbody', 'tfoot'].includes(child.tag)) { walk(child); continue; }
        if (child.tag === 'tr') rows.push(elements(child));
      }
    };
    walk(table);
    return rows;
  };

  /* The grading table is the one with a numbered first column, a verdict
     column carrying the colour classes, and a fourth column explaining it.
     The shorter "ranked by how solid they are" summary earlier in the study
     has only three columns, so it is not mistaken for this one. */
  for (const section of chapters) {
    for (const table of section.blocks.flatMap((b) => (isTag(b) ? deepTables(b, b.tag === 'table' ? [b] : []) : []))) {
      const rows = rowsOf(table);
      const head = rows[0]?.map((c) => flat(c).toLowerCase()) ?? [];
      if (head.length < 4 || !head.includes('axiom') || !head.includes('verdict')) continue;

      const graded = rows.slice(1).map((cells) => {
        const grade = classesOf(cells[2] ?? {}).map((c) => VERDICT_GRADES[c]).find(Boolean);
        return {
          n: Number(flat(cells[0])),
          axiom: flat(cells[1]),
          grade,
          verdict: flat(cells[2]),
          why: flat(cells[3]),
        };
      });

      if (graded.some((g) => !g.grade || !Number.isInteger(g.n))) {
        throw new Error(`${where}: the scorecard has an ungraded or unnumbered row`);
      }
      return graded;
    }
  }
  throw new Error(`${where}: no scorecard table found`);
}

/* ------------------------------------------------------------------
   Reading one study.
   ------------------------------------------------------------------ */
function importStudy(book, study) {
  const path = join(SRC_DIR, study.file);
  if (!existsSync(path)) throw new Error(`Missing source for ${book.slug}/${study.slug}: ${path}`);
  const raw = readFileSync(path, 'utf8');
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error(`${study.slug}: no <body>`);

  const where = `${book.slug}/${study.slug}`;
  const io = new Importer(where);
  const document = parse(bodyMatch[1], where);

  /* Every top-level section is one of four things: the printed cover, the
     printed contents, the "how to read this" note, or a numbered part. */
  const sections = elements(document).filter((node) => node.tag === 'section');
  if (!sections.length) throw new Error(`${where}: no sections`);

  const readSection = (node) => ({
    kicker: flat(findClass(node, 'part-num') ?? { children: [] }),
    title: flat(find(node, (c) => c.tag === 'h2') ?? { children: [] }),
    lead: flat(findClass(node, 'part-lede') ?? { children: [] }),
    blocks: elements(node).filter((c) => (
      !hasClass(c, 'part-num') && c.tag !== 'h2' && !hasClass(c, 'part-lede')
    )),
  });

  const front = sections
    .filter((s) => hasClass(s, 'front') && !hasClass(s, 'toc'))
    .map(readSection);
  const parts = sections.filter((s) => hasClass(s, 'part')).map(readSection);

  if (front.length !== 1) throw new Error(`${where}: expected one front-matter section, found ${front.length}`);
  if (parts.length < 3) throw new Error(`${where}: only ${parts.length} parts`);

  /* The appendix is reference matter, not argument: it becomes the reader's
     collapsible sources block so the study ends on its own last line. */
  const isAppendix = (s) => /^Appendix$/i.test(s.kicker);
  const appendix = parts.filter(isAppendix);
  const chapters = parts.filter((s) => !isAppendix(s));
  if (!appendix.length) throw new Error(`${where}: no appendix`);

  const [opening] = front;
  const prologue = (opening.lead ? `<p class="w-lead">${esc(opening.lead)}</p>` : '')
    + io.blocks(opening.blocks);

  /* Two-level contents: the parts, and the numbered sections inside each one.
     A study runs to eighty subsections, so a flat list would be useless. */
  const toc = [];
  /* Where each numbered axiom is actually written, so the load diagram's
     piers can link straight to the assumption they stand for. */
  const axiomIds = new Map();

  const body = chapters.map((section) => {
    const id = `${study.slug}-${slugify(section.kicker || section.title)}`;
    const kids = [];

    const html = section.blocks.map((node) => {
      const out = io.block(node);
      if (isTag(node) && node.tag === 'h3') {
        const numbered = findClass(node, 'n');
        const text = flat({ children: node.children.filter((c) => c !== numbered) });
        const kidId = `${id}-${slugify(text)}`;
        const num = flat(numbered ?? { children: [] });
        kids.push({ id: kidId, num, text });
        const axiom = num.match(/^Axiom\s+(\d+)$/i);
        if (axiom) axiomIds.set(Number(axiom[1]), kidId);
        return out.replace('<h3 class="w-h3', `<h3 id="${kidId}" class="w-h3`);
      }
      return out;
    }).join('');

    toc.push({ id, num: (section.kicker.match(/\d+/) ?? ['·'])[0], text: section.title, kids });

    return `<h2 class="w-h2" id="${id}"><span class="w-num">${esc(section.kicker)}</span>${esc(section.title)}</h2>`
      + (section.lead ? `<p class="w-lead">${esc(section.lead)}</p>` : '')
      + html;
  }).join('');

  const sources = appendix.map((section) => (
    (section.lead ? `<p class="w-lead">${esc(section.lead)}</p>` : '') + io.blocks(section.blocks)
  )).join('');

  const scorecard = readScorecard(chapters, where).map((row) => ({
    ...row,
    href: axiomIds.get(row.n) ?? null,
  }));

  if (io.unmapped.size) {
    throw new Error(
      `${where}: ${io.unmapped.size} unmapped construct(s):\n`
      + [...io.unmapped.entries()].map(([k, v]) => `      ${k}  "${v}"`).join('\n')
    );
  }

  const words = `${prologue} ${body} ${sources}`
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ')
    .split(/\s+/).filter(Boolean).length;

  /* The source filename is the importer's business, not the reader's. */
  const { file: _file, ...declared } = study;
  return {
    ...declared,
    words,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    chapters: chapters.length,
    scorecard,
    toc,
    prologueTitle: opening.title,
    prologueTag: `Before you begin · ${study.title}`,
    prologue,
    html: body,
    sources,
  };
}

/* ------------------------------------------------------------------
   Build.
   ------------------------------------------------------------------ */
mkdirSync(OUT_DIR, { recursive: true });

for (const book of BOOKS) {
  const studies = book.studies.map((study) => importStudy(book, study));

  for (const [index, study] of studies.entries()) {
    if (study.n !== index + 1) throw new Error(`${book.slug}: studies must be contiguous from 1; found ${study.n}`);
    if (study.toc.length < 3) throw new Error(`${book.slug}/${study.slug}: recovered only ${study.toc.length} parts`);
    if (study.words < 5000) throw new Error(`${book.slug}/${study.slug} is short (${study.words} words)`);
    if (!study.prologue) throw new Error(`${book.slug}/${study.slug} recovered no front matter`);
    if (!study.sources) throw new Error(`${book.slug}/${study.slug} recovered no appendix`);
    /* The diagram is the study's front door, so a scorecard that has drifted
       from the declared axiom count, or an axiom the reader cannot jump to,
       fails the import rather than shipping a picture that lies. */
    if (study.scorecard.length !== study.axioms) {
      throw new Error(`${book.slug}/${study.slug} declares ${study.axioms} axioms but grades ${study.scorecard.length}`);
    }
    for (const row of study.scorecard) {
      if (!row.href) throw new Error(`${book.slug}/${study.slug}: axiom ${row.n} is graded but never written`);
    }

    const ids = [...study.toc.map((t) => t.id), ...study.toc.flatMap((t) => t.kids.map((k) => k.id))];
    if (new Set(ids).size !== ids.length) throw new Error(`${book.slug}/${study.slug} has duplicate section ids`);
    for (const id of ids) {
      if (!study.html.includes(`id="${id}"`)) throw new Error(`${book.slug}/${study.slug}: ${id} has no heading`);
    }
  }

  const total = studies.reduce((sum, s) => sum + s.words, 0);
  const out = join(OUT_DIR, `${book.slug}.js`);
  writeFileSync(out, `/* ============================================================
   ${book.slug.toUpperCase()} — the studies on this book.
   Generated by scripts/import-shot-arguments.mjs from the authored HTML.
   Do not hand-edit: re-run the importer.

   ${studies.length} ${studies.length === 1 ? 'study' : 'studies'} · ${total.toLocaleString('en-IN')} words
   ============================================================ */

const studies = ${JSON.stringify(studies, null, 2)};

export default studies;
`, 'utf8');

  console.log(`✓ ${out}`);
  for (const s of studies) {
    console.log(
      `  ${String(s.n).padStart(2)} — ${s.title.slice(0, 34).padEnd(34)} `
      + `${String(s.toc.length).padStart(2)} parts · ${String(s.toc.reduce((a, t) => a + t.kids.length, 0)).padStart(3)} sections`
      + ` · ${s.words.toLocaleString('en-IN').padStart(7)} words · ${s.minutes} min`
    );
  }
}
