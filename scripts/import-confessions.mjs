/**
 * import-confessions.mjs
 *
 * Importer for "The Confessions, Explained" — Augustine's thirteen books in
 * nine parts. All nine are rebuilt from their designed PDFs by
 * ./confessions-parse.mjs; parts 1 to 5 have no other source left, and reading
 * the other four the same way keeps one code path for the whole book, which is
 * the rule the book's own extract.py set for the same reason.
 *
 * The rebuild is not taken on trust. Parts 6 to 9 still have the Python content
 * modules they were rendered from, and scripts/verify-confessions.mjs compares
 * the two token for token: 1,276 tokens and 408,639 characters of prose, with
 * every structure, every heading and every scrap of inline emphasis matching.
 *
 * Like the other importers here, this translates the print vocabulary into the
 * site's prose vocabulary in src/components/Prose.css rather than shipping
 * print markup, and it is deliberately strict: an unhandled token throws.
 *
 *   node scripts/import-confessions.mjs
 *   node scripts/import-confessions.mjs "<folder holding the nine PDFs>"
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePart } from './confessions-parse.mjs';

const SRC = process.argv[2] ?? 'C:/Users/rajpa/Documents/books/The Confessions';
const OUT = 'src/data/writing/confessions.js';

/* The series went up in one piece, so every part carries the same date. It was
   written between 31 August and 1 September 2026; this is the day it was
   published. */
const PUBLISHED = '2026-09-02';

/**
 * The nine parts. `covers` is which of Augustine's thirteen books the part
 * walks, `label` the short chip the contents rail shows. Both are the book's
 * own, off the handover files that ship with it.
 */
const PARTS = [
  { n: 1, file: 'The_Confessions_Explained_Part_1_The_Restless_Heart.pdf', covers: 'Book I', label: 'Infancy & School' },
  { n: 2, file: 'The_Confessions_Explained_Part_2_The_Pears_and_the_Manichees.pdf', covers: 'Books II–III', label: 'Pears & Manichees' },
  { n: 3, file: 'The_Confessions_Explained_Part_3_The_Dead_Friend_and_the_Disappointing_Bishop.pdf', covers: 'Books IV–V', label: 'Grief & Faustus' },
  { n: 4, file: 'The_Confessions_Explained_Part_4_Milan_Ambrose_and_Where_Evil_Comes_From.pdf', covers: 'Books VI–VII', label: 'Milan & Evil' },
  { n: 5, file: 'The_Confessions_Explained_Part_5_The_Garden.pdf', covers: 'Book VIII', label: 'Conversion' },
  { n: 6, file: 'The_Confessions_Explained_Part_6_The_Water_the_Window_and_the_Grave.pdf', covers: 'Book IX', label: 'Baptism & Ostia' },
  { n: 7, file: 'The_Confessions_Explained_Part_7_The_Vast_Palace_of_Memory.pdf', covers: 'Book X', label: 'Memory' },
  { n: 8, file: 'The_Confessions_Explained_Part_8_What_Is_Time.pdf', covers: 'Book XI', label: 'Time' },
  { n: 9, file: 'The_Confessions_Explained_Part_9_The_First_Sentence_of_the_Bible.pdf', covers: 'Books XII–XIII', label: 'Genesis' },
];

/**
 * The six print boxes, translated to the site's callout vocabulary.
 *
 * The tones are chosen so that all six read apart from one another on the page
 * — the print edition gives each box its own colour and the web edition should
 * too — and so that each lands on the class the rest of the archive already
 * uses for that job: a term explained is `simple`, a number made real is
 * `number`, evidence weighed is `weigh`, a live dispute is `arg`, a premise
 * dug out is `claim`, and the plain-words close of a chapter is `remember`.
 */
const BOXES = {
  word: { cls: 'simple', label: 'Word box' },
  real: { cls: 'number', label: 'In real terms' },
  know: { cls: 'weigh', label: 'How we actually know this' },
  assume: { cls: 'claim', label: 'The hidden assumption' },
  arg: { cls: 'arg', label: 'The argument' },
  rem: { cls: 'remember', label: 'Remember this' },
};


/* ---------- small helpers ---------- */

