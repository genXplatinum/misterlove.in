import english from '../src/data/writing/kissan-andolan.js';
import hindi from '../src/data/writing/kissan-andolan-hi.js';
import { getPieceForLanguage } from '../src/data/writing.js';

const count = (text, pattern) => (String(text ?? '').match(pattern) ?? []).length;
const classCount = (text, className, tag = '[a-z0-9]+') => [
  ...String(text ?? '').matchAll(new RegExp(`<${tag}\\b[^>]*class=["']([^"']*)["']`, 'gi')),
].filter((match) => match[1].split(/\s+/).includes(className)).length;
const sourceItems = (text) => count(text, /<li\b/gi);
const ids = (text) => new Set(
  [...String(text ?? '').matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1])
);
const attributeValues = (text, name) => [
  ...String(text ?? '').matchAll(new RegExp(`\\b${name}=["']([^"']+)["']`, 'gi')),
].map((match) => match[1]);
const tagSequence = (text) => [
  ...String(text ?? '').matchAll(/<(\/?)([a-z0-9]+)\b[^>]*>/gi),
]
  .map((match) => `${match[1]}${match[2].toLowerCase()}`);
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

const metrics = (part) => {
  const body = `${part.prologue ?? ''}${part.html ?? ''}`;
  return {
    toc: part.toc?.length ?? 0,
    headings: count(body, /<h2\b/gi),
    paragraphs: count(body, /<p\b/gi),
    boxes: classCount(body, 'w-box', 'div'),
    boxLabels: classCount(body, 'w-box-label'),
    tables: count(body, /<table\b/gi),
    tableRows: count(body, /<tr\b/gi),
    tableHeaders: count(body, /<th\b/gi),
    tableCells: count(body, /<td\b/gi),
    listItems: count(body, /<li\b/gi),
    timelines: classCount(body, 'w-timeline'),
    timelineItems: classCount(body, 'w-tl-item'),
    journeys: classCount(body, 'w-journey'),
    journeySteps: classCount(body, 'w-j-step'),
    pullquotes: classCount(body, 'w-pullquote'),
    takeaways: classCount(body, 'w-takeaways'),
    footnotes: classCount(body, 'w-fn'),
    citations: classCount(body, 'w-cite', 'a'),
    links: count(body, /<a\b/gi),
    authorNotes: classCount(body, 'w-authnote'),
    signatures: classCount(body, 'w-sign'),
    dedications: classCount(body, 'w-dedication'),
    sourceItems: sourceItems(part.sources),
  };
};

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

  const sourceMetrics = metrics(source);
  const translatedMetrics = metrics(translated);
  for (const key of Object.keys(sourceMetrics)) {
    if (sourceMetrics[key] !== translatedMetrics[key]) {
      failures.push(
        `part ${source.n}: ${key} ${translatedMetrics[key]} (expected ${sourceMetrics[key]})`
      );
    }
  }

  const sourceBody = `${source.prologue ?? ''}${source.html ?? ''}${source.sources ?? ''}`;
  const translatedBody = `${translated.prologue ?? ''}${translated.html ?? ''}${translated.sources ?? ''}`;
  const sourceTocIds = (source.toc ?? []).map((entry) => entry.id);
  const translatedTocIds = (translated.toc ?? []).map((entry) => entry.id);
  if (JSON.stringify(sourceTocIds) !== JSON.stringify(translatedTocIds)) {
    failures.push(`part ${source.n}: TOC ids or order differ from English`);
  }
  if (JSON.stringify(tagSequence(sourceBody)) !== JSON.stringify(tagSequence(translatedBody))) {
    failures.push(`part ${source.n}: HTML tag sequence differs from English`);
  }
  if (
    JSON.stringify(attributeValues(sourceBody, 'class'))
    !== JSON.stringify(attributeValues(translatedBody, 'class'))
  ) {
    failures.push(`part ${source.n}: HTML class sequence differs from English`);
  }
  if (
    JSON.stringify(attributeValues(sourceBody, 'id'))
    !== JSON.stringify(attributeValues(translatedBody, 'id'))
  ) {
    failures.push(`part ${source.n}: HTML id sequence differs from English`);
  }
  if (
    JSON.stringify(attributeValues(sourceBody, 'href'))
    !== JSON.stringify(attributeValues(translatedBody, 'href'))
  ) {
    failures.push(`part ${source.n}: citation/link URLs differ from English`);
  }

  const translatedIds = ids(`${translated.prologue ?? ''}${translated.html ?? ''}`);
  const translatedHeadings = h2ById(`${translated.prologue ?? ''}${translated.html ?? ''}`);
  for (const entry of translated.toc ?? []) {
    if (!translatedIds.has(entry.id)) {
      failures.push(`part ${source.n}: TOC id "${entry.id}" has no matching heading`);
    } else if (comparableText(translatedHeadings.get(entry.id)) !== comparableText(entry.text)) {
      failures.push(`part ${source.n}: TOC text differs from heading "${entry.id}"`);
    }
  }

  if (translated.html.length < source.html.length * 0.45) {
    failures.push(
      `part ${source.n}: translated HTML is unusually short (${translated.html.length} vs ${source.html.length})`
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
  const devanagari = count(visible, /[\u0900-\u097f]/g);
  if (devanagari < 500) failures.push(`part ${source.n}: too little Devanagari text (${devanagari} characters)`);

  console.log(
    `Part ${String(source.n).padStart(2, '0')}  `
    + `${String(words).padStart(5)} words  ${String(minutes).padStart(2)} min  `
    + `${translatedMetrics.headings} sections · ${translatedMetrics.boxes} boxes · `
    + `${translatedMetrics.tables} tables · ${translatedMetrics.sourceItems} sources`
  );
}

console.log(`\nHindi total: ${totalWords.toLocaleString('en-IN')} words · ${totalMinutes} minutes`);

const manifest = getPieceForLanguage('kissan-andolan', 'hi');
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
  console.log('\nHindi structural validation passed.');
}
