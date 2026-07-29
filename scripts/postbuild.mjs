// Runs automatically after `npm run build` (npm's "postbuild" lifecycle hook).
// Prepares the static output to work on GitHub Pages (and any static host):
//   - 404.html mirrors index.html so client-side routes resolve on deep links / refresh
//   - .nojekyll stops GitHub Pages from running Jekyll over the build output
//   - sitemap.xml is generated from the writing manifest, so adding a piece or a
//     part can't leave the sitemap silently stale
import { copyFileSync, writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import {
  pieces,
  writingMeta,
  writingTotals,
  contentsOf,
  isInProgress,
  getPieceForLanguage,
  pdfForPart,
  pdfsOf,
  publishedOf,
  writingPathOf,
} from '../src/data/writing.js';

const SITE = 'https://misterlove.in';
const today = new Date().toISOString().slice(0, 10);

copyFileSync('dist/index.html', 'dist/404.html');
writeFileSync('dist/.nojekyll', '');

/* Every route below is driven by the parts that actually exist in the data
   files, never by a piece's planned part count. A serialised piece announces
   fifteen parts long before it has written them, and a sitemap that promised
   the other fourteen would be fourteen 404s handed straight to Google. */
const loaded = [];
const editions = [];
for (const piece of pieces) {
  const english = getPieceForLanguage(piece.slug, 'en');
  const parts = (await english.load()).default;
  loaded.push({ piece: english, parts });
  editions.push({ piece: english, parts });

  for (const language of Object.keys(piece.translations ?? {})) {
    const edition = getPieceForLanguage(piece.slug, language);
    editions.push({ piece: edition, parts: (await edition.load()).default });
  }
}

/* The HTML below promises a route-specific social image. Fail the build before
   deployment if generation was skipped, a filename drifted, or a card has the
   wrong dimensions. PNG stores width and height in the IHDR header. */
const expectedOgCards = new Set(['writing.png']);
for (const { piece, parts } of editions) {
  const imageSlug = piece.ogSlug ?? piece.slug;
  expectedOgCards.add(`${imageSlug}.png`);
  for (const part of parts) expectedOgCards.add(`${imageSlug}-part-${part.n}.png`);
}

const ogErrors = [];
for (const name of expectedOgCards) {
  const path = `dist/og/${name}`;
  if (!existsSync(path)) {
    ogErrors.push(`${name}: missing`);
    continue;
  }

  const png = readFileSync(path);
  const signature = png.subarray(1, 4).toString('ascii');
  if (png.length < 24 || signature !== 'PNG') {
    ogErrors.push(`${name}: not a readable PNG`);
    continue;
  }

  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== 1200 || height !== 630) {
    ogErrors.push(`${name}: ${width}×${height}, expected 1200×630`);
  }
}

if (ogErrors.length) {
  throw new Error(`OG card validation failed:\n  ${ogErrors.join('\n  ')}`);
}

const alternatesFor = (piece, part) => {
  if (!piece.translations?.hi) return [];
  const suffix = part ? `/part-${part}/` : '/';
  return [
    { language: 'en', href: `${SITE}/writing/${piece.slug}${suffix}` },
    { language: 'hi', href: `${SITE}/hi/writing/${piece.slug}${suffix}` },
    { language: 'x-default', href: `${SITE}/writing/${piece.slug}${suffix}` },
  ];
};

