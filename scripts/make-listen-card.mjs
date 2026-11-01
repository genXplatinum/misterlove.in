import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { listenMeta } from '../src/data/podcastMeta.js';

const cover = `data:image/png;base64,${readFileSync('public/book-covers/debunked-islam.png').toString('base64')}`;
const wave = (x, y, width, height) => Array.from({ length: 95 }, (_, i) => {
  const amplitude = (.12 + .88 * Math.abs(Math.sin(i * .77) * Math.cos(i * .29))) * height;
  return `<rect x="${x + i * width / 95}" y="${y - amplitude / 2}" width="${width / 95 * .5}" height="${amplitude}" rx="2"/>`;
}).join('');
const defs = `<defs><linearGradient id="wave"><stop stop-color="#edb778"/><stop offset=".5" stop-color="#e79699"/><stop offset="1" stop-color="#b4a8e3"/></linearGradient></defs>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">${defs}<rect width="1200" height="630" fill="#222824"/><circle cx="975" cy="310" r="210" fill="#30372f" stroke="#bda67c" stroke-opacity=".3"/><g fill="#f7efdf"><text x="62" y="68" font-family="Inter" font-size="22">misterlove.</text><text x="62" y="156" font-family="Inter" font-size="13" letter-spacing="3" fill="#edb778">THE LISTENING ROOM</text><text x="57" y="269" font-family="Newsreader" font-size="86" letter-spacing="-2">Books,</text><text x="57" y="356" font-family="Newsreader" font-style="italic" font-size="86" letter-spacing="-2">in conversation.</text></g><g fill="url(#wave)" opacity=".85">${wave(64, 423, 600, 63)}</g><g fill="#d6d1c7" font-family="Inter"><text x="62" y="518" font-size="18">DEBUNKED: ISLAM</text><text x="62" y="552" font-size="16">Punjabi chapter discussions · Lovepreet Singh</text><text x="62" y="594" font-size="13" fill="#aaa99e">misterlove.in/listen</text></g><g transform="translate(840 126) rotate(-6 130 195)"><rect x="12" y="16" width="260" height="390" fill="#000" opacity=".35"/><image href="${cover}" width="260" height="390"/></g></svg>`;
const font = { fontFiles: ['assets/fonts/og/Inter-Variable.ttf', 'assets/fonts/og/Newsreader-Variable.ttf'], loadSystemFonts: false };
mkdirSync('public/og', { recursive: true });
writeFileSync(`public${listenMeta.image}`, new Resvg(svg, { font }).render().asPng());
const square = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1400">${defs}<rect width="1400" height="1400" fill="#222824"/><circle cx="700" cy="640" r="430" stroke="#bda67c" stroke-opacity=".25" fill="#30372f"/><g fill="#f7efdf" font-family="Inter"><text x="90" y="115" font-size="35">misterlove.</text><text x="90" y="203" font-size="23" letter-spacing="4" fill="#edb778">THE LISTENING ROOM</text></g><g transform="translate(452 300) rotate(-5 250 375)"><rect x="19" y="25" width="500" height="750" fill="#000" opacity=".35"/><image href="${cover}" width="500" height="750"/></g><g fill="url(#wave)">${wave(90, 1165, 1220, 95)}</g><g fill="#f7efdf" font-family="Inter" font-size="25"><text x="90" y="1310">Punjabi chapter discussions</text><text x="1310" y="1310" text-anchor="end">Lovepreet Singh</text></g></svg>`;
mkdirSync('public/podcast-covers', { recursive: true });
writeFileSync(`public${listenMeta.artwork}`, new Resvg(square, { font }).render().asPng());
console.log('listen artwork ✓ 1200 × 630 share card and 1400 × 1400 podcast cover');
