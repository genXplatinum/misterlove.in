// Run after `npm run build`. Verifies the separate White edition and the
// preservation of the Original readers/downloads and retirement of Observatory.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifySiteCopy } from './verify-site-copy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 2 && args[0] === '--base'),
  'Usage: node scripts/verify-white-premium.mjs [--base <original-commit>]');
const base = args[1] ?? '47ca094f';
const dist = join(root, 'dist');
const site = 'https://misterlove.in';
const customRoutes = ['/white/', '/white/writing/', '/white/books/', '/white/about/'];
const hash = value => createHash('sha256').update(value).digest('hex');
const text = path => readFileSync(path, 'utf8');
const normalizeRoute = path => `${path.replace(/\/+$/, '')}/`;
const routeFile = route => join(dist, decodeURIComponent(route).replace(/^\/+/, ''), 'index.html');
const mainOf = html => html.match(/<main\b[^>]*\bid=["']main["'][^>]*>[\s\S]*?<\/main>/i)?.[0];
const coverStart = '<!--white-cover:start-->';
const coverEnd = '<!--white-cover:end-->';
const needsCover = path => /^\/(?:(?:hi|pa)\/)?writing\/[^/]+(?:\/part-\d+)?\/$/.test(path)
  || /^\/(?:hi\/)?books\/[^/]+(?:\/[^/]+)?\/$/.test(path);
const isArticleCover = path => /^\/(?:(?:hi|pa)\/)?writing\/[^/]+\/part-\d+\/$/.test(path)
  || /^\/(?:hi\/)?books\/[^/]+\/[^/]+\/$/.test(path);

function git(...gitArgs) {
  const result = spawnSync('git', ['-C', root, ...gitArgs], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  assert.equal(result.status, 0, `Git ${gitArgs[0]} failed: ${result.error?.message ?? result.stderr}`);
  return result.stdout;
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1];
}

function decodeEntities(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#(\d+)|#x([a-f\d]+));/gi, (entity, decimal, hex) => {
    if (decimal || hex) return String.fromCodePoint(parseInt(decimal ?? hex, decimal ? 10 : 16));
    return ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' })[entity.toLowerCase()];
  });
}

function plainText(html) {
  return decodeEntities(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}

function stripCoverDecoration(html, route, required) {
  const starts = html.split(coverStart).length - 1;
  const ends = html.split(coverEnd).length - 1;
  assert.equal(starts, ends, `${route}: unbalanced publication-cover markers`);
  assert.ok(starts <= 1, `${route}: duplicate publication-cover blocks`);
  assert.equal(starts, required ? 1 : 0, `${route}: ${required ? 'missing' : 'unexpected'} publication-cover block`);
  if (!starts) return { normalized: html, block: '' };
  const start = html.indexOf(coverStart);
  const end = html.indexOf(coverEnd);
  assert.ok(end > start, `${route}: publication-cover markers are out of order`);
  const block = html.slice(start + coverStart.length, end);
  const coverTags = [...block.matchAll(/<[a-z][^>]*\sdata-white-cover(?=[\s=>])[^>]*>/gi)];
  assert.equal(coverTags.length, 1, `${route}: exactly one data-white-cover element must identify the decoration`);
  assert.ok(!/<\/?main\b/i.test(block), `${route}: cover decoration must not change the main landmark`);
  assert.ok(!/<(?:script|iframe)\b/i.test(block), `${route}: cover block must contain only the publication illustration`);
  return { normalized: html.slice(0, start) + html.slice(end + coverEnd.length), block };
}

function canonicalOf(html) {
  const tag = [...html.matchAll(/<link\b[^>]*>/gi)].find(([value]) => attribute(value, 'rel') === 'canonical')?.[0];
  return tag && decodeEntities(attribute(tag, 'href') ?? '');
}

function hasNoindexFollow(html) {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)].find(([value]) => attribute(value, 'name') === 'robots')?.[0];
  const directives = (tag && attribute(tag, 'content') || '').toLowerCase().split(/\s*,\s*/);
  return directives.includes('noindex') && directives.includes('follow');
}

function walkIndexes(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkIndexes(path) : entry.name === 'index.html' ? [path] : [];
  });
}

