/**
 * verify-wars-of-punjab.mjs
 *
 * Checks the PDF reconstruction in ./wars-of-punjab-pdf.mjs against ground
 * truth. Parts 1 and 2 of the book exist in both forms — the authored
 * print-HTML they were rendered from, and the finished PDF — so rebuilding
 * those two from their PDFs and comparing against their own source says
 * exactly how faithful the rebuild of the other fourteen is.
 *
 * Run it after any change to the parser. Both parts should come back within
 * a handful of characters, and every structure count should match.
 *
 *   node scripts/verify-wars-of-punjab.mjs
 *
 * Exits non-zero if the text drifts past the tolerance below or a structure
 * count moves, so it can gate a build.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfPart } from './wars-of-punjab-pdf.mjs';

const SRC_DIR = process.argv[2] ?? 'C:/Users/rajpa/Documents/books/Wars of Punjab';
const PDF_DIR = resolve(SRC_DIR, 'out');

/* The book's own two sources for the same content, per part. */
const CASES = [
  { n: 1, html: 'build/part1.html' },
  { n: 2, html: 'build/part2.html' },
];

/* Print vocabulary on the left, the web vocabulary it becomes on the right.
   A count that moves means a structure stopped being recognised. */
const STRUCTURES = [
  ['war card', /class="wonby"/g, /w-box--fact/g],
  ['win/lose panel', /class="why"/g, /w-sides--pair/g],
  ['story box', /class="story"/g, /w-myth-head/g],
  ['note box', /class="note"/g, /w-box--weigh/g],
  ['table', /<table>/g, /w-table-scroll/g],
  ['timeline', /class="tl"/g, /w-timeline/g],
  ['glossary term', /<dt>/g, /w-def-term/g],
  ['source list', /class="srcs"/g, /w-srcs/g],
  ['lede', /class="lede"/g, /w-lead/g],
  ['drop cap', /class="dropcap"/g, /w-dropcap/g],
  ['h4', /<h4>/g, /w-h4/g],
  ['quote', /<blockquote>/g, /w-box--quote/g],
];

const strip = (html) => html
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

/* Compared without whitespace or quote-shape, since neither carries meaning
   here and both legitimately differ between a printed page and a web one. */
const squash = (s) => s
  .replace(/\u00ad/g, '')
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/[\u2756\u2766\u274b\u2022]/g, '')
  .replace(/\s+/g, '').toLowerCase();

const count = (text, re) => (text.match(re) ?? []).length;

/**
 * The rebuild runs a shade longer than the source on purpose: the print
 * edition sets a war card's keys as small caps with no punctuation, and the
 * web edition writes them back as "When:", "Where:", "Won by:". That is worth
 * about half a character per thousand. Anything past this is real drift.
 */
const TOLERANCE = 0.0025;

const pdfFileFor = (n) => {
  const name = readdirSync(PDF_DIR).find((f) => new RegExp(`^Wars of Punjab - Part ${n} - `).test(f));
  if (!name) throw new Error(`No PDF for part ${n} in ${PDF_DIR}`);
  return resolve(PDF_DIR, name);
};

let failed = false;

for (const { n, html: htmlFile } of CASES) {
  const rebuilt = parsePdfPart(pdfFileFor(n));
  const rebuiltHtml = rebuilt.sections
    .map((s) => `<h2>${s.title} ${s.badge ?? ''}</h2>${s.html.join('')}`)
    .join('');

  const authored = readFileSync(resolve(SRC_DIR, htmlFile), 'utf8')
    .replace(/<section class="cover">[\s\S]*?<\/section>/, '')
    .replace(/^[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*$/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // The chapter kicker is print furniture that the web edition drops.
    .replace(/<h2 class="chapter">[\s\S]*?<\/h2>/g, '');

  const a = squash(strip(authored));
  const b = squash(strip(rebuiltHtml));
  const drift = Math.abs(b.length - a.length) / a.length;

  console.log(`\nPart ${n} — "${rebuilt.title}"`);
  console.log(`  text     ${a.length} authored vs ${b.length} rebuilt`
    + `  (${b.length - a.length >= 0 ? '+' : ''}${b.length - a.length}, ${(drift * 100).toFixed(3)}%)`);
  if (drift > TOLERANCE) { console.log(`  ✗ text drift beyond tolerance`); failed = true; }

  for (const [name, fromPrint, fromWeb] of STRUCTURES) {
    const want = count(authored, fromPrint);
    const got = count(rebuiltHtml, fromWeb);
    if (want !== got) {
      console.log(`  ✗ ${name}: ${want} in the source, ${got} rebuilt`);
      failed = true;
    }
  }
  if (!failed) console.log('  ✓ every structure accounted for');
}

console.log(failed
  ? '\nFAILED — the reconstruction has drifted from the authored source.'
  : '\nOK — the reconstruction matches the authored source.');
process.exit(failed ? 1 : 0);
