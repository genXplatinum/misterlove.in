import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { myBooks } from '../src/data/myBooks.js';

const dataUri = path => `data:image/${path.endsWith('.jpg') ? 'jpeg' : 'png'};base64,${readFileSync(`public${path}`).toString('base64')}`;
const cover = (book, x, y, angle) => `<g transform="translate(${x} ${y}) rotate(${angle} 90 135)"><rect x="8" y="13" width="180" height="270" fill="#000" opacity=".32"/><image href="${dataUri(book.cover)}" width="180" height="270"/></g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#1b2921"/>
<circle cx="920" cy="300" r="237" fill="#25372b" stroke="#64725a" stroke-opacity=".45"/>
<g fill="#eee4cf" font-family="Inter"><text x="58" y="64" font-size="20" letter-spacing="-.8">misterlove.</text><text x="60" y="170" font-size="13" letter-spacing="2.2" fill="#cec29f">BOOKS BY LOVEPREET SINGH</text></g>
<g fill="#faf1de" font-family="Newsreader" font-size="88" font-weight="500" letter-spacing="-2.5"><text x="55" y="283">Belief, put</text><text x="55" y="376">to the test.</text></g>
<g fill="#e5dccb" font-family="Inter"><text x="60" y="446" font-size="19">Three books on belief and evidence.</text><text x="60" y="480" font-size="15" fill="#c7c5b7">Explore the books. Follow the sources.</text></g>
${cover(myBooks[1], 650, 205, -12)}${cover(myBooks[2], 960, 217, 10)}${cover(myBooks[0], 813, 159, -3)}
<path d="M60 560H1140" stroke="#8c997e" stroke-opacity=".5"/>
<g fill="#ded9c9" font-family="Inter" font-size="14"><text x="60" y="594">misterlove.in/my-books</text><text x="1138" y="594" text-anchor="end">Independent thought. In print.</text></g></svg>`;
const png = new Resvg(svg, { font: { fontFiles: ['assets/fonts/og/Inter-Variable.ttf', 'assets/fonts/og/Newsreader-Variable.ttf'], loadSystemFonts: false } }).render().asPng();
mkdirSync('public/og', { recursive: true });
writeFileSync('public/og/my-books.png', png);
console.log('my-books card ✓ 1200 × 630, three approved cover designs');