const url = ({ loc, lastmod, changefreq, priority, image, alternates = [] }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${alternates.map((alternate) => `
    <xhtml:link rel="alternate" hreflang="${alternate.language}" href="${alternate.href}" />`).join('')}${image ? `
    <image:image>
      <image:loc>${image.loc}</image:loc>
      <image:title>${image.title}</image:title>
    </image:image>` : ''}
  </url>`;

const urls = [
  url({
    loc: `${SITE}/`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '1.0',
    image: {
      loc: `${SITE}/og.png`,
      title: 'Lovepreet Singh — Cybersecurity Professional, Scholar and Writer',
    },
  }),
  // Trailing slashes throughout: these routes are pre-rendered as directories,
  // and GitHub Pages 301s the slash-less form to them. Pointing the sitemap and
  // canonicals at the form that answers 200 directly avoids sending every
  // crawl through a redirect.
  url({
    loc: `${SITE}/writing/`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.9',
    image: {
      loc: `${SITE}/og/writing.png`,
      title: 'Writing — long-form research by Lovepreet Singh',
    },
  }),
];

for (const { piece, parts } of editions) {
  const base = writingPathOf(piece);
  const imageSlug = piece.ogSlug ?? piece.slug;
  // The topic page is the piece's front door — what /writing links to and what
  // someone sharing "this research" would send.
  urls.push(
    url({
      loc: `${SITE}${base}/`,
      lastmod: publishedOf(piece, parts.at(-1)),
      changefreq: 'monthly',
      priority: '0.9',
      alternates: alternatesFor(piece),
      image: {
        loc: `${SITE}/og/${imageSlug}.png`,
        title: `${piece.title} — ${piece.subtitle}`.replace(/&/g, '&amp;'),
      },
    })
  );

  for (const part of parts) {
    urls.push(
      url({
        loc: `${SITE}${base}/part-${part.n}/`,
        lastmod: publishedOf(piece, part),
        changefreq: 'yearly',
        // Part 1 is the entry point readers should land on from search.
        priority: part.n === 1 ? '0.8' : '0.7',
        alternates: alternatesFor(piece, part.n),
      })
    );
  }
}

writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`
);

/* ------------------------------------------------------------------
   Pre-rendered route shells.

   GitHub Pages has no server-side rewrite: an unknown path falls back to
   404.html, which loads the SPA fine for a visitor but answers HTTP 404 with
   the homepage's <title>. Crawlers take that at face value and drop the page,
   so every writing route would stay unindexed no matter what the sitemap says.

   Writing a real index.html at each route makes the path a genuine 200 with
   its own title, description, canonical and structured data in the served
   markup — before any JavaScript runs. React still mounts and takes over; this
   only fixes what the crawler is handed first.
   ------------------------------------------------------------------ */
const template = readFileSync('dist/index.html', 'utf8');

/* The route stylesheets ship in lazy chunks, so index.html only links the main
   one. The pre-rendered markup below uses those route classes — without the
   stylesheet the static content lands unstyled for anyone whose JS has not run
   yet (or at all), and everyone else gets a repaint when the chunk finally
   arrives. Link them up front instead: the CSS then downloads in parallel with
   the bundle rather than after it. */
const cssFor = (name) => {
  const hit = readdirSync('dist/assets').find((f) => f.startsWith(`${name}-`) && f.endsWith('.css'));
  return hit ? `  <link rel="stylesheet" href="/assets/${hit}" />` : '';
};
const ROUTE_CSS = { article: cssFor('Article'), writing: cssFor('Writing') };

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripTags = (s) =>
  s.replace(/<[^>]*>/g, ' ')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/* ------------------------------------------------------------------
   Static body.

   The SPA leaves <div id="root"> empty, so a crawler that does not execute
   JavaScript sees the metadata and nothing else — 291 words of a 7,800-word
   part. Google renders JS eventually, but rendering is deferred and most
   other crawlers (Bing, social unfurlers, the AI search bots) do not render
   at all. So each shell now ships the real article inside #root, using the
   site's own class names so the existing CSS styles it.

   main.jsx mounts with createRoot().render(), which replaces this markup
   rather than hydrating it — no mismatch warnings, and the reader sees text
   immediately instead of waiting on the bundle.
   ------------------------------------------------------------------ */

const crumbs = (trail, label = 'Breadcrumb') =>
  `<nav class="article__crumbs" aria-label="${esc(label)}">${trail
    .map((c, i) =>
      (i ? '<span class="article__crumb-sep" aria-hidden="true">/</span>' : '')
      + (c.href
        ? `<a class="article__crumb" href="${c.href}">${esc(c.name)}</a>`
        : `<span class="article__crumb is-current">${esc(c.name)}</span>`)
    )
    .join('')}</nav>`;

