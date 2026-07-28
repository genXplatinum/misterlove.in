/**
 * import-patriarchy-feminism.mjs
 *
 * One-shot importer for "Patriarchy & Feminism — Part 1: The Ground Rules".
 * The authored LaTeX source did not survive, so this recovers the web article
 * from the final PDF's typography, in the same way the other PDF-only writing
 * importers in this repository do.
 *
 * The PDF has a stable vocabulary:
 *   - 22.9 pt chapter titles
 *   - 13 pt numbered sections
 *   - 10.9 pt body copy
 *   - 10 pt subheads
 *   - 9.6 pt callout copy under 8.2 pt labels
 *   - 8.9–9.2 pt source lists and tables
 *
 * Footnote markers and the repeated page-bottom notes are deliberately omitted
 * from the web prose. The complete bibliography is recovered from the PDF's
 * grouped Sources section, while the downloadable PDF preserves every inline
 * footnote exactly where the author placed it.
 *
 * Usage:
 *   node scripts/import-patriarchy-feminism.mjs
 *   node scripts/import-patriarchy-feminism.mjs "<path to PDF>"
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const SRC = process.argv[2]
  ?? 'C:/Users/rajpa/Documents/books/Patriarchy & Feminism/Part 1 - The Ground Rules.pdf';
const OUT = 'src/data/writing/patriarchy-feminism.js';

const round = (n) => Math.round(n * 10) / 10;
const near = (n, target, tolerance = 0.25) => Math.abs(n - target) <= tolerance;
const clean = (s) => s
  .replace(/\u00ad/g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s+([,.;:!?])/g, '$1')
  .replace(/([.!?])([A-Z“])/g, '$1 $2')
  .replace(/([a-z0-9)\]])([“])/g, '$1 $2')
  .replace(/([”])([A-Za-z0-9])/g, '$1 $2')
  .replace(/(\d(?:\.\d+)+)([A-Z])/g, '$1 $2')
  .replace(/\b(SOLID|CONTESTED|FALSE AS STATED|VALUE JUDGEMENT)(?=[A-Za-z])/g, '$1 ')
  .replace(/\bSourcessection\b/g, 'Sources section')
  .trim();
const esc = (s) => clean(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
const slugify = (s) => s
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .slice(0, 72);

const PRESERVED_HYPHENATED_LINE_BREAKS = new Set([
  'age-matched',
  'and-assault',
  'achievement-strength',
  'by-case',
  'co-authors',
  'college-educated',
  'english-language',
  'equal-opportunity',
  'gender-based',
  'gender-equality',
  'gender-heterodox',
  'intra-feminist',
  'most-quoted',
  'party-affiliated',
  'property-qualified',
  'proto-feminist',
  'self-description',
  'sex-positive',
  'single-axis',
  'statutory-interpretation',
]);

function glue(a, b) {
  const left = clean(a);
  const right = clean(b);
  if (!left) return right;
  if (!right) return left;
  // A line-ending hyphen in this typeset PDF is a discretionary wrap.
  if (/[-‐]\s*$/.test(left) && /^[a-z]/.test(right)) {
    const leftWord = left.match(/([A-Za-z]+)[-‐]\s*$/)?.[1].toLowerCase();
    const rightWord = right.match(/^([a-z]+)/)?.[1].toLowerCase();
    if (PRESERVED_HYPHENATED_LINE_BREAKS.has(`${leftWord}-${rightWord}`)) {
      return left + right;
    }
    return left.replace(/[-‐]\s*$/, '') + right;
  }
  if (/^[,.;:!?)}\]]/.test(right)) return left + right;
  return `${left} ${right}`;
}

function joinItems(items) {
  let text = '';
  let end = null;

  for (const item of items) {
    const value = item.str;
    if (!value) continue;
    const gap = end === null ? 0 : item.transform[4] - end;
    if (
      text
      && !/\s$/.test(text)
      && !/^\s/.test(value)
      && gap > 1.2
    ) {
      text += ' ';
    }
    text += value;
    end = item.transform[4] + (item.width ?? 0);
  }

  return clean(text);
}

function splitCells(items) {
  const cells = [];
  let current = [];
  let end = null;

  for (const item of items) {
    if (end !== null && item.transform[4] - end > 3.5 && current.some((x) => x.str.trim())) {
      cells.push({
        x: current.find((x) => x.str.trim())?.transform[4] ?? current[0].transform[4],
        text: joinItems(current),
      });
      current = [];
    }
    current.push(item);
    end = item.transform[4] + (item.width ?? 0);
  }

  if (current.some((x) => x.str.trim())) {
    cells.push({
      x: current.find((x) => x.str.trim())?.transform[4] ?? current[0].transform[4],
      text: joinItems(current),
    });
  }

  return cells.filter((cell) => cell.text);
}

async function readPdf(file) {
  const document = await getDocument({
    data: new Uint8Array(readFileSync(file)),
    useSystemFonts: true,
  }).promise;
  const lines = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const rows = new Map();

    for (const item of (await page.getTextContent()).items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const key = [...rows.keys()].find((candidate) => Math.abs(candidate - y) <= 2) ?? y;
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(item);
    }

    for (const [y, items] of [...rows.entries()].sort((a, b) => b[0] - a[0])) {
      items.sort((a, b) => a.transform[4] - b.transform[4]);
      const nonblank = items.filter((item) => item.str.trim());
      const cells = splitCells(items);
      const size = round(Math.max(...nonblank.map((item) => Math.abs(item.transform[0]))));
      lines.push({
        page: pageNumber,
        y,
        x: Math.min(...nonblank.map((item) => item.transform[4])),
        size,
        text: clean(cells.map((cell) => cell.text).join(' ')),
        cells,
        fontNames: [...new Set(nonblank.map((item) => item.fontName))],
        fragments: nonblank.map((item) => ({
          x: item.transform[4],
          text: clean(item.str),
        })).filter((item) => item.text),
      });
    }
  }

  return { document, lines };
}

const BOX_TONES = [
  [/SIMPLEST WORDS|PLAIN WORDS/, 'simple'],
  [/REMEMBER THIS|TAKEAWAY/, 'remember'],
  [/GENUINELY DISPUTED|COUNTERPOINT|LIMITS? OF/, 'weigh'],
  [/CORRECTION|CAUTION|PROBLEM|WARNING/, 'worry'],
  [/WHY THIS MATTERS|WHAT THIS MEANS|WHAT FOLLOWS/, 'aim'],
  [/CLAIM|ARGUMENT|CASE FOR|CASE AGAINST/, 'arg'],
  [/VERDICT|ANSWER|CONCLUSION/, 'answer'],
  [/NUMBER|FIGURE|DATA/, 'number'],
];

function boxTone(label) {
  const upper = label.toUpperCase();
  return BOX_TONES.find(([pattern]) => pattern.test(upper))?.[1] ?? 'key';
}

function isBoxLabel(line) {
  const letters = line.text.replace(/[^A-Za-z]/g, '');
  return line.x >= 78
    && line.x <= 100
    && line.size >= 7.8
    && line.size <= 8.5
    && letters.length >= 4
    && line.text === line.text.toUpperCase()
    && !/^CHAPTER\b/.test(line.text);
}

function hasWideCells(line) {
  if (line.cells.length < 2) return false;
  return line.cells.some((cell, index) => (
    index > 0 && cell.x - line.cells[index - 1].x > 35
  ));
}

function isTableHeader(line) {
  const compactLabels = line.text.length <= 100
    && line.cells.every((cell) => cell.text.length <= 60);
  return line.size >= 8.2
    && line.size <= 8.6
    && line.y > 160
    && (line.x <= 80 || compactLabels)
    && line.fontNames.length === 1
    && hasWideCells(line);
}

function isTableLine(line, tableOpen) {
  const tableSize = line.size >= 8.7 && line.size <= 9.4;
  if (!(tableSize || isTableHeader(line))) return false;
  if (hasWideCells(line)) return true;
  return Boolean(tableOpen && tableSize && line.cells.length === 1 && line.x >= 70);
}

function isBullet(line) {
  return /^[•·]\s*/.test(line.text);
}

