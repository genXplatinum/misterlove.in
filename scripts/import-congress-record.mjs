/**
 * import-congress-record.mjs
 *
 * Importer for "The Congress Record" — a nineteen-part audit of the Indian
 * National Congress in government, delivered as print-first HTML, one file
 * per part, in the author's working folder.
 *
 * Like the Reservation Files sources these are real semantic markup — chapters,
 * callouts, opposed argument panels, verdicts, grades and tables all carry
 * their own classes — so this reads the markup rather than reconstructing it
 * from typography, and translates the print vocabulary into the site's prose
 * vocabulary in src/components/Prose.css.
 *
 * What the print edition has and the web edition drops: the masthead (the
 * reader prints its own), the printed contents page (the reader renders its
 * own from `toc`), the "About the Author" card (the site carries that
 * site-wide) and the series nav strip (the reader has a pager). Everything
 * else survives, in the author's order — including the standing warning bar,
 * which is the book's declared posture and is kept at the head of every part.
 *
 * It is deliberately strict: an unrecognised construct throws rather than
 * silently swallowing prose.
 *
 * Usage:
 *   node scripts/import-congress-record.mjs
 *   node scripts/import-congress-record.mjs "<folder holding part-N-*.html>"
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SRC_DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/books/Congress Files';
const OUT = 'src/data/writing/congress-record.js';

/* Everything the manifest and the reader need that the source markup does not
   carry: the editorial label shown in the part chip, the source file, and the
   PDF that ships alongside each part. The part's own title and strapline are
   read from the file, so they can never drift from the published book. */
const PARTS = [
  {
    n: 1,
    label: 'The Method',
    file: 'part-1-how-to-judge-a-government.html',
    pdf: 'The_Congress_Record_Part_1_How_to_Judge_a_Government.pdf',
  },
  {
    n: 2,
    label: 'The Inheritance',
    file: 'part-2-the-inheritance.html',
    pdf: 'The_Congress_Record_Part_2_The_Inheritance.pdf',
  },
  {
    n: 3,
    label: 'The Constitution',
    file: 'part-3-the-constitution-amended.html',
    pdf: 'The_Congress_Record_Part_3_The_Constitution_Amended.pdf',
  },
  {
    n: 4,
    label: 'The Economy',
    file: 'part-4-the-economic-model.html',
    pdf: 'The_Congress_Record_Part_4_The_Economic_Model.pdf',
  },
  {
    n: 5,
    label: 'Who Got What',
    file: 'part-5-the-map-of-who-got-what.html',
    pdf: 'The_Congress_Record_Part_5_The_Map_of_Who_Got_What.pdf',
  },
  {
    n: 6,
    label: 'China and 1962',
    file: 'part-6-china-tibet-and-1962.html',
    pdf: 'The_Congress_Record_Part_6_China_Tibet_and_1962.pdf',
  },
  {
    n: 7,
    label: 'The Wars',
    file: 'part-7-pakistan-kashmir-and-the-wars.html',
    pdf: 'The_Congress_Record_Part_7_Pakistan_Kashmir_and_the_Wars.pdf',
  },
  {
    n: 8,
    label: 'Indira Rising',
    file: 'part-8-indira-rising.html',
    pdf: 'The_Congress_Record_Part_8_Indira_Rising.pdf',
  },
  {
    n: 9,
    label: 'The Emergency',
    file: 'part-9-the-emergency.html',
    pdf: 'The_Congress_Record_Part_9_The_Emergency.pdf',
  },
  {
    n: 10,
    label: 'Punjab',
    file: 'part-10-punjab.html',
    pdf: 'The_Congress_Record_Part_10_Punjab.pdf',
  },
  {
    n: 11,
    label: 'November 1984',
    file: 'part-11-november-1984.html',
    pdf: 'The_Congress_Record_Part_11_November_1984.pdf',
  },
  {
    n: 12,
    label: 'Rajiv Gandhi',
    file: 'part-12-rajiv-gandhi.html',
    pdf: 'The_Congress_Record_Part_12_Rajiv_Gandhi.pdf',
  },
  {
    n: 13,
    label: 'The Other India',
    file: 'part-13-the-other-india.html',
    pdf: 'The_Congress_Record_Part_13_The_Other_India.pdf',
  },
  {
    n: 14,
    label: 'Reform & Demolition',
    file: 'part-14-1991.html',
    pdf: 'The_Congress_Record_Part_14_Reform_and_Demolition.pdf',
  },
  {
    n: 15,
    label: 'UPA I',
    file: 'part-15-upa-i.html',
    pdf: 'The_Congress_Record_Part_15_UPA_I.pdf',
  },
  {
    n: 16,
    label: 'UPA II',
    file: 'part-16-upa-ii.html',
    pdf: 'The_Congress_Record_Part_16_UPA_II.pdf',
  },
];

