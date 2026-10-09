// Integration check for static routes, social assets and archive completeness.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import jpeg from 'jpeg-js';
import { features, featurePath, featureCard, featureStory, pressSite, carousels } from '../src/data/press.js';

const get = path => readFileSync(`dist${path}`, 'utf8');
const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
assert.equal(new Set(features.map(feature => feature.slug)).size, features.length, 'Feature slugs must be unique');
const original = features.flatMap(feature => feature.images).filter(image => image.provenance);
assert.equal(original.length, 19, 'Every supplied slide must be included once');
assert.equal(new Set(original.map(image => image.src)).size, 19, 'No duplicate archival slide assignments');
const sitemap = get('/sitemap.xml');
const cards = new Set();
for (const feature of [null, ...features]) {
  const path = feature ? featurePath(feature) : '/press/';
  const card = feature ? featureCard(feature) : '/og/press.jpg';
  const html = get(`${path}index.html`);
  const canonical = pressSite + path;
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${path}: one primary heading`);
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${path}: canonical`);
  assert.ok(html.includes(`property="og:url" content="${canonical}"`), `${path}: OG URL`);
  for (const property of ['og:image', 'og:image:secure_url']) assert.ok(html.includes(`property="${property}" content="${pressSite + card}"`), `${path}: ${property}`);
  assert.ok(html.includes(`name="twitter:image" content="${pressSite + card}"`), `${path}: Twitter image`);
  assert.ok(html.includes('property="og:image:type" content="image/jpeg"'), `${path}: image MIME`);
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), `${path}: large Twitter card`);
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${path}: sitemap entry`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
  const { width, height } = jpeg.decode(readFileSync(`dist${card}`), { useTArray: true, formatAsRGBA: false });
  assert.deepEqual([width, height], [1200, 630], `${card}: social dimensions`);
  cards.add(card);
  for (const match of html.matchAll(/(?:src|href)="(\/(?:press|og|assets)\/[^"?#]+)"/g)) {
    const file = match[1];
    assert.ok(existsSync(`dist${file.endsWith('/') ? `${file}index.html` : file}`), `${path}: missing ${file}`);
  }
  if (!feature) continue;
  assert.ok(html.includes(`<h1>${esc(feature.title)}</h1>`), `${path}: real title before JS`);
  assert.ok(html.includes(esc(feature.credit)), `${path}: publisher credit before JS`);
  assert.ok(html.includes(feature.source ?? feature.images[0].provenance), `${path}: source link`);
  for (const image of feature.images) assert.ok(existsSync(`dist${image.src}`), `${path}: original image`);
  const story = jpeg.decode(readFileSync(`dist${featureStory(feature)}`), { useTArray: true, formatAsRGBA: false });
  assert.deepEqual([story.width, story.height], [1080, 1920], `${path}: Story dimensions`);
}
assert.equal(cards.size, features.length + 1, 'Every feature needs a distinct OG card');
const index = get('/press/index.html');
for (const carousel of carousels) assert.ok(index.includes(carousel.url), 'Both original Instagram sources must be discoverable');
console.log(`Press verified: ${features.length + 1} static routes, ${cards.size} unique OG cards, ${features.length} Stories, all 19 original slides, metadata, links and sitemap.`);
