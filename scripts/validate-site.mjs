// Validate the final deployed tree, not an intermediate renderer's output.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, join } from 'node:path';

const root = resolve('dist');
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);
const files = walk(root);
const failures = new Set();
const refs = new Set();
let pages = 0;
function checkRef(value, file) {
  if (!value || value.startsWith('#') || /^(data:|blob:|mailto:|tel:)/i.test(value)) return;
  const url = new URL(value.replaceAll('&amp;', '&'), `https://misterlove.in/${relative(root, file).replaceAll('\\', '/')}`);
  if (url.origin !== 'https://misterlove.in') return;
  const path = decodeURIComponent(url.pathname);
  refs.add(path);
  const target = resolve(root, '.' + path);
  if (!target.startsWith(root + '/') && !target.startsWith(root + '\\') && target !== root) {
    failures.add(`Unsafe path: ${path}`); return;
  }
  if (!existsSync(target) || (statSync(target).isDirectory() && !existsSync(join(target, 'index.html')))) {
    failures.add(`${path} ← ${relative(root, file)}`);
  }
}
for (const file of files) {
  assert.ok(!/\.(mp3|m4a|wav|ogg|opus|flac|aac|aiff?|wma)$/i.test(file), `Audio remains: ${file}`);
  if (!file.endsWith('.html')) continue;
  pages++;
  const html = readFileSync(file, 'utf8');
  const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1];
  assert.ok(policy?.includes("object-src 'none'") && policy.includes("script-src-attr 'none'"), `Missing CSP: ${file}`);
  assert.ok(html.indexOf('Content-Security-Policy') < html.indexOf('<script') || !html.includes('<script'), `Late CSP: ${file}`);
  assert.ok(!/<[^>]+\son[a-z]+\s*=/i.test(html), `Inline event handler blocked by CSP: ${file}`);
  assert.ok(!/src="\/brand\/intro\.js"|id="brand-intro"/.test(html), `Blocking intro remains: ${file}`);
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/.test(attrs) && body.trim()) {
      assert.ok(policy.includes(`'sha256-${createHash('sha256').update(body).digest('base64')}'`), `Unhashed inline script: ${file}`);
    }
  }
  for (const [, attrs] of html.matchAll(/<(?:a|img|script|link|source|iframe)\b([^>]*)>/gi)) {
    for (const [, , value] of attrs.matchAll(/\b(?:href|src)=("|')([^"']*)\1/gi)) checkRef(value, file);
    const srcset = attrs.match(/\bsrcset="([^"]+)"/i)?.[1];
    if (srcset) for (const part of srcset.split(',')) checkRef(part.trim().split(/\s+/)[0], file);
  }
}
for (const file of files.filter(file => file.endsWith('.css'))) {
  const css = readFileSync(file, 'utf8');
  for (const [, value] of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) checkRef(value, file);
}
for (const file of walk('public').filter(file => file.endsWith('.pdf'))) {
  assert.ok(readFileSync(file).equals(readFileSync(join(root, relative('public', file)))), `PDF bytes changed: ${file}`);
}
const size = files.reduce((sum, file) => sum + statSync(file).size, 0);
assert.ok(size < 500_000_000, `Site size exceeds 500 MB budget: ${size}`);
assert.equal(failures.size, 0, `Broken local URLs (${failures.size}):\n${[...failures].slice(0, 45).join('\n')}`);
console.log(`site ✓ ${pages} HTML pages, ${refs.size} local URLs, unchanged PDFs, no stored audio, ${(size / 1e6).toFixed(1)} MB deployment`);
