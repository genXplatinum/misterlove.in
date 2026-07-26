/**
 * import-writing.mjs — one-shot content importer.
 *
 * Converts the authored "Kissan Andolan" print-HTML (12 files, one per part)
 * into `src/data/writing/kissan-andolan.js`, which the site renders.
 *
 * The source files were written for a PDF renderer, so they carry print-only
 * chrome (a full-bleed cover page, page-break markers, hard-coded paper colours
 * in inline styles). We strip that, then rewrite every class name behind a `w-`
 * prefix so the article's own vocabulary (`.section`, `.lead`, `.data`) can't
 * collide with the site's global design-system utilities of the same names.
 * Prose HTML is otherwise preserved verbatim — this is researched work and the
 * structure (boxes, timelines, tables, sources) IS the content.
 *
 * Usage:  node scripts/import-writing.mjs "<dir containing kissan_part*.html>"
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = process.argv[2];
if (!SRC_DIR) {
  console.error('usage: node scripts/import-writing.mjs "<source dir>"');
  process.exit(1);
}

const PART_COUNT = 12;
const OUT_FILE = 'src/data/writing/kissan-andolan.js';

/* Every class used by the source documents → its namespaced equivalent.
   Anything not listed here is dropped, so unexpected print chrome can't leak
   in unstyled. */
const CLASS_MAP = {
  // structure
  section: 'w-h2', sub: 'w-h3', 'part-head': 'w-part-head', 'part-tag': 'w-part-tag',
  lead: 'w-lead', num: 'w-num', soft: 'w-soft',
  // callout boxes
  box: 'w-box', 'box-label': 'w-box-label', big: 'w-big',
  'box-simple': 'w-box--simple', 'box-key': 'w-box--key', 'box-number': 'w-box--number',
  'box-remember': 'w-box--remember', 'box-weigh': 'w-box--weigh', 'box-arg': 'w-box--arg',
  'box-quote': 'w-box--quote', 'box-worry': 'w-box--worry', 'box-answer': 'w-box--answer',
  'box-aim': 'w-box--aim',
  // tables
  data: 'w-table', pc: 'w-table--pc', scorecard: 'w-table--scorecard',
  recap: 'w-table--recap', cmp: 'w-table--cmp', hi: 'w-hi', pend: 'w-pend', win: 'w-win',
  // timeline + journey diagrams
  timeline: 'w-timeline', 'tl-item': 'w-tl-item', 'tl-year': 'w-tl-year', 'tl-text': 'w-tl-text',
  journey: 'w-journey', 'j-step': 'w-j-step', 'j-num': 'w-j-num', 'j-body': 'w-j-body',
  'j-arrow': 'w-j-arrow',
  // set pieces
  pullquote: 'w-pullquote', takeaways: 'w-takeaways', sources: 'w-sources',
  authnote: 'w-authnote', dedication: 'w-dedication', sign: 'w-sign',
  fn: 'w-fn', lawtag: 'w-lawtag',
};

const decode = (s) =>
  s
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '•').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&lsquo;/g, '‘').replace(/&rarr;/g, '→').replace(/&hellip;/g, '…')
    .replace(/&deg;/g, '°').replace(/&times;/g, '×');

const stripTags = (s) => decode(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();

/** Rewrite a class attribute through CLASS_MAP, dropping unknown tokens. */
function mapClassAttr(value) {
  return value
    .split(/\s+/)
    .map((c) => CLASS_MAP[c])
    .filter(Boolean)
    .join(' ');
}

/** Slug for stable in-page anchors (used by the per-part contents rail). */
const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);

function clean(html) {
  return (
    html
      // print-only chrome
      .replace(/<div style="page-break[^>]*>\s*<\/div>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      // hard-coded paper colours / print spacing would fight the site theme
      .replace(/\s+style="[^"]*"/gi, '')
      // namespace every class; drop the attribute entirely if nothing survives
      .replace(/\s+class="([^"]*)"/gi, (_, v) => {
        const mapped = mapClassAttr(v);
        return mapped ? ` class="${mapped}"` : '';
      })
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Citations name their publication in prose ("Deccan Herald; PRS.") and only
 * twice carry an actual URL. Map each cited outlet or institution to its
 * official site so every reference is something a reader can follow.
 *
 * Deliberately excluded: "Supreme Court", "FCI"/"Food Corporation of India".
 * Those are subjects of the story, not sources — they appear throughout the
 * narrative, and linking them would be wrong more often than right.
 *
 * Applied ONLY to the sources block and the footnotes. The body prose is left
 * alone: it is the author's writing, not a bibliography.
 */
