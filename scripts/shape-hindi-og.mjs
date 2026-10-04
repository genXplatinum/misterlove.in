import * as hb from 'harfbuzzjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fonts = new Map();
const decode = (text) => text.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');

function fontFor(style, weight) {
  const key = `${style}:${weight}`;
  if (!fonts.has(key)) {
    const name = style === 'h' ? 'NotoSerifDevanagari' : 'NotoSansDevanagari';
    const file = fileURLToPath(new URL(`../assets/fonts/og/${name}-Variable.ttf`, import.meta.url));
    const face = new hb.Face(new hb.Blob(readFileSync(file)));
    const font = new hb.Font(face);
    font.setVariations([new hb.Variation('wght', weight)]);
    fonts.set(key, { face, font });
  }
  return fonts.get(key);
}

/** Shape complete words before rasterisation so SVG character positioning
 * cannot detach Hindi vowel marks or collapse the spaces between words.
 * Latin and Hindi words each get their own correct script properties. */
export function shapeHindiOg(svg) {
  return svg.replace(/<text\b([^>]*)>([^<]*)<\/text>/g, (original, attrs, encoded) => {
    const attr = (name) => attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
    const style = attr('class');
    if (style !== 'h' && style !== 'hs') return original;
    const size = Number(attr('font-size'));
    const x = Number(attr('x'));
    const y = Number(attr('y'));
    const spacing = Number(attr('word-spacing') ?? 0);
    const { face, font } = fontFor(style, Number(attr('font-weight') ?? 400));
    const scale = size / face.upem;
    let advance = 0;
    const paths = [];
    for (const word of decode(encoded).split(/(\s+)/)) {
      if (!word) continue;
      const buffer = new hb.Buffer();
      buffer.addText(word);
      buffer.guessSegmentProperties();
      hb.shape(font, buffer);
      const positions = buffer.getGlyphPositions();
      for (const [index, glyph] of buffer.getGlyphInfos().entries()) {
        if (!glyph.codepoint) throw new Error(`Missing OG glyph in: ${word}`);
        const position = positions[index];
        const path = font.glyphToPath(glyph.codepoint);
        if (path) {
          paths.push(`<path d="${path}" transform="translate(${x + advance + position.xOffset * scale} ${y - position.yOffset * scale}) scale(${scale} ${-scale})"/>`);
        }
        advance += position.xAdvance * scale;
      }
      if (/^\s+$/.test(word)) advance += spacing * word.length;
    }
    return `<g fill="${attr('fill')}" aria-label="${encoded}" data-shaped="hi">${paths.join('')}</g>`;
  });
}
