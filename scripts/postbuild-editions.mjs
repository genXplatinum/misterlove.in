import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const dist = resolve('dist');
const site = 'https://misterlove.in';
const editionPath = join(dist, 'white', 'edition.json');
const edition = JSON.parse(readFileSync(editionPath, 'utf8'));

function moveOriginalPages() {
  const original = join(dist, 'original');
  mkdirSync(original, { recursive: true });
  renameSync(join(dist, 'index.html'), join(original, 'index.html'));
  for (const route of ['books', 'writing', 'press', 'hi', 'pa', 'my-books', 'listen', 'observatory']) {
    const source = join(dist, route);
    if (existsSync(source)) renameSync(source, join(original, route));
  }
  const podcastRedirect = join(dist, 'podcasts', 'index.html');
  if (existsSync(podcastRedirect)) {
    mkdirSync(join(original, 'podcasts'), { recursive: true });
    renameSync(podcastRedirect, join(original, 'podcasts', 'index.html'));
  }
}

function originalHref(href) {
  if (href === '/') return '/original/';
  if (href.startsWith('/#')) return `/original${href}`;
  if (href === '/about' || href.startsWith('/about/')) return `/original/#about`;
  if (/^\/(?:writing|books|press|hi|pa|my-books|listen|podcasts|observatory)(?:\/|[?#]|$)/.test(href)) {
    return `/original${href}`;
  }
  return href;
}

function whiteRoutes() {
  const found = [];
  const whiteRoot = join(dist, 'white');
  const visit = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.name === 'index.html') {
        const route = path.slice(whiteRoot.length).replaceAll('\\', '/').replace(/\/index\.html$/, '').replace(/^\/+/, '');
        found.push(route ? `/${route}/` : '/');
      }
    }
  };
  visit(whiteRoot);
  const routes = new Map(edition.routes.map(route => [route.path, route]));
  for (const path of found) if (!routes.has(path)) routes.set(path, { path });
  return [...routes.values()];
}

function markOriginal(html) {
  const switches = [];
  html = html.replace(/<nav class="edition-switch"[\s\S]*?<\/nav>/g, value => {
    const token = `__EDITION_SWITCH_${switches.length}__`;
    switches.push(value);
    return token;
  });
  html = html.replace(/(<a\b[^>]*\bhref=")([^"]*)(")/g, (match, before, href, after) => `${before}${originalHref(href)}${after}`);
  html = html.replace(/__EDITION_SWITCH_(\d+)__/g, (_, index) => switches[Number(index)]);
  html = html.replace(/<meta name="robots"[^>]*>/gi, '')
    .replace(/<meta name="googlebot"[^>]*>/gi, '')
    .replace('</head>', '<meta name="robots" content="noindex, follow"><meta name="googlebot" content="noindex, follow"></head>');
  return html;
}

function copyWhitePages() {
  edition.routes = whiteRoutes();
  for (const route of edition.routes) {
    const path = route.path === '/' ? '/' : route.path;
    const source = join(dist, 'white', path.replace(/^\/+/, ''), 'index.html');
    const target = join(dist, path.replace(/^\/+/, ''), 'index.html');
    assert.ok(existsSync(source), `White page missing before promotion: ${path}`);
    mkdirSync(dirname(target), { recursive: true });
    let html = readFileSync(source, 'utf8').replace(/\/white(?=\/|["?#])/g, '');
    writeFileSync(target, html);
  }
}

function writeWhiteAlias(route) {
  const path = route.path === '/' ? '/' : route.path;
  const alias = `/white${path === '/' ? '/' : path}`;
  const destination = join(dist, alias.replace(/^\/+/, ''), 'index.html');
  const target = path;
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow"><link rel="canonical" href="${site}${target}"><meta http-equiv="refresh" content="0; url=${target}"><title>White edition moved | MisterLove</title><script>const path=location.pathname.replace(/^\\/white(?=\\/|$)/,'')||'/';location.replace(path+location.search+location.hash)</script></head><body><p>The White edition has moved to its primary address. <a href="${target}">Continue to MisterLove White</a>.</p></body></html>`);
}

function promoteWhiteEdition() {
  copyWhitePages();
  for (const route of edition.routes) writeWhiteAlias(route);
  edition.routes = edition.routes.map(route => ({
    ...route,
    redirect: route.redirect?.replace(`${site}/white`, site),
  }));
  edition.legacy_aliases = edition.routes.map(route => `/white${route.path === '/' ? '/' : route.path}`);
  edition.base = '/';
  writeFileSync(editionPath, JSON.stringify(edition, null, 2));
}

function rewriteOriginalEdition() {
  const original = join(dist, 'original');
  const visit = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.name === 'index.html') {
        let html = markOriginal(readFileSync(path, 'utf8'));
        if (path === join(original, 'observatory', 'index.html')) {
          html = html.replaceAll('url=/', 'url=/original/').replace('location.replace("/"+location.search+location.hash)', 'location.replace("/original/"+location.search+location.hash)');
        }
        if (path === join(original, 'podcasts', 'index.html')) html = html.replaceAll('url=/listen/', 'url=/original/listen/');
        writeFileSync(path, html);
      }
    }
  };
  visit(original);

  const legacyObservatory = join(dist, 'observatory', 'index.html');
  mkdirSync(dirname(legacyObservatory), { recursive: true });
  writeFileSync(legacyObservatory, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow"><link rel="canonical" href="${site}/"><meta http-equiv="refresh" content="0; url=/original/"><title>Continue to MisterLove</title><script>location.replace("/original/"+location.search+location.hash)</script></head><body><p>This edition has moved. <a href="/original/">Continue to MisterLove Original</a>.</p></body></html>`);
}

function writeWhiteNotFound() {
  let html = readFileSync(join(dist, 'index.html'), 'utf8');
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found | MisterLove</title>')
    .replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow">')
    .replace(/<meta name="googlebot"[^>]*>/, '<meta name="googlebot" content="noindex, follow">')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, '')
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, '')
    .replace(/<main id="main"[\s\S]*?<\/main>/, '<main id="main" tabIndex="-1"><section class="white-shell white-empty"><p class="white-page-heading">404 · Page not found</p><h1>Page not found.</h1><p>The address may have changed.</p><a href="/writing" class="white-button">Browse the writing <span aria-hidden="true">→</span></a></section></main>');
  writeFileSync(join(dist, '404.html'), html);
}