function createCollector({ chapterToc = false } = {}) {
  const blocks = [];
  const toc = [];
  let paragraph = null;
  let list = null;
  let box = null;
  let quote = null;
  let table = null;
  let pendingChapter = null;

  const flushParagraph = () => {
    if (paragraph?.text) blocks.push({ type: 'p', text: paragraph.text });
    paragraph = null;
  };
  const flushList = () => {
    if (list?.items.length) blocks.push({ type: 'ul', items: list.items });
    list = null;
  };
  const flushBox = () => {
    if (box) {
      const paragraphs = box.paragraphs.filter(Boolean);
      if (box.current) paragraphs.push(box.current);
      blocks.push({
        type: 'box',
        label: box.label,
        tone: boxTone(box.label),
        paragraphs,
      });
    }
    box = null;
  };
  const flushQuote = () => {
    if (quote?.text) blocks.push({ type: 'quote', text: quote.text });
    quote = null;
  };
  const flushTable = () => {
    if (table?.rows.length) blocks.push({ type: 'table', ...table });
    table = null;
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushBox();
    flushQuote();
    flushTable();
  };

  const addParagraphLine = (line) => {
    flushList();
    flushBox();
    flushQuote();
    flushTable();

    if (!paragraph) {
      paragraph = { text: line.text, page: line.page, y: line.y };
      return;
    }

    const samePage = paragraph.page === line.page;
    const gap = samePage ? paragraph.y - line.y : null;
    const ended = /[.!?…”"')\]]$/.test(paragraph.text);
    const startsNew = samePage ? gap > 18 : ended;

    if (startsNew) {
      flushParagraph();
      paragraph = { text: line.text, page: line.page, y: line.y };
    } else {
      paragraph.text = glue(paragraph.text, line.text);
      paragraph.page = line.page;
      paragraph.y = line.y;
    }
  };

  const addBoxLine = (line) => {
    flushParagraph();
    flushList();
    flushQuote();
    flushTable();

    if (!box) return false;
    const samePage = box.page === line.page;
    const gap = samePage ? box.y - line.y : 14;
    if (gap > 18 && box.current) {
      box.paragraphs.push(box.current);
      box.current = line.text;
    } else {
      box.current = glue(box.current, line.text);
    }
    box.page = line.page;
    box.y = line.y;
    return true;
  };

  const addQuoteLine = (line) => {
    flushParagraph();
    flushList();
    flushBox();
    flushTable();
    if (!quote) quote = { text: '', page: line.page, y: line.y };
    quote.text = glue(quote.text, line.text);
    quote.page = line.page;
    quote.y = line.y;
  };

  const addTableLine = (line) => {
    flushParagraph();
    flushList();
    flushBox();
    flushQuote();

    if (!table) {
      const hasBlankLeadingHeader = isTableHeader(line) && line.x > 100;
      table = {
        columns: [
          ...(hasBlankLeadingHeader ? [71.7] : []),
          ...line.cells.map((cell) => cell.x),
        ],
        rows: [],
        firstRowHeader: isTableHeader(line),
        lastPage: line.page,
        lastY: line.y,
      };
    }

    const values = Array.from({ length: table.columns.length }, () => '');
    for (const cell of line.cells) {
      // The table's status text is right-aligned, so its x coordinate begins
      // slightly before the header label. Group nearby PDF fragments first,
      // then map each group to the closest header anchor.
      let index = 0;
      let distance = Infinity;
      table.columns.forEach((column, candidate) => {
        const candidateDistance = Math.abs(column - cell.x);
        if (candidateDistance < distance) {
          index = candidate;
          distance = candidateDistance;
        }
      });
      values[index] = glue(values[index], cell.text);
    }

    const firstCellIndex = values.findIndex(Boolean);
    const firstText = values[firstCellIndex] ?? '';
    const previous = table.rows.at(-1);
    const samePage = table.lastPage === line.page;
    const lineGap = samePage ? table.lastY - line.y : null;
    const repeatedHeader = Boolean(
      !samePage
      && table.firstRowHeader
      && isTableHeader(line)
    );
    const wrappedFirstColumn = Boolean(
      previous
      && firstCellIndex === 0
      && (
        /^[a-z”’)\]]/.test(firstText)
        || /[-‐]$/.test(previous[0] ?? '')
      )
    );
    const wrappedByLayout = Boolean(
      previous
      && samePage
      && lineGap > 0
      && lineGap <= 14
    );
    if (repeatedHeader) {
      // Long tables repeat their header at the top of the next PDF page.
    } else if ((firstCellIndex > 0 || wrappedFirstColumn || wrappedByLayout) && previous) {
      values.forEach((value, index) => {
        if (value) previous[index] = glue(previous[index], value);
      });
    } else {
      table.rows.push(values);
    }
    table.lastPage = line.page;
    table.lastY = line.y;
  };

  const addLine = (line, mode = 'main') => {
    if (!line.text || line.y > 770 || line.y < 52) return;
    if (/^PART ONE\b|^PATRIARCHY: THE WORD$|^SOURCES$/.test(line.text) && line.size < 9) return;

    if (/^CHAPTER\s+\d+$/i.test(line.text)) {
      pendingChapter = Number(line.text.match(/\d+/)[0]);
      flushAll();
      return;
    }

    if (isBoxLabel(line)) {
      flushAll();
      box = {
        label: line.text,
        paragraphs: [],
        current: '',
        page: line.page,
        y: line.y,
      };
      return;
    }

    if (box && near(line.size, 9.6, 0.35) && line.x >= 78) {
      addBoxLine(line);
      return;
    }

    if (mode === 'main' && line.size >= 20) {
      flushAll();
      const last = blocks.at(-1);
      if (last?.type === 'chapter' && last.page === line.page && last.y - line.y <= 35) {
        last.title = glue(last.title, line.text);
        const entry = toc.find((item) => item.num === String(last.number));
        if (entry) {
          entry.text = last.title;
          entry.id = `pf1-${last.number}-${slugify(last.title)}`;
          last.id = entry.id;
        }
        last.y = line.y;
        return;
      }

      const number = pendingChapter ?? toc.length + 1;
      const id = `pf1-${number}-${slugify(line.text)}`;
      blocks.push({
        type: 'chapter',
        number,
        title: line.text,
        id,
        page: line.page,
        y: line.y,
      });
      if (chapterToc) toc.push({ id, num: String(number), text: line.text });
      pendingChapter = null;
      return;
    }

    if (mode === 'main' && line.size >= 12.5 && line.size <= 13.4) {
      flushAll();
      const last = blocks.at(-1);
      if (last?.type === 'section' && last.page === line.page && last.y - line.y <= 25) {
        last.text = glue(last.text, line.text);
        last.y = line.y;
      } else {
        blocks.push({ type: 'section', text: line.text, page: line.page, y: line.y });
      }
      return;
    }

    if (
      mode === 'sources'
      && line.size >= 11.5
      && line.size <= 13.2
      && /^Chapters?\b/i.test(line.text)
    ) {
      flushAll();
      blocks.push({ type: 'section', text: line.text, page: line.page, y: line.y });
      return;
    }

    if (mode === 'front' && line.size >= 18) {
      flushAll();
      if (!/^Author[’']s note$/i.test(line.text)) {
        blocks.push({ type: 'section', text: line.text, page: line.page, y: line.y });
      }
      return;
    }

    if (
      mode !== 'sources'
      && line.size >= 9.7
      && line.size <= 10.3
      && line.x <= 76
    ) {
      flushAll();
      blocks.push({ type: 'subhead', text: line.text });
      return;
    }

    if (
      mode === 'main'
      && line.size >= 10.6
      && line.size <= 11
      && /^\d+\.\d+\.\d+\b/.test(line.text)
    ) {
      flushAll();
      blocks.push({ type: 'subhead', text: line.text });
      return;
    }

    if (line.size >= 10 && line.size <= 10.4 && line.x >= 78) {
      addQuoteLine(line);
      return;
    }

    if (isBullet(line)) {
      flushParagraph();
      flushBox();
      flushQuote();
      flushTable();
      if (!list) list = { items: [], page: line.page, y: line.y };
      list.items.push(line.text.replace(/^[•·]\s*/, ''));
      list.page = line.page;
      list.y = line.y;
      return;
    }

    if (list && line.size >= 8.8 && line.size <= 11.2 && line.x >= 80) {
      list.items[list.items.length - 1] = glue(list.items.at(-1), line.text);
      list.page = line.page;
      list.y = line.y;
      return;
    }

    if (isTableLine(line, Boolean(table))) {
      addTableLine(line);
      return;
    }

    // Repeated inline footnotes are 8.4 pt and reference markers 5.9–8 pt.
    // The full grouped bibliography is parsed from pages 95–103 instead.
    if (mode === 'main' && line.size <= 8.6) return;

    if (mode === 'sources' && line.size >= 8.7 && line.size <= 9.8) {
      addParagraphLine(line);
      return;
    }

    if (line.size >= 10.5 && line.size <= 11.2) {
      addParagraphLine(line);
    }
  };

  return {
    blocks,
    toc,
    addLine,
    finish: flushAll,
  };
}

