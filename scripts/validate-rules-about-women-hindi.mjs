/** Guard the complete translation, original chapter anchors and verified download. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import english from '../src/data/writing/rules-about-women.js';
import hindi from '../src/data/writing/rules-about-women-hi.js';
import { getPieceForLanguage, writingPathOf } from '../src/data/writing.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const provenance = JSON.parse(read('src/data/writing/rules-about-women-hi-provenance.json'));
const count = (html, tag) => (html.match(new RegExp(`<${tag}\\b`, 'gi')) ?? []).length;
const ids = (html) => [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
const words = (html) => html.replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ').trim().split(/\s+/).filter(Boolean).length;
const coreHtml = (part) => part.n === 16
  ? part.html.split('<section id="rw16-short-version">')[0] : part.html;

assert.equal(english.length, 16);
assert.equal(hindi.length, 16);
let chapters = 0, entries = 0, tables = 0, cells = 0, totalWords = 0, minutes = 0;
for (const [index, source] of english.entries()) {
  const part = hindi[index];
  assert.equal(part.n, source.n);
  assert.equal(part.language, 'hi');
  assert.equal(part.originalPublished, source.published);
  for (const field of ['title', 'lead', 'prologueTitle', 'prologueTag']) {
    assert.match(part[field], /[\u0900-\u097f]/, `Part ${part.n}: ${field} is not Hindi`);
  }
  for (const field of ['prologue', 'html', 'sources']) {
    const original = source[field];
    const translated = field === 'html' ? coreHtml(part) : part[field];
    assert.ok(translated.length >= original.length * 0.65, `Part ${part.n}: ${field} unusually short`);
    for (const tag of ['h2', 'h3', 'h4', 'p', 'li', 'table', 'tr', 'th', 'td']) {
      assert.equal(count(translated, tag), count(original, tag), `Part ${part.n}: ${field} ${tag} loss`);
    }
    assert.deepEqual(ids(translated), ids(original), `Part ${part.n}: ${field} anchors changed`);
    tables += count(translated, 'table');
    cells += count(translated, 'td') + count(translated, 'th');
  }
  const body = part.prologue + part.html + part.sources;
  const allIds = ids(body);
  assert.equal(new Set(allIds).size, allIds.length, `Part ${part.n}: duplicate anchors`);
  assert.deepEqual(part.toc.slice(0, source.toc.length).map((x) => x.id), source.toc.map((x) => x.id));
  assert.equal(part.toc.length, source.toc.length + (part.n === 16 ? 1 : 0));
  for (const entry of part.toc) {
    assert.ok(allIds.includes(entry.id), `Part ${part.n}: missing TOC anchor ${entry.id}`);
    assert.match(entry.text, /[\u0900-\u097f]/);
  }
  assert.doesNotMatch(body, /⁇|\uFFFD|⟦अधूरा|(?:महान-){6,}/u);
  assert.doesNotMatch(body.replace(/<[^>]*>/g, ' '), /([\p{L}\p{M}-]+)(?:\s+\1){4,}/gu, `Part ${part.n}: repeated-word loop`);
  assert.doesNotMatch(body, /<(?:script|iframe)\b|\bon(?:load|error|click)\s*=/i);
  assert.doesNotMatch(body, /<(h2|h3|p)(?:\s[^>]*)?>\s*<\/\1>/i);
  const calculated = words(part.prologue + ' ' + part.html);
  assert.equal(part.words, calculated, `Part ${part.n}: word count`);
  assert.ok(Math.abs(part.minutes - calculated / 200) <= 0.5, `Part ${part.n}: reading time`);
  chapters += source.toc.length; entries += part.toc.length;
  totalWords += part.words; minutes += part.minutes;
}
assert.equal(chapters, 166);
assert.equal(entries, 167);
assert.equal(tables, 53);
assert.equal(cells, 1808);
assert.ok(hindi[15].html.includes('rw16-short-version'));
assert.equal(provenance.parts, 16);
assert.equal(provenance.originalChapterEntries, chapters);
assert.equal(provenance.hindiChapterEntries, entries);
assert.equal(provenance.tables, tables);
assert.equal(provenance.tableCells, cells);
assert.equal(provenance.sourceFiles.length, 16);
assert.equal(provenance.hindiPdf.renderedPages, provenance.hindiPdf.pages);
// Git checks this text out with CRLF on Windows and LF on the Pages server.
// Only line endings are normalized; every source character remains checked.
assert.equal(hash(read('src/data/writing/rules-about-women.js').toString('utf8').replace(/\r\n/g, '\n')), provenance.englishDataSha256);
assert.equal(hash(read('public/rules-about-women.pdf')), provenance.englishPdfSha256);
assert.equal(provenance.englishPdfSha256, 'db51fb80df09da77b3bc5122e3de93053803b43d88acbf0a98967c576202234e');
const pdf = read('public/' + provenance.hindiPdf.file);
assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
assert.equal(pdf.length, provenance.hindiPdf.bytes);
assert.equal(hash(pdf), provenance.hindiPdf.sha256);
const piece = getPieceForLanguage('rules-about-women', 'hi');
assert.equal(piece.words, totalWords);
assert.equal(piece.minutes, minutes);
assert.equal(piece.pdf, provenance.hindiPdf.file);
assert.ok(piece.pdfLabel.includes(String(provenance.hindiPdf.pages)));
assert.equal(writingPathOf(piece), '/hi/writing/rules-about-women');
assert.equal(writingPathOf(piece, 13), '/hi/writing/rules-about-women/part-13');
console.log(`Hindi women book verified: 16 parts, ${chapters} original chapters + short appendix, ${tables} tables, ${cells} cells, ${totalWords} words; ${provenance.hindiPdf.pages}-page download matches its SHA-256.`);
