import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import jpeg from 'jpeg-js';
import { features, featureCard, featureStory, pressCollectionCard } from '../src/data/press.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fonts = ['Newsreader-Variable.ttf', 'Inter-Variable.ttf'].map(name => resolve(root, 'assets/fonts/og', name));
const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const raster = path => `data:image/jpeg;base64,${readFileSync(resolve(root, 'public', path.replace(/^\//, ''))).toString('base64')}`;
const sourceImage = feature => raster(`/press/previews/${feature.images[0].src.split('/').at(-1).replace(/\.[^.]+$/, '.jpg')}`);
function width(text, size) {
  return [...text].reduce((sum, char) => sum + size * (/[ilI.,'’ :!]/.test(char) ? .27 : /[MWmw@]/.test(char) ? .85 : /[A-Z]/.test(char) ? .65 : .51), 0);
}
function wrap(text, size, max) {
  const lines = [''];
  for (const word of text.split(/\s+/)) {
    const last = lines.length - 1;
    const next = lines[last] ? `${lines[last]} ${word}` : word;
    if (width(next, size) > max && lines[last]) lines.push(word); else lines[last] = next;
  }
  return lines;
}
function fit(text, size, max, count) {
  while (wrap(text, size, max).length > count) size -= 2;
  return size;
}
function lines(text, x, y, size, max, gap = 1.06, family = 'Newsreader', color = '#F0F3FA') {
  return wrap(text, size, max).map((line, i) => `<text x="${x}" y="${y + i * size * gap}" font-family="${family}" font-size="${size}" fill="${color}">${esc(line)}</text>`).join('');
}
function label(text, x, y, size = 17, color = '#B7C1D4', tracking = 0) {
  return `<text x="${x}" y="${y}" font-family="Inter" font-size="${size}" font-weight="500" letter-spacing="${tracking}" fill="${color}">${esc(text)}</text>`;
}
function render(svg, path) {
  const file = resolve(root, 'public', path.replace(/^\//, ''));
  const image = new Resvg(svg, { font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Inter' } }).render();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, jpeg.encode({ data: image.pixels, width: image.width, height: image.height }, 93).data);
}
const svg = (w, h, content) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="midnight" x2="1" y2="1"><stop stop-color="#080F20"/><stop offset=".56" stop-color="#142641"/><stop offset="1" stop-color="#091223"/></linearGradient>
    <linearGradient id="foil" x2="1" y2="1"><stop stop-color="#F3DEB7"/><stop offset=".3" stop-color="#A37C40"/><stop offset=".6" stop-color="#EBD1A1"/><stop offset="1" stop-color="#9E7C46"/></linearGradient>
    <linearGradient id="glass" x2="1" y2="1"><stop stop-color="#5A7396"/><stop offset=".38" stop-color="#203552"/><stop offset="1" stop-color="#10213D"/></linearGradient>
    <linearGradient id="shine" x2="1" y2="1"><stop stop-color="#FFFFFF" stop-opacity=".18"/><stop offset=".62" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
    <radialGradient id="bloom"><stop stop-color="#88AAD9" stop-opacity=".16"/><stop offset="1" stop-color="#88AAD9" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#midnight)"/>
  <ellipse cx="${w * .82}" cy="${h * .18}" rx="${w * .65}" ry="${h * .6}" fill="url(#bloom)"/>
  <path d="M${w * .52} 0H${w * .82}L${w * .32} ${h}H${w * .12}Z" fill="url(#shine)" opacity=".25"/>
  <rect x="22" y="22" width="${w - 44}" height="${h - 44}" rx="10" fill="none" stroke="url(#foil)" stroke-opacity=".48"/>
  ${content}</svg>`;
function frame(source, x, y, w, h) {
  return `<rect x="${x + 5}" y="${y + 14}" width="${w}" height="${h}" rx="12" fill="#010611" opacity=".4"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="url(#glass)" stroke="url(#foil)" stroke-width="2"/>
    <rect x="${x + 12}" y="${y + 12}" width="${w - 24}" height="${h - 24}" rx="5" fill="#F5F5F3"/>
    <image href="${source}" x="${x + 24}" y="${y + 25}" width="${w - 48}" height="${h - 50}" preserveAspectRatio="xMidYMid meet"/>
    <path d="M${x} ${y + h * .15}L${x + w * .54} ${y}H${x + w * .85}L${x} ${y + h * .62}Z" fill="url(#shine)" opacity=".5"/>
    <path d="M${x + 12} ${y + 1}H${x + w - 12}" stroke="#FFFFFF" stroke-opacity=".5"/>`;
}

for (const feature of features) {
  const kind = `${feature.kind}${feature.archived ? ' · archived clipping' : ''}`;
  const credit = feature.archived ? 'Original clipping preserved from Instagram'
    : feature.kind === 'Press release' ? 'News provided by Lovelace IT Solutions'
    : feature.slug === 'dwi-media-youthful-visionary' ? 'By DWI Media News Network on Medium'
    : `${feature.publisher} company directory`;
  const source = sourceImage(feature);
  const ogSize = fit(feature.cardTitle, 72, 610, 3);
  render(svg(1200, 630, `
    ${label('LOVEPREET SINGH', 58, 73, 25, '#E1BF88', 1)}
    ${label('P R E S S   &   F E A T U R E S', 60, 108, 12, '#B7C1D4')}
    <path d="M58 136H680" stroke="#70819B" stroke-opacity=".5"/>
    ${lines(feature.cardTitle, 58, 223, ogSize, 610)}
    ${lines(feature.publisher, 60, 452, 25, 610, 1.25, 'Inter', '#E1BF88')}
    ${label(kind, 60, 515, 16)}
    ${label(credit, 60, 542, 13)}
    ${frame(source, 732, 58, 410, 479)}
    <path d="M58 566H1142" stroke="url(#foil)" stroke-opacity=".6"/>
    ${label('Five Rivers Inc. · Lovelace', 60, 602, 17, '#DDE5F3')}
    ${label('misterlove.in/press', 921, 602, 16, '#E1BF88')}
  `), featureCard(feature));
  const storySize = fit(feature.cardTitle, 98, 910, 3);
  render(svg(1080, 1920, `
    ${label('P R E S S   &   F E A T U R E S', 80, 114, 23, '#E1BF88')}
    ${label('LOVEPREET SINGH', 80, 177, 34, '#F0F3FA', 1)}
    <path d="M80 215H1000" stroke="#70819B" stroke-opacity=".6"/>
    ${lines(feature.cardTitle, 80, 337, storySize, 910)}
    ${lines(feature.publisher, 82, 622, 36, 910, 1.25, 'Inter', '#E1BF88')}
    ${label(kind, 82, 705, 24)}
    ${frame(source, 80, 760, 920, 790)}
    ${lines(credit, 82, 1612, 24, 900, 1.35, 'Inter', '#B7C1D4')}
    <path d="M80 1690H1000" stroke="url(#foil)" stroke-opacity=".75"/>
    ${lines('Five Rivers Inc. & Lovelace', 80, 1788, 54, 930)}
    ${label('Explore the story at misterlove.in/press', 82, 1860, 26, '#E1BF88')}
  `), featureStory(feature));
}

render(svg(1200, 630, `
  ${label('P R E S S   &   F E A T U R E S', 60, 76, 13, '#B7C1D4')}
  ${label('LOVEPREET SINGH', 58, 128, 28, '#E1BF88', 1)}
  ${lines('Built to make a mark.', 58, 257, 109, 690, 1.02)}
  ${label('The vision. The ventures. The stories.', 60, 470, 24, '#F0F3FA')}
  ${label('Original features & preserved clippings', 60, 512, 19)}
  <rect x="800" y="48" width="342" height="489" rx="12" fill="url(#glass)" stroke="url(#foil)" stroke-width="2"/>
  <image href="${raster('/founder.jpg')}" x="812" y="60" width="318" height="465" preserveAspectRatio="xMidYMid slice"/>
  <path d="M800 170L1000 48H1110L800 320Z" fill="url(#shine)" opacity=".45"/>
  <path d="M58 566H1142" stroke="url(#foil)" stroke-opacity=".6"/>
  ${label('Five Rivers Inc. · Lovelace', 60, 602, 17, '#DDE5F3')}
  ${label('misterlove.in/press', 921, 602, 16, '#E1BF88')}
`), pressCollectionCard);
console.log(`Spotlight artwork: ${features.length + 1} social cards (1200×630), ${features.length} Stories (1080×1920).`);