const staticCopy = (piece) => (piece.language === 'hi' ? {
  writing: 'लेखन',
  part: 'भाग',
  of: '/',
  sources: 'स्रोत और आगे की पढ़ाई',
  allParts: 'सभी भाग',
  back: 'सभी लेखों पर वापस जाएं →',
  parts: 'भाग',
  published: 'प्रकाशित',
  words: 'शब्द',
  contents: 'विषय सूची',
  minutes: 'मिनट',
  preparing: 'तैयार हो रहा है',
  download: (pdf) => `मूल अंग्रेज़ी PDF डाउनलोड करें · ${pdf.size}`,
  by: 'लेखक',
  readFull: 'पूरा भाग पढ़ें',
  inThisPart: 'इस भाग में',
  partsAria: 'लेख के भाग',
} : {
  writing: 'Writing',
  part: 'Part',
  of: 'of',
  sources: 'Sources & further reading',
  allParts: 'All parts',
  back: 'Back to all writing →',
  parts: 'parts',
  published: 'published',
  words: 'words',
  contents: 'Contents',
  minutes: 'min',
  preparing: 'In preparation',
  download: (pdf) => (
    piece.pdfs
      ? `Download ${pdf.label ?? 'the PDF'} · ${pdf.size}`
      : `Download ${piece.pdfLabel ?? 'the full PDF'} · ${piece.pdfSize}`
  ),
  by: 'by',
  readFull: 'Read the full part',
  inThisPart: 'In this part',
  partsAria: 'Article parts',
});

function articleBody(piece, part, live) {
  const base = writingPathOf(piece);
  const copy = staticCopy(piece);
  const pdf = pdfForPart(piece, part);
  const download = pdf
    ? `<p><a class="btn btn--ghost" href="/${pdf.file}" download>${esc(copy.download(pdf))}</a></p>`
    : '';
  return `<main id="main"><article class="article${piece.language === 'hi' ? ' article--hi' : ''}" lang="${piece.language}">
  <header class="article__head"><div class="container">
    ${crumbs([
      { name: copy.writing, href: '/writing/' },
      { name: piece.title, href: `${base}/` },
      { name: `${copy.part} ${part.n}` },
    ], piece.language === 'hi' ? 'पृष्ठ क्रम' : 'Breadcrumb')}
    <div class="article__head-grid"><div class="article__head-main">
      <span class="article__partno mono">${copy.part} ${String(part.n).padStart(2, '0')} <span class="dim">${copy.of} ${piece.parts}</span><span class="article__partlabel">${esc(part.label)}</span></span>
      <h1 class="article__title">${esc(part.title)}</h1>
      <p class="article__standfirst">${esc(part.lead)}</p>
    </div></div>
  </div></header>
  <div class="container"><div class="article__body"><div class="article__col">
    ${part.prologue ? `<section class="article__prologue">${part.prologueTitle ? `<h2 class="article__prologue-head">${esc(part.prologueTitle)}</h2>` : ''}<div class="prose">${part.prologue}</div></section>` : ''}
    <div class="prose">${part.html}</div>
    ${part.sources ? `<section class="article__sources" open><p class="mono">${copy.sources} — ${copy.part} ${part.n}</p><div class="prose prose--sources">${part.sources}</div></section>` : ''}
    ${download}
    <nav class="article__pager" aria-label="${copy.partsAria}">
      ${part.n > 1 ? `<a class="article__pager-link article__pager-link--prev" href="${base}/part-${part.n - 1}/"><span class="mono">← ${copy.part} ${String(part.n - 1).padStart(2, '0')}</span></a>` : '<span></span>'}
      ${part.n < live ? `<a class="article__pager-link article__pager-link--next" href="${base}/part-${part.n + 1}/"><span class="mono">${copy.part} ${String(part.n + 1).padStart(2, '0')} →</span></a>` : `<a class="article__pager-link article__pager-link--next" href="${isInProgress(piece) ? `${base}/` : '/writing/'}"><span class="mono">${isInProgress(piece) ? `${copy.allParts} →` : copy.back}</span></a>`}
    </nav>
  </div></div></div>
</article></main>`;
}

