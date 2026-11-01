import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { listenMeta, podcastStructuredData } from '../src/data/podcastMeta.js';

const SITE = 'https://misterlove.in';
const podcast = JSON.parse(readFileSync('src/data/podcasts.json', 'utf8'));
const episodes = podcast.episodes.filter(episode => episode.src);
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { default: Listen } = await server.ssrLoadModule('/src/pages/Listen.jsx');
  const { default: Nav } = await server.ssrLoadModule('/src/components/Nav.jsx');
  const { default: Footer } = await server.ssrLoadModule('/src/components/Footer.jsx');
  const { ExperienceProvider, PlainReadingProvider } = await server.ssrLoadModule('/src/components/ExperienceProvider.jsx');
  const { ThemeProvider } = await server.ssrLoadModule('/src/components/ThemeProvider.jsx');
  for (const white of [false, true]) {
    const path = `${white ? '/white' : ''}/listen/`;
    const route = body => React.createElement(StaticRouter, { basename: white ? '/white' : undefined, location: path },
      React.createElement(ThemeProvider, { initialTheme: 'light' },
        React.createElement(white ? PlainReadingProvider : ExperienceProvider, null, body)));
    const main = React.createElement('main', { id: 'main', tabIndex: -1, className: white ? undefined : 'main--reading' }, React.createElement(Listen));
    let html;
    if (white) {
      html = readFileSync('dist/white/books/index.html', 'utf8')
        .replace(/<main id="main"[\s\S]*?<\/main>/, renderToString(route(main)))
        .replace(/<nav class="edition-switch"[\s\S]*?<\/nav>/g, navigation => navigation.replace(/href="(?:\/white)?\/books\/?"/g, match => match.includes('/white/') ? 'href="/white/listen/"' : 'href="/listen/"'))
        .replace(/<a\b[^>]*href="\/white\/books"[^>]*>/g, link => link.replace(/ aria-current="page"/g, '').replace(/class="active"/g, 'class=""'))
        .replace(/<a\b[^>]*href="\/white\/listen\/"[^>]*>/g, link => link.includes('aria-current') ? link : link.slice(0, -1) + ' aria-current="page">');
    } else {
      html = readFileSync('dist/index.html', 'utf8');
      const frame = React.createElement(React.Fragment, null,
        React.createElement('a', { className: 'skip-link', href: '#main' }, 'Skip to content'),
        React.createElement(Nav), main, React.createElement(Footer));
      html = html.replace('<div id="root"></div>', `<div id="root">${renderToString(route(frame))}</div>`)
        .replace(/<noscript>[\s\S]*?<\/noscript>/, '');
    }
    if (!html.includes('Choose a chapter.')) throw new Error(`Listening room missing at ${path}`);
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(listenMeta.title)}</title>`);
    const metadata = {
      description: listenMeta.description, 'og:title': listenMeta.title,
      'og:description': listenMeta.description, 'og:url': SITE + listenMeta.path,
      'og:type': 'website', 'og:image': SITE + listenMeta.image,
      'og:image:secure_url': SITE + listenMeta.image, 'og:image:alt': listenMeta.imageAlt,
      'og:image:type': 'image/png', 'og:image:width': '1200', 'og:image:height': '630',
      'twitter:title': listenMeta.title, 'twitter:description': listenMeta.description,
      'twitter:image': SITE + listenMeta.image, 'twitter:image:alt': listenMeta.imageAlt,
    };
    for (const [key, value] of Object.entries(metadata)) html = html.replace(new RegExp(`(<meta (?:name|property)="${key}"\\s+content=")[^"]*(")`), `$1${esc(value)}$2`);
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}${listenMeta.path}$2`)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    const styles = new Set();
    const visited = new Set();
    function addStyles(key) {
      if (visited.has(key)) return;
      visited.add(key);
      const entry = manifest[key];
      if (!entry) throw new Error(`Missing manifest chunk ${key}`);
      (entry.css || []).forEach(css => styles.add(css));
      (entry.imports || []).forEach(addStyles);
    }
    [white ? 'src/white/WhiteApp.jsx' : 'src/App.jsx', 'src/pages/Listen.jsx'].forEach(addStyles);
    const css = [...styles].filter(css => !html.includes(`href="/${css}"`)).map(css => `<link rel="stylesheet" href="/${css}"/>`).join('');
    html = html.replace('</head>', `${css}<link rel="alternate" type="application/rss+xml" title="DEBUNKED: ISLAM — Punjabi podcast" href="${listenMeta.feed}"/><script type="application/ld+json">${JSON.stringify(podcastStructuredData(podcast)).replace(/</g, '\\u003c')}</script></head>`);
    html = html.replace('</body>', `<noscript><section><h2>Listen without JavaScript</h2><p>Open a recording with your browser’s audio player.</p><ol>${episodes.map(episode => `<li><a href="${episode.src}">Chapter ${episode.n}: ${esc(episode.title)}</a></li>`).join('')}</ol></section></noscript></body>`);
    mkdirSync(`dist${path}`, { recursive: true });
    writeFileSync(`dist${path}index.html`, html);
  }
  let sitemap = readFileSync('dist/sitemap.xml', 'utf8');
  if (!sitemap.includes(`<loc>${SITE}/listen/</loc>`)) {
    sitemap = sitemap.replace('</urlset>', `  <url><loc>${SITE}/listen/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n</urlset>`);
    writeFileSync('dist/sitemap.xml', sitemap);
  }
  mkdirSync('dist/podcasts', { recursive: true });
  const feed = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>DEBUNKED: ISLAM — Punjabi chapter discussions</title><link>${SITE}/listen/</link><description>${esc(listenMeta.description)}</description><language>pa</language><copyright>Lovepreet Singh</copyright><atom:link href="${SITE}${listenMeta.feed}" rel="self" type="application/rss+xml"/><itunes:author>MisterLove</itunes:author><itunes:type>serial</itunes:type><itunes:image href="${SITE}${listenMeta.artwork}"/><image><url>${SITE}${listenMeta.artwork}</url><title>DEBUNKED: ISLAM</title><link>${SITE}/listen/</link></image>${episodes.map(episode => `<item><title>${esc(`Chapter ${episode.n}: ${episode.title}`)}</title><link>${SITE}/listen/?chapter=${episode.n}</link><guid isPermaLink="false">misterlove-debunked-islam-pa-chapter-${episode.n}</guid><description>${esc(`Punjabi discussion for chapter ${episode.n} of DEBUNKED: ISLAM by Lovepreet Singh. ${episode.title}. Read the chapter and follow its sources at ${SITE}${episode.readPath}`)}</description><enclosure url="${SITE}${episode.src}" length="${episode.bytes}" type="audio/mpeg"/><itunes:episode>${episode.n}</itunes:episode><itunes:duration>${Math.round(episode.duration)}</itunes:duration></item>`).join('')}</channel></rss>\n`;
  writeFileSync(`dist${listenMeta.feed}`, feed);
  mkdirSync('dist/podcasts', { recursive: true });
  writeFileSync('dist/podcasts/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/listen/"><link rel="canonical" href="${SITE}/listen/"><title>Listen | MisterLove</title></head><body><a href="/listen/">Open the listening room</a></body></html>`);
  console.log(`listen ✓ Original + White pages, ${episodes.length} episodes, podcast RSS, canonical, social metadata, JSON-LD and sitemap`);
} finally { await server.close(); }