function verifyPromotion() {
  const whiteHome = readFileSync(join(dist, 'index.html'), 'utf8');
  const originalHome = readFileSync(join(dist, 'original', 'index.html'), 'utf8');
  const notFound = readFileSync(join(dist, '404.html'), 'utf8');
  const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
  assert.match(whiteHome, /MisterLove: leave no question unasked/);
  assert.match(whiteHome, /<link rel="canonical" href="https:\/\/misterlove\.in\/"/);
  assert.match(whiteHome, /<meta name="robots" content="index, follow"/);
  assert.match(originalHome, /Lovepreet Singh \| Essays and Research/);
  assert.match(originalHome, /<meta name="robots" content="noindex, follow"/);
  assert.match(originalHome, /<link rel="canonical" href="https:\/\/misterlove\.in\/"/);
  assert.match(notFound, /Page not found \| MisterLove/);
  assert.match(notFound, /<meta name="robots" content="noindex, follow"/);
  assert.match(notFound, /class="white-site"/);
  assert.ok(existsSync(join(dist, 'original', 'writing', 'index.html')), 'Original writing shelf was not moved');
  assert.ok(existsSync(join(dist, 'writing', 'index.html')), 'White writing shelf was not promoted');
  assert.ok(existsSync(join(dist, 'my-books', 'index.html')), 'White bookshop was not promoted');
  assert.ok(existsSync(join(dist, 'listen', 'index.html')), 'White listening room was not promoted');
  assert.match(readFileSync(join(dist, 'white', 'writing', 'index.html'), 'utf8'), /url=\/writing\//);
  assert.ok(!sitemap.includes('/original/'), 'Secondary Original URLs must not appear in the sitemap');
  assert.ok(!sitemap.includes('/white/'), 'Legacy White aliases must not appear in the sitemap');
}

moveOriginalPages();
promoteWhiteEdition();
rewriteOriginalEdition();
writeWhiteNotFound();
verifyPromotion();
console.log(`editions ✓ White promoted to /, Original moved to /original/, ${edition.routes.length} compatibility redirects retained`);
