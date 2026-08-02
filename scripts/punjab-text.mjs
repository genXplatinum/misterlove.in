/* The text layer for the Punjab import, developed on its own so the space
   reconstruction can be checked before any structure is built on top of it. */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'node:fs';

/* A gap wider than this fraction of the font size is a word space. Measured:
   inter-word gaps in this typeface run 0.20–0.35em, and the letterspaced
   small-caps labels put ~0.30em between letters of one word, so the two
   cannot be separated by width alone — the caps runs are handled after. */
export const SPACE_RATIO = 0.14;

/**
 * Small-caps labels are set with wide letterspacing, and the extractor
 * reports that spacing as real spaces — but one item per *word*. So the
 * letterspacing is collapsed inside an item, and the gap between items is
 * left to put the word breaks back.
 */
function collapse(str) {
  const trimmed = str.trim();
  if (!trimmed.includes(' ')) return str;
  // Inside one item, a run of 2+ spaces is a word break and a single space is
  // letterspacing. Prose never consists entirely of single characters, so the
  // test cannot fire on body copy.
  const words = trimmed.split(/\s{2,}/);
  const letterspaced = words.every((word) => {
    const tokens = word.split(' ').filter(Boolean);
    return tokens.length >= 2 && tokens.every((t) => t.length === 1);
  });
  if (!letterspaced) return str;
  return words.map((word) => word.split(' ').filter(Boolean).join('')).join(' ');
}

/**
 * Some small-caps labels are set as a single text item with the original word
 * spaces removed and letterspacing put in their place, so the word breaks are
 * simply not in the file: "THE FOUR THINGS PEOPLE MEAN BY PUNJAB" arrives as
 * one unbroken run. They are recovered by matching against the vocabulary of
 * the book itself — every word in such a label also appears in the body copy —
 * longest match first, and the caller is told when a run cannot be split so it
 * can fail rather than publish a mangled caption.
 */
export function resegment(run, vocabulary) {
  const letters = run.replace(/[^A-Z0-9]/gi, '');
  if (!letters) return null;
  const memo = new Map();

  const solve = (from) => {
    if (from === letters.length) return [];
    if (memo.has(from)) return memo.get(from);
    let best = null;
    // Longest first: "THEFOUR" prefers "THE"+"FOUR" over "T"+"HE"+…
    for (let to = letters.length; to > from; to -= 1) {
      const word = letters.slice(from, to);
      if (!vocabulary.has(word.toLowerCase())) continue;
      const rest = solve(to);
      if (rest) { best = [word, ...rest]; break; }
    }
    memo.set(from, best);
    return best;
  };

  const words = solve(0);
  return words ? words.join(' ') : null;
}

/** One visual line: its baseline, left edge, dominant size, and its text. */
function lineOf(items) {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  let text = '';
  let prev = null;
  for (const it of sorted) {
    const str = collapse(it.str);
    if (prev) {
      const gap = it.x - (prev.x + prev.w);
      // Items already ending or starting with a space need no help.
      const spaced = /\s$/.test(prev.str) || /^\s/.test(it.str);
      if (!spaced && gap > SPACE_RATIO * it.size) text += ' ';
    }
    text += str;
    prev = it;
  }
  return {
    y: sorted[0].y,
    x: Math.min(...sorted.map((i) => i.x)),
    size: Math.round(Math.max(...sorted.map((i) => i.size)) * 10) / 10,
    text: text.replace(/\s+/g, ' ').trim(),
  };
}

/**
 * Every line of a document, in reading order, with spaces restored — plus the
 * raw items each page was built from. Multi-column tables put several cells on
 * one baseline, so they have to be rebuilt from items rather than lines.
 */
export async function readLines(file) {
  const doc = await getDocument({ data: new Uint8Array(readFileSync(file)), useSystemFonts: true }).promise;
  const pages = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const content = await (await doc.getPage(p)).getTextContent();
    const rows = new Map();
    const items = [];
    for (const it of content.items) {
      if (!it.str.trim()) continue;
      const [a, , , , x, y] = it.transform;
      const item = {
        x, y, w: it.width ?? 0,
        size: Math.round((Math.abs(a) || it.height || 0) * 10) / 10,
        str: collapse(it.str).replace(/\s+/g, ' ').trim(),
        raw: it.str,
      };
      items.push(item);
      const key = String(Math.round(y * 2) / 2);
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push({ x, y, w: it.width ?? 0, size: Math.abs(a) || it.height || 0, str: it.str });
    }
    /* A line-breaking hyphen is its own text item, sitting in the right
       margin. Left alone it is read as a separate table cell and the word it
       broke is silently split in two ("Hi" / "machal"), so it is folded back
       onto the item it belongs to before anything else looks at them. */
    const merged = [];
    for (const item of items.sort((a, b) => b.y - a.y || a.x - b.x)) {
      if (item.str === '‐' && merged.length) {
        const owner = merged
          .filter((m) => Math.abs(m.y - item.y) < 1 && m.x < item.x)
          .sort((a, b) => b.x - a.x)[0];
        if (owner) { owner.str += '‐'; continue; }
      }
      merged.push(item);
    }

    const lines = [...rows.values()].map(lineOf).sort((a, b) => b.y - a.y);
    pages.push({ page: p, lines, items: merged });
  }
  return pages;
}

if (process.argv[1]?.endsWith('punjab-text.mjs')) {
  const DIR = 'C:/Users/rajpa/Documents/Debunk/Punjab - The Whole Truth';
  const pages = await readLines(`${DIR}/Punjab_Part_01_The_Land_Before_the_Name.pdf`);
  for (const p of pages.filter((p) => [5, 6].includes(p.page))) {
    console.log(`===== page ${p.page}`);
    for (const l of p.lines) console.log(`${String(l.size).padStart(5)}pt x${String(Math.round(l.x)).padStart(4)} | ${l.text}`);
  }
}
