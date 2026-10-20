import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { readerCollections, summaryOf } from './reader-chunks.mjs';

const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
const collections = await readerCollections();
const results = [];
let checkedParts = 0;
for (const [key, parts] of collections) {
  const entry = manifest[`virtual:reader:${key}`];
  assert.ok(entry, `Missing contents chunk: ${key}`);
  const contents = await import(pathToFileURL(resolve('dist', entry.file)));
  assert.deepEqual(contents.contents, parts.map(summaryOf), `Contents metadata changed: ${key}`);
  const originalGzip = gzipSync(Buffer.from(JSON.stringify(parts))).length;
  for (const part of parts) {
    const partKey = key.startsWith('writing:') ? part.n : part.slug;
    const partEntry = manifest[`virtual:reader:${key}:${partKey}`];
    assert.ok(partEntry, `Missing part chunk: ${key}:${partKey}`);
    const chunk = await import(pathToFileURL(resolve('dist', partEntry.file)));
    assert.deepEqual(chunk.default, part, `Delivered manuscript differs: ${key}:${partKey}`);
    checkedParts++;
    results.push({ key, part: partKey, collectionGzip: originalGzip,
      selectedGzip: gzipSync(readFileSync(`dist/${partEntry.file}`)).length });
  }
}
const representative = [
  ['/', ['src/App.jsx', 'src/pages/ClassicHome.jsx']],
  ['/white/', ['src/white/WhiteApp.jsx']],
  ['/press/', ['src/App.jsx', 'src/pages/Press.jsx']],
  ['/white/press/', ['src/white/WhiteApp.jsx', 'src/pages/Press.jsx']],
  ['/white/writing/why-i-dont-believe/part-1/', [
    'virtual:reader:writing:en:why-i-dont-believe', 'virtual:reader:writing:en:why-i-dont-believe:1',
  ]],
  ['/hi/writing/rules-about-women/part-1/', [
    'virtual:reader:writing:hi:rules-about-women', 'virtual:reader:writing:hi:rules-about-women:1',
  ]],
];
for (const [route, keys] of representative) {
  const html = readFileSync(`dist${route}index.html`, 'utf8');
  for (const key of keys) assert.ok(html.includes(`rel="modulepreload" crossorigin href="/${manifest[key].file}"`), `${route}: missing preload ${key}`);
  assert.ok(!html.includes('fonts.googleapis.com'), `${route}: external font stylesheet remains`);
  const preloadedReaders = Object.entries(manifest).filter(([key, value]) =>
    key.startsWith('virtual:reader:') && html.includes(`href="/${value.file}"`));
  assert.equal(preloadedReaders.length, route.includes('/part-') ? 2 : 0, `${route}: unrelated prose was preloaded`);
}
const fontSources = JSON.parse(readFileSync('public/fonts/web/sources.json', 'utf8'));
for (const source of fontSources) {
  const bytes = readFileSync(`public/fonts/web/${source.file}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, `Font bytes changed: ${source.file}`);
  assert.equal(bytes.toString('ascii', 0, 4), 'wOF2');
}
console.log(`Performance integrity: ${checkedParts} complete reader payloads and ${collections.size} contents chunks match the original manuscripts; ${fontSources.length} exact font binaries verified.`);
console.log(JSON.stringify(results.filter(row => row.part === 1 &&
  ['writing:en:why-i-dont-believe', 'writing:hi:rules-about-women'].includes(row.key)), null, 2));
