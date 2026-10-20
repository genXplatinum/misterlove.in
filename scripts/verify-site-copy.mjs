// Source guard for the explicitly authorized website-copy audit.
// The released brand version is the content baseline; no build or writes occur here.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { parseAst } from 'rolldown/parseAst';

export const COPY_BASE = '5bbdbc8af2f726da19830617a2833e8421a53542';
// The subsequent menu-only change is compared with the released copy audit.
const NAVIGATION_BASE = 'd3b5d9bc166ba271efa466636cda21861ddb903d';
const NAVIGATION_PATHS = new Set([
  'src/components/Nav.jsx', 'src/components/Nav.css', 'src/components/EditionSwitch.css',
  'src/white/WhiteApp.jsx', 'src/white/White.css', 'src/white/WhitePremium.css',
]);
const MOBILE_BASE = '751b43d3358ea196074330b5a27a7ce43359f4b8';
const MOBILE_PATHS = new Set(['src/pages/Study.jsx', 'docs/mobile-layout-audit.md']);
export const COPY_EDIT_PATHS = new Set([
  'src/data/site.js', 'src/data/writing.js', 'src/data/books.js', 'src/data/press.js',
  'src/pages/ClassicHome.jsx', 'src/pages/Books.jsx', 'src/pages/Book.jsx', 'src/pages/Press.jsx',
  'src/components/Footer.jsx', 'src/components/LoadDiagram.jsx',
  'src/components/PressLogoStrip.jsx', 'src/components/PressTeaser.jsx',
  'src/white/WhiteApp.jsx', 'src/white/ReadingRoom.jsx',
  'scripts/postbuild.mjs', 'scripts/postbuild-white.mjs', 'scripts/press-static.mjs',
  'scripts/make-og-cards.mjs', 'scripts/make-press-cards.mjs',
  'scripts/verify-site-copy.mjs', 'scripts/verify-white-premium.mjs',
  'index.html', 'docs/site-copy-audit.md',
]);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const normalize = text => text.replace(/\r\n/g, '\n');
const read = path => normalize(readFileSync(join(root, path), 'utf8'));
const contentRoots = ['src/data/writing/', 'src/data/books/'];
const copyAttributes = new Set(['title', 'description', 'aria-label', 'alt', 'placeholder', 'intro']);
const protectedProperties = new Set([
  'id', 'slug', 'href', 'to', 'src', 'url', 'source', 'canonical', 'image', 'images',
  'className', 'class', 'style', 'tone', 'motif', 'room', 'accent', 'type', 'kind',
  'publisher', 'published', 'dateLabel', 'displayDate', 'bookYear', 'author',
]);
const skipAstKeys = new Set(['start', 'end', 'loc', 'range', 'raw', 'comments', 'leadingComments', 'trailingComments']);