function allowedChange(path) {
  return copyAuditPaths.has(path)
    || path.startsWith('src/white/')
    || path.startsWith('docs/')
    || path.startsWith('public/white-assets/')
    || path.startsWith('public/brand/')
    || path.startsWith('brand/misterlove/')
    || [
      'scripts/postbuild-white.mjs', 'scripts/postbuild.mjs', 'scripts/verify-white-premium.mjs',
      'scripts/test-brand-intro.mjs', 'public/og/white-edition.png', 'public/favicon.svg', 'public/favicon.ico', 'index.html',
      'package.json', 'package-lock.json', 'src/App.jsx', 'src/main.jsx', 'src/pageSurface.js',
      'src/components/EditionSwitch.jsx', 'src/components/EditionSwitch.css',
      'src/components/ExperienceProvider.jsx', 'src/components/Nav.jsx', 'src/components/Nav.css',
      'src/components/Footer.jsx', 'src/components/Logo.jsx', 'src/components/Logo.css', 'src/pages/Writing.jsx', 'src/pages/Topic.jsx',
      ...retiredSources, ...retiredAssets.map(asset => `public/${asset}`),
    ].includes(path);
}

const retiredSources = [
  'src/pages/Home.jsx', 'src/pages/Home.css', 'src/observatory.css',
  'src/components/HeroNataraja.jsx', 'src/components/InquiryInstrument.jsx',
  'src/components/ObservatoryMotion.jsx', 'src/components/GodQuote.jsx', 'src/components/GodQuote.css',
];
const retiredAssets = [
  'observatory.webp', 'observatory-empty-arch.webp', 'nataraja-midnight-sky.webp',
  'nataraja-continuous-backdrop.webp', 'nataraja-apasmara.webp',
];
const baseCommit = git('rev-parse', '--verify', `${base}^{commit}`).trim();
// A later, explicitly approved copy audit may change website descriptions and
// labels. Its stricter release-baseline guard protects source manuscripts,
// PDFs, reader renderers, links and design before extending historical scope.
const copyAudit = verifySiteCopy({ quiet: true });
const copyAuditPaths = new Set(copyAudit.authorizedPaths);
const changed = git('diff', '--name-only', '--no-renames', '-z', baseCommit, '--').split('\0').filter(Boolean);
assert.deepEqual(changed.filter(path => !allowedChange(path)), [],
  'Changes exceed the authorized White, edition-switch, intro and Observatory-retirement scope');
// Check untracked files too, so a new manuscript or asset cannot bypass the diff guard.
const untracked = git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean);
assert.deepEqual(untracked.filter(path => !allowedChange(path)), [], 'Untracked files exceed the authorized scope');

// verifySiteCopy compares each protected reader declaration with the approved
// brand release, and checks complete manuscript files and manifest suffixes.
// Website metadata and shelf labels no longer require whole-file equality.

const basePackage = JSON.parse(git('show', `${baseCommit}:package.json`));
const currentPackage = JSON.parse(text(join(root, 'package.json')));
delete basePackage.dependencies.three;
assert.deepEqual(currentPackage, basePackage, 'Only the unused Three.js dependency may change in package.json');
const lock = JSON.parse(text(join(root, 'package-lock.json')));
assert.ok(!lock.packages?.['node_modules/three'], 'Retired Three.js dependency remains in the lockfile');
for (const file of retiredSources) assert.ok(!existsSync(join(root, file)), `Retired source remains: ${file}`);
for (const asset of retiredAssets) {
  assert.ok(!existsSync(join(root, 'public', asset)), `Retired public asset remains: ${asset}`);
  assert.ok(!existsSync(join(dist, asset)), `Stale retired asset remains in build: ${asset}`);
}
for (const file of ['src/main.jsx', 'index.html', 'src/components/ExperienceProvider.jsx',
  'src/components/EditionSwitch.jsx', 'src/components/Nav.jsx', 'src/components/Footer.jsx', 'src/white/WhiteApp.jsx']) {
  assert.ok(!/observatory|immersive/i.test(text(join(root, file))), `${file}: retired edition remains active`);
}
const legacyRedirect = text(routeFile('/observatory/'));
assert.equal(canonicalOf(legacyRedirect), `${site}/`, 'Legacy edition must point to Original');
assert.ok(hasNoindexFollow(legacyRedirect), 'Legacy redirect must be noindex, follow');
assert.match(legacyRedirect, /http-equiv="refresh" content="0; url=\/"/, 'Legacy URL needs a no-JS redirect');
assert.match(legacyRedirect, /location\.replace\("\/"\+location\.search\+location\.hash\)/,
  'Legacy JavaScript redirect must preserve query and hash without adding history');
assert.ok(!/type="module"|observatory-home|<canvas/i.test(legacyRedirect), 'Legacy URL must not retain an active view');
assert.ok(!/\/observatory(?:\/|<)/.test(text(join(dist, 'sitemap.xml'))), 'Retired edition must not appear in the sitemap');