const CITATION_SITES = {
  'Deccan Herald': 'https://www.deccanherald.com/',
  'Business Standard': 'https://www.business-standard.com/',
  'The Tribune': 'https://www.tribuneindia.com/',
  'Tribune India': 'https://www.tribuneindia.com/',
  'Hindustan Times': 'https://www.hindustantimes.com/',
  'The Hindu': 'https://www.thehindu.com/',
  'Indian Express': 'https://indianexpress.com/',
  'Times of India': 'https://timesofindia.indiatimes.com/',
  'The Print': 'https://theprint.in/',
  ThePrint: 'https://theprint.in/',
  'The Wire': 'https://thewire.in/',
  'The Quint': 'https://www.thequint.com/',
  'National Herald': 'https://www.nationalheraldindia.com/',
  Outlook: 'https://www.outlookindia.com/',
  Scroll: 'https://scroll.in/',
  Newslaundry: 'https://www.newslaundry.com/',
  Caravan: 'https://caravanmagazine.in/',
  'Down To Earth': 'https://www.downtoearth.org.in/',
  'India TV': 'https://www.indiatvnews.com/',
  'India Today': 'https://www.indiatoday.in/',
  NDTV: 'https://www.ndtv.com/',
  Reuters: 'https://www.reuters.com/',
  BBC: 'https://www.bbc.com/news',
  'Al Jazeera': 'https://www.aljazeera.com/',
  Euronews: 'https://www.euronews.com/',
  Undark: 'https://undark.org/',
  Wikipedia: 'https://en.wikipedia.org/',
  Britannica: 'https://www.britannica.com/',
  Springer: 'https://link.springer.com/',
  'Drishti IAS': 'https://www.drishtiias.com/',
  PMFIAS: 'https://www.pmfias.com/',
  "BYJU'S": 'https://byjus.com/',
  Legistify: 'https://legistify.com/',
  'PRS Legislative Research': 'https://prsindia.org/',
  PRS: 'https://prsindia.org/',
  PIB: 'https://www.pib.gov.in/',
  'Commission for Agricultural Costs and Prices': 'https://cacp.dacnet.nic.in/',
  CACP: 'https://cacp.dacnet.nic.in/',
  'National Crime Records Bureau': 'https://www.ncrb.gov.in/',
  NCRB: 'https://www.ncrb.gov.in/',
  NABARD: 'https://www.nabard.org/',
  NSSO: 'https://www.mospi.gov.in/',
  'Ministry of Agriculture': 'https://agriwelfare.gov.in/',
};

// Longest names first, so "Tribune India" wins over "The Tribune" and
// "PRS Legislative Research" over "PRS".
const CITE_NAMES = Object.keys(CITATION_SITES).sort((a, b) => b.length - a.length);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BARE_URL = String.raw`(?:https?:\/\/)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/[^\s<,;)]*`;
const CITE_RE = new RegExp(`(${BARE_URL})|\\b(${CITE_NAMES.map(escapeRe).join('|')})\\b`, 'g');

const anchor = (href, text, extra = '') =>
  `<a class="w-cite${extra}" href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

/**
 * Single pass over the text nodes only — tags are passed through untouched so
 * a rule can never rewrite an attribute or nest an anchor inside another.
 */
function linkifyCitations(html) {
  if (!html) return html;
  return html
    .split(/(<[^>]*>)/)
    .map((seg) => {
      if (seg.startsWith('<')) return seg;
      return seg.replace(CITE_RE, (match, url, name) => {
        if (url) {
          const href = url.startsWith('http') ? url : `https://${url}`;
          return anchor(href, url, ' w-cite--url');
        }
        return anchor(CITATION_SITES[name], name);
      });
    })
    .join('');
}

/**
 * Tables are the widest thing in the corpus (up to five columns of prose).
 * Wrap each in its own scroll container so a narrow viewport scrolls the table
 * rather than the page, and hoist the caption out of that container so the
 * label stays put while the data scrolls under it.
 */
function wrapTables(html) {
  return html.replace(/<table class="([^"]*)">([\s\S]*?)<\/table>/g, (_, cls, inner) => {
    let caption = '';
    const body = inner.replace(/<caption>([\s\S]*?)<\/caption>/i, (__, c) => {
      caption = `<p class="w-table-caption">${c.trim()}</p>`;
      return '';
    });
    return `<figure class="w-figure">${caption}<div class="w-table-scroll"><table class="${cls}">${body}</table></div></figure>`;
  });
}

/**
 * The source attaches citations as a bare inline <span class="fn"> sitting mid-
 * sentence. Number them per part and emit an in-text superscript reference, so
 * the reader can float the note into the margin (wide screens) or set it as an
 * indented aside (narrow) while the sentence still reads cleanly.
 */
function numberFootnotes(html) {
  const OPEN = '<span class="w-fn">';
  let out = '';
  let i = 0;
  let n = 0;

  for (;;) {
    const start = html.indexOf(OPEN, i);
    if (start === -1) {
      out += html.slice(i);
      return out;
    }
    out += html.slice(i, start);

    // Walk to this span's own closing tag, counting nested <span>s, so a note
    // containing markup isn't truncated at the first </span> it happens to hit.
    let depth = 1;
    let j = start + OPEN.length;
    while (depth > 0) {
      const nextOpen = html.indexOf('<span', j);
      const nextClose = html.indexOf('</span>', j);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) { depth += 1; j = nextOpen + 5; }
      else { depth -= 1; j = nextClose + 7; }
    }

    const inner = html.slice(start + OPEN.length, j - 7);
    n += 1;
    out += `<sup class="w-fnref">${n}</sup><span class="w-fn">`
      + `<span class="w-fn-n">${n}</span>${linkifyCitations(inner)}</span>`;
    i = j;
  }
}

