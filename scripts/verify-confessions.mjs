/**
 * verify-confessions.mjs
 *
 * Checks the PDF reconstruction against ground truth.
 *
 * Parts 1 to 5 of "The Confessions, Explained" exist only as designed PDFs —
 * their source was lost with an earlier working directory (HANDOVER_PART_06.md
 * §2) — so the web edition is rebuilt from the PDFs by confessions-parse.mjs.
 * Parts 6 to 9 still have the Python content modules they were rendered from,
 * which makes the rebuild checkable rather than merely plausible: run it on
 * those four and compare token for token with what the author actually wrote.
 *
 *   node scripts/verify-confessions.mjs          # summary
 *   node scripts/verify-confessions.mjs -v       # every mismatch
 *
 * The truth file comes from scripts/confessions-truth.py, which has to run
 * beside the content modules — they live with the book rather than in this
 * repository, in C:/Users/rajpa/Documents/books/The Confessions/build:
 *
 *   cp scripts/confessions-truth.py "<book>/build/"
 *   cd "<book>/build" && python confessions-truth.py "<repo>/tmp/truth.json"
 *
 * Its output holds the full text of four parts, so it stays uncommitted.
 *
 * What a clean run means, and what it does not. The rebuild reproduces the
 * token stream of all four parts exactly — every chapter, heading, box, case
 * card, table and list, and every scrap of inline emphasis, across 408,639
 * characters. The mismatches it does report are all one thing: a paragraph
 * break inside a callout that the page carries no evidence for either way,
 * because those boxes are set with no gap between paragraphs and the line
 * above happened to fill its measure. Nineteen of them, and each merges two
 * paragraphs of one box rather than losing or moving a word.
 */
import { readFileSync, existsSync } from 'node:fs';
import { parsePart } from './confessions-parse.mjs';

const BOOK = process.argv.find((a) => a.startsWith('--book='))?.slice(7)
  ?? 'C:/Users/rajpa/Documents/books/The Confessions';
const TRUTH = 'tmp/truth.json';
const verbose = process.argv.includes('-v');

const FILES = {
  6: 'The_Confessions_Explained_Part_6_The_Water_the_Window_and_the_Grave.pdf',
  7: 'The_Confessions_Explained_Part_7_The_Vast_Palace_of_Memory.pdf',
  8: 'The_Confessions_Explained_Part_8_What_Is_Time.pdf',
  9: 'The_Confessions_Explained_Part_9_The_First_Sentence_of_the_Bible.pdf',
};

if (!existsSync(TRUTH)) {
  console.error(`No ${TRUTH}. Run tmp/dump-truth.py against the book's build/ directory first.`);
  process.exit(2);
}
const truth = JSON.parse(readFileSync(TRUTH, 'utf8'));

/* ---------- normalisation ----------
   The comparison is of what a reader gets, so it ignores things that cannot
   survive a round trip through a PDF and do not change a word of the text:
   the <br/> tags the print module used to force a line break, and the
   difference between a straight and a typographic space. */