function verifyIntro(html, route) {
  const intros = [...html.matchAll(/<[^>]+\bid=["']brand-intro["'][^>]*>/g)];
  assert.equal(intros.length, 1, `${route}: exactly one branded loading intro must be present`);
  assert.equal(attribute(intros[0][0], 'aria-hidden'), 'true', `${route}: intro must remain decorative`);
  assert.ok(/src=["']\/brand\/intro\.js["']/.test(html), `${route}: intro script is missing`);
}
verifyIntro(text(routeFile('/')), '/');
for (const file of walkIndexes(dist)) {
  const html = text(file);
  if (/http-equiv=["']refresh["']/i.test(html)) continue;
  assert.ok(!/<a\b[^>]*href=["'][^"']*\/observatory(?:[/"'?#])/i.test(html),
    `${file}: navigation still links to the retired edition`);
}

const manifestPath = join(dist, 'white', 'edition.json');
assert.ok(existsSync(manifestPath), 'Missing dist/white/edition.json. Run the full npm run build first.');
const edition = JSON.parse(text(manifestPath));
assert.equal(edition.base, '/white/');
assert.equal(edition.canonical_original_readers, true);
assert.ok(Array.isArray(edition.routes) && edition.routes.length > 0, 'White route inventory must be present');
assert.ok(Array.isArray(edition.manuscript_preservation) && edition.manuscript_preservation.length > 0,
  'White manuscript-preservation inventory must be present');

const routes = new Map();
const htmlByRoute = new Map();
for (const entry of edition.routes) {
  assert.ok(typeof entry.path === 'string' && entry.path.startsWith('/white/'), 'Every White route needs its /white/ prefix');
  const route = normalizeRoute(entry.path);
  assert.ok(!routes.has(route), `Duplicate route in edition.json: ${route}`);
  assert.ok(existsSync(routeFile(route)), `Missing direct-entry page: ${route}`);
  routes.set(route, entry);
  const html = text(routeFile(route));
  htmlByRoute.set(route, html);
  if (entry.redirect) {
    const target = new URL(entry.redirect);
    assert.equal(target.origin, site, `${route}: unexpected redirect origin`);
    assert.ok(existsSync(routeFile(target.pathname)), `${route}: missing White redirect target ${target.pathname}`);
  } else {
    assert.ok(hasNoindexFollow(html), `${route}: comparison edition must remain noindex, follow`);
    assert.equal(canonicalOf(html), entry.canonical, `${route}: generated canonical differs from manifest`);
    assert.ok(mainOf(html), `${route}: missing main content`);
    verifyIntro(html, route);
    const header = html.match(/<header\b[^>]*class="white-header"[^>]*>[\s\S]*?<\/header>/)?.[0];
    assert.ok(header, `${route}: missing White header`);
    const menu = header.match(/<details\b[^>]*class="white-mobile-menu"[^>]*>[\s\S]*?<\/details>/)?.[0];
    assert.ok(menu && !/\bopen(?:\s|=|>)/.test(menu.slice(0, menu.indexOf('>') + 1)),
      `${route}: navigation menu must start closed`);
    assert.ok(!header.replace(menu, '').includes('class="edition-switch"'),
      `${route}: edition switch must not occupy the closed header`);
    const editionNav = menu.match(/<nav\b[^>]*aria-label="Site edition"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(editionNav, `${route}: the edition switch must be inside the menu`);
    const editionLinks = [...editionNav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    assert.deepEqual(editionLinks.map(([, , label]) => plainText(label)), ['Original', 'White'],
      `${route}: menu switch must offer exactly Original and White`);
    const originalPath = route === '/white/about/' ? '/#about' : route.slice('/white'.length);
    assert.equal(decodeEntities(attribute(editionLinks[0][1], 'href') ?? ''), originalPath,
      `${route}: Original switch must preserve the current reading route`);
    assert.equal(decodeEntities(attribute(editionLinks[1][1], 'href') ?? ''), route,
      `${route}: White switch must preserve the current reading route`);
    assert.equal(attribute(editionLinks[1][1], 'aria-current'), 'true',
      `${route}: current edition must be announced`);
    assert.match(html, /<footer\b[^>]*class="white-footer"[\s\S]*?class="edition-switch"/,
      `${route}: footer edition switch must remain available`);
  }
}
for (const route of [...customRoutes, '/white/press/']) {
  assert.ok(routes.has(route), `Expected White page missing from edition.json: ${route}`);
}

assert.ok(Array.isArray(edition.publication_covers) && edition.publication_covers.length > 0,
  'White publication-cover inventory must be present');
const covers = new Map();
for (const cover of edition.publication_covers) {
  assert.ok(typeof cover.path === 'string' && cover.path.startsWith('/') && !cover.path.startsWith('/white/'),
    'Publication-cover paths must use original reader paths, matching manuscript_preservation');
  const path = normalizeRoute(cover.path);
  const route = `/white${path}`;
  assert.ok(!covers.has(path), `Duplicate publication-cover record: ${path}`);
  assert.ok(routes.has(route) && !routes.get(route).redirect && needsCover(path),
    `Publication-cover record has no eligible reader route: ${path}`);
  for (const field of ['title', 'collection', 'label']) {
    assert.ok(typeof cover[field] === 'string' && cover[field].trim(), `${path}: missing publication-cover ${field}`);
  }
  covers.set(path, cover);
}

const normalizedWhiteMains = new Map();
for (const [route, entry] of routes) {
  const path = route.slice('/white'.length);
  const required = !entry.redirect && needsCover(path);
  const html = htmlByRoute.get(route);
  const { block } = stripCoverDecoration(html, route, required);
  assert.equal(covers.has(path), required, `${route}: publication-cover inventory does not match reader coverage`);
  if (entry.redirect) continue;
  const main = mainOf(html);
  const result = stripCoverDecoration(main, route, required);
  normalizedWhiteMains.set(route, result.normalized);
  if (!required) continue;
  assert.equal(result.block, block, `${route}: cover must be entirely inside main content`);
  const titleSpan = [...block.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi)]
    .find(([, attrs]) => (attribute(attrs, 'class') ?? '').split(/\s+/).includes('pc-title'));
  assert.ok(titleSpan, `${route}: cover title must be visible as text`);
  assert.equal(plainText(titleSpan[2]), plainText(covers.get(path).title),
    `${route}: visible cover title differs from publication_covers`);
  assert.ok(plainText(block).includes(plainText(covers.get(path).label)),
    `${route}: cover label differs from publication_covers`);
  if (isArticleCover(path)) {
    const originalMain = mainOf(text(routeFile(path)));
    const originalHeading = originalMain?.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    assert.ok(originalHeading, `${route}: original article/study title must be available`);
    assert.equal(plainText(covers.get(path).title), plainText(originalHeading),
      `${route}: cover must use the actual original article/study title`);
  }
  assert.equal((main.match(/\bdata-white-cover(?:\s|=|>)/gi) ?? []).length, 1,
    `${route}: duplicate cover element outside the removable decoration`);
}

const records = new Map();
for (const record of edition.manuscript_preservation) {
  assert.ok(typeof record.path === 'string' && record.path.startsWith('/'), 'Invalid manuscript path');
  assert.ok(!records.has(record.path), `Duplicate manuscript record: ${record.path}`);
  records.set(record.path, record);
  const whiteRoute = normalizeRoute(`/white${record.path}`);
  assert.ok(routes.has(whiteRoute), `Manuscript missing from route inventory: ${whiteRoute}`);
  const originalHtml = text(routeFile(record.path));
  const whiteHtml = htmlByRoute.get(whiteRoute);
  const originalMain = mainOf(originalHtml);
  const whiteMain = normalizedWhiteMains.get(whiteRoute);
  assert.ok(originalMain && whiteMain, `${record.path}: original and White manuscripts must both exist`);
  const originalHash = hash(originalMain);
  const whiteHash = hash(whiteMain.replaceAll('href="/white/', 'href="/'));
  assert.equal(originalHash, record.original_main_sha256, `${record.path}: original manuscript hash is stale`);
  assert.equal(whiteHash, record.white_main_sha256_after_normalizing_links,
    `${record.path}: White manuscript hash is stale`);
  assert.equal(whiteHash, originalHash, `${record.path}: White manuscript differs from its original`);
  assert.equal(canonicalOf(whiteHtml), canonicalOf(originalHtml), `${record.path}: preserve the original canonical URL`);
}

let mirroredPages = 0;
for (const section of ['writing', 'books', 'press', 'hi', 'pa']) {
  for (const file of walkIndexes(join(dist, section))) {
    const originalRoute = `/${file.slice(dist.length + 1).replaceAll('\\', '/').replace(/index\.html$/, '')}`;
    const whiteRoute = normalizeRoute(`/white${originalRoute}`);
    assert.ok(routes.has(whiteRoute), `Original page has no White counterpart: ${originalRoute}`);
    if (!['/writing/', '/books/'].includes(originalRoute) && mainOf(text(file))) {
      assert.ok(records.has(originalRoute), `Original manuscript has no preservation record: ${originalRoute}`);
    }
    mirroredPages++;
  }
}

const homepage = htmlByRoute.get('/white/');
const headings = [...homepage.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
assert.equal(headings.length, 1, 'The White homepage must have one primary heading');
const headingText = plainText(headings[0][1]);
assert.ok(headingText.length > 0, 'The homepage headline must be visible in static HTML');
const questionButtons = [...homepage.matchAll(/<button\b[^>]*\baria-pressed=["']([^"']+)["'][^>]*>([\s\S]*?)<\/button>/gi)];
assert.ok(questionButtons.length >= 2, 'Question selection must expose real buttons and aria-pressed state');
assert.ok(questionButtons.every(([, state]) => ['true', 'false'].includes(state)), 'Invalid question button state');
assert.ok(questionButtons.some(([, state]) => state === 'true'), 'The initial question selection must be identified');
assert.ok(!/\brole=["']tab(?:list|panel)?["']/i.test(homepage),
  'Question choices are pressed buttons, not an incomplete ARIA tabs widget');

let navigationLinks = 0;
for (const route of customRoutes) {
  const html = htmlByRoute.get(route);
  for (const [, tag] of html.matchAll(/(<a\b[^>]*>)/gi)) {
    const href = decodeEntities(attribute(tag, 'href') ?? '').trim();
    if (!href || href.startsWith('#') || href.startsWith('?') || /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) continue;
    const url = new URL(href, site + route);
    if (url.origin !== site || !/^\/white(?:\/|$)/.test(url.pathname) || /\.pdf$/i.test(url.pathname)) continue;
    const target = normalizeRoute(url.pathname);
    assert.ok(routes.has(target), `${route}: navigation target is absent from edition.json: ${href}`);
    assert.ok(existsSync(routeFile(target)), `${route}: navigation target is missing: ${href}`);
    navigationLinks++;
  }
}

const pdfs = new Set();
let pdfLinks = 0;
for (const [route, html] of htmlByRoute) {
  for (const [, tag] of html.matchAll(/(<a\b[^>]*>)/gi)) {
    const href = decodeEntities(attribute(tag, 'href') ?? '').trim();
    if (!href || href.startsWith('#') || href.startsWith('?') || /^(?:mailto|tel|javascript|data):/i.test(href)) continue;
    const url = new URL(href, site + route);
    if (url.origin !== site || !/\.pdf$/i.test(url.pathname)) continue;
    assert.ok(!/^\/white(?:\/|$)/.test(url.pathname), `${route}: PDF must keep its original URL: ${href}`);
    const path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    pdfLinks++;
    if (pdfs.has(path)) continue;
    const generatedPath = join(dist, path);
    const publicPath = join(root, 'public', path);
    assert.ok(existsSync(generatedPath), `${route}: PDF missing from build: ${href}`);
    assert.ok(existsSync(publicPath), `${route}: PDF has no original public asset: ${href}`);
    const bytes = readFileSync(generatedPath);
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-', `${href}: file is not a PDF`);
    assert.equal(hash(bytes), hash(readFileSync(publicPath)), `${href}: build changed the checked public PDF`);
    pdfs.add(path);
  }
}
assert.ok(pdfs.size > 0, 'White readers must retain their existing PDF downloads');

console.log(`White verified against ${baseCommit.slice(0, 8)}:`);
console.log(`  ${changed.length} authorized tracked changes; original content and static reader rendering preserved.`);
console.log(`  Copy audit against ${copyAudit.base.slice(0, 8)}: ${copyAudit.manuscriptFiles} source files and ${copyAudit.pdfs} PDFs unchanged.`);
console.log('  Observatory retired; edition switches confined to closed menus and footers; decorative intro verified.');
console.log(`  ${routes.size} direct-entry routes; ${mirroredPages} original pages mirrored.`);
console.log(`  ${records.size} manuscripts independently hash-checked; original canonicals retained.`);
console.log(`  ${covers.size} publication covers verified; only balanced cover decorations excluded from manuscript hashes.`);
console.log(`  ${navigationLinks} custom-page navigation links resolve; semantic question controls present.`);
console.log(`  ${pdfLinks} download links; ${pdfs.size} original PDFs available and byte-identical.`);
console.log('Browser layout, interactive behavior, keyboard access and reduced motion still require browser checks.');