function blocksToHtml(blocks) {
  return blocks.map((block) => {
    switch (block.type) {
      case 'p':
        return `<p>${esc(block.text)}</p>`;
      case 'subhead':
        return `<h3 class="w-h3">${esc(block.text)}</h3>`;
      case 'section':
        return `<h3 class="w-h3">${esc(block.text)}</h3>`;
      case 'chapter':
        return `<h2 class="w-h2" id="${block.id}"><span class="w-num">${block.number}</span>${esc(block.title)}</h2>`;
      case 'ul':
        return `<ul>${block.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
      case 'quote':
        return `<div class="w-pullquote">${esc(block.text)}</div>`;
      case 'box': {
        const copy = block.paragraphs.length
          ? block.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')
          : '<p></p>';
        return `<div class="w-box w-box--${block.tone}"><span class="w-box-label">${esc(block.label)}</span>${copy}</div>`;
      }
      case 'table': {
        const [first, ...rest] = block.rows;
        const head = block.firstRowHeader && first
          ? `<thead><tr>${first.map((cell) => `<th>${esc(cell)}</th>`).join('')}</tr></thead>`
          : '';
        const rows = block.firstRowHeader ? rest : block.rows;
        return `<figure class="w-figure"><div class="w-table-scroll"><table class="w-table">${head}<tbody>${rows
          .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div></figure>`;
      }
      default:
        return '';
    }
  }).join('');
}

function parseRange(lines, pages, options) {
  const collector = createCollector(options);
  let previousPage = null;
  for (const line of lines.filter((candidate) => pages.has(candidate.page))) {
    if (previousPage !== null && line.page > previousPage + 1) collector.finish();
    collector.addLine(line, options?.mode ?? 'main');
    previousPage = line.page;
  }
  collector.finish();
  return collector;
}

const { document, lines } = await readPdf(SRC);

if (document.numPages !== 103) {
  throw new Error(`Expected the 103-page final PDF; found ${document.numPages} pages.`);
}

// Pages 2–4 are the author's note and series statement. Pages 8–9 explain
// the report's callouts, confidence tags and sourcing conventions.
const frontPages = new Set([2, 3, 4, 8, 9]);
const front = parseRange(lines, frontPages, { mode: 'front' });
// The reader component supplies this heading, so do not repeat it in the prose.
if (front.blocks[0]?.type === 'p' && /^Author[’']s note$/i.test(front.blocks[0].text)) {
  front.blocks.shift();
}

const mainPages = new Set(Array.from({ length: 85 }, (_, index) => index + 10));
const main = parseRange(lines, mainPages, { mode: 'main', chapterToc: true });

const sourcePages = new Set(Array.from({ length: 9 }, (_, index) => index + 95));
const sourceCollector = parseRange(lines, sourcePages, { mode: 'sources' });

const prologue = blocksToHtml(front.blocks)
  .replace(/^<p>Author[’']s note<\/p>/i, '');
const html = blocksToHtml(main.blocks);
const sources = blocksToHtml(sourceCollector.blocks)
  .replace(/^<p>REFERENCE<\/p>/i, '')
  .replace(/^<p>Sources<\/p>/i, '');

const strip = (markup) => markup
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z0-9#]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const words = strip(`${prologue} ${html}`).split(/\s+/).filter(Boolean).length;

if (main.toc.length !== 10) {
  throw new Error(`Expected 10 chapter entries; generated ${main.toc.length}.`);
}
if (words < 25_000) {
  throw new Error(`Imported prose is unexpectedly short (${words} words).`);
}
if (!/Chapters 8.?9/i.test(strip(sources))) {
  throw new Error('The grouped Sources section did not reach the final research chapters.');
}

const part = {
  n: 1,
  label: 'Definitions & Method',
  title: 'The Ground Rules',
  lead: 'What the words actually mean, who believes what, and the fourteen ways this argument goes wrong.',
  words,
  minutes: Math.max(1, Math.round(words / 220)),
  toc: main.toc,
  prologue,
  prologueTitle: "Author's Note",
  prologueTag: 'An evidence-led, all-sides explanatory report · July 2026',
  html,
  sources,
};

const output = `/* ============================================================
   PATRIARCHY & FEMINISM — PART 1: THE GROUND RULES
   Generated by scripts/import-patriarchy-feminism.mjs from the
   authored final PDF. Do not hand-edit: re-run the importer.

   1 published part · ${words.toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify([part], null, 2)};

export default parts;
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, output, 'utf8');

console.log(`✓ ${OUT}`);
console.log(`  ${words.toLocaleString('en-IN')} words · ${part.minutes} min · ${main.toc.length} chapters`);
console.log(`  ${strip(sources).split(/\s+/).filter(Boolean).length.toLocaleString('en-IN')} source words`);
