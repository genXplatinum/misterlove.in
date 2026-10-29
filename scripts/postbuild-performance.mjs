// Give the browser each direct-entry route's code up front. Do not preload
// sibling articles or change the rendered markup and stylesheet ordering.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? walk(path) : entry.name === 'index.html' ? [path] : [];
});
const get = key => {
  if (!manifest[key]) throw new Error(`Missing entry: ${key}`);
  return manifest[key];
};
let count = 0;
for (const file of walk('dist')) {
  let html = readFileSync(file, 'utf8');
  if (!html.includes('<div id="root">')) continue;
  const route = '/' + file.replaceAll('\\', '/').replace(/^dist\//, '').replace(/index\.html$/, '');
  const white = route.startsWith('/white/');
  const path = white ? route.slice(6) : route;
  const segments = path.split('/').filter(Boolean);
  const language = ['hi', 'pa'].includes(segments[0]) ? segments.shift() : 'en';
  const [section, slug, part] = segments;
  const entries = [white ? 'src/white/WhiteApp.jsx' : 'src/App.jsx'];
  if (!section && !white) entries.push('src/pages/ClassicHome.jsx');
  if (section === 'press') entries.push('src/pages/Press.jsx');
  if (section === 'my-books') entries.push('src/pages/MyBooks.jsx');
  if (section === 'writing') {
    if (!slug && !white) entries.push('src/pages/Writing.jsx');
    if (slug) {
      entries.push(`src/pages/${part ? 'Article' : 'Topic'}.jsx`);
      const key = `virtual:reader:writing:${language}:${slug}`;
      if (manifest[key]) entries.push(key);
      const article = `${key}:${part?.replace(/^part-/, '')}`;
      if (part && manifest[article]) entries.push(article);
    }
  }
  if (section === 'books') {
    if (!slug && !white) entries.push('src/pages/Books.jsx');
    if (slug) {
      entries.push(`src/pages/${part ? 'Study' : 'Book'}.jsx`);
      const key = `virtual:reader:books:${language}:${slug}`;
      if (manifest[key]) entries.push(key);
      if (part && manifest[`${key}:${part}`]) entries.push(`${key}:${part}`);
    }
  }
  const scripts = new Set();
  const visit = key => {
    const chunk = get(key);
    if (scripts.has(chunk.file)) return;
    scripts.add(chunk.file);
    (chunk.imports ?? []).forEach(visit);
  };
  entries.forEach(visit);
  const preloads = [...scripts].filter(path => !html.includes(`href="/${path}"`))
    .map(path => `<link rel="modulepreload" crossorigin href="/${path}">`).join('');
  // Both homepage hero faces are discoverable before React mounts. These are
  // the same Google Fonts binaries and descriptors, now served on this domain.
  const fontCss = readFileSync('public/fonts/site-fonts.css', 'utf8');
  const fontBlocks = [...fontCss.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)].map(match => match[1]);
  const heroFonts = !white && !section ? [
    ["Cormorant Garamond", 'normal', '600'],
    ["Cormorant Garamond", 'italic', '400'],
    ["Newsreader", 'normal', '400'],
  ].map(([family, style, weight]) => fontBlocks.find(block =>
    block.includes(`font-family: '${family}'`) &&
    block.includes(`font-style: ${style};`) && block.includes(`font-weight: ${weight};`)
  )?.match(/url\(([^)]+)\)/)?.[1]).filter(Boolean) : [];
  const fonts = heroFonts.map(path => {
    if (!existsSync(`public${path}`)) throw new Error(`Missing font ${path}`);
    return `<link rel="preload" href="${path}" as="font" type="font/woff2" crossorigin>`;
  }).join('');
  html = html.replace('</head>', `${preloads}${fonts}</head>`);
  writeFileSync(file, html);
  count++;
}
console.log(`performance ✓ ${count} direct-entry pages preload only their edition, route and selected reader.`);