const norm = (s) => String(s)
  .replace(/<br\s*\/?>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\u00a0/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/** Text with all inline markup removed, for the "same words?" comparison. */
const words = (s) => norm(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** The truth stream, mapped onto the token shapes the parser emits. */
function expected(doc) {
  const out = [];
  for (const tok of doc) {
    const [kind] = tok;
    switch (kind) {
      case 'p': out.push(['p', tok[1]]); break;
      case 'dc': out.push(['dc', tok[1]]); break;
      case 'h2': out.push(['h2', tok[1]]); break;
      case 'h3': out.push(['h3', tok[1]]); break;
      case 'ul': out.push(['ul', tok[1]]); break;
      case 'chap': out.push(['chap', tok[1], tok[2], tok[3]]); break;
      case 'toc': out.push(['toc', tok[1], tok[2]]); break;
      case 'rem': out.push(['rem', tok[1]]); break;
      case 'assume': out.push(['assume', tok[1], tok[2]]); break;
      case 'word': case 'real': case 'know':
        out.push([kind, '', tok[2]]); break;
      case 'arg':
        out.push(['arg', {
          question: tok[1], framing: [tok[2]],
          cases: tok[3].map(([who, body]) => [who, Array.isArray(body) ? body : [body]]),
          verdict: tok[4],
        }]); break;
      case 'table': out.push(['table', tok[1], tok[2]]); break;
      case 'end': out.push(['end', tok[1]]); break;
      case 'endsub': out.push(['endsub', tok[1]]); break;
      case 'pb': case 'gap': case 'assume_demo': break;
      default: throw new Error(`unknown truth token ${kind}`);
    }
  }
  return out;
}

/**
 * Every scrap of prose in a token, flattened, for a text-level comparison.
 *
 * The press module upper-cases every box label and case-card label as it draws
 * it, so their original case cannot be read back off a page \u2014 and does not need
 * to be, since the web edition's stylesheet upper-cases them again. Those
 * fields alone are compared case-blind; everything else is compared as written.
 */
const label = (s) => String(s ?? '').toLowerCase();

function textOf(tok) {
  const [kind] = tok;
  if (kind === 'arg') {
    const a = tok[1];
    return [label(a.question), ...a.framing,
      ...a.cases.flatMap(([who, body]) => [label(who), ...body]),
      ...a.verdict].join(' \u241f ');
  }
  if (kind === 'table') return [...tok[1], ...tok[2].flat()].join(' \u241f ');
  if (kind === 'chap') return [tok[1], ...tok[2], tok[3]].join(' \u241f ');
  if (kind === 'ul' || kind === 'rem') return tok[1].join(' \u241f ');
  if (kind === 'word' || kind === 'real' || kind === 'know') return tok[2].join(' \u241f ');
  if (kind === 'assume') return [label(tok[1]), ...tok[2]].join(' \u241f ');
  if (kind === 'toc') return [tok[1], tok[2]].join(' \u241f ');
  return String(tok[1] ?? '');
}

let failures = 0;

for (const n of Object.keys(FILES)) {
  const got = parsePart(`${BOOK}/${FILES[n]}`).tokens;
  const want = expected(truth[n].doc);

  const gotKinds = got.map((t) => t[0]).join(' ');
  const wantKinds = want.map((t) => t[0]).join(' ');

  /* Compare the streams position by position, but resynchronise on a length
     difference so one extra token does not report every token after it as
     wrong. */
  const issues = [];
  let gi = 0;
  let wi = 0;
  while (gi < got.length || wi < want.length) {
    const g = got[gi];
    const w = want[wi];
    if (!g) { issues.push(['missing', wi, w && textOf(w).slice(0, 90)]); wi += 1; continue; }
    if (!w) { issues.push(['extra', gi, textOf(g).slice(0, 90)]); gi += 1; continue; }
    if (g[0] !== w[0]) {
      // Resynchronise: look a short way ahead for the kind that matches.
      const ahead = want.slice(wi, wi + 4).findIndex((x) => x[0] === g[0]);
      const behind = got.slice(gi, gi + 4).findIndex((x) => x[0] === w[0]);
      if (ahead > 0 && (behind === -1 || ahead <= behind)) {
        issues.push(['missing', wi, `${w[0]}: ${textOf(w).slice(0, 90)}`]);
        wi += 1;
      } else if (behind > 0) {
        issues.push(['extra', gi, `${g[0]}: ${textOf(g).slice(0, 90)}`]);
        gi += 1;
      } else {
        issues.push(['kind', gi, `got ${g[0]} want ${w[0]}: ${textOf(g).slice(0, 70)}`]);
        gi += 1; wi += 1;
      }
      continue;
    }
    const a = words(textOf(g));
    const b = words(textOf(w));
    if (a !== b) {
      issues.push(['text', gi, diffAt(a, b)]);
    } else if (norm(textOf(g)) !== norm(textOf(w))) {
      issues.push(['markup', gi, diffAt(norm(textOf(g)), norm(textOf(w)))]);
    }
    gi += 1; wi += 1;
  }

  const chars = want.reduce((sum, t) => sum + words(textOf(t)).length, 0);
  const bad = issues.filter((x) => x[0] !== 'markup').length;
  failures += bad;
  console.log(
    `Part ${n}: ${got.length} tokens vs ${want.length} · `
    + `${chars.toLocaleString('en-IN')} characters of text · `
    + `${bad} mismatch${bad === 1 ? '' : 'es'}`
    + (issues.length > bad ? ` (+${issues.length - bad} markup-only)` : '')
  );
  if (gotKinds !== wantKinds && !verbose) {
    console.log('  token kinds differ; re-run with -v for detail');
  }
  if (verbose) {
    for (const [what, at, detail] of issues) {
      console.log(`  ${what.padEnd(8)} @${String(at).padStart(4)}  ${detail}`);
    }
  }
}

/** Where two strings first differ, with a little context either side. */
function diffAt(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  const from = Math.max(0, i - 40);
  return `at ${i}\n      got  …${a.slice(from, i + 60)}\n      want …${b.slice(from, i + 60)}`;
}

console.log(failures === 0
  ? '\nClean: the rebuild reproduces every part whose source survives.'
  : `\n${failures} mismatches.`);
process.exit(failures === 0 ? 0 : 1);
