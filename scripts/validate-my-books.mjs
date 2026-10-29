import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { myBooks, myBooksMeta } from '../src/data/myBooks.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const esc = value => value.replace(/&/g, '&amp;');
check(myBooks.length === 3 && new Set(myBooks.map(book => book.id)).size === 3, 'Exactly three distinct author books');
const available = myBooks.filter(book => book.status === 'available');
const pending = myBooks.filter(book => book.status === 'review');
check(available.length === 2 && pending.length === 1, 'Current verified availability: two stores and one pending review');
check(pending[0].id === 'debunked-islam' && pending[0].storeUrl === null, 'No invented Islam purchase URL');
for (const book of myBooks) {
  check(existsSync(`public${book.cover}`) && existsSync(`dist${book.cover}`), `Cover exists for ${book.title}`);
  check(Number.isInteger(book.pages) && book.pages > 0, `Print page count for ${book.title}`);
  if (book.storeUrl) check(new URL(book.storeUrl).host === 'store.pothi.com' && new URL(book.storeUrl).pathname.startsWith('/book/'), `Public Pothi store for ${book.title}`);
}
for (const white of [false, true]) {
  const path = `${white ? '/white' : ''}${myBooksMeta.path}`;
  const html = readFileSync(`dist${path}index.html`, 'utf8');
  check(html.includes(`<title>${myBooksMeta.title}</title>`), `${path} title`);
  check(html.includes('<link rel="canonical" href="https://misterlove.in/my-books/"'), `${path} canonical`);
  check(html.includes('content="https://misterlove.in/og/my-books.png"'), `${path} own social card`);
  check((html.match(/<article class="author-book /g) ?? []).length === 3, `${path} all three complete static cards`);
  check((html.match(/class="bookshop-buy"/g) ?? []).length === 2, `${path} only the two verified purchase buttons`);
  for (const book of available) {
    check(html.includes(`href="${book.storeUrl}" target="_blank" rel="noopener noreferrer"`), `${path} ${book.title} opens the correct store safely`);
    check(html.includes(`href="${esc(book.previewUrl)}"`), `${path} ${book.title} preview`);
  }
  check(html.includes('Paperback coming soon') && html.includes('Pothi review pending'), `${path} pending release shown truthfully`);
  check(html.includes(`href="${white ? '/white' : ''}/writing/debunked-islam/"`), `${path} correct complete reader link`);
  check(html.includes('href="/my-books/"') && html.includes('href="/white/my-books/"'), `${path} reciprocal edition switches`);
  check((html.match(/<main\b/g) ?? []).length === 1 && (html.match(/<h1\b/g) ?? []).length === 1, `${path} semantic main and title`);
  const structured = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  check(structured['@type'] === 'CollectionPage' && structured.mainEntity.itemListElement.length === 3, `${path} three-book schema`);
  check(!JSON.stringify(structured).includes('"offers"') && !JSON.stringify(structured).includes('"isbn"'), `${path} no invented prices, stock offers or ISBNs`);
  check(html.includes('MyBooks-') && html.includes('rel="modulepreload"'), `${path} route style and code preloads`);
  if (white) check(html.includes('content="noindex, follow"'), 'White preserves the duplicate-edition indexing policy');
}
const card = readFileSync('public/og/my-books.png');
check(card.readUInt32BE(16) === 1200 && card.readUInt32BE(20) === 630, 'Sharing card is 1200 × 630');
check(readFileSync('dist/og/my-books.png').equals(card), 'Built sharing card matches the source');
check(readFileSync('dist/sitemap.xml', 'utf8').includes('<loc>https://misterlove.in/my-books/</loc>'), 'Canonical page is in sitemap');
check(readFileSync('dist/books/index.html', 'utf8').includes('Famous books, taken apart.'), 'Existing close-reading shelf remains available');
check(readFileSync('dist/white/books/index.html', 'utf8').includes('Books, read closely.'), 'Existing White reading shelf remains available');
console.log(JSON.stringify({ status: 'PASS', checks, social_card_sha256: createHash('sha256').update(card).digest('hex'), routes: ['/my-books/', '/white/my-books/'], available: available.map(book => ({ title: book.title, url: book.storeUrl })), pending: pending.map(book => book.title) }, null, 2));
