// Render the same component for crawlers and the browser in both editions.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { myBooksMeta, myBooksStructuredData } from '../src/data/myBooks.js';

const SITE = 'https://misterlove.in';
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { default: MyBooks } = await server.ssrLoadModule('/src/pages/MyBooks.jsx');
  const { default: Nav } = await server.ssrLoadModule('/src/components/Nav.jsx');
  const { default: Footer } = await server.ssrLoadModule('/src/components/Footer.jsx');
  const { ExperienceProvider, PlainReadingProvider } = await server.ssrLoadModule('/src/components/ExperienceProvider.jsx');
  const { ThemeProvider } = await server.ssrLoadModule('/src/components/ThemeProvider.jsx');

  for (const white of [false, true]) {
    const path = `${white ? '/white' : ''}${myBooksMeta.path}`;
    const routed = body => React.createElement(StaticRouter, { basename: white ? '/white' : undefined, location: path },
      React.createElement(ThemeProvider, { initialTheme: 'light' },
        React.createElement(white ? PlainReadingProvider : ExperienceProvider, null, body)));
    const main = React.createElement('main', { id: 'main', tabIndex: -1, className: white ? undefined : 'main--reading' }, React.createElement(MyBooks));
    let html;
    if (white) {
      html = readFileSync('dist/white/books/index.html', 'utf8')
        .replace(/<main id="main"[\s\S]*?<\/main>/, renderToString(routed(main)));
      // The frame comes from a reading-shelf route; switch its edition links
      // and active state to this page without rewriting the other content.
      html = html.replace(/<nav class="edition-switch"[\s\S]*?<\/nav>/g, navigation => navigation.replace(/href="(?:\/white)?\/books\/?"/g, match => match.includes('/white/') ? 'href="/white/my-books/"' : 'href="/my-books/"'));
      html = html.replace(/<a\b[^>]*href="\/white\/books"[^>]*>/g, link => link.replace(/ aria-current="page"/g, '').replace(/class="active"/g, 'class=""'));
      html = html.replace(/<a\b[^>]*href="\/white\/my-books\/"[^>]*>/g, link => link.includes('aria-current') ? link : link.slice(0, -1) + ' aria-current="page">');
    } else {
      html = readFileSync('dist/index.html', 'utf8');
      const frame = React.createElement(React.Fragment, null,
        React.createElement('a', { className: 'skip-link', href: '#main' }, 'Skip to content'),
        React.createElement(Nav), main, React.createElement(Footer));
      html = html.replace('<div id="root"></div>', `<div id="root">${renderToString(routed(frame))}</div>`)
        .replace(/<noscript>[\s\S]*?<\/noscript>/, '');
    }
    if (!html.includes('Choose your next question.')) throw new Error(`Bookshop body missing at ${path}`);
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(myBooksMeta.title)}</title>`);
    const meta = {
      description: myBooksMeta.description, 'og:title': myBooksMeta.title,
      'og:description': myBooksMeta.description, 'og:url': SITE + myBooksMeta.path,
      'og:type': 'website', 'og:image': SITE + myBooksMeta.image,
      'og:image:secure_url': SITE + myBooksMeta.image, 'og:image:alt': myBooksMeta.imageAlt,
      'og:image:type': 'image/png', 'og:image:width': '1200', 'og:image:height': '630',
      'twitter:title': myBooksMeta.title, 'twitter:description': myBooksMeta.description,
      'twitter:image': SITE + myBooksMeta.image, 'twitter:image:alt': myBooksMeta.imageAlt,
    };
    for (const [key, value] of Object.entries(meta)) {
      html = html.replace(new RegExp(`(<meta (?:name|property)="${key}"\\s+content=")[^"]*(")`), `$1${esc(value)}$2`);
    }
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}${myBooksMeta.path}$2`);
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    const styles = new Set();
    const visited = new Set();
    function addStyles(key) {
      if (visited.has(key)) return;
      visited.add(key);
      const entry = manifest[key];
      if (!entry) throw new Error(`Missing manifest chunk ${key}`);
      (entry.css ?? []).forEach(css => styles.add(css));
      (entry.imports ?? []).forEach(addStyles);
    }
    [white ? 'src/white/WhiteApp.jsx' : 'src/App.jsx', 'src/pages/MyBooks.jsx'].forEach(addStyles);
    const css = [...styles].filter(css => !html.includes(`href="/${css}"`)).map(css => `<link rel="stylesheet" href="/${css}"/>`).join('');
    const data = JSON.stringify(myBooksStructuredData()).replace(/</g, '\\u003c');
    html = html.replace('</head>', `${css}<script type="application/ld+json">${data}</script></head>`);
    mkdirSync(`dist${path}`, { recursive: true });
    writeFileSync(`dist${path}index.html`, html);
  }
  const sitemapPath = 'dist/sitemap.xml';
  let sitemap = readFileSync(sitemapPath, 'utf8');
  if (!sitemap.includes(`<loc>${SITE}${myBooksMeta.path}</loc>`)) {
    sitemap = sitemap.replace('</urlset>', `  <url><loc>${SITE}${myBooksMeta.path}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n</urlset>`);
    writeFileSync(sitemapPath, sitemap);
  }
  console.log('my-books ✓ Original + White direct-entry pages, shared component, canonical, JSON-LD, social metadata and sitemap');
} finally {
  await server.close();
}