function git(...args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `Git ${args[0]} failed: ${result.error?.message ?? result.stderr}`);
  return result.stdout;
}
function walk(directory) {
  if (!existsSync(join(root, directory))) return [];
  return readdirSync(join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const path = `${directory.replace(/\/$/, '')}/${entry.name}`;
    assert.ok(!entry.isSymbolicLink(), `Unexpected symbolic link: ${path}`);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
function blobHash(bytes, algorithm) {
  return createHash(algorithm).update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}
function parse(source, path) {
  return parseAst(source, { lang: path.endsWith('.jsx') ? 'jsx' : 'js', sourceType: 'module' }, path);
}
function propertyName(node) {
  return node?.key?.name ?? node?.key?.value;
}
function linksIn(text) {
  return [...text.matchAll(/(?:https?:\/\/|mailto:|tel:|(?:www\.)?[a-z\d-]+\.(?:co\.in|in|com|org)\/)[^\s<"'`]+/gi)]
    .map(match => match[0]);
}
function copyText(text) {
  return { copy: true, links: linksIn(text) };
}

// Keep tags, order, attributes, embedded code and styling. Only readable text
// and explicitly textual accessibility attributes are replaceable.
function markupShape(markup, allowMeta = false) {
  const protectedBlocks = [];
  let result = markup.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, block => {
    protectedBlocks.push(block);
    return `<!--PROTECTED_BLOCK_${protectedBlocks.length - 1}-->`;
  });
  result = result.split(/(<[^>]*>)/g).map(part => {
    if (!part.startsWith('<')) return part.split('\0').map(text => text.trim() ? JSON.stringify(copyText(text)) : '').join('\0');
    if (allowMeta && /^<meta\b/i.test(part) && /\b(?:name|property)=["'](?:description|og:description|twitter:description)["']/i.test(part)) {
      return part.replace(/(\bcontent=)(["'])(.*?)\2/i, (_, key, quote, value) => `${key}${quote}${JSON.stringify(copyText(value))}${quote}`);
    }
    return part.replace(/(\b(?:alt|title|aria-label)=)(["'])(.*?)\2/gi,
      (_, key, quote, value) => `${key}${quote}${JSON.stringify(copyText(value))}${quote}`);
  }).join('');
  return { markup: result, protectedBlocks };
}

function constantText(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'BinaryExpression' && node.operator === '+') {
    const a = constantText(node.left), b = constantText(node.right);
    if (a !== undefined && b !== undefined) return a + b;
  }
  return undefined;
}
function jsxCopy(node) {
  if (node.type === 'JSXText') return node.value;
  if (node.type !== 'JSXExpressionContainer') return undefined;
  const expression = node.expression;
  const value = constantText(expression);
  if (value !== undefined) return value;
  if (expression.type === 'ConditionalExpression') {
    const a = constantText(expression.consequent), b = constantText(expression.alternate);
    if (a !== undefined && b !== undefined) return `${a} ${b}`;
  }
  return undefined;
}

// AST comparison permits wording edits while preserving executable structure,
// numeric values, selectors, routes, JSX attributes and SVG/CSS geometry.
// The data and renderer checks below add stricter content-specific guarantees.
function copyShape(node, ancestry = []) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) {
    if (ancestry.at(-1)?.children === node && /^JSX(?:Element|Fragment)$/.test(ancestry.at(-1).type)) {
      const children = [];
      for (const child of node) {
        const copy = jsxCopy(child);
        if (copy === undefined) children.push(copyShape(child, ancestry));
        else if (children.at(-1)?.type === 'CopyTextRun') children.at(-1).links.push(...linksIn(copy));
        else children.push({ type: 'CopyTextRun', links: linksIn(copy) });
      }
      return children;
    }
    return node.map(value => copyShape(value, ancestry));
  }
  const parent = ancestry.at(-1);
  const attribute = [...ancestry].reverse().find(item => item.type === 'JSXAttribute');
  const property = parent?.type === 'Property' && parent.value === node ? propertyName(parent) : null;
  const inImport = ancestry.some(item => /^(?:Import|ExportAll)/.test(item.type));
  const protectedContext = inImport
    || (attribute && !copyAttributes.has(attribute.name?.name))
    || (property && protectedProperties.has(property))
    || (parent?.type === 'Property' && parent.key === node);
  if (parent?.type === 'CallExpression' && parent.callee?.name === 'clampLines' && parent.arguments[0] === node) {
    const fn = [...ancestry].reverse().find(item => item.type === 'FunctionDeclaration')?.id?.name;
    if (fn === 'shelfCard' || fn === 'booksShelfCard') {
      const expected = fn === 'shelfCard' ? 'writingMeta' : 'booksMeta';
      const shared = node.type === 'MemberExpression' && !node.computed && node.object?.name === expected && node.property?.name === 'lead';
      if (constantText(node) !== undefined || shared) return { type: 'CollectionCardCopy', collection: expected };
    }
  }

  // Only these two collection descriptions may switch from a literal to their
  // shared metadata value. Article/individual-study descriptions are untouched.
  if (property === 'description') {
    const call = [...ancestry].reverse().find(item => item.type === 'CallExpression' && item.callee?.name === 'shell');
    const route = call?.arguments?.[0]?.properties?.find(item => propertyName(item) === 'path')?.value?.value;
    if (route === '/writing' || route === '/books') {
      const expected = route === '/writing' ? 'writingMeta' : 'booksMeta';
      const shared = node.type === 'MemberExpression' && !node.computed && node.object?.name === expected && node.property?.name === 'lead';
      assert.ok(constantText(node) !== undefined || shared, `${route}: description must be copy or ${expected}.lead`);
      return { type: 'CollectionDescription', route };
    }
  }
  if (node.type === 'JSXText') return { type: 'JSXText', ...copyText(node.value) };
  const literal = constantText(node);
  if (literal !== undefined && !protectedContext) {
    // A route, selector, module path, MIME type, color or other machine token
    // is never treated as prose, even when it appears in a permitted file.
    const machineValue = /^(?:[/.#]|(?:https?|mailto|tel|data|javascript|file):)|\.(?:m?js|jsx|css|woff2?|ttf|png|webp|jpe?g|svg|pdf)$/i.test(literal)
      || /^(?:[a-z\d_-]+\/[a-z\d_.-]+|#[\da-f]{3,8})$/i.test(literal);
    if (!machineValue) return { type: 'CopyLiteral', ...copyText(literal) };
  }
  if (node.type === 'TemplateLiteral' && !protectedContext) {
    const raw = node.quasis.map(item => item.value.raw).join('\0');
    const variable = [...ancestry].reverse().find(item => item.type === 'VariableDeclarator')?.id?.name;
    const textualTemplate = property === 'imageAlt' || variable === 'badge'
      || (attribute && copyAttributes.has(attribute.name?.name));
    if (/<[a-z!/]/i.test(raw) || textualTemplate) {
      return {
        type: 'TemplateLiteral',
        shape: /<[a-z!/]/i.test(raw) ? markupShape(raw) : copyText(raw),
        expressions: node.expressions.map(value => copyShape(value, [...ancestry, node])),
      };
    }
  }
  return Object.fromEntries(Object.entries(node)
    .filter(([key]) => !skipAstKeys.has(key))
    .map(([key, value]) => [key, copyShape(value, [...ancestry, node])]));
}

function declarationSource(source, ast, name) {
  for (const entry of ast.body) {
    const node = entry.declaration ?? entry;
    if (node.type === 'FunctionDeclaration' && node.id?.name === name) return source.slice(node.start, node.end);
    if (node.type === 'VariableDeclaration' && node.declarations.some(item => item.id?.name === name)) return source.slice(node.start, node.end);
  }
  assert.fail(`Protected renderer declaration missing: ${name}`);
}
function dataObject(source, expression) {
  const code = source.replaceAll('export const ', 'const ').replaceAll('export function ', 'function ')
    .replaceAll('import.meta.env.BASE_URL', "'/'");
  return runInNewContext(`${code}\n;(${expression})`, {}, { timeout: 3000 });
}
const plain = value => JSON.parse(JSON.stringify(value));
function firstDifference(a, b, path = 'AST') {
  if (JSON.stringify(a) === JSON.stringify(b)) return '';
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return `${path}: ${JSON.stringify(a)?.slice(0, 180)} != ${JSON.stringify(b)?.slice(0, 180)}`;
  }
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const difference = firstDifference(a[key], b[key], `${path}.${key}`);
    if (difference) return difference;
  }
  return path;
}

export function verifySiteCopy({ quiet = false } = {}) {
  const base = git('rev-parse', '--verify', `${COPY_BASE}^{commit}`).trim();
  const algorithm = git('rev-parse', '--show-object-format').trim();
  const tree = new Map(git('ls-tree', '-r', '-z', base).split('\0').filter(Boolean).map(line => {
    const [, type, oid, path] = line.match(/^\d+ (\S+) ([\da-f]+)\t([\s\S]+)$/);
    assert.equal(type, 'blob', `Unexpected Git object: ${path}`);
    return [path, oid];
  }));
  const old = path => normalize(git('show', `${base}:${path}`));
  const baselinePress = dataObject(old('src/data/press.js'), '({features,carousels,pressSite,pressCollectionCard,pressFilters,matchesPressFilter})');
  const press = dataObject(read('src/data/press.js'), '({features,carousels,pressSite,pressCollectionCard,pressFilters,matchesPressFilter})');
  const imagePaths = new Set([
    'public/og/writing.png', 'public/og/books.png', 'public/og/white-edition.png',
    `public${baselinePress.pressCollectionCard}`,
    ...baselinePress.features.flatMap(feature => [
      `public/og/press-spotlight-${feature.slug}.jpg`,
      `public/press/social/${feature.slug}-spotlight-story.jpg`,
    ]),
  ]);
  const allowed = path => COPY_EDIT_PATHS.has(path) || NAVIGATION_PATHS.has(path) || MOBILE_PATHS.has(path) || imagePaths.has(path);
  const changed = git('diff', '--name-only', '--no-renames', '-z', base, '--').split('\0').filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean);
  assert.deepEqual([...new Set([...changed, ...untracked])].filter(path => !allowed(path)), [],
    'Changes exceed the approved copy, edition-menu and mobile-layout scopes');

  const studyPath = 'src/pages/Study.jsx';
  const releasedStudy = normalize(git('show', `${MOBILE_BASE}:${studyPath}`));
  const omitMobileJump = source => {
    const pattern = /^  const goSectionMobile = \(event, id\) => \{[\s\S]*?^  \};/m;
    assert.match(source, pattern, 'Study mobile contents handler is missing');
    return source.replace(pattern, '');
  };
  assert.equal(omitMobileJump(read(studyPath)), omitMobileJump(releasedStudy),
    'The mobile contents fix must preserve the rest of the study reader');

  const manuscripts = [...tree.keys()].filter(path => contentRoots.some(prefix => path.startsWith(prefix))).sort();
  assert.deepEqual(contentRoots.flatMap(walk).sort(), manuscripts,
    'Manuscript source inventory changed (including untracked or ignored additions)');
  for (const path of manuscripts) {
    assert.equal(blobHash(Buffer.from(read(path)), algorithm), tree.get(path),
      `${path}: manuscript source differs from the released content (checkout CRLF is normalized)`);
  }
  for (const [path, marker] of [['src/data/writing.js', 'export const pieces = ['], ['src/data/books.js', 'export const books = [']]) {
    const prior = old(path), current = read(path);
    assert.ok(prior.includes(marker) && current.includes(marker), `${path}: manifest boundary missing`);
    assert.equal(current.slice(current.indexOf(marker)), prior.slice(prior.indexOf(marker)),
      `${path}: publication manifests, article summaries, loaders and helpers must stay unchanged`);
  }
  const pdfs = [...tree.keys()].filter(path => /\.pdf$/i.test(path)).sort();
  const currentPdfs = [...new Set([
    ...git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => /\.pdf$/i.test(path)),
    ...['public', 'brand'].flatMap(walk).filter(path => /\.pdf$/i.test(path)),
  ])].sort();
  assert.deepEqual(currentPdfs, pdfs, 'PDF inventory changed');
  for (const path of pdfs) assert.equal(blobHash(readFileSync(join(root, path)), algorithm), tree.get(path), `${path}: published PDF bytes changed`);

  const withoutCopy = features => plain(features).map(record => {
    delete record.cardTitle;
    delete record.excerpt;
    return record;
  });
  assert.deepEqual(withoutCopy(press.features), withoutCopy(baselinePress.features),
    'Publisher titles, attribution, dates, source URLs, images or other press evidence changed');
  for (const field of ['carousels', 'pressSite', 'pressCollectionCard']) assert.deepEqual(plain(press[field]), plain(baselinePress[field]), `Press ${field} changed`);
  assert.equal(press.pressFilters.length, baselinePress.pressFilters.length, 'Press filter inventory changed');
  for (let i = 0; i < press.pressFilters.length; i++) {
    assert.deepEqual(plain(press.features.map(feature => press.matchesPressFilter(feature, press.pressFilters[i]))),
      plain(baselinePress.features.map(feature => baselinePress.matchesPressFilter(feature, baselinePress.pressFilters[i]))),
      `Press filter ${i}: a label change altered its article membership`);
  }
  const profileBefore = dataObject(old('src/data/site.js'), '({profile,nav,home})');
  const profileAfter = dataObject(read('src/data/site.js'), '({profile,nav,home})');
  for (const field of ['profile', 'nav']) assert.deepEqual(plain(profileAfter[field]), plain(profileBefore[field]), `Site ${field} changed`);
  assert.deepEqual(plain(profileAfter.home.about.facts), plain(profileBefore.home.about.facts), 'Biography fact table changed');
  assert.equal(profileAfter.home.about.statement, profileBefore.home.about.statement, 'Personal quotation changed');
  assert.equal(profileAfter.home.about.statementEmphasis, profileBefore.home.about.statementEmphasis, 'Quotation emphasis changed');
  const education = model => plain(model.home.education.items.map(({ period, title, place }) => ({ period, title, place })));
  assert.deepEqual(education(profileAfter), education(profileBefore), 'Education credentials or institutions changed');

  const publisher = 'scripts/postbuild.mjs';
  const beforePublisher = old(publisher), afterPublisher = read(publisher);
  const beforeAst = parse(beforePublisher, publisher), afterAst = parse(afterPublisher, publisher);
  const protectedRenderers = [
    'esc', 'stripTags', 'crumbs', 'staticCopy', 'writingLanguageSwitch', 'articleBody', 'topicBody',
    'roomClass', 'gradeCount', 'loadStrip', 'LOAD_COPY', 'loadDiagram', 'bookBody', 'STUDY_COPY', 'studyBody', 'shell',
  ];
  for (const name of protectedRenderers) {
    assert.equal(declarationSource(afterPublisher, afterAst, name), declarationSource(beforePublisher, beforeAst, name),
      `${publisher}: protected article renderer ${name} changed`);
  }
  const sourceFiles = [...COPY_EDIT_PATHS].filter(path => /\.(?:mjs|jsx|js)$/.test(path)
    && !path.startsWith('scripts/verify-') && tree.has(path));
  for (const path of sourceFiles) {
    const before = old(path);
    let current = read(path);
    if (path === 'src/white/WhiteApp.jsx') {
      const released = normalize(git('show', `${NAVIGATION_BASE}:${path}`));
      const withoutNav = source => source.replace(declarationSource(source, parse(source, path), 'WhiteNav'), '');
      assert.equal(withoutNav(current), withoutNav(released),
        'The menu relocation must not change White content, footer, readers or routing');
      current = current.replace(declarationSource(current, parse(current, path), 'WhiteNav'),
        declarationSource(before, parse(before, path), 'WhiteNav'));
    }
    const difference = firstDifference(copyShape(parse(current, path)), copyShape(parse(before, path)));
    assert.ok(!difference, `${path}: change affects code, links, attributes, layout or data structure rather than website copy.\n${difference}`);
  }
  assert.deepEqual(markupShape(read('index.html'), true), markupShape(old('index.html'), true),
    'index.html: change affects shared structure, links or style rather than descriptive metadata');
  for (const path of changed) assert.ok(existsSync(join(root, path)), `Copy audit must not remove files: ${path}`);

  const result = { base, trackedChanges: changed.length, manuscriptFiles: manuscripts.length,
    pdfs: pdfs.length, pressEntries: press.features.length, protectedRenderers: protectedRenderers.length,
    copySourceFiles: sourceFiles.length, generatedShareCards: changed.filter(path => imagePaths.has(path)).length,
    authorizedPaths: [...new Set([...changed, ...untracked])] };
  if (!quiet) {
    console.log(`Website copy verified against ${base.slice(0, 8)}:`);
    console.log(`  ${result.manuscriptFiles} manuscript source files and both manifest suffixes unchanged.`);
    console.log(`  ${result.pdfs} PDFs byte-identical; no added or removed manuscript/PDF files.`);
    console.log(`  ${result.pressEntries} press evidence records and filter membership preserved.`);
    console.log(`  ${result.protectedRenderers} static reader declarations unchanged.`);
    console.log(`  ${result.copySourceFiles} source files checked for copy-only AST changes outside the separately authorized White menu.`);
    console.log(`  ${result.generatedShareCards} regenerated website share cards within the explicit allowlist.`);
    console.log('Human review still covers prose meaning and rendered layout; this guard does not certify those.');
  }
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 2, 'Usage: node scripts/verify-site-copy.mjs');
  verifySiteCopy();
}