const PUBLISHED = '2026-08-07';
const WORDS_PER_MINUTE = 220;

/* ------------------------------------------------------------------
   A very small HTML reader, shared in spirit with the Reservation Files
   importer. The sources are machine-generated and well-formed, so this only
   has to handle what they actually contain.
   ------------------------------------------------------------------ */
const VOID = new Set(['br', 'hr', 'img', 'col', 'meta', 'link', 'input']);
const RAW_TEXT = new Set(['style', 'script']);

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', middot: '·', times: '×', deg: '°', pound: '£',
  eacute: 'é', egrave: 'è', uuml: 'ü', ouml: 'ö', auml: 'ä', ntilde: 'ñ',
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
const deepHasClass = (node, name) => elements(node).some(
  (child) => hasClass(child, name) || deepHasClass(child, name),
);

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

/* ------------------------------------------------------------------
   Print vocabulary → prose vocabulary.

   The source gives every callout a colour that carries its meaning. Each maps
   onto the prose tone that already wears the same hue and does the same job:
     .box.word   slate  a term defined            → key
     .box.know   sepia  where the evidence is from → fact
     .box.real   moss   the figure put in scale    → number
     .box.assume plum   the unexamined premise     → interp
     .box.arg    ochre  the two sides, then a verdict → arg
     .remember   dark   the emphatic summary       → remember
   ------------------------------------------------------------------ */
const BOX_TONES = {
  word: 'key',
  know: 'fact',
  real: 'number',
  assume: 'interp',
  hidden: 'interp', // parts 14-16 renamed "the hidden assumption" box to `.box.hidden`
  arg: 'arg',
};

/** Inline markup that survives into the web edition. */
const INLINE = new Set(['strong', 'b', 'em', 'i', 'sup', 'sub', 'br', 'span', 'a', 'code', 'abbr']);

