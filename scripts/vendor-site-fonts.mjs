// Run manually when updating fonts, never during deployment. Vendor the exact
// Google Fonts faces used by the released design, including unicode ranges.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const stylesheet = process.argv[2];
if (!stylesheet) throw new Error('Pass the saved Google Fonts CSS stylesheet.');
const css = readFileSync(stylesheet, 'utf8');
const directory = 'public/fonts/web';
mkdirSync(directory, { recursive: true });
const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(match => match[1]))];
if (!urls.length || /format\('(?!woff2)/.test(css)) throw new Error('Expected Google Fonts WOFF2 stylesheet.');
const files = new Map();
const records = [];
// Keep network concurrency small, including on the author's laptop.
for (let offset = 0; offset < urls.length; offset += 4) {
  await Promise.all(urls.slice(offset, offset + 4).map(async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.toString('ascii', 0, 4) !== 'wOF2') throw new Error(`Not WOFF2: ${url}`);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const name = `${sha256.slice(0, 20)}.woff2`;
    writeFileSync(`${directory}/${name}`, bytes);
    files.set(url, `/fonts/web/${name}`);
    records.push({ source: url, file: name, bytes: bytes.length, sha256 });
  }));
}
let local = css;
for (const [url, path] of files) local = local.replaceAll(url, path);
const banner = '/* Same font faces, weights and unicode ranges as the released design. See web/sources.json and OFL licenses. */\n';
writeFileSync('public/fonts/site-fonts.css', banner + local);
const white = [...local.matchAll(/@font-face\s*\{[^}]+\}/g)]
  .map(match => match[0]).filter(block => block.includes("font-family: 'Noto Sans Devanagari'"));
writeFileSync('public/fonts/white-fonts.css', banner + white.join('\n'));
const families = ['cormorantgaramond', 'newsreader', 'sourcesans3', 'bodonimoda', 'instrumentserif', 'ibmplexmono', 'notosansdevanagari', 'notoserifdevanagari'];
for (const family of families) {
  const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`License unavailable: ${url}`);
  const license = await response.text();
  if (!license.includes('SIL OPEN FONT LICENSE')) throw new Error(`Unexpected license: ${family}`);
  writeFileSync(`${directory}/${family}-OFL.txt`, license);
}
writeFileSync(`${directory}/sources.json`, JSON.stringify(records.sort((a, b) => a.file.localeCompare(b.file)), null, 2) + '\n');
console.log(`Vendored ${records.length} unchanged WOFF2 files (${records.reduce((sum, item) => sum + item.bytes, 0)} bytes), with eight OFL licenses.`);
