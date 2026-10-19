import { readFileSync } from 'node:fs';
import { shapePunjabiOg, measurePunjabiOg } from './shape-hindi-og.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The existing Sacred Mirage artwork, with shaped Gurmukhi and accurate availability. */
export function punjabiMirageCard(piece, part) {
  const art = readFileSync(new URL('../assets/og/why-i-dont-believe-sacred-mirage-art.png', import.meta.url)).toString('base64');
  let lines = part?.n === 1 ? ['ਮੈਂ ਅਜੇ ਤੁਹਾਡੀ ਗੱਲ', 'ਨਹੀਂ ਮੰਨਦਾ'] : ['ਮੈਂ ਕਿਉਂ', 'ਨਹੀਂ ਮੰਨਦਾ'];
  if (part && part.n !== 1) {
    lines = []; let line = '';
    for (const word of part.title.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && measurePunjabiOg(next, 62) > 600) { lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
  }
  let size = part ? 68 : 72;
  while (lines.some((line) => measurePunjabiOg(line, size) > 600) && size > 42) size -= 2;
  if (lines.length > 2 || lines.some((line) => measurePunjabiOg(line, size) > 600)) throw new Error('Punjabi title exceeds the social-card text area');
  const kicker = part ? `ਪੰਜਾਬੀ / ਭਾਗ ${part.n} / ${piece.parts}` : `ਪੰਜਾਬੀ / ${piece.parts} ਵਿੱਚੋਂ ${piece.live} ਭਾਗ ਉਪਲਬਧ`;
  const title = lines.map((line, i) => `<text class="h" x="68" y="${245+i*100}" fill="#f4f0e5" font-size="${size}" font-weight="650">${esc(line)}</text>`).join('');
  return shapePunjabiOg(`<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>${esc(part?.title ?? piece.title)} / ਪੰਜਾਬੀ / The Sacred Mirage</title>
  <defs>
    <linearGradient id="mirage-copy" x1="0" y1="0" x2="790" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#04090b"/><stop offset="0.61" stop-color="#04090b" stop-opacity="0.98"/>
      <stop offset="0.76" stop-color="#04090b" stop-opacity="0.76"/><stop offset="1" stop-color="#04090b" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="mirage-footer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04090b" stop-opacity="0"/><stop offset="1" stop-color="#04090b" stop-opacity="0.97"/></linearGradient>
    <style>.r{font-family:'Newsreader',Georgia,serif}.s{font-family:'Inter','Segoe UI',sans-serif}</style>
  </defs>
  <image href="data:image/png;base64,${art}" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
  <rect width="790" height="630" fill="url(#mirage-copy)"/><rect y="514" width="1200" height="116" fill="url(#mirage-footer)"/>
  <rect x="28" y="28" width="1144" height="574" fill="none" stroke="#9a8052" stroke-width="1.2"/>
  <text class="s" x="68" y="76" fill="#eae5da" font-size="18" font-weight="650" letter-spacing="1.6">LOVEPREET SINGH</text>
  <line x1="68" y1="103" x2="1132" y2="103" stroke="#6f6248" stroke-width="1"/>
  <text class="hs" x="68" y="150" fill="#d2aa66" font-size="20" font-weight="650">${esc(kicker)}</text>
  ${title}
  <text class="r" x="68" y="403" fill="#e7c385" font-size="31" font-weight="550">THE SACRED MIRAGE</text>
  <rect x="68" y="431" width="94" height="4" rx="2" fill="#d2aa66"/>
  <text class="hs" x="68" y="478" fill="#dedbd2" font-size="26" font-weight="500">ਰੱਬ, ਧਰਮ ਅਤੇ ਸਬੂਤ ਦੀ ਪੜਤਾਲ</text>
  <text class="hs" x="68" y="568" fill="#c4b79d" font-size="19" font-weight="500">ਸੌਖੀ ਪੰਜਾਬੀ / ਮੂਲ ਸਰੋਤਾਂ ਸਮੇਤ</text>
  <text class="s" x="1132" y="568" text-anchor="end" fill="#ead8b5" font-size="15" font-weight="550" letter-spacing="1.5">MISTERLOVE.IN</text>
  </svg>`);
}
