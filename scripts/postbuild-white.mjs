// A separate, route-based edition. The existing output and its canonical URLs
// remain intact; duplicate readers reuse the original static manuscript.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { Resvg } from '@resvg/resvg-js';

const SITE = 'https://misterlove.in';
const hash = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const template = readFileSync('dist/index.html', 'utf8');
const stylesheet = readdirSync('dist/assets').find(name => name.endsWith('.css') && readFileSync(`dist/assets/${name}`, 'utf8').includes('.white-hero'));
if (!stylesheet) throw new Error('White edition stylesheet was not emitted.');

// All artwork is built from the bundled OFL font, including on Linux CI.
const artwork = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="white"/><g fill="#121212" font-family="Manrope ExtraBold" font-weight="800"><text x="62" y="75" font-size="34" letter-spacing="-2.5">misterlove.</text><text x="62" y="254" font-size="112" letter-spacing="-7">Questions</text><text x="62" y="369" font-size="112" letter-spacing="-7">worth asking.</text></g><g fill="#121212" font-family="Manrope" font-weight="400"><text x="64" y="501" font-size="23">Independent research &amp; writing by Lovepreet Singh.</text><text x="64" y="563" font-size="18">misterlove.in/white</text></g><path d="M64 595H1136" stroke="#dedede"/></svg>`;
const card = new Resvg(artwork, { font: { fontFiles: ['scripts/white-fonts/Manrope-regular.ttf', 'scripts/white-fonts/Manrope-bold.ttf'], loadSystemFonts: false, defaultFontFamily: 'Manrope' } }).render().asPng();
writeFileSync('public/og/white-edition.png', card);
writeFileSync('dist/og/white-edition.png', card);

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let renderWhite;
try {
  const { default: WhiteApp } = await server.ssrLoadModule('/src/white/WhiteApp.jsx');
  renderWhite = path => renderToString(React.createElement(StaticRouter, { basename: '/white', location: `/white${path}` }, React.createElement(WhiteApp)));
  const homepage = renderWhite('/');
  const mainAt = homepage.indexOf('<main id="main"');
  const mainEnd = homepage.lastIndexOf('</main>') + '</main>'.length;
  if (mainAt < 0 || mainEnd < mainAt) throw new Error('White frame did not render.');
  const frameBefore = homepage.slice(0, mainAt);
  const frameAfter = homepage.slice(mainEnd);
  const generated = [];

  function shell(source, path, body, meta) {
    let html = source.replace(/<html([^>]*)>/, (_, attrs) => `<html${attrs.includes('class="') ? attrs.replace(/class="([^"]*)"/, 'class="$1 white-edition"') : `${attrs} class="white-edition"`}>`);
    const extra = `<meta name="robots" content="noindex, follow"/><link rel="stylesheet" href="/assets/${stylesheet}"/><link rel="preload" href="/white-assets/manrope-latin.woff2" as="font" type="font/woff2" crossorigin="anonymous"/><script>document.documentElement.dataset.experience="classic";</script><style>html.white-edition,html.white-edition body{background:#fff;color:#121212}</style>`;
    html = html.replace(/<meta name="robots"[^>]*>/g, '').replace('</head>', `${extra}</head>`);
    html = html.replace(/href="https:\/\/fonts.googleapis.com\/css2\?[^"]+"/, 'href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&amp;display=swap"');
    html = html.replace(/(<meta name="theme-color" content=")[^"]*(")/, '$1#ffffff$2');
    if (meta) {
      html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(meta.title)}</title>`);
      for (const property of ['og:title', 'twitter:title']) html = html.replace(new RegExp(`(<meta (?:property|name)="${property}" content=")[^"]*(")`), `$1${escape(meta.title)}$2`);
      for (const property of ['description', 'og:description', 'twitter:description']) html = html.replace(new RegExp(`(<meta (?:property|name)="${property}"\\s+content=")[^"]*(")`), `$1${escape(meta.description)}$2`);
      html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${meta.canonical}$2`).replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${meta.canonical}$2`);
      if (meta.image) {
        for (const property of ['og:image', 'og:image:secure_url', 'twitter:image']) html = html.replace(new RegExp(`(<meta (?:property|name)="${property}" content=")[^"]*(")`), `$1${meta.image}$2`);
        for (const property of ['og:image:alt', 'twitter:image:alt']) html = html.replace(new RegExp(`(<meta (?:property|name)="${property}" content=")[^"]*(")`), '$1MisterLove White — questions worth asking$2');
      }
    }
    // Vite puts the module entry in <head>; replacing <body> leaves it intact.
    if (!html.slice(0, html.indexOf('<body')).includes('type="module"')) throw new Error('Expected module entry in document head.');
    html = html.replace(/<body[\s\S]*?<\/body>/, `<body><div id="root">${body}</div></body>`);
    const dir = `dist/white${path}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/index.html`, html);
    generated.push({ path: `/white${path}`, canonical: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] });
  }

  const homeMeta = { title: 'MisterLove — questions worth asking | Lovepreet Singh', description: 'Independent research and writing by Lovepreet Singh. Explore long-form investigations, books and clear arguments with their sources.', canonical: `${SITE}/white/`, image: `${SITE}/og/white-edition.png` };
  shell(template, '/', homepage, homeMeta);
  shell(readFileSync('dist/writing/index.html', 'utf8'), '/writing/', renderWhite('/writing/'), { title: 'Writing — MisterLove | Lovepreet Singh', description: 'Explore the complete MisterLove research archive. Search investigations and filter by subject.', canonical: `${SITE}/writing/` });
  shell(readFileSync('dist/books/index.html', 'utf8'), '/books/', renderWhite('/books/'), { title: 'Books, read closely — MisterLove | Lovepreet Singh', description: 'Close readings of Chesterton, Horace and Harari by Lovepreet Singh. Follow the assumptions, strongest arguments and evidence behind influential books.', canonical: `${SITE}/books/` });
  shell(template, '/about/', renderWhite('/about/'), { title: 'About Lovepreet Singh — MisterLove', description: 'The researcher, writer and founder behind MisterLove. Biography, research method, practice and education.', canonical: `${SITE}/`, image: `${SITE}/og/white-edition.png` });

  function walk(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : entry.name === 'index.html' ? [join(dir, entry.name)] : []);
  }
  const originals = ['writing', 'books', 'press', 'hi', 'pa'].flatMap(dir => existsSync(`dist/${dir}`) ? walk(`dist/${dir}`) : []);
  const manuscripts = [];
  for (const file of originals) {
    const path = '/' + file.replaceAll('\\', '/').replace(/^dist\//, '').replace(/index\.html$/, '');
    if (path === '/writing/' || path === '/books/') continue;
    const html = readFileSync(file, 'utf8');
    const originalMain = html.match(/<main id="main"[\s\S]*?<\/main>/)?.[0];
    if (!originalMain) {
      const target = html.match(/http-equiv="refresh" content="0; url=([^"]+)"/)?.[1];
      if (!target?.startsWith(`${SITE}/writing/`)) throw new Error(`No complete main content in ${file}`);
      const whiteTarget = target.replace(SITE, `${SITE}/white`);
      const dir = `dist/white${path}`;
      mkdirSync(dir, { recursive: true });
      writeFileSync(`${dir}/index.html`, html.replaceAll(target, whiteTarget));
      generated.push({ path: `/white${path}`, redirect: whiteTarget });
      continue;
    }
    const whiteMain = originalMain.replace(/href="\/(?!\/)((?:(?:hi|pa)\/)?(?:writing|books|press)(?:\/|"))/g, 'href="/white/$1');
    shell(html, path, frameBefore + whiteMain + frameAfter);
    manuscripts.push({ path, original_main_sha256: hash(originalMain), white_main_sha256_after_normalizing_links: hash(whiteMain.replaceAll('href="/white/', 'href="/')) });
  }
  if (manuscripts.some(row => row.original_main_sha256 !== row.white_main_sha256_after_normalizing_links)) throw new Error('Static manuscript preservation failed.');
  writeFileSync('dist/white/edition.json', JSON.stringify({ edition: 'White', base: '/white/', routes: generated, canonical_original_readers: true, manuscript_preservation: manuscripts, social_card_sha256: hash(card) }, null, 2));
  console.log(`white edition ✓ ${generated.length} direct-entry routes, ${manuscripts.length} preserved static readers/collections, self-hosted font, 1200×630 social card`);
} finally {
  await server.close();
}
