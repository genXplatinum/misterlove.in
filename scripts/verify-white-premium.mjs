import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const site = 'https://misterlove.in';
const edition = JSON.parse(readFileSync(join(dist, 'white', 'edition.json'), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const readRoute = (route, prefix = '') => readFileSync(join(dist, prefix, route.replace(/^\/+/, ''), 'index.html'), 'utf8');
const mainOf = html => html.match(/<main\b[^>]*\bid=["']main["'][^>]*>[\s\S]*?<\/main>/i)?.[0];
const canonicalOf = html => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const hasDirective = (html, name) => {
  const content = html.match(/<meta name="robots" content="([^"]+)"/i)?.[1] ?? '';
  return content.toLowerCase().split(/\s*,\s*/).includes(name);
};
const check = (condition, message) => assert.ok(condition, message);

check(edition.edition === 'White' && edition.base === '/', 'White must be the primary root edition');
check(edition.canonical_white && edition.noindex_original, 'Edition metadata must identify the primary and secondary policies');
check(edition.routes.length > 0 && edition.manuscript_preservation.length > 0, 'White route and manuscript inventories must exist');

const whiteHome = readRoute('/');
const originalHome = readRoute('/', 'original');
const notFound = readFileSync(join(dist, '404.html'), 'utf8');
check(whiteHome.includes('class="white-header"'), 'White homepage must serve at the root');
check(whiteHome.includes('MisterLove: leave no question unasked'), 'White homepage title must be present in static HTML');
check(canonicalOf(whiteHome) === `${site}/`, 'White homepage canonical must be root');
check(hasDirective(whiteHome, 'index'), 'White primary pages must be indexable');
check(!hasDirective(whiteHome, 'noindex'), 'White primary homepage must not be noindex');
check(originalHome.includes('<title>Lovepreet Singh | Essays and Research</title>'), 'Original homepage must remain at /original/');
check(canonicalOf(originalHome) === `${site}/`, 'Original homepage must canonicalize to White');
check(hasDirective(originalHome, 'noindex') && hasDirective(originalHome, 'follow'), 'Original secondary pages must be noindex, follow');
check(notFound.includes('Page not found | MisterLove') && hasDirective(notFound, 'noindex'),
  'Unknown root routes must use the White not-found page and remain noindex');

for (const route of edition.routes) {
  check(route.path.startsWith('/'), `Invalid White route: ${route.path}`);
  const html = readRoute(route.path);
  if (route.redirect) {
    check(/http-equiv="refresh"/.test(html), `${route.path}: expected a static content redirect`);
  } else {
    check(mainOf(html), `${route.path}: White page is missing its main content`);
    check(hasDirective(html, 'index') && !hasDirective(html, 'noindex'), `${route.path}: primary White page must be indexable`);
  }
  const alias = readRoute(route.path === '/' ? '/' : route.path, 'white');
  check(alias.includes('noindex, follow'), `${route.path}: legacy /white alias must be noindex`);
  check(alias.includes(`url=${route.path}`), `${route.path}: legacy alias must redirect to the primary route`);
  check(alias.includes(`${site}${route.path}`), `${route.path}: legacy alias canonical must point to the primary route`);
}

for (const record of edition.manuscript_preservation) {
  const original = mainOf(readRoute(record.path, 'original'));
  const white = mainOf(readRoute(record.path));
  check(original && white, `${record.path}: both editions must keep their reader content`);
  const normalizedOriginal = original.replaceAll('href="/original/', 'href="/').replaceAll('href="/original"', 'href="/"');
  check(hash(normalizedOriginal) === record.original_main_sha256, `${record.path}: Original manuscript changed`);
  const normalizedWhite = white.replace(/<!--white-cover:start-->[\s\S]*?<!--white-cover:end-->/g, '')
    .replaceAll('href="/white/', 'href="/');
  check(hash(normalizedWhite) === record.white_main_sha256_after_normalizing_links,
    `${record.path}: White manuscript changed`);
  check(canonicalOf(readRoute(record.path)) === canonicalOf(readRoute(record.path, 'original')),
    `${record.path}: editions must share the White canonical`);
}

for (const cover of edition.publication_covers) {
  const html = readRoute(cover.path);
  check((html.match(/\bdata-white-cover(?:\s|=|>)/gi) ?? []).length === 1,
    `${cover.path}: expected exactly one publication cover`);
}

const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
check(!sitemap.includes('/original/'), 'Secondary Original URLs must not appear in the sitemap');
check(!sitemap.includes('/white/'), 'Legacy White aliases must not appear in the sitemap');
check(sitemap.includes(`${site}/`), 'Primary White homepage must appear in the sitemap');
const legacyObservatory = readRoute('/', 'observatory');
check(legacyObservatory.includes('url=/original/'), 'Legacy Observatory URL must point to Original');

const pdfs = new Set();
for (const record of edition.manuscript_preservation) {
  const html = readRoute(record.path);
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+\.pdf(?:[?#][^"]*)?)"/gi)) {
    const url = new URL(href, site);
    if (url.origin !== site) continue;
    const path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (pdfs.has(path)) continue;
    check(existsSync(join(dist, path)), `${record.path}: missing PDF ${href}`);
    check(existsSync(join(root, 'public', path)), `${record.path}: missing source PDF ${href}`);
    check(hash(readFileSync(join(dist, path))) === hash(readFileSync(join(root, 'public', path))),
      `${record.path}: PDF bytes changed for ${href}`);
    pdfs.add(path);
  }
}
check(pdfs.size > 0, 'White readers must retain their existing PDF downloads');

console.log(`White verified: ${edition.routes.length} primary routes, ${edition.manuscript_preservation.length} manuscript hashes, ${edition.publication_covers.length} covers and ${pdfs.size} unchanged PDFs.`);