const esc = (s) => String(s)
  .replace(/&(?!(amp|lt|gt|#\d+|[a-z]+);)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The parser's print markup, in the site's tags. */
const rich = (s) => String(s)
  .replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>')
  .replace(/<i>/g, '<em>').replace(/<\/i>/g, '</em>');

const textOf = (html) => String(html)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const wordCount = (html) => (textOf(html).match(/\S+/g) ?? []).length;

const slugify = (s) => textOf(s)
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

const paras = (list) => list.map((p) => `<p>${rich(p)}</p>`).join('');

/* ---------- block translators ---------- */

/**
 * A numbered section heading. The print sets these as "4.2 — Section title";
 * the number becomes the site's own heading chip, which is what the rest of
 * the archive does with a printed section number.
 */
function heading3(text) {
  const m = text.match(/^(\d+\.\d+)\s*[—–-]\s*(.+)$/);
  if (!m) return `<h3 class="w-h3">${esc(text)}</h3>`;
  return `<h3 class="w-h3 w-h3--num"><span class="w-num">${esc(m[1])}</span>${esc(m[2])}</h3>`;
}

/**
 * An argument box: the framing, then one card per position, then the
 * three-part verdict. Two positions sit side by side on a wide screen; three
 * stack, because three columns of argument are unreadable at any width.
 *
 * The verdict's three lead-ins — where things stand, what would settle it, why
 * people care so much — are stripped by the parser so it can be compared with
 * the author's own source, and put back here.
 */
function argumentBox(a) {
  const tones = ['a', 'b', 'c'];
  const cases = a.cases.map(([who, body], i) =>
    `<div class="w-side w-side--${tones[i % tones.length]}">`
    + `<span class="w-who">${esc(who)}</span>${paras(body)}</div>`).join('');
  const pair = a.cases.length === 2 ? ' w-sides--pair' : '';
  const verdict = a.verdict.map((text, i) => {
    const lead = a.verdictLabels?.[i];
    return `<p>${lead ? `<strong>${esc(lead)}:</strong> ` : ''}${rich(text)}</p>`;
  }).join('');
  return `<div class="w-box w-box--arg">`
    + `<span class="w-box-label">The argument — ${esc(a.question)}</span>`
    + paras(a.framing)
    + (cases ? `<div class="w-sides${pair}">${cases}</div>` : '')
    + verdict
    + `</div>`;
}

/**
 * A table.
 *
 * A two-column table of terms is a glossary, and the site has a better shape
 * for one than a table: a definition list that does not go narrow and cramped
 * on a phone. Everything else keeps its columns, inside its own scroller so a
 * wide table never pushes the page sideways.
 */
function table(headers, rows) {
  const glossary = headers.length === 2 && /^(term|word)$/i.test(textOf(headers[0]));
  if (glossary) {
    const entries = rows.map(([term, body]) =>
      `<div class="w-def"><span class="w-def-term">${esc(textOf(term))}</span>`
      + `<div class="w-def-body">${rich(body)}</div></div>`).join('');
    return `<div class="w-gloss-list">${entries}</div>`;
  }
  const th = headers.map((h) => `<th>${rich(h)}</th>`).join('');
  const tb = rows.map((r) => `<tr>${r.map((c) => `<td>${rich(c)}</td>`).join('')}</tr>`).join('');
  return `<div class="w-table-scroll"><table class="w-table">`
    + `<thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>`;
}

/* ---------- one part ---------- */

/**
 * Turn one part's token stream into the site's HTML plus its contents.
 *
 * Every chapter and every front- or back-matter heading becomes a section, so
 * the reader's contents rail is the part's real structure rather than a
 * summary of it. Chapters carry their number; the rest carry a section mark.
 */
function buildPart(meta) {
  const { cover, tokens } = parsePart(resolve(SRC, meta.file));

  const toc = [];
  const html = [];
  let contents = null;      // the print Contents page, gathered as it arrives
  let chapters = 0;

  const section = (num, text) => {
    const id = `cf${meta.n}-${slugify(text)}`;
    toc.push({ id, num, text });
    return id;
  };

  const flushContents = () => {
    if (!contents) return;
    html.push(`<div class="w-gloss-list">${contents.join('')}</div>`);
    contents = null;
  };

  for (const tok of tokens) {
    const [kind] = tok;

    if (kind !== 'toc') flushContents();

    switch (kind) {
      case 'chap': {
        chapters += 1;
        const title = tok[2].join(' ');
        const id = section(String(chapters), title);
        html.push(`<h2 class="w-h2" id="${id}"><span class="w-num">${chapters}</span>${esc(title)}</h2>`);
        if (tok[3]) html.push(`<p class="w-lead">${rich(tok[3])}</p>`);
        break;
      }
      case 'h2': {
        const id = section('§', tok[1]);
        html.push(`<h2 class="w-h2" id="${id}">${esc(tok[1])}</h2>`);
        break;
      }
      case 'h3':
        html.push(heading3(tok[1]));
        break;
      case 'p':
        html.push(`<p>${rich(tok[1])}</p>`);
        break;
      case 'dc': {
        const text = rich(tok[1]);
        // The drop capital is the paragraph's own first letter, set large.
        html.push(`<p><span class="w-dropcap">${text[0]}</span>${text.slice(1)}</p>`);
        break;
      }
      case 'ul':
        html.push(`<ul>${tok[1].map((li) => `<li>${rich(li)}</li>`).join('')}</ul>`);
        break;
      case 'toc':
        /* The printed Contents is the author's own map of the part, and its
           sublines say what each chapter holds — which the site's contents
           rail has no room for. Kept, as a definition list. */
        contents ??= [];
        contents.push(`<div class="w-def"><span class="w-def-term">${esc(tok[1])}</span>`
          + `<div class="w-def-body">${rich(tok[2])}</div></div>`);
        break;
      case 'word': case 'real': case 'know': {
        const box = BOXES[kind];
        html.push(`<div class="w-box w-box--${box.cls}">`
          + `<span class="w-box-label">${box.label}</span>${paras(tok[2])}</div>`);
        break;
      }
      case 'assume':
        html.push(`<div class="w-box w-box--${BOXES.assume.cls}">`
          + `<span class="w-box-label">${BOXES.assume.label} — ${esc(tok[1])}</span>`
          + `${paras(tok[2])}</div>`);
        break;
      case 'rem':
        html.push(`<div class="w-box w-box--${BOXES.rem.cls}">`
          + `<span class="w-box-label">${BOXES.rem.label}</span>${paras(tok[1])}</div>`);
        break;
      case 'arg':
        html.push(argumentBox(tok[1]));
        break;
      case 'table':
        html.push(table(tok[1], tok[2]));
        break;
      case 'end': case 'endsub':
        /* Print furniture: the ruled "End of Part 6 of 9" and the colophon
           under it. The site closes a part with its own pager. */
        break;
      default:
        throw new Error(`Part ${meta.n}: unhandled token "${kind}"`);
    }
  }
  flushContents();

  const body = html.join('');
  const words = wordCount(body);
  return {
    n: meta.n,
    label: meta.label,
    title: cover.title,
    lead: cover.blurb,
    covers: meta.covers,
    chapters,
    published: PUBLISHED,
    words,
    minutes: Math.max(1, Math.round(words / 220)),
    toc,
    html: body,
  };
}

/* ---------- run ---------- */

const parts = PARTS.map(buildPart);
const total = parts.reduce((a, p) => a + p.words, 0);

const out = `/* ============================================================
   THE CONFESSIONS, EXPLAINED — AUGUSTINE, ALL THIRTEEN BOOKS
   Generated by scripts/import-confessions.mjs from the nine designed
   PDFs. Do not hand-edit: re-run the importer.

   ${parts.length} parts · ${parts.reduce((a, p) => a + p.chapters, 0)} chapters · ${total.toLocaleString('en-IN')} words

   The rebuild is checked against the surviving source of parts 6 to 9
   by scripts/verify-confessions.mjs.
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`;

writeFileSync(resolve(OUT), out, 'utf8');

for (const p of parts) {
  console.log(
    `Part ${p.n}: "${p.title}" — ${p.covers}, ${p.chapters} chapters, `
    + `${p.toc.length} sections, ${p.words.toLocaleString('en-IN')} words, ~${p.minutes} min`
  );
}
console.log(`\n${total.toLocaleString('en-IN')} words in ${parts.length} parts. Wrote ${OUT}`);
