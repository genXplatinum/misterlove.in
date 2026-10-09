import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import jpeg from 'jpeg-js';
import { features } from '../src/data/press.js';

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
function lines(text, x, y, size, max, gap = 1.08, family = 'Newsreader', color = '#1d1a16') {
  return wrap(text, size, max).map((line, i) => `<text x="${x}" y="${y + i * size * gap}" font-family="${family}" font-size="${size}" fill="${color}">${esc(line)}</text>`).join('');
}
function label(text, x, y, size = 17, color = '#5e574d') {
  return `<text x="${x}" y="${y}" font-family="Inter" font-size="${size}" font-weight="500" fill="${color}">${esc(text)}</text>`;
}
function render(svg, file) {
  const image = new Resvg(svg, { font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Inter' } }).render();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, jpeg.encode({ data: image.pixels, width: image.width, height: image.height }, 91).data);
}
const svg = (w, h, content) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f3efe6"/>${content}</svg>`;

for (const feature of features) {
  const accent = feature.accent === 'forest' ? '#3f5448' : '#7c3032';
  const publisher = feature.publisher;
  const kind = `${feature.kind}${feature.archived ? ' · archived clipping' : ''}`;
  const credit = feature.archived ? 'Original clipping preserved from Instagram'
    : feature.kind === 'Press release' ? 'News provided by Lovelace IT Solutions'
    : feature.slug === 'dwi-media-youthful-visionary' ? 'By DWI Media News Network on Medium'
    : `${feature.publisher} company directory`;
  const source = sourceImage(feature);
  const og = svg(1200, 630, `
    <rect x="0" width="12" height="630" fill="${accent}"/>
    ${label('LOVEPREET SINGH', 58, 61, 21)}
    ${label('PRESS & FEATURES', 58, 94, 13, accent)}
    <path d="M58 122H677" stroke="#cfc5b6"/>
    ${lines(feature.cardTitle, 58, 210, 65, 600)}
    ${lines(publisher, 60, 427, 25, 590, 1.3, 'Inter', accent)}
    ${label(kind, 60, 490, 17)}
    ${label(credit, 60, 522, 14)}
    <path d="M58 552H1142" stroke="#cfc5b6"/>
    ${label('Five Rivers Inc. · Lovelace', 60, 591, 18)}
    ${label('misterlove.in/press', 908, 591, 17)}
    <rect x="721" y="44" width="423" height="487" fill="${accent}"/>
    <rect x="736" y="59" width="393" height="457" fill="#fcfaf5"/>
    <image href="${source}" x="747" y="74" width="371" height="427" preserveAspectRatio="xMidYMid meet"/>
  `);
  render(og, resolve(root, `public/og/press-${feature.slug}.jpg`));
  const story = svg(1080, 1920, `
    <rect x="0" width="14" height="1920" fill="${accent}"/>
    ${label('PRESS & FEATURES', 80, 105, 25, accent)}
    ${label('LOVEPREET SINGH', 80, 164, 31)}
    <path d="M80 205H1000" stroke="#cfc5b6"/>
    ${lines(feature.cardTitle, 80, 322, 87, 920)}
    ${lines(publisher, 82, 600, 36, 910, 1.25, 'Inter', accent)}
    ${label(kind, 82, 680, 25)}
    <rect x="80" y="740" width="920" height="780" fill="${accent}"/>
    <rect x="96" y="756" width="888" height="748" fill="#fcfaf5"/>
    <image href="${source}" x="114" y="774" width="852" height="712" preserveAspectRatio="xMidYMid meet"/>
    ${lines(credit, 82, 1576, 24, 900, 1.35, 'Inter', '#5e574d')}
    <path d="M80 1660H1000" stroke="#cfc5b6"/>
    ${lines('Five Rivers Inc. & Lovelace', 80, 1753, 53, 930)}
    ${label('Explore the original story at misterlove.in/press', 82, 1835, 25)}
  `);
  render(story, resolve(root, `public/press/social/${feature.slug}-story.jpg`));
}

render(svg(1200, 630, `
  <rect width="12" height="630" fill="#7c3032"/>
  ${label('LOVEPREET SINGH', 58, 65, 22)}
  ${lines('Stories, beyond this site.', 58, 207, 84, 650, 1.02)}
  ${label('Press & features', 60, 433, 28, '#7c3032')}
  ${label('Original stories. Preserved clippings.', 60, 480, 20)}
  <rect x="782" y="40" width="360" height="490" fill="#3f5448"/>
  <image href="${raster('/founder.jpg')}" x="797" y="55" width="330" height="460" preserveAspectRatio="xMidYMid slice"/>
  <path d="M58 552H1142" stroke="#cfc5b6"/>
  ${label('Five Rivers Inc. · Lovelace', 60, 591, 18)}
  ${label('misterlove.in/press', 908, 591, 17)}
`), resolve(root, 'public/og/press.jpg'));

console.log(`Press artwork: ${features.length + 1} social cards (1200×630), ${features.length} Stories (1080×1920).`);
