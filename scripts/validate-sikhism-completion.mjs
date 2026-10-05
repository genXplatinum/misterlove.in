import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import parts from '../src/data/writing/debunked-sikhism.js';
import { getPiece, isInProgress, pdfForPart } from '../src/data/writing.js';

const piece = getPiece('debunked-sikhism');
const originals = JSON.parse(readFileSync('content/debunked-sikhism/original-parts-1-3.json', 'utf8'));
assert.equal(parts.length, 13);
assert.equal(piece.live, 13);
assert.equal(piece.status, 'Complete');
assert.equal(isInProgress(piece), false);
assert.equal(piece.words, parts.reduce((sum, p) => sum + p.words, 0));
assert.equal(piece.minutes, parts.reduce((sum, p) => sum + p.minutes, 0));
for (const [index, part] of parts.entries()) {
  assert.equal(part.n, index + 1);
  assert.equal(part.toc.length, 11);
  assert.equal((part.html.match(/w-box--claim/g) ?? []).length, 10);
  assert.equal((part.html.match(/class="w-step"/g) ?? []).length, 50);
  assert.ok(part.words >= 6000);
  assert.ok(part.prologue.includes('w-pullquote'));
  assert.ok(part.sources);
  assert.ok(!/\[READ:|\uFFFD|\[object Object\]/.test(part.html), `Part ${part.n} has an unresolved import marker`);
  const ids = [...part.html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const entry of part.toc) assert.ok(ids.includes(entry.id));
  assert.equal(pdfForPart(piece, part).file, 'debunked-sikhism.pdf');
  if (index < 3) {
    assert.equal(part.html, originals[index].html, 'Original main text must be preserved');
    assert.equal(part.sources, originals[index].sources);
    assert.equal(part.published, originals[index].published);
    assert.ok(part.prologue.endsWith(originals[index].prologue));
    assert.ok(part.prologue.includes('Complete-edition editorial note'));
  } else {
    assert.equal(part.published, '2026-10-05');
    assert.equal(part.displayDate, '5 October 2026');
    assert.ok(part.sources.includes('Research check: 5 October 2026'));
    assert.ok(!/w-verdict|w-sides/.test(part.html));
    assert.ok(!/href="(?:javascript:|http:)/.test(part.html));
  }
}
const master = await PDFDocument.load(readFileSync('public/debunked-sikhism.pdf'));
assert.equal(master.getPageCount(), 268);
const archive = readFileSync('public/debunked-sikhism-parts-1-3.pdf');
const hash = createHash('sha256').update(archive).digest('hex');
assert.equal(hash, 'c61d208cd6817ddbe466328c9112d8efa4948ea5ae696148c4da20fd83d6ba35');
assert.equal((await PDFDocument.load(archive)).getPageCount(), 78);
console.log(`Sikhism complete: 13 parts, 130 claims, 650 steps, ${piece.words} words, 268-page master; original text and archive preserved.`);