class Importer {
  constructor(where) {
    this.where = where;
    this.dropped = [];
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
        // The drop cap that opens a chapter.
        if (hasClass(node, 'dc')) {
          return `<span class="w-dropcap">${this.inline(node.children)}</span>`;
        }
        // The grade chip: "Court-found", "Audited", "Contested"… (parts 1-13
        // spell it `.grade`; parts 14-16 use `.g <grade>`). The grade is the
        // claim's evidentiary status, so it is kept as a visible tag.
        if (hasClass(node, 'grade') || hasClass(node, 'g')) {
          return `<span class="w-lawtag">${this.inline(node.children)}</span>`;
        }
        // Furniture that only carries its text: chapter numerals, source
        // attributions inline, the discreet run-in.
        if (hasClass(node, 'dis') || hasClass(node, 'src') || hasClass(node, 'cnum')) {
          return this.inline(node.children);
        }
        return this.inline(node.children);
      }
      if (node.tag === 'a') {
        // In-page anchor links ("#") are print furniture; the reader has its
        // own contents rail.
        if (hasClass(node, 'anch') || hasClass(node, 'skip') || hasClass(node, 'dl')) return '';
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
    // parts 14-16: `.ni` and `.sub` are lead paragraphs; `.tbl-note` is the
    // small note hung under a table.
    if (hasClass(node, 'ni') || hasClass(node, 'sub')) return `<p class="w-lead">${body}</p>`;
    if (hasClass(node, 'tbl-note')) return `<p class="w-tnote">${body}</p>`;
    // `.dropcap` needs no class of its own — the <span class="w-dropcap"> it
    // wraps is what Prose.css styles.
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

  blocksOrInline(node) {
    const hasBlocks = elements(node).some((child) => !INLINE.has(child.tag));
    return hasBlocks ? this.blocks(node.children) : this.inline(node.children);
  }

  /** A callout. `.side` panels inside it are gathered into an opposed pair. */
  box(node) {
    const tone = classesOf(node).map((name) => BOX_TONES[name]).find(Boolean);
    if (!tone) this.fail(`callout with no recognised tone: ${classesOf(node).join(' ')}`);

    const out = [];
    let sides = [];
    const flushSides = () => {
      if (!sides.length) return;
      const pair = sides.length === 2 ? ' w-sides--pair' : '';
      out.push(`<div class="w-sides${pair}">${sides.join('')}</div>`);
      sides = [];
    };

    for (const child of node.children) {
      if (!isTag(child)) continue;
      if (hasClass(child, 'lbl')) {
        flushSides();
        out.unshift(`<span class="w-box-label">${this.inline(child.children)}</span>`);
        continue;
      }
      if (hasClass(child, 'side')) { sides.push(this.side(child, sides.length)); continue; }
      flushSides();
      out.push(this.block(child));
    }
    flushSides();

    return `<div class="w-box w-box--${tone}">${out.join('')}</div>`;
  }

  /**
   * One panel of an opposed argument. Its `.who` is the voice speaking, and
   * the argument itself is written as loose inline copy after that label
   * rather than wrapped in a <p> — so it is gathered up in document order and
   * emitted exactly once.
   */
  side(node, index) {
    const variant = index === 0 ? 'a' : 'b';
    const out = [];
    let loose = [];

    const flushLoose = () => {
      const text = loose.join('').replace(/\s+/g, ' ').trim();
      loose = [];
      if (text) out.push(`<p>${text}</p>`);
    };

    for (const child of node.children) {
      if (!isTag(child)) {
        loose.push(esc(decode(child)).replace(/\s+/g, ' '));
        continue;
      }
      if (hasClass(child, 'who')) {
        flushLoose();
        out.push(`<span class="w-who">${this.inline(child.children)}</span>`);
        continue;
      }
      if (INLINE.has(child.tag)) {
        loose.push(this.inline([child]));
        continue;
      }
      flushLoose();
      out.push(this.block(child));
    }
    flushLoose();

    return `<div class="w-side w-side--${variant}">${out.join('')}</div>`;
  }

  /**
   * The line that closes an argument: who is right, and how we know. Parts 1-13
   * write it as inline bold lines; parts 14-16 give it a `.lbl` label and
   * full paragraphs. Both are handled without changing the earlier output.
   */
  verdict(node) {
    const hasLabel = elements(node).some((child) => hasClass(child, 'lbl'));
    const hasBlocks = elements(node).some((child) => !INLINE.has(child.tag));
    if (!hasLabel && !hasBlocks) {
      return `<div class="w-verdict">${this.inline(node.children)}</div>`;
    }
    const out = [];
    for (const child of node.children) {
      if (!isTag(child)) { const t = this.inline([child]); if (t) out.push(`<p>${t}</p>`); continue; }
      if (hasClass(child, 'lbl')) {
        out.unshift(`<span class="w-box-label">${this.inline(child.children)}</span>`);
        continue;
      }
      if (INLINE.has(child.tag)) { const t = this.inline([child]); if (t) out.push(`<p>${t}</p>`); continue; }
      out.push(this.block(child));
    }
    return `<div class="w-verdict">${out.join('')}</div>`;
  }

  /** parts 14-16: an epigraph — a quotation with its source, opening a chapter. */
  epi(node) {
    const parts = [];
    for (const child of node.children) {
      if (!isTag(child)) continue;
      if (hasClass(child, 'src')) {
        parts.push(`<span class="w-attrib">${this.inline(child.children)}</span>`);
      } else {
        const inner = this.inline(child.children);
        if (inner) parts.push(inner);
      }
    }
    return `<div class="w-pullquote">${parts.join(' ')}</div>`;
  }

  /** The dark emphatic panel that closes a chapter. */
  remember(node) {
    const out = [];
    for (const child of node.children) {
      if (!isTag(child)) continue;
      if (hasClass(child, 'lbl')) {
        out.unshift(`<span class="w-box-label">${this.inline(child.children)}</span>`);
        continue;
      }
      out.push(this.block(child));
    }
    return `<div class="w-box w-box--remember">${out.join('')}</div>`;
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
            // `td.gl` is the source's emphasis for the row's key term.
            hi: hasClass(cell, 'gl'),
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

  /** The author card's key/value rows. */
  authorcard(node) {
    const rows = elements(node)
      .filter((row) => hasClass(row, 'row'))
      .map((row) => {
        const cells = elements(row);
        const key = cells.find((c) => hasClass(c, 'k'));
        const value = cells.find((c) => !hasClass(c, 'k'));
        if (!key || !value) this.fail('an author-card row is missing its key or value');
        return `<div class="w-def"><span class="w-def-term">${this.inline(key.children)}</span>`
          + `<span class="w-def-body">${this.inline(value.children)}</span></div>`;
      })
      .join('');
    return rows;
  }

  /** One block-level node from the print source. */
  block(node) {
    if (!isTag(node)) {
      if (decode(node).trim()) this.fail(`loose text outside a block: "${flat(node).slice(0, 60)}"`);
      return '';
    }

    switch (node.tag) {
      case 'p': return this.paragraph(node);
      /* Chapters are already <h2>, so the source's own levels carry straight
         over: a section heading stays an <h3> under its chapter. Demoting them
         would leave the part's outline jumping h2 → h4. */
      case 'h2': return `<h3 class="w-h3">${this.inline(node.children)}</h3>`;
      case 'h3': {
        const id = node.attrs.id ? ` id="${esc(this.idPrefix + node.attrs.id)}"` : '';
        return `<h3 class="w-h3"${id}>${this.inline(node.children)}</h3>`;
      }
      case 'h4': return `<h4 class="w-h4">${this.inline(node.children)}</h4>`;
      case 'ul':
      case 'ol': return this.list(node);
      case 'table': return this.table(node);
      case 'hr': return '<hr class="w-soft" />';
      case 'figure': return this.blocks(node.children);
      default: break;
    }

    if (node.tag !== 'div' && node.tag !== 'section' && node.tag !== 'blockquote') {
      this.fail(`unexpected block <${node.tag}>`);
    }

    if (hasClass(node, 'box')) return this.box(node);
    if (hasClass(node, 'remember')) return this.remember(node);
    if (hasClass(node, 'verdict')) return this.verdict(node);
    if (hasClass(node, 'epi')) return this.epi(node);
    if (hasClass(node, 'side')) return `<div class="w-sides">${this.side(node, 0)}</div>`;
    if (hasClass(node, 'tw')) return this.blocks(node.children);
    if (hasClass(node, 'authorcard')) return this.authorcard(node);
    // parts 14-16: the printed contents list, dropped — the reader renders its
    // own from `toc`.
    if (hasClass(node, 'toc-list')) { this.dropped.push('toc-list'); return ''; }
    // A kicker above a subheading.
    if (hasClass(node, 'eyebrow')) return `<p class="w-small">${this.inline(node.children)}</p>`;
    if (hasClass(node, 'lede')) return `<p class="w-lead">${this.inline(node.children)}</p>`;
    if (hasClass(node, 'standfirst')) return `<p class="w-lead">${this.inline(node.children)}</p>`;
    if (hasClass(node, 'signoff')) return this.blocks(node.children);
    // The centred rule that ends a part; the reader prints its own colophon.
    if (hasClass(node, 'endline')) { this.dropped.push('endline'); return ''; }
    if (hasClass(node, 'wrap')) return this.blocks(node.children);
    if (!flat(node)) return '';

    this.fail(`unrecognised block <${node.tag} class="${classesOf(node).join(' ')}">`);
    return '';
  }

  blocks(nodes) {
    return nodes.map((node) => this.block(node)).join('');
  }
}

/* ------------------------------------------------------------------
   Reading one part.
   ------------------------------------------------------------------ */

const stripMarkup = (markup) => markup
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z0-9#]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * The second-generation template (parts 14 onward). Its chapters are not
 * wrapped in their own <section>; they are a flat run of blocks delimited by
 * `div.chead` markers, sitting between the front-matter sections and the
 * back-matter sections inside `div.wrap`.
 */
function importNewPart({ n, label, pdf }, body, io, path) {
  const where = `part ${n}`;
  const wrap = find(body, (node) => hasClass(node, 'wrap'));
  if (!wrap) throw new Error(`${where}: no .wrap`);
  const header = find(wrap, (child) => hasClass(child, 'pg'));
  if (!header) throw new Error(`${where}: no masthead (.pg)`);

  const h1 = find(header, (child) => child.tag === 'h1');
  const title = h1 ? flat(h1) : '';
  if (!title) throw new Error(`${where}: the masthead has no title`);
  const blurb = flat(findClass(header, 'sub') ?? { children: [] });
  const warn = flat(findClass(header, 'adv') ?? { children: [] });

  /* One pass over the wrapper's children, sorting them into front-matter
     sections, the flat chapter run, and back-matter sections. */
  const frontSecs = [];
  const chapters = [];
  const backSecs = [];
  let phase = 'front';
  let current = null;

  for (const child of wrap.children) {
    if (!isTag(child) || child === header) continue;
    if (hasClass(child, 'pn')) continue; // the printed pager
    if (child.tag === 'section' && hasClass(child, 'sec')) {
      if (phase === 'front') frontSecs.push(child);
      else { phase = 'back'; current = null; backSecs.push(child); }
      continue;
    }
    if (hasClass(child, 'chead')) {
      phase = 'chapters';
      current = { head: child, body: [] };
      chapters.push(current);
      continue;
    }
    if (phase === 'chapters' && current) { current.body.push(child); continue; }
    if (phase === 'front') { frontSecs.push(child); continue; }
    backSecs.push(child); // trailing furniture, e.g. div.signoff
  }

  if (!chapters.length) throw new Error(`${where}: found no chapters`);

  /* The printed contents section carries a `.toc-list`; it is dropped, since
     the reader renders its own contents from `toc`. */
  const keptFront = frontSecs.filter((node) => {
    if (isTag(node) && node.tag === 'section' && deepHasClass(node, 'toc-list')) {
      io.dropped.push('contents section');
      return false;
    }
    return true;
  });

  const secHead = (node) => find(node, (c) => c.tag === 'h2' && hasClass(c, 'sec-h'));
  const firstSec = keptFront.find((node) => isTag(node) && node.tag === 'section');
  const prologueTitle = firstSec ? flat(secHead(firstSec) ?? { children: [] }) : 'Before We Begin';

  /* The front matter and back matter are shallow — one level of subheads under
     a single section heading. The section heading becomes an <h2> (the prologue
     title) or an <h3> (a sources heading), so a source <h4> inside them would
     skip a level. Demote those to <h3>; the chapter body keeps its own <h4>s. */
  const shallow = (html) => html
    .replace(/<h4 class="w-h4"/g, '<h3 class="w-h3"')
    .replace(/<\/h4>/g, '</h3>');

  const prologueBody = shallow(keptFront.map((node) => {
    if (isTag(node) && node.tag === 'section') {
      const h = secHead(node);
      const rest = node.children.filter((c) => c !== h);
      const heading = node === firstSec ? '' : (h ? `<h3 class="w-h3">${esc(flat(h))}</h3>` : '');
      return heading + io.blocks(rest);
    }
    return io.block(node);
  }).join(''));

  const prologue = (warn
    ? `<div class="w-box w-box--worry"><span class="w-box-label">How to read this</span><p>${esc(warn)}</p></div>`
    : '') + prologueBody;

  const toc = [];
  const html = chapters.map((chapter, index) => {
    const heading = find(chapter.head, (c) => c.tag === 'h2');
    if (!heading) throw new Error(`${where}: a chapter head with no title`);
    const chapterTitle = flat(heading);
    const number = index + 1;
    const id = `cr${n}-${number}-${slugify(chapterTitle)}`;
    toc.push({ id, num: String(number), text: chapterTitle });
    return `<h2 class="w-h2" id="${id}"><span class="w-num">${number}</span>${esc(chapterTitle)}</h2>`
      + io.blocks(chapter.body);
  }).join('');

  const sources = shallow(backSecs.map((node) => {
    if (isTag(node) && node.tag === 'section') {
      const h = secHead(node);
      const rest = node.children.filter((c) => c !== h);
      return (h ? `<h3 class="w-h3">${esc(flat(h))}</h3>` : '') + io.blocks(rest);
    }
    return io.block(node);
  }).join('<hr class="w-soft" />'));

  const pdfPath = resolve(SRC_DIR, pdf);
  if (!existsSync(pdfPath)) throw new Error(`${where}: missing PDF ${pdfPath}`);
  const words = stripMarkup(`${prologue} ${html} ${sources}`).split(/\s+/).filter(Boolean).length;

  return {
    part: {
      n,
      label,
      title,
      lead: blurb,
      words,
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      published: PUBLISHED,
      toc,
      prologue,
      prologueTitle,
      prologueTag: `Before We Begin · The Congress Record, Part ${n}`,
      html,
      sources,
    },
    source: { path, pdfPath, chapters: toc.length, dropped: io.dropped },
  };
}

function importPart({ n, label, file, pdf }) {
  const path = resolve(SRC_DIR, file);
  if (!existsSync(path)) throw new Error(`Missing source for part ${n}: ${path}`);

  const raw = readFileSync(path, 'utf8');
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error(`Part ${n}: no <body> in ${path}`);

  const where = `part ${n}`;
  const io = new Importer(where);
  io.idPrefix = `cr${n}-`;
  const body = parse(bodyMatch[1], where);

  /* Parts 14 onward were typeset with a second-generation template — a
     `header.pg` masthead, `section.sec` blocks and flat `div.chead`-delimited
     chapters. It is read by its own function; parts 1-13 fall through to the
     original reader below. */
  if (deepHasClass(body, 'pg')) {
    return importNewPart({ n, label, pdf }, body, io, path);
  }

  /* The part's own title and strapline, read from the masthead so they can
     never drift from the published book. "Part One — How to Judge a
     Government" carries the part number the reader already shows. */
  const masthead = find(body, (node) => hasClass(node, 'masthead'));
  if (!masthead) throw new Error(`${where}: no masthead`);
  const psub = flat(findClass(findClass(masthead, 'wrap') ?? masthead, 'psub') ?? { children: [] });
  const blurb = flat(findClass(findClass(masthead, 'wrap') ?? masthead, 'blurb') ?? { children: [] });
  const warn = flat(findClass(findClass(masthead, 'wrap') ?? masthead, 'warnbar') ?? { children: [] });
  const title = psub.replace(/^Part\s+\w+\s*[—–-]\s*/i, '').trim();
  if (!title) throw new Error(`${where}: the masthead has no part title`);

  const main = find(body, (node) => node.tag === 'main');
  if (!main) throw new Error(`${where}: no <main>`);
  const wrap = find(main, (node) => hasClass(node, 'wrap')) ?? main;

  let front = null;
  const chapters = [];
  const back = [];

  for (const section of elements(wrap)) {
    if (section.tag !== 'section') {
      if (flat(section)) throw new Error(`${where}: unexpected <${section.tag}> beside the chapters`);
      continue;
    }
    if (section.attrs.id === 'front') { front = section; continue; }
    if (hasClass(section, 'backm')) { back.push(section); continue; }
    if (/^chapter-\d+$/.test(section.attrs.id ?? '')) { chapters.push(section); continue; }
    throw new Error(
      `${where}: a section that is neither front matter, a chapter nor back matter — `
      + `<section id="${section.attrs.id ?? ''}" class="${classesOf(section).join(' ')}">`
    );
  }

  if (!front) throw new Error(`${where}: no front matter`);
  if (!chapters.length) throw new Error(`${where}: no chapters`);

  /* The front matter's opening kicker and heading are promoted to the
     reader's own prologue tag and title, so they are lifted out of the body
     here rather than printed twice. */
  const frontEyebrowNode = findClass(front, 'eyebrow');
  const frontTitleNode = find(front, (c) => c.tag === 'h2');
  const frontEyebrow = frontEyebrowNode ? flat(frontEyebrowNode) : '';
  const frontTitle = frontTitleNode ? flat(frontTitleNode) : '';
  const frontBody = front.children.filter(
    (child) => child !== frontEyebrowNode && child !== frontTitleNode
  );

  /* The standing warning opens the prologue: it is the book's declared posture
     and the reader is entitled to it before the first line of argument. */
  const prologue = (warn ? `<div class="w-box w-box--worry"><span class="w-box-label">How to read this</span><p>${esc(warn)}</p></div>` : '')
    + io.blocks(frontBody);

  const toc = [];
  const html = chapters
    .map((section) => {
      const head = findClass(section, 'chead');
      if (!head) throw new Error(`${where}: a chapter with no heading strip`);
      const heading = find(head, (c) => c.tag === 'h2' && hasClass(c, 'chapter'));
      const standfirst = findClass(head, 'standfirst');
      if (!heading) throw new Error(`${where}: a chapter with no title`);

      const chapterTitle = flat(heading);
      const number = toc.length + 1;
      const id = `cr${n}-${number}-${slugify(chapterTitle)}`;
      toc.push({ id, num: String(number), text: chapterTitle });

      const rest = section.children.filter((child) => child !== head);
      return `<h2 class="w-h2" id="${id}"><span class="w-num">${number}</span>${esc(chapterTitle)}</h2>`
        + (standfirst ? `<p class="w-lead">${esc(flat(standfirst))}</p>` : '')
        + io.blocks(rest);
    })
    .join('');

  /* Back matter becomes the reader's sources panel — the ground the series
     covers, the glossary and what comes next. The author card is dropped:
     the site carries the same details in its own colophon. */
  const sources = back
    .filter((section) => {
      const eyebrow = flat(findClass(section, 'eyebrow') ?? { children: [] });
      if (/^about$/i.test(eyebrow)) { io.dropped.push('About the Author'); return false; }
      return true;
    })
    .map((section) => {
      const heading = find(section, (c) => c.tag === 'h2');
      const rest = section.children.filter(
        (child) => child !== heading && !(isTag(child) && hasClass(child, 'eyebrow'))
      );
      return (heading ? `<h3 class="w-h3">${esc(flat(heading))}</h3>` : '') + io.blocks(rest);
    })
    .join('<hr class="w-soft" />');

  const pdfPath = resolve(SRC_DIR, pdf);
  if (!existsSync(pdfPath)) throw new Error(`${where}: missing PDF ${pdfPath}`);

  const strip = (markup) => markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = strip(`${prologue} ${html} ${sources}`).split(/\s+/).filter(Boolean).length;

  return {
    part: {
      n,
      label,
      title,
      lead: blurb,
      words,
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      published: PUBLISHED,
      toc,
      prologue,
      prologueTitle: frontTitle || 'Why I Wrote This',
      prologueTag: `${frontEyebrow || 'Before We Begin'} · The Congress Record, Part ${n}`,
      html,
      sources,
    },
    source: { path, pdfPath, chapters: toc.length, dropped: io.dropped },
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
  if (!part.prologue) throw new Error(`Part ${part.n} recovered no front matter`);
  if (!part.sources) throw new Error(`Part ${part.n} recovered no back matter`);
  if (!part.title) throw new Error(`Part ${part.n} recovered no title`);
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
const totalMinutes = parts.reduce((sum, part) => sum + part.minutes, 0);

const output = `/* ============================================================
   THE CONGRESS RECORD — WHAT A PARTY DID WITH SEVENTY YEARS
   Generated by scripts/import-congress-record.mjs from the
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
    `  Part ${String(part.n).padStart(2)} — ${part.title.slice(0, 34).padEnd(34)} `
    + `${String(part.toc.length).padStart(2)} chapters · `
    + `${part.words.toLocaleString('en-IN').padStart(7)} words · ${String(part.minutes).padStart(3)} min`
    + (source.dropped.length ? `  (dropped: ${[...new Set(source.dropped)].join(', ')})` : '')
  );
}
console.log(
  `  ${parts.length} parts · ${totalWords.toLocaleString('en-IN')} words · ${totalMinutes} min`
);
console.log('  Set words/minutes above into the manifest entry.');