/** Give every h2 a stable id and collect the part's contents list. */
function anchorHeadings(html, partNo) {
  const toc = [];
  const out = html.replace(
    /<h2 class="w-h2">([\s\S]*?)<\/h2>/g,
    (match, inner) => {
      const numMatch = inner.match(/<span class="w-num">(\d+)<\/span>/);
      const num = numMatch ? numMatch[1] : null;
      const text = stripTags(inner.replace(/<span class="w-num">\d+<\/span>/, ''));
      const id = `p${partNo}-${num ?? 'x'}-${slugify(text)}`;
      toc.push({ id, num, text });
      return match.replace('<h2 class="w-h2">', `<h2 class="w-h2" id="${id}">`);
    }
  );
  return { html: out, toc };
}

const parts = [];

for (let i = 1; i <= PART_COUNT; i++) {
  const raw = readFileSync(join(SRC_DIR, `kissan_part${i}.html`), 'utf8');

  const body = raw.match(/<body>([\s\S]*)<\/body>/i)[1];
  const cover = body.match(/<section class="cover">([\s\S]*?)<\/section>/i)[1];

  // "PART 1 OF 12 • THE SETUP" → the short label used on cards and pagination
  const badge = stripTags(cover.match(/<div class="part-badge">([\s\S]*?)<\/div>/i)[1]);
  const label = (badge.split('•')[1] ?? badge).trim();

  // Everything after the cover is the readable article.
  let article = body.replace(/<section class="cover">[\s\S]*?<\/section>/i, '').trim();

  // Part 1 opens with the Author's Note, split from the part proper by the only
  // page-break marker in the corpus. Keep it, but as its own prologue block so
  // the reader can present it before the part title rather than inside it.
  let prologue = null;
  if (i === 1) {
    const [note, rest] = article.split(/<div style="page-break-before: always;"><\/div>/);
    // Anchored too (with its own id namespace) so no heading in the piece is
    // un-linkable, though the prologue stays out of the part's contents list.
    prologue = anchorHeadings(
      wrapTables(clean(note.replace(/<h1 class="part-head">[\s\S]*?<\/h1>\s*<p class="part-tag">[\s\S]*?<\/p>/, ''))),
      'note'
    ).html;
    article = rest;
  }

  const title = stripTags(article.match(/<h1 class="part-head">([\s\S]*?)<\/h1>/i)[1]);

  // The reader renders its own themed title block, so drop the source's
  // title/tag/rule from the prose stream to avoid printing it twice.
  article = article
    .replace(/<p class="part-tag">[\s\S]*?<\/p>/i, '')
    .replace(/<h1 class="part-head">[\s\S]*?<\/h1>/i, '')
    .replace(/^\s*<hr class="soft">/i, '');

  let html = clean(article);

  // Split the trailing sources block out — it's reference apparatus, not prose,
  // and the reader collapses it under the article.
  let sources = null;
  const srcMatch = html.match(/<div class="w-sources">([\s\S]*?)<\/div>\s*$/i);
  if (srcMatch) {
    sources = linkifyCitations(srcMatch[1].replace(/<h2[^>]*>[\s\S]*?<\/h2>/i, '').trim());
    html = html.replace(/(<hr class="w-soft">\s*)?<div class="w-sources">[\s\S]*?<\/div>\s*$/i, '').trim();
  }

  const anchored = anchorHeadings(wrapTables(numberFootnotes(html)), i);

  // The standfirst shown on the index card and at the top of each part.
  const leadMatch = anchored.html.match(/<p class="w-lead">([\s\S]*?)<\/p>/i);
  const lead = leadMatch ? stripTags(leadMatch[1]) : '';

  const words = stripTags(anchored.html).split(/\s+/).filter(Boolean).length;

  parts.push({
    n: i,
    label,
    title,
    lead,
    words,
    minutes: Math.max(1, Math.round(words / 220)),
    toc: anchored.toc,
    prologue,
    html: anchored.html,
    sources,
  });

  console.log(`part ${String(i).padStart(2)}  ${String(words).padStart(5)} words  ${anchored.toc.length} sections  — ${title}`);
}

const totalWords = parts.reduce((a, p) => a + p.words, 0);

const file = `/* ============================================================
   KISSAN ANDOLAN — THE COMPLETE STORY
   Generated by scripts/import-writing.mjs from the authored source
   documents. Do not hand-edit: re-run the importer instead.

   ${PART_COUNT} parts · ${totalWords.toLocaleString('en-IN')} words
   ============================================================ */

const parts = ${JSON.stringify(parts, null, 2)};

export default parts;
`;

mkdirSync('src/data/writing', { recursive: true });
writeFileSync(OUT_FILE, file);
console.log(`\n✓ ${OUT_FILE} — ${PART_COUNT} parts, ${totalWords.toLocaleString('en-IN')} words, ${(file.length / 1024).toFixed(0)} KB`);
