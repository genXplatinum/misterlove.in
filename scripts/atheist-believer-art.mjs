import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { shapeHindiOg } from './shape-hindi-og.mjs';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (s, x, y, size = 26, hi = false, fill = '#242220', weight = 400) => `<text class="${hi ? 'hs' : 's'}" x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(s)}</text>`;
const style = '<style>.s{font-family:Inter,Arial,sans-serif}.r{font-family:Newsreader,Georgia,serif}.h{font-family:"Noto Serif Devanagari",serif}.hs{font-family:"Noto Sans Devanagari",sans-serif}</style>';

export function makeAtheistBelieverFigures() {
  const out = fileURLToPath(new URL('../public/writing-assets/atheist-vs-believer/', import.meta.url));
  mkdirSync(out, { recursive: true });
  for (const hi of [false, true]) {
    for (const key of ['selection', 'fusion']) {
      const name = `${key}-${hi ? 'hi' : 'en'}.svg`;
      let drawing = '';
      if (key === 'selection') {
        drawing += text(hi ? 'प्राकृतिक चयन: केवल समझाने का चित्र' : 'Natural selection: a schematic illustration', 58, 70, 32, hi, '#242220', 650);
        const labels = hi ? ['पहली पीढ़ी', 'चयन का असर', 'बाद की पीढ़ी'] : ['First generation', 'Selection', 'Later generation'];
        for (let i = 0; i < 3; i += 1) {
          for (let j = 0; j < 8; j += 1) {
            drawing += `<ellipse cx="${120 + i * 390 + (j % 4) * 42}" cy="${190 + Math.floor(j / 4) * 75}" rx="15" ry="21" fill="${j < [2, 4, 6][i] ? '#383634' : '#e0ded9'}" stroke="#242220" stroke-width="2"/>`;
          }
          drawing += text(labels[i], 95 + i * 390, 350, 26, hi);
          if (i < 2) drawing += `<path d="M${290 + i * 390} 230h175m-15 -10 15 10-15 10" fill="none" stroke="#242220" stroke-width="3"/>`;
        }
        drawing += text(hi ? 'चित्र की गिनती गढ़ी है; यह किसी प्रयोग का आँकड़ा नहीं।' : 'Illustrative counts only; these are not experimental data.', 58, 445, 25, hi);
      } else {
        drawing += text(hi ? 'मानव गुणसूत्र 2: पुराने जुड़ाव की मिसाल' : 'Human chromosome 2: an ancestral fusion', 58, 70, 32, hi, '#242220', 650);
        drawing += '<g fill="#dedbd5" stroke="#242220" stroke-width="2"><rect x="110" y="155" width="300" height="38"/><rect x="790" y="155" width="300" height="38"/><rect x="230" y="320" width="740" height="38"/></g><path d="M445 175h300m-15 -10 15 10-15 10" fill="none" stroke="#242220" stroke-width="3"/><rect x="585" y="320" width="30" height="38" fill="#353330"/>';
        drawing += text(hi ? 'पुराना गुणसूत्र' : 'Ancestral chromosome', 110, 240, 24, hi);
        drawing += text(hi ? 'पुराना गुणसूत्र' : 'Ancestral chromosome', 790, 240, 24, hi);
        drawing += text(hi ? 'भीतर बचे पुराने सिरों के निशान' : 'Internal remnants of ancestral chromosome ends', 280, 410, 25, hi);
        drawing += text(hi ? 'आकार और लंबाई पैमाने पर नहीं हैं।' : 'Shapes and lengths are not to scale.', 58, 475, 25, hi);
      }
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520" role="img"><title>${key === 'selection' ? 'Natural selection schematic' : 'Human chromosome 2 fusion schematic'}</title>${style}<rect width="1200" height="520" fill="#faf8f3"/>${drawing}</svg>`;
      writeFileSync(out + name, hi ? shapeHindiOg(svg) : svg);
    }
  }
}

export function atheistBelieverCard(language = 'en', volume = 0) {
  const hi = language === 'hi';
  const labels = hi ? { 1: 'इस्लाम', 2: 'ईसाई धर्म', 3: 'हिंदू परंपराएँ', 4: 'दूसरे धर्म' } : { 1: 'ISLAM', 2: 'CHRISTIANITY', 3: 'HINDU TRADITIONS', 4: 'OTHER TRADITIONS' };
  const subtitles = hi ? { 1: 'इस्लाम से मेरे सवाल', 2: 'ईसाई धर्म से मेरे सवाल', 3: 'हिंदू धर्म से मेरे सवाल', 4: 'दूसरे धर्मों से मेरे सवाल' } : { 1: 'Questions Islam Must Answer', 2: 'Questions Christianity Must Answer', 3: 'Questions Hinduism Must Answer', 4: 'Questions Other Traditions Must Answer' };
  const kicker = hi ? (volume ? `पुस्तक ${volume} / ${labels[volume]} / 30 अध्याय` : 'धर्म और प्रमाण / चार पूरी पुस्तकें') : (volume ? `VOLUME ${volume} / ${labels[volume]} / 30 CHAPTERS` : 'RELIGION AND EVIDENCE / FOUR COMPLETE VOLUMES');
  const sub = volume ? subtitles[volume] : (hi ? 'धार्मिक दावों से सीधे सवाल' : 'Questions religious claims must answer');
  const title = hi ? '<text class="h" x="64" y="257" font-size="79" font-weight="650" fill="#f6f0df">नास्तिक</text><text class="h" x="64" y="365" font-size="79" font-weight="650" fill="#f6f0df">बनाम आस्तिक</text>' : '<text class="r" x="64" y="250" font-size="91" font-weight="650" fill="#f6f0df">ATHEIST</text><text class="r" x="64" y="354" font-size="87" font-weight="650" fill="#f6f0df">vs BELIEVER</text>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><title>${hi ? 'नास्तिक बनाम आस्तिक' : 'Atheist vs Believer'}</title>${style}<rect width="1200" height="630" fill="#2c292a"/><rect x="28" y="28" width="1144" height="574" fill="none" stroke="#9b7c38"/><path d="M64 110h1070M64 412h690" stroke="#b58e37" stroke-width="1.5"/>${text('LOVEPREET SINGH',64,79,20,false,'#f6f0df',650)}${text(kicker,64,159,20,hi,'#d5aa43',600)}${title}<text class="r" x="886" y="444" font-size="340" fill="#d5aa43">?</text>${text(sub,64,472,hi ? 36 : 30,hi,'#eee5d2',500)}${text(hi ? 'हिंदी और अंग्रेज़ी / पूरी पुस्तक की PDF' : 'ENGLISH AND HINDI / COMPLETE BOOK PDFs',64,566,18,hi,'#d5aa43',500)}${text('MISTERLOVE.IN',960,566,17,false,'#eee5d2')}</svg>`;
  return hi ? shapeHindiOg(svg) : svg;
}
