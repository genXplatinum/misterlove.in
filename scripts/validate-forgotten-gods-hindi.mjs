/**
 * validate-forgotten-gods-hindi.mjs — structural + integrity checks for the
 * Hindi edition.
 *
 * Unlike Kissan Andolan's Hindi edition (see validate-hindi-writing.mjs),
 * "Forgotten Gods Hindi - Simplified.pdf" is not a paragraph-for-paragraph
 * mirror of the English source — it's a genuine retelling that expands some
 * passages (Part 3 gives the Goa Inquisition its own extra passage) and
 * condenses others (Part 4's closing argument runs noticeably tighter in
 * Hindi). Checking exact paragraph/box counts or tag-for-tag HTML sequence
 * against English, the way the Kissan Andolan validator does, would fail on
 * that legitimate editorial difference as readily as on a real bug. So this
 * checks what actually has to hold for the site to work and the content to
 * be trustworthy — matching TOC ids in matching order (that's what the
 * language switch anchors on), no malformed or empty markup, no leaked
 * extraction artifacts, self-consistent metadata — and leaves paragraph-
 * level shape to differ where the two editions genuinely do.
 */
import english from '../src/data/writing/forgotten-gods.js';
import hindi from '../src/data/writing/forgotten-gods-hi.js';
import { getPieceForLanguage } from '../src/data/writing.js';

const count = (text, pattern) => (String(text ?? '').match(pattern) ?? []).length;
const ids = (text) => new Set(
  [...String(text ?? '').matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1])
);
const stripHtml = (text) => String(text ?? '')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(?:nbsp|amp|quot|apos|mdash|ndash|hellip);/g, ' ')
  .replace(/&#\d+;|&#x[\da-f]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const wordCount = (part) => stripHtml([
  part.title,
  part.lead,
  part.prologue,
  part.html,
].filter(Boolean).join(' ')).split(/\s+/).filter(Boolean).length;
const comparableText = (text) => stripHtml(text)
  .toLocaleLowerCase('hi')
  .replace(/[^\p{L}\p{N}%+]+/gu, '');
const h2ById = (text) => new Map(
  [...String(text ?? '').matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi)]
    .map((match) => {
      const id = match[1].match(/\bid=["']([^"']+)["']/i)?.[1];
      const withoutNumber = match[2].replace(
        /<span\b[^>]*class=["'][^"']*\bw-num\b[^"']*["'][^>]*>[\s\S]*?<\/span>/i,
        ''
      );
      return id ? [id, withoutNumber] : null;
    })
    .filter(Boolean)
);

const failures = [];
if (hindi.length !== english.length) {
  failures.push(`expected ${english.length} Hindi parts, found ${hindi.length}`);
}
hindi.forEach((part, index) => {
  const expected = index + 1;
  if (part.n !== expected) {
    failures.push(`Hindi array position ${expected}: found part ${part.n ?? 'unknown'}`);
  }
});
if (new Set(hindi.map((part) => part.n)).size !== hindi.length) {
  failures.push('Hindi array contains duplicate part numbers');
}

let totalWords = 0;
let totalMinutes = 0;

for (const source of english) {
  const translated = hindi.find((part) => part.n === source.n);
  if (!translated) {
    failures.push(`part ${source.n}: missing`);
    continue;
  }

  const body = `${translated.prologue ?? ''}${translated.html ?? ''}${translated.sources ?? ''}`;

  // The language switch anchors on these ids directly — same ids, same
  // order as English, or a reader switching language mid-section loses
  // their place.
  const sourceTocIds = (source.toc ?? []).map((entry) => entry.id);
  const translatedTocIds = (translated.toc ?? []).map((entry) => entry.id);
  if (JSON.stringify(sourceTocIds) !== JSON.stringify(translatedTocIds)) {
    failures.push(`part ${source.n}: TOC ids or order differ from English`);
  }

  const bodyIds = ids(body);
  const headingsById = h2ById(body);
  for (const entry of translated.toc ?? []) {
    if (!bodyIds.has(entry.id)) {
      failures.push(`part ${source.n}: TOC id "${entry.id}" has no matching heading`);
    } else if (comparableText(headingsById.get(entry.id)) !== comparableText(entry.text)) {
      failures.push(`part ${source.n}: TOC text differs from its own heading "${entry.id}"`);
    }
  }

  // Structural integrity — markup that would mean a genuine extraction bug
  // regardless of how the two editions' prose otherwise differs.
  const emptyTags = body.match(/<(h2|h3|p)(?:\s[^>]*)?>\s*<\/\1>/gi) ?? [];
  if (emptyTags.length) {
    failures.push(`part ${source.n}: ${emptyTags.length} empty tag(s) — ${emptyTags.slice(0, 3).join(', ')}`);
  }
  const boxesWithoutLabel = count(body, /<div class="w-box[^"]*">(?!<span class="w-box-label")/g);
  if (boxesWithoutLabel) failures.push(`part ${source.n}: ${boxesWithoutLabel} box(es) missing their label`);
  const controlChars = [...body].filter((ch) => {
    const c = ch.codePointAt(0);
    return c < 32 && c !== 10 && c !== 13 && c !== 9;
  });
  if (controlChars.length) failures.push(`part ${source.n}: ${controlChars.length} stray control character(s) in output`);

  if (translated.html.length < source.html.length * 0.6) {
    failures.push(
      `part ${source.n}: translated HTML is unusually short (${translated.html.length} vs English's ${source.html.length})`
    );
  }

  const words = wordCount(translated);
  const minutes = Math.max(1, Math.round(words / 180));
  totalWords += words;
  totalMinutes += minutes;
  if (translated.words !== words) {
    failures.push(`part ${source.n}: words metadata ${translated.words}, calculated ${words}`);
  }
  if (translated.minutes !== minutes) {
    failures.push(`part ${source.n}: minutes metadata ${translated.minutes}, calculated ${minutes}`);
  }

  const visible = stripHtml([
    translated.title,
    translated.lead,
    translated.prologue,
    translated.html,
  ].filter(Boolean).join(' '));
  const devanagari = count(visible, /[ऀ-ॿ]/g);
  if (devanagari < 500) failures.push(`part ${source.n}: too little Devanagari text (${devanagari} characters)`);

  const paragraphs = count(body, /<p\b/gi);
  const boxes = count(body, /class="w-box /g) + count(body, /class="w-box"/g);
  console.log(
    `Part ${String(source.n).padStart(2, '0')}  `
    + `${String(words).padStart(5)} words  ${String(minutes).padStart(2)} min  `
    + `${translated.toc?.length ?? 0} sections · ${paragraphs} paragraphs · ${boxes} boxes`
  );
}

console.log(`\nHindi total: ${totalWords.toLocaleString('en-IN')} words · ${totalMinutes} minutes`);

const manifest = getPieceForLanguage('forgotten-gods', 'hi');
if (manifest?.words !== totalWords) {
  failures.push(`manifest: words ${manifest?.words ?? 'missing'}, calculated ${totalWords}`);
}
if (manifest?.minutes !== totalMinutes) {
  failures.push(`manifest: minutes ${manifest?.minutes ?? 'missing'}, calculated ${totalMinutes}`);
}

if (failures.length) {
  console.error(`\nValidation failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('\nHindi validation passed.');
}