function topicBody(piece, parts) {
  const base = writingPathOf(piece);
  const copy = staticCopy(piece);
  const downloads = pdfsOf(piece)
    .map((pdf) => `<a class="btn btn--ghost" href="/${pdf.file}" download>${esc(copy.download(pdf))}</a>`)
    .join(' ');
  // The whole announced series, not just what is written: a crawler that sees
  // the shape of the work indexes the topic page for the subjects still to
  // come, and the unwritten rows are plain markup with no href to follow.
  const contents = contentsOf(piece, parts);
  const count = isInProgress(piece)
    ? `${parts.length} / ${piece.parts} ${copy.parts} ${copy.published}`
    : `${piece.parts} ${copy.parts}`;

  const row = (p) => `<span class="partrow__n mono">${String(p.n).padStart(2, '0')}</span><span class="partrow__body"><span class="partrow__label mono">${esc(p.label)}</span><span class="partrow__title">${esc(p.title)}</span><span class="partrow__lead">${esc(p.lead)}</span></span><span class="partrow__meta mono">${p.live ? `${p.minutes} ${copy.minutes}` : copy.preparing}</span>`;

  return `<main id="main"><div class="topicpage${piece.language === 'hi' ? ' topicpage--hi' : ''}" lang="${piece.language}"><div class="container">
  ${crumbs(
    [{ name: copy.writing, href: '/writing/' }, { name: piece.title }],
    piece.language === 'hi' ? 'पृष्ठ क्रम' : 'Breadcrumb'
  )}
  <h1 class="topic__title">${esc(piece.title)} — ${esc(piece.subtitle)}</h1>
  <p class="topicpage__stand">${esc(piece.standfirst)}</p>
  <p class="topicpage__summary">${esc(piece.summary)}</p>
  <p class="mono">${count} · ${piece.words.toLocaleString('en-IN')} ${copy.words} · ${esc(piece.displayDate)} · ${copy.by} Lovepreet Singh</p>
  <h2>${copy.contents}</h2>
  <ol class="feature__parts">${contents
    .map((p) => `<li>${p.live
      ? `<a class="partrow" href="${base}/part-${p.n}/">${row(p)}</a>`
      : `<span class="partrow partrow--soon">${row(p)}</span>`}</li>`)
    .join('')}</ol>
  ${downloads ? `<p>${downloads}</p>` : ''}
</div></div></main>`;
}

function shelfBody(loaded) {
  return `<main id="main"><div class="writingpage"><div class="container">
  <h1 class="writingpage__title">${esc(writingMeta.title)}</h1>
  <p class="writingpage__lead">${esc(writingMeta.lead)}</p>
  <p class="mono">${writingTotals.pieces} research pieces · ${writingTotals.parts} parts · ${writingTotals.words.toLocaleString('en-IN')} words</p>
  <ul class="topics">${loaded
    .map(({ piece: p, parts }) => `<li class="topic"><a class="topic__link" href="/writing/${p.slug}/"><span class="topic__body"><span class="mono topic__topic">${esc(p.topic)}</span><span class="topic__title">${esc(p.title)} — ${esc(p.subtitle)}</span><span class="topic__stand">${esc(p.standfirst)}</span><span class="topic__meta mono">${isInProgress(p) ? `${parts.length} of ${p.parts} parts` : `${p.parts} parts`} · ${p.words.toLocaleString('en-IN')} words · ${esc(p.displayDate)}</span></span></a><ol>${parts
      .map((x) => `<li><a href="/writing/${p.slug}/part-${x.n}/">Part ${x.n} — ${esc(x.title)}</a></li>`)
      .join('')}</ol></li>`)
    .join('')}</ul>
</div></div></main>`;
}

