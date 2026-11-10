// GitHub Pages does not expose custom response headers. Apply the supported
// document-level policy after every renderer, redirect and edition transform.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

for (const base of ['', '/original', '/white']) {
  for (const route of ['listen', 'podcasts']) {
    const target = `${base === '/original' ? base : ''}/writing/`;
    const dir = `dist${base}/${route}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://misterlove.in${target}"><meta http-equiv="refresh" content="0;url=${target}"><title>Continue reading | MisterLove</title></head><body><h1>The audio collection has been retired.</h1><p>The books and research remain available to read. <a href="${target}">Open the writing archive</a>.</p></body></html>`);
  }
}

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);
let count = 0;
for (const path of walk('dist').filter(path => path.endsWith('.html'))) {
  let html = readFileSync(path, 'utf8');
  const hashes = new Set([...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs, body]) => !/\bsrc\s*=/.test(attrs) && body.trim())
    .map(([, , body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`));
  const policy = [
    "default-src 'self'", `script-src 'self' ${[...hashes].join(' ')}`,
    "script-src-attr 'none'", "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:", "font-src 'self' data:",
    "connect-src 'self' https://api.dictionaryapi.dev",
    "media-src 'self' https://api.dictionaryapi.dev https://upload.wikimedia.org",
    "frame-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
  ].join('; ');
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="strict-origin-when-cross-origin">`;
  html = html.replace(/<meta\s+charset=[^>]+>/i, match => match + meta);
  if (!html.includes(meta)) throw new Error(`Missing charset for security policy: ${path}`);
  writeFileSync(path, html);
  count++;
}
console.log(`security ✓ ${count} pages protected with hashed inline scripts and a referrer policy`);
