// Runs automatically after `npm run build` (npm's "postbuild" lifecycle hook).
// Prepares the static output to work on GitHub Pages (and any static host):
//   - 404.html mirrors index.html so client-side routes resolve on deep links / refresh
//   - .nojekyll stops GitHub Pages from running Jekyll over the build output
//   - sitemap.xml is generated from the writing manifest, so adding a piece or a
//     part can't leave the sitemap silently stale
import { copyFileSync, writeFileSync } from 'node:fs';
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
  url({ loc: `${SITE}/writing`, lastmod: today, changefreq: 'monthly', priority: '0.9' }),
];

for (const piece of pieces) {
  for (let n = 1; n <= piece.parts; n++) {
    urls.push(
      url({
        loc: `${SITE}/writing/${piece.slug}/part-${n}`,
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

console.log(`postbuild ✓  404.html, .nojekyll, sitemap.xml (${urls.length} URLs)`);