function shell({
  path,
  title,
  description,
  canonical,
  jsonLd,
  noscript,
  keywords,
  image,
  imageAlt,
  body,
  theme,
  extraMeta,
  css,
  language = 'en',
  locale = 'en_US',
  alternates = [],
}) {
  let html = template
    .replace(/<html lang="[^"]*"/, `<html lang="${language}"`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    // Share card: the piece's own artwork rather than the site banner, so a
    // shared part previews that part. Generated by scripts/make-og-cards.mjs.
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta property="og:image:secure_url" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, `$1${esc(imageAlt)}$2`)
    .replace(
      /(<meta property="og:image:width" content=")[^"]*(")/,
      (_, prefix, suffix) => `${prefix}1200${suffix}`
    )
    .replace(
      /(<meta property="og:image:height" content=")[^"]*(")/,
      (_, prefix, suffix) => `${prefix}630${suffix}`
    )
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta name="twitter:image:alt" content=")[^"]*(")/, `$1${esc(imageAlt)}$2`)
    // The homepage keywords describe the person and the wider archive. Each
    // reading route gets the terms for its own subject instead.
    .replace(/(<meta name="keywords" content=")[^"]*(")/, `$1${esc(keywords)}$2`)
    .replace(
      /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
      `$1${esc(description)}$2`
    )
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[\s\S]*?(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1article$2`)
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${locale}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[\s\S]*?(")/, `$1${esc(description)}$2`);

  const head = [];

  for (const ld of [].concat(jsonLd ?? [])) {
    head.push(`  <script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n    </script>`);
  }
  for (const [k, v] of Object.entries(extraMeta ?? {})) {
    head.push(`  <meta property="${k}" content="${esc(v)}" />`);
  }
  for (const alternate of alternates) {
    head.push(`  <link rel="alternate" hreflang="${alternate.language}" href="${alternate.href}" />`);
  }
  if (alternates.length) {
    head.push(`  <meta property="og:locale:alternate" content="${locale === 'hi_IN' ? 'en_IN' : 'hi_IN'}" />`);
  }
  head.push('  <link rel="alternate" type="application/rss+xml" title="Writing — Lovepreet Singh" href="https://misterlove.in/feed.xml" />');
  for (const c of [].concat(css ?? [])) if (c) head.push(c);

  // Set the reading theme before first paint so the article does not flash
  // from the site's dark default to paper. Matches useReaderTheme's key.
  if (theme) {
    head.push(
      '  <script>try{var t=localStorage.getItem("lws:reader-theme");'
      + `document.documentElement.dataset.theme=t==="dark"?"dark":"${theme}"}`
      + `catch(e){document.documentElement.dataset.theme="${theme}"}</script>`
    );
  }

  html = html.replace('</head>', `${head.join('\n')}\n  </head>`);

  // Swap the homepage's no-JS fallback for this route's own.
  //
  // Target it by content, not position: <head> also carries a <noscript> that
  // loads the reading serif, and a naive first-match replace drops article
  // markup into the head while leaving the real fallback in place — which
  // also left two <h1>s in the document.
  //
  // With #root now carrying the full article, this block is only a safety net,
  // so it stays short and headingless rather than duplicating the page.
  html = html.replace(
    /<noscript>\s*<h1>[\s\S]*?<\/noscript>/,
    `<noscript>\n${noscript}\n    </noscript>`
  );

  // Ship the real content inside #root. React replaces it on mount.
  if (body) html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const dir = `dist${path}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, html);
}

let shells = 0;

/* ---- /writing — the shelf. Written once, listing every piece. ---- */
shell({
  path: '/writing',
  title: 'Writing — long-form research by Lovepreet Singh',
  description:
    'Long-form work on subjects I refused to have a lazy opinion about. Researched properly, written plainly, every side given its strongest case.',
  canonical: `${SITE}/writing/`,
  keywords: `Lovepreet Singh writing, long-form research, essays, ${pieces.map((p) => p.title).join(', ')}`,
  // The shelf has its own card listing the research — not a borrowed cover
  // from whichever piece happens to be newest.
  image: `${SITE}/og/writing.png`,
  imageAlt: `Writing by Lovepreet Singh — ${pieces.length} long-form research pieces, ${writingTotals.parts} parts, ${writingTotals.words.toLocaleString('en-IN')} words.`,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Writing — Lovepreet Singh',
    url: `${SITE}/writing/`,
    author: { '@id': `${SITE}/#lovepreet-singh` },
    hasPart: pieces.map((p) => ({
      '@type': 'CreativeWorkSeries',
      name: `${p.title} — ${p.subtitle}`,
      url: `${SITE}/writing/${p.slug}/`,
      numberOfItems: p.parts,
      abstract: p.standfirst,
    })),
  },
  body: shelfBody(loaded),
  css: ROUTE_CSS.writing,
  noscript:
    '      <p><strong>Writing — Lovepreet Singh</strong></p>\n' +
    loaded
      .map(({ piece: p, parts }) =>
        `      <h2><a href="/writing/${p.slug}/">${esc(p.title)} — ${esc(p.subtitle)}</a></h2>\n` +
        `      <p>${esc(p.standfirst)}</p>\n` +
        `      <ul>\n${parts
          .map((x) => `        <li><a href="/writing/${p.slug}/part-${x.n}/">Part ${x.n}: ${esc(x.title)}</a></li>`)
          .join('\n')}\n      </ul>`
      )
      .join('\n'),
});
shells += 1;

for (const { piece, parts } of editions) {
  /* ---- English or Hindi topic front door. ---- */
  const copy = staticCopy(piece);
  const topicPath = writingPathOf(piece);
  const topicUrl = `${SITE}${topicPath}/`;
  const imageSlug = piece.ogSlug ?? piece.slug;
  const alternates = alternatesFor(piece);
  shell({
    path: topicPath,
    title: `${piece.title} — ${piece.subtitle} | Lovepreet Singh`,
    description: piece.standfirst,
    canonical: topicUrl,
    keywords: [piece.title, ...piece.keywords, 'Lovepreet Singh'].join(', '),
    image: `${SITE}/og/${imageSlug}.png`,
    imageAlt: piece.language === 'hi'
      ? `${piece.title} — ${piece.subtitle}। Lovepreet Singh की ${piece.parts} भागों वाली शोध श्रृंखला।`
      : `${piece.title} — ${piece.subtitle}. ${piece.parts}-part research series by Lovepreet Singh.`,
    body: topicBody(piece, parts),
    css: ROUTE_CSS.writing,
    language: piece.language,
    locale: piece.locale,
    alternates,
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: copy.writing, item: `${SITE}/writing/` },
        { '@type': 'ListItem', position: 2, name: piece.title, item: topicUrl },
      ],
    }, {
      '@context': 'https://schema.org',
      '@type': 'CreativeWorkSeries',
      name: `${piece.title} — ${piece.subtitle}`,
      url: topicUrl,
      description: piece.standfirst,
      abstract: piece.summary,
      datePublished: piece.published,
      inLanguage: piece.language,
      numberOfItems: piece.parts,
      author: { '@type': 'Person', '@id': `${SITE}/#lovepreet-singh`, name: 'Lovepreet Singh' },
      about: piece.topic.split(' · ').map((t) => ({ '@type': 'Thing', name: t })),
      hasPart: parts.map((x) => ({
        '@type': 'Article',
        headline: x.title,
        url: `${SITE}${topicPath}/part-${x.n}/`,
        wordCount: x.words,
        position: x.n,
      })),
      ...(piece.language === 'hi' ? {
        translationOfWork: {
          '@type': 'CreativeWorkSeries',
          inLanguage: 'en',
          url: `${SITE}/writing/${piece.slug}/`,
        },
      } : piece.translations?.hi ? {
        workTranslation: {
          '@type': 'CreativeWorkSeries',
          inLanguage: 'hi',
          url: `${SITE}/hi/writing/${piece.slug}/`,
        },
      } : {}),
    }],
    noscript:
      `      <p><strong>${esc(piece.title)} — ${esc(piece.subtitle)}</strong></p>\n` +
      `      <p>${esc(piece.standfirst)}</p>\n` +
      `      <p>${esc(piece.summary)}</p>\n` +
      `      <p>${isInProgress(piece) ? `${parts.length} / ${piece.parts} ${copy.parts} ${copy.published}` : `${piece.parts} ${copy.parts}`} · ${piece.words.toLocaleString('en-IN')} ${copy.words} · ${copy.by} Lovepreet Singh, ${esc(piece.displayDate)}</p>\n` +
      `      <h2>${copy.contents}</h2>\n      <ul>\n${contentsOf(piece, parts)
        .map((x) => (x.live
          ? `        <li><a href="${topicPath}/part-${x.n}/">${copy.part} ${x.n} — ${esc(x.title)}</a></li>`
          : `        <li>${copy.part} ${x.n} — ${esc(x.title)} (${copy.preparing})</li>`))
        .join('\n')}\n      </ul>`,
  });
  shells += 1;

  for (const part of parts) {
    const canonical = `${SITE}${topicPath}/part-${part.n}/`;
    const partAlternates = alternatesFor(piece, part.n);
    const partPublished = publishedOf(piece, part);
    shell({
      path: `${topicPath}/part-${part.n}`,
      title: piece.language === 'hi'
        ? `${part.title} — ${piece.title}: भाग ${part.n}/${piece.parts} | Lovepreet Singh`
        : `${part.title} — ${piece.title}: Part ${part.n} of ${piece.parts} | Lovepreet Singh`,
      description: part.lead || piece.standfirst,
      canonical,
      keywords: [
        piece.title, `${piece.title} ${copy.part} ${part.n}`, part.label.toLowerCase(),
        ...piece.keywords, 'Lovepreet Singh',
      ].join(', '),
      image: `${SITE}/og/${imageSlug}-part-${part.n}.png`,
      imageAlt: piece.language === 'hi'
        ? `${piece.title}, ${piece.parts} में से भाग ${part.n} — ${part.title}। लेखक: Lovepreet Singh।`
        : `${piece.title}, Part ${part.n} of ${piece.parts} — ${part.title}. By Lovepreet Singh.`,
      body: articleBody(piece, part, parts.length),
      css: [ROUTE_CSS.article, ROUTE_CSS.writing],
      language: piece.language,
      locale: piece.locale,
      alternates: partAlternates,
      // The article reads on paper; set it before paint so there is no flash.
      theme: 'light',
      extraMeta: {
        'article:published_time': `${partPublished}T00:00:00+05:30`,
        'article:modified_time': `${partPublished}T00:00:00+05:30`,
        'article:author': 'Lovepreet Singh',
        'article:section': part.label,
        'article:tag': piece.keywords.slice(0, 6).join(', '),
      },
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: copy.writing, item: `${SITE}/writing/` },
          { '@type': 'ListItem', position: 2, name: piece.title, item: topicUrl },
          { '@type': 'ListItem', position: 3, name: part.title, item: canonical },
        ],
      }, {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: piece.language === 'hi'
          ? `${part.title} — ${piece.title}: भाग ${part.n}`
          : `${part.title} — ${piece.title}: Part ${part.n}`,
        description: part.lead || piece.standfirst,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        datePublished: partPublished,
        inLanguage: piece.language,
        wordCount: part.words,
        articleSection: part.label,
        isPartOf: {
          '@type': 'CreativeWorkSeries',
          name: `${piece.title} — ${piece.subtitle}`,
          url: topicUrl,
          numberOfItems: piece.parts,
        },
        author: { '@type': 'Person', '@id': `${SITE}/#lovepreet-singh`, name: 'Lovepreet Singh' },
        publisher: { '@id': `${SITE}/#lovepreet-singh` },
        about: piece.topic.split(' · ').map((t) => ({ '@type': 'Thing', name: t })),
        isAccessibleForFree: true,
        ...(piece.language === 'hi' ? {
          translationOfWork: {
            '@type': 'Article',
            inLanguage: 'en',
            url: `${SITE}/writing/${piece.slug}/part-${part.n}/`,
          },
        } : piece.translations?.hi ? {
          workTranslation: {
            '@type': 'Article',
            inLanguage: 'hi',
            url: `${SITE}/hi/writing/${piece.slug}/part-${part.n}/`,
          },
        } : {}),
      }],
      noscript:
        `      <p><strong>${esc(part.title)}</strong></p>\n` +
        `      <p><strong>${esc(piece.title)} — ${esc(piece.subtitle)}</strong> · ${copy.part} ${part.n} ${copy.of} ${piece.parts} · ${copy.by} Lovepreet Singh</p>\n` +
        `      <p>${esc(part.lead)}</p>\n` +
        `      <h2>${copy.inThisPart}</h2>\n      <ul>\n${part.toc
          .map((t) => `        <li>${esc(t.text)}</li>`)
          .join('\n')}\n      </ul>\n` +
        `      <p>${esc(stripTags(part.html).slice(0, 900))}…</p>\n` +
        `      <p><a href="${canonical}">${copy.readFull}</a></p>`,
    });
    shells += 1;
  }
}

