// Runs automatically after `npm run build` (npm's "postbuild" lifecycle hook).
// Prepares the static output to work on GitHub Pages (and any static host):
//   - 404.html mirrors index.html so client-side routes resolve on deep links / refresh
//   - .nojekyll stops GitHub Pages from running Jekyll over the build output
//   - sitemap.xml is generated from the writing manifest, so adding a piece or a
//     part can't leave the sitemap silently stale
import { copyFileSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { pieces } from '../src/data/writing.js';

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
  url({ loc: `${SITE}/writing/`, lastmod: today, changefreq: 'monthly', priority: '0.9' }),
];

for (const piece of pieces) {
  for (let n = 1; n <= piece.parts; n++) {
    urls.push(
      url({
        loc: `${SITE}/writing/${piece.slug}/part-${n}/`,
        lastmod: piece.published,
        changefreq: 'yearly',
        // Part 1 is the entry point readers should land on from search.
        priority: n === 1 ? '0.9' : '0.7',
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

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripTags = (s) =>
  s.replace(/<[^>]*>/g, ' ')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function shell({ path, title, description, canonical, jsonLd, noscript, keywords }) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
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

  if (jsonLd) {
    html = html.replace(
      '</head>',
      `  <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n    </script>\n  </head>`
    );
  }
  // Replace the homepage's no-JS fallback with this route's own.
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript>\n${noscript}\n    </noscript>`);

  const dir = `dist${path}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, html);
}

let shells = 0;

for (const piece of pieces) {
  const parts = (await piece.load()).default;

  shell({
    path: '/writing',
    title: `Writing — long-form research by Lovepreet Singh`,
    description:
      'Long-form work on subjects I refused to have a lazy opinion about. Researched properly, written plainly, every side given its strongest case.',
    canonical: `${SITE}/writing/`,
    keywords: `Lovepreet Singh writing, long-form research, essays, ${pieces.map((p) => p.title).join(', ')}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Writing — Lovepreet Singh',
      url: `${SITE}/writing`,
      author: { '@id': `${SITE}/#lovepreet-singh` },
      hasPart: pieces.map((p) => ({
        '@type': 'CreativeWorkSeries',
        name: `${p.title} — ${p.subtitle}`,
        url: `${SITE}/writing/${p.slug}/part-1/`,
        numberOfItems: p.parts,
      })),
    },
    noscript: `      <h1>Writing — Lovepreet Singh</h1>\n${pieces
      .map(
        (p) =>
          `      <h2>${esc(p.title)} — ${esc(p.subtitle)}</h2>\n      <p>${esc(p.standfirst)}</p>\n` +
          `      <ul>\n${parts
            .map((x) => `        <li><a href="/writing/${p.slug}/part-${x.n}">Part ${x.n}: ${esc(x.title)}</a></li>`)
            .join('\n')}\n      </ul>`
      )
      .join('\n')}`,
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
        'kisan andolan', 'farmers protest India', 'farm laws 2020', 'MSP', 'Punjab farmers',
        'Lovepreet Singh',
      ].join(', '),
      jsonLd: {
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
      },
      noscript:
        `      <h1>${esc(part.title)}</h1>\n` +
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

console.log(`postbuild ✓  404.html, .nojekyll, sitemap.xml (${urls.length} URLs), ${shells} pre-rendered routes`);
