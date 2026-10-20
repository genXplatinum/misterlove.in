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
const artwork = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="white"/><g fill="#121212" font-family="Manrope ExtraBold" font-weight="800"><text x="62" y="75" font-size="34" letter-spacing="-2.5">misterlove.</text><text x="62" y="254" font-size="98" letter-spacing="-6">Leave no question</text><text x="62" y="369" font-size="98" letter-spacing="-6">unasked.</text></g><g fill="#121212" font-family="Manrope" font-weight="400"><text x="64" y="501" font-size="23">Independent research &amp; writing by Lovepreet Singh.</text><text x="64" y="563" font-size="18">misterlove.in/white</text></g><path d="M64 595H1136" stroke="#dedede"/></svg>`;
const card = new Resvg(artwork, { font: { fontFiles: ['scripts/white-fonts/Manrope-regular.ttf', 'scripts/white-fonts/Manrope-bold.ttf'], loadSystemFonts: false, defaultFontFamily: 'Manrope' } }).render().asPng();
writeFileSync('public/og/white-edition.png', card);
writeFileSync('dist/og/white-edition.png', card);

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let renderWhite;
try {
  const { default: WhiteApp } = await server.ssrLoadModule('/src/white/WhiteApp.jsx');
  const { default: PublicationCover } = await server.ssrLoadModule('/src/white/PublicationCover.jsx');
  const { publicationForPath } = await server.ssrLoadModule('/src/white/publicationContext.js');
  renderWhite = path => renderToString(React.createElement(StaticRouter, { basename: '/white', location: `/white${path}` }, React.createElement(WhiteApp)));
  const homepage = renderWhite('/');
  const mainAt = homepage.indexOf('<main id="main"');
  const mainEnd = homepage.lastIndexOf('</main>') + '</main>'.length;
  if (mainAt < 0 || mainEnd < mainAt) throw new Error('White frame did not render.');
  const frameBefore = homepage.slice(0, mainAt);
  const frameAfter = homepage.slice(mainEnd);
  const generated = [];
  const frameForPath = (frame, path) => frame.replace(
    /<nav class="edition-switch"[\s\S]*?<\/nav>/g,
    switchHtml => switchHtml
      .replace(/(<a href=")[^"]*("[^>]*>Original<\/a>)/, `$1${path}$2`)
      .replace(/(<a href=")[^"]*("[^>]*>White<\/a>)/, `$1/white${path}$2`)
  );

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
        for (const property of ['og:image:alt', 'twitter:image:alt']) html = html.replace(new RegExp(`(<meta (?:property|name)="${property}" content=")[^"]*(")`), '$1MisterLove White — leave no question unasked$2');
      }
    }
    // Keep the short brand introduction outside React's root in both editions.
    if (!html.slice(0, html.indexOf('<body')).includes('type="module"')) throw new Error('Expected module entry in document head.');
    const introduction = html.match(/<div id="brand-intro"[\s\S]*?<\/div>\s*<script src="\/brand\/intro\.js"><\/script>/)?.[0];
    if (!introduction) throw new Error('Brand introduction missing from the source shell.');
    html = html.replace(/<body[\s\S]*?<\/body>/, `<body>${introduction}<div id="root">${body}</div></body>`);
    const dir = `dist/white${path}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/index.html`, html);
    generated.push({ path: `/white${path}`, canonical: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] });
  }

  const homeMeta = { title: 'MisterLove — leave no question unasked | Lovepreet Singh', description: 'A reading room for independent thought. Explore Lovepreet Singh’s research on belief, science, society and the systems we live inside.', canonical: `${SITE}/white/`, image: `${SITE}/og/white-edition.png` };
  shell(template, '/', homepage, homeMeta);
  shell(readFileSync('dist/writing/index.html', 'utf8'), '/writing/', renderWhite('/writing/'), { title: 'Writing — MisterLove | Lovepreet Singh', description: 'Explore the complete MisterLove research archive. Search investigations and filter by subject.', canonical: `${SITE}/writing/` });
  shell(readFileSync('dist/books/index.html', 'utf8'), '/books/', renderWhite('/books/'), { title: 'Books, read closely — MisterLove | Lovepreet Singh', description: 'Close readings of Chesterton, Horace and Harari by Lovepreet Singh. Follow the assumptions, strongest arguments and evidence behind influential books.', canonical: `${SITE}/books/` });
  shell(template, '/about/', renderWhite('/about/'), { title: 'About Lovepreet Singh — MisterLove', description: 'The researcher, writer and founder behind MisterLove. Biography, research method, practice and education.', canonical: `${SITE}/`, image: `${SITE}/og/white-edition.png` });

  function walk(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : entry.name === 'index.html' ? [join(dir, entry.name)] : []);
  }
  const originals = ['writing', 'books', 'press', 'hi', 'pa'].flatMap(dir => existsSync(`dist/${dir}`) ? walk(`dist/${dir}`) : []);
  const manuscripts = [];
  const publicationCovers = [];
  const coverCatalog = [];
  const decodeText = value => value.replace(/<[^>]*>/g, ' ').replace(/&(?:amp|quot|apos|lt|gt|#(\d+)|#x([a-f\d]+));/gi, (entity, decimal, hex) => {
    if (decimal || hex) return String.fromCodePoint(parseInt(decimal ?? hex, decimal ? 10 : 16));
    return ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' })[entity.toLowerCase()];
  }).replace(/\s+/g, ' ').trim();
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
    let whiteMain = originalMain.replace(/href="\/(?!\/)((?:(?:hi|pa)\/)?(?:writing|books|press)(?:\/|"))/g, 'href="/white/$1');
    const heading = decodeText(originalMain.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '');
    const context = publicationForPath(path, heading);
    if (context) {
      const art = renderToString(React.createElement(PublicationCover, { piece: context.piece, title: context.title, label: context.label }));
      // Original static pages use a leaner layout than the live React reader.
      // Add only a marked illustration before their heading, then preserve
      // every original manuscript byte when that decoration is removed.
      const decoration = `<!--white-cover:start--><div data-white-cover="true" class="white-cover-slot white-static-cover" aria-hidden="true">${art}</div><!--white-cover:end-->`;
      if (!/<h1\b/.test(whiteMain)) throw new Error(`No cover heading in ${path}`);
      whiteMain = whiteMain.replace(/<h1\b/, headingTag => decoration + headingTag);
      publicationCovers.push({ path, title: context.title, collection: context.collection, label: context.label, language: context.language });
      coverCatalog.push({ ...context, path, art });
    }
    shell(html, path, frameForPath(frameBefore, path) + whiteMain + frameForPath(frameAfter, path));
    const preservedMain = whiteMain.replace(/<!--white-cover:start-->[\s\S]*?<!--white-cover:end-->/g, '').replaceAll('href="/white/', 'href="/');
    manuscripts.push({ path, original_main_sha256: hash(originalMain), white_main_sha256_after_normalizing_links: hash(preservedMain) });
  }
  if (manuscripts.some(row => row.original_main_sha256 !== row.white_main_sha256_after_normalizing_links)) throw new Error('Static manuscript preservation failed.');
  writeFileSync('dist/white/edition.json', JSON.stringify({ edition: 'White', base: '/white/', routes: generated, canonical_original_readers: true, manuscript_preservation: manuscripts, publication_covers: publicationCovers, social_card_sha256: hash(card) }, null, 2));
  const catalogFont = readFileSync('public/white-assets/manrope-latin.woff2').toString('base64');
  const catalogCss = readFileSync('src/white/PublicationCover.css', 'utf8');
  const catalogHtml = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>White edition — cover library</title><style>@font-face{font-family:Manrope;src:url(data:font/woff2;base64,${catalogFont}) format('woff2');font-weight:400 800}*{box-sizing:border-box}body{margin:0;background:#fff;color:#151714;font-family:Manrope,'Nirmala UI',sans-serif}header{padding:48px 5vw 32px;border-bottom:1px solid #ddd}h1{font-size:clamp(32px,5vw,64px);letter-spacing:-.06em;font-weight:600;margin:18px 0}p{line-height:1.7}input,select{font:inherit;padding:12px;margin:10px 12px 0 0;max-width:100%;border:1px solid #cdd2c6;background:#fff}input{width:320px}.catalog{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:38px;padding:40px 5vw}.catalog figure{margin:0;min-width:0}.catalog figure[hidden]{display:none}.catalog figcaption{font-size:12px;line-height:1.7;margin-top:15px;color:#5a605a}.catalog a{color:inherit}a:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #526345;outline-offset:4px}${catalogCss}</style><body class="white-site"><header><p>MisterLove · White edition · Local review only</p><h1>A cover for every question.</h1><p>${publicationCovers.length} covers, drawn from existing published titles. Collections and their articles share a colour and motif. No PDF or manuscript was changed.</p><label>Find a cover <input id="q" type="search" placeholder="Title, collection or part"></label><label>Show <select id="kind"><option value="collection">Collections</option><option value="article">Articles &amp; studies</option><option value="">All covers</option></select></label><label>Language <select id="language"><option value="">All languages</option><option value="en">English</option><option value="hi">Hindi</option><option value="pa">Punjabi</option></select></label><p id="count" role="status">${publicationCovers.length} covers</p><a href="http://127.0.0.1:5513/white/">Open the local White edition ↗</a></header><main class="catalog">${coverCatalog.sort((a,b)=>Number(a.isArticle)-Number(b.isArticle)||a.path.localeCompare(b.path,undefined,{numeric:true})).map(item => `<figure lang="${item.language}" data-language="${item.language}" data-kind="${item.isArticle ? 'article' : 'collection'}" data-title="${escape(`${item.title} ${item.collection} ${item.label}`.toLowerCase())}">${item.art}<figcaption><a href="http://127.0.0.1:5513/white${item.path}">${escape(item.label)} · ${escape(item.collection)}</a><br>${escape(item.title)}</figcaption></figure>`).join('')}</main><script>const q=document.querySelector('#q'),language=document.querySelector('#language'),kind=document.querySelector('#kind'),items=[...document.querySelectorAll('.catalog figure')];function filter(){let count=0;for(const item of items){item.hidden=!(item.dataset.title.includes(q.value.toLowerCase().trim())&&(!language.value||language.value===item.dataset.language)&&(!kind.value||kind.value===item.dataset.kind));if(!item.hidden)count++}document.querySelector('#count').textContent=count+' covers'}q.addEventListener('input',filter);language.addEventListener('change',filter);kind.addEventListener('change',filter);filter();</script></body></html>`;
  writeFileSync('docs/white-cover-catalog.html', catalogHtml);
  console.log(`white edition ✓ ${generated.length} direct-entry routes, ${manuscripts.length} preserved static readers/collections, ${publicationCovers.length} publication covers, self-hosted font, 1200×630 social card`);
} finally {
  await server.close();
}
