// Runs automatically after `npm run build` (npm's "postbuild" lifecycle hook).
// Prepares the static output to work on GitHub Pages (and any static host):
//   - 404.html mirrors index.html so client-side routes resolve on deep links / refresh
//   - .nojekyll stops GitHub Pages from running Jekyll over the build output
//   - sitemap.xml is generated from the writing manifest, so adding a piece or a
//     part can't leave the sitemap silently stale
import { copyFileSync, writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { pieces, writingMeta, writingTotals } from '../src/data/writing.js';

const SITE = 'https://misterlove.in';
const today = new Date().toISOString().slice(0, 10);

copyFileSync('dist/index.html', 'dist/404.html');
writeFileSync('dist/.nojekyll', '');

const url = ({ loc, lastmod, changefreq, priority, image }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${image ? `
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
      title: 'Lovepreet Singh — Ethical Hacker, Security Architect &amp; Founder',
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

for (const piece of pieces) {
  // The topic page is the piece's front door — what /writing links to and what
  // someone sharing "this research" would send.
  urls.push(
    url({
      loc: `${SITE}/writing/${piece.slug}/`,
      lastmod: piece.published,
      changefreq: 'monthly',
      priority: '0.9',
      image: {
        loc: `${SITE}/og/${piece.slug}.png`,
        title: `${piece.title} — ${piece.subtitle}`.replace(/&/g, '&amp;'),
      },
    })
  );

  for (let n = 1; n <= piece.parts; n++) {
    urls.push(
      url({
        loc: `${SITE}/writing/${piece.slug}/part-${n}/`,
        lastmod: piece.published,
        changefreq: 'yearly',
        // Part 1 is the entry point readers should land on from search.
        priority: n === 1 ? '0.8' : '0.7',
      })
    );
  }
}

writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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

const crumbs = (trail) =>
  `<nav class="article__crumbs" aria-label="Breadcrumb">${trail
    .map((c, i) =>
      (i ? '<span class="article__crumb-sep" aria-hidden="true">/</span>' : '')
      + (c.href
        ? `<a class="article__crumb" href="${c.href}">${esc(c.name)}</a>`
        : `<span class="article__crumb is-current">${esc(c.name)}</span>`)
    )
    .join('')}</nav>`;

function articleBody(piece, part) {
  const base = `/writing/${piece.slug}`;
  return `<main id="main"><article class="article">
  <header class="article__head"><div class="container">
    ${crumbs([
      { name: 'Writing', href: '/writing/' },
      { name: piece.title, href: `${base}/` },
      { name: `Part ${part.n}` },
    ])}
    <div class="article__head-grid"><div class="article__head-main">
      <span class="article__partno mono">Part ${String(part.n).padStart(2, '0')} <span class="dim">of ${piece.parts}</span><span class="article__partlabel">${esc(part.label)}</span></span>
      <h1 class="article__title">${esc(part.title)}</h1>
      <p class="article__standfirst">${esc(part.lead)}</p>
    </div></div>
  </div></header>
  <div class="container"><div class="article__body"><div class="article__col">
    ${part.prologue ? `<section class="article__prologue">${part.prologueTitle ? `<h2 class="article__prologue-head">${esc(part.prologueTitle)}</h2>` : ''}<div class="prose">${part.prologue}</div></section>` : ''}
    <div class="prose">${part.html}</div>
    ${part.sources ? `<section class="article__sources" open><p class="mono">Sources &amp; further reading — Part ${part.n}</p><div class="prose prose--sources">${part.sources}</div></section>` : ''}
    <nav class="article__pager" aria-label="Article parts">
      ${part.n > 1 ? `<a class="article__pager-link article__pager-link--prev" href="${base}/part-${part.n - 1}/"><span class="mono">← Part ${String(part.n - 1).padStart(2, '0')}</span></a>` : '<span></span>'}
      ${part.n < piece.parts ? `<a class="article__pager-link article__pager-link--next" href="${base}/part-${part.n + 1}/"><span class="mono">Part ${String(part.n + 1).padStart(2, '0')} →</span></a>` : `<a class="article__pager-link article__pager-link--next" href="/writing/"><span class="mono">Back to all writing →</span></a>`}
    </nav>
  </div></div></div>
</article></main>`;
}

function topicBody(piece, parts) {
  const base = `/writing/${piece.slug}`;
  return `<main id="main"><div class="topicpage"><div class="container">
  ${crumbs([{ name: 'Writing', href: '/writing/' }, { name: piece.title }])}
  <h1 class="topic__title">${esc(piece.title)} — ${esc(piece.subtitle)}</h1>
  <p class="topicpage__stand">${esc(piece.standfirst)}</p>
  <p class="topicpage__summary">${esc(piece.summary)}</p>
  <p class="mono">${piece.parts} parts · ${piece.words.toLocaleString('en-IN')} words · ${esc(piece.displayDate)} · by Lovepreet Singh</p>
  <h2>Contents</h2>
  <ol class="feature__parts">${parts
    .map((p) => `<li><a class="partrow" href="${base}/part-${p.n}/"><span class="partrow__n mono">${String(p.n).padStart(2, '0')}</span><span class="partrow__body"><span class="partrow__label mono">${esc(p.label)}</span><span class="partrow__title">${esc(p.title)}</span><span class="partrow__lead">${esc(p.lead)}</span></span></a></li>`)
    .join('')}</ol>
  <p><a class="btn btn--ghost" href="/${piece.pdf}" download>Download the full PDF · ${piece.pdfSize}</a></p>
</div></div></main>`;
}

function shelfBody(loaded) {
  return `<main id="main"><div class="writingpage"><div class="container">
  <h1 class="writingpage__title">${esc(writingMeta.title)}</h1>
  <p class="writingpage__lead">${esc(writingMeta.lead)}</p>
  <p class="mono">${writingTotals.pieces} research pieces · ${writingTotals.parts} parts · ${writingTotals.words.toLocaleString('en-IN')} words</p>
  <ul class="topics">${loaded
    .map(({ piece: p, parts }) => `<li class="topic"><a class="topic__link" href="/writing/${p.slug}/"><span class="topic__body"><span class="mono topic__topic">${esc(p.topic)}</span><span class="topic__title">${esc(p.title)} — ${esc(p.subtitle)}</span><span class="topic__stand">${esc(p.standfirst)}</span><span class="topic__meta mono">${p.parts} parts · ${p.words.toLocaleString('en-IN')} words · ${esc(p.displayDate)}</span></span></a><ol>${parts
      .map((x) => `<li><a href="/writing/${p.slug}/part-${x.n}/">Part ${x.n} — ${esc(x.title)}</a></li>`)
      .join('')}</ol></li>`)
    .join('')}</ul>
</div></div></main>`;
}

function shell({ path, title, description, canonical, jsonLd, noscript, keywords, image, imageAlt, body, theme, extraMeta, css }) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    // Share card: the piece's own artwork rather than the site banner, so a
    // shared part previews that part. Generated by scripts/make-og-cards.mjs.
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta property="og:image:secure_url" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, `$1${esc(imageAlt)}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta name="twitter:image:alt" content=")[^"]*(")/, `$1${esc(imageAlt)}$2`)
    // The template's keywords describe the security practice; on a piece about
    // Indian farm policy they are just noise.
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
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[\s\S]*?(")/, `$1${esc(description)}$2`);

  const head = [];

  for (const ld of [].concat(jsonLd ?? [])) {
    head.push(`  <script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n    </script>`);
  }
  for (const [k, v] of Object.entries(extraMeta ?? {})) {
    head.push(`  <meta property="${k}" content="${esc(v)}" />`);
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

// Load every piece's parts up front — the index shell needs them all, and each
// piece needs its own, so fetching once avoids re-importing per template.
const loaded = [];
for (const piece of pieces) {
  loaded.push({ piece, parts: (await piece.load()).default });
}

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

for (const { piece, parts } of loaded) {
  /* ---- /writing/<slug> — the topic's front door ---- */
  const topicUrl = `${SITE}/writing/${piece.slug}/`;
  shell({
    path: `/writing/${piece.slug}`,
    title: `${piece.title} — ${piece.subtitle} | Lovepreet Singh`,
    description: piece.standfirst,
    canonical: topicUrl,
    keywords: [piece.title, ...piece.keywords, 'Lovepreet Singh'].join(', '),
    image: `${SITE}/og/${piece.slug}.png`,
    imageAlt: `${piece.title} — ${piece.subtitle}. ${piece.parts}-part research series by Lovepreet Singh.`,
    body: topicBody(piece, parts),
    css: ROUTE_CSS.writing,
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Writing', item: `${SITE}/writing/` },
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
      inLanguage: 'en',
      numberOfItems: piece.parts,
      author: { '@type': 'Person', '@id': `${SITE}/#lovepreet-singh`, name: 'Lovepreet Singh' },
      about: piece.topic.split(' · ').map((t) => ({ '@type': 'Thing', name: t })),
      hasPart: parts.map((x) => ({
        '@type': 'Article',
        headline: x.title,
        url: `${SITE}/writing/${piece.slug}/part-${x.n}/`,
        wordCount: x.words,
        position: x.n,
      })),
    }],
    noscript:
      `      <p><strong>${esc(piece.title)} — ${esc(piece.subtitle)}</strong></p>\n` +
      `      <p>${esc(piece.standfirst)}</p>\n` +
      `      <p>${esc(piece.summary)}</p>\n` +
      `      <p>${piece.parts} parts · ${piece.words.toLocaleString('en-IN')} words · by Lovepreet Singh, ${esc(piece.displayDate)}</p>\n` +
      `      <h2>Contents</h2>\n      <ul>\n${parts
        .map((x) => `        <li><a href="/writing/${piece.slug}/part-${x.n}/">Part ${x.n} — ${esc(x.title)}</a></li>`)
        .join('\n')}\n      </ul>`,
  });
  shells += 1;

  for (const part of parts) {
    const canonical = `${SITE}/writing/${piece.slug}/part-${part.n}/`;
    shell({
      path: `/writing/${piece.slug}/part-${part.n}`,
      title: `${part.title} — ${piece.title}: Part ${part.n} of ${piece.parts} | Lovepreet Singh`,
      description: part.lead || piece.standfirst,
      canonical,
      keywords: [
        piece.title, `${piece.title} part ${part.n}`, part.label.toLowerCase(),
        ...piece.keywords, 'Lovepreet Singh',
      ].join(', '),
      image: `${SITE}/og/${piece.slug}-part-${part.n}.png`,
      imageAlt: `${piece.title}, Part ${part.n} of ${piece.parts} — ${part.title}. By Lovepreet Singh.`,
      body: articleBody(piece, part),
      css: [ROUTE_CSS.article, ROUTE_CSS.writing],
      // The article reads on paper; set it before paint so there is no flash.
      theme: 'light',
      extraMeta: {
        'article:published_time': `${piece.published}T00:00:00+05:30`,
        'article:modified_time': `${piece.published}T00:00:00+05:30`,
        'article:author': 'Lovepreet Singh',
        'article:section': part.label,
        'article:tag': piece.keywords.slice(0, 6).join(', '),
      },
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Writing', item: `${SITE}/writing/` },
          { '@type': 'ListItem', position: 2, name: piece.title, item: `${SITE}/writing/${piece.slug}/` },
          { '@type': 'ListItem', position: 3, name: part.title, item: canonical },
        ],
      }, {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${part.title} — ${piece.title}: Part ${part.n}`,
        description: part.lead || piece.standfirst,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        datePublished: piece.published,
        inLanguage: 'en',
        wordCount: part.words,
        articleSection: part.label,
        isPartOf: {
          '@type': 'CreativeWorkSeries',
          name: `${piece.title} — ${piece.subtitle}`,
          url: `${SITE}/writing/${piece.slug}/part-1/`,
          numberOfItems: piece.parts,
        },
        author: { '@type': 'Person', '@id': `${SITE}/#lovepreet-singh`, name: 'Lovepreet Singh' },
        publisher: { '@id': `${SITE}/#lovepreet-singh` },
        about: piece.topic.split(' · ').map((t) => ({ '@type': 'Thing', name: t })),
        isAccessibleForFree: true,
      }],
      noscript:
        `      <p><strong>${esc(part.title)}</strong></p>\n` +
        `      <p><strong>${esc(piece.title)} — ${esc(piece.subtitle)}</strong> · Part ${part.n} of ${piece.parts} · by Lovepreet Singh</p>\n` +
        `      <p>${esc(part.lead)}</p>\n` +
        `      <h2>In this part</h2>\n      <ul>\n${part.toc
          .map((t) => `        <li>${esc(t.text)}</li>`)
          .join('\n')}\n      </ul>\n` +
        `      <p>${esc(stripTags(part.html).slice(0, 900))}…</p>\n` +
        `      <p><a href="${canonical}">Read the full part</a></p>`,
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
      <pubDate>${rssDate(piece.published)}</pubDate>
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
  + `feed.xml (${items.length} items), ${shells} pre-rendered routes`
);
