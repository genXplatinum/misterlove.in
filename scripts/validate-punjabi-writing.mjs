import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { getPieceForLanguage, writingEditionsOf, writingPathOf, writingTranslationMeta, writingLanguageFromPath } from '../src/data/writing.js';
import { pageSurfaceForPath } from '../src/pageSurface.js';

const slug = 'why-i-dont-believe';
const pa = getPieceForLanguage(slug, 'pa');
const parts = (await pa.load()).default;
assert.equal(pa.language, 'pa'); assert.equal(pa.locale, 'pa_IN');
assert.equal(pa.parts, 28); assert.equal(pa.live, parts.length); assert.ok(parts.length >= 1);
assert.equal(writingPathOf(pa, 1), `/pa/writing/${slug}/part-1`);
assert.equal(writingLanguageFromPath(`/pa/writing/${slug}/part-1`), 'pa');
assert.equal(pageSurfaceForPath(`/pa/writing/${slug}/part-1/`), 'page-reader');
assert.deepEqual(writingEditionsOf(pa, 1).map((p) => p.language), ['en', 'hi', 'pa']);
if (pa.live < pa.parts) assert.ok(!writingEditionsOf(pa, pa.live + 1).some((p) => p.language === 'pa'), 'Do not advertise an unwritten Punjabi part');
for (const language of ['en', 'hi']) {
  const edition = getPieceForLanguage(slug, language);
  assert.equal((await edition.load()).default.length, 28);
  assert.equal(writingPathOf(edition, 1), `${language === 'hi' ? '/hi' : ''}/writing/${slug}/part-1`);
  const relationships = writingTranslationMeta(edition, 1);
  assert.ok(language !== 'en' || relationships.workTranslation.some((work) => work.inLanguage === 'pa'));
}
for (const [i, part] of parts.entries()) {
  assert.equal(part.n, i + 1);
  const ids = [...part.html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size, 'Duplicate article IDs');
  for (const chapter of part.toc) assert.ok(ids.includes(chapter.id));
  for (const match of part.html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), 'Unresolved source link');
  assert.ok(!/[\u0900-\u0963\u0966-\u097f\ufffd\u25a1]/u.test(part.html), 'Wrong script or missing character');
  assert.ok(!/As an AI|\bTODO\b|\bTBD\b|INSERT HERE/i.test(part.html));
  assert.ok(existsSync(`public/${part.pdf}`));
}
const first = parts[0];
assert.equal(first.toc.length, 27);
assert.equal([...first.html.matchAll(/id="wid-p1-source-\d+"/g)].length, 9);
assert.ok(first.html.includes('part-1-firas-spectrum-pa.png'));
const pdfHash = createHash('sha256').update(readFileSync(`public/${first.pdf}`)).digest('hex');
assert.equal(pdfHash, 'a0d6d913c9d66e0a3018c97b667beea39dbeda5232ae4309dfbb08c7e1feda0e', 'Publish the checked PDF unchanged');
assert.ok(existsSync('public/fonts/NotoSerifGurmukhi-Variable.ttf'));
assert.ok(existsSync('public/fonts/NotoSerifGurmukhi-OFL.txt'));
console.log(`Punjabi writing validated: ${parts.length}/28 parts, reciprocal available languages, source anchors and original PDF hash.`);