/* ---- RSS ----------------------------------------------------------------
   One item per part, newest piece first. Gives readers and aggregators
   something to subscribe to, and gives crawlers a second discovery path
   into every part alongside the sitemap. */
const rssDate = (d) => new Date(`${d}T00:00:00+05:30`).toUTCString();

const items = loaded.flatMap(({ piece, parts }) =>
  parts.map((part) => `    <item>
      <title>${esc(`${piece.title} — Part ${part.n}: ${part.title}`)}</title>
      <link>${SITE}/writing/${piece.slug}/part-${part.n}/</link>
      <guid isPermaLink="true">${SITE}/writing/${piece.slug}/part-${part.n}/</guid>
      <pubDate>${rssDate(publishedOf(piece, part))}</pubDate>
      <category>${esc(piece.topic.split(' · ')[0])}</category>
      <description>${esc(part.lead || piece.standfirst)}</description>
    </item>`)
);

writeFileSync(
  'dist/feed.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Writing — Lovepreet Singh</title>
    <link>${SITE}/writing/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(writingMeta.lead)}</description>
    <language>en</language>
    <lastBuildDate>${rssDate(today)}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`
);

console.log(
  `postbuild ✓  404.html, .nojekyll, sitemap.xml (${urls.length} URLs), `
  + `feed.xml (${items.length} items), ${shells} pre-rendered routes, `
  + `${expectedOgCards.size} route-specific OG cards`
);
