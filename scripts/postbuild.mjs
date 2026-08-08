// Runs automatically after `npm run build` (npm's "postbuild" lifecycle hook).
// Prepares the static output to work on GitHub Pages (and any static host):
//   - 404.html mirrors index.html so client-side routes resolve on deep links / refresh
//   - .nojekyll stops GitHub Pages from running Jekyll over the build output
//   - sitemap.xml is generated from the writing manifest, so adding a piece or a
//     part can't leave the sitemap silently stale
import { copyFileSync, writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import {
  pieces,
  writingMeta,
  writingTotals,
  contentsOf,
  isInProgress,
  getPieceForLanguage,
  pdfForPart,
  pdfsOf,
  publishedOf,
  writingPathOf,
} from '../src/data/writing.js';
import {
  books,
  booksMeta,
  booksTotals,
  studiesOf,
  liveStudiesOf,
  isOpen,
} from '../src/data/books.js';

const SITE = 'https://misterlove.in';
const today = new Date().toISOString().slice(0, 10);

copyFileSync('dist/index.html', 'dist/404.html');
writeFileSync('dist/.nojekyll', '');

/* Every route below is driven by the parts that actually exist in the data
   files, never by a piece's planned part count. A serialised piece announces
   fifteen parts long before it has written them, and a sitemap that promised
   the other fourteen would be fourteen 404s handed straight to Google. */
const loaded = [];
const editions = [];
for (const piece of pieces) {
  const english = getPieceForLanguage(piece.slug, 'en');
  const parts = (await english.load()).default;
  loaded.push({ piece: english, parts });
  editions.push({ piece: english, parts });

  for (const language of Object.keys(piece.translations ?? {})) {
    const edition = getPieceForLanguage(piece.slug, language);
    editions.push({ piece: edition, parts: (await edition.load()).default });
  }
}

/* The shelf at /books. Same rule as above: what is written, never what is
   announced — a book here plans three studies and has published one. */
const shelved = [];
/* Language editions of individual studies, kept beside the shelf rather than
   inside it — a translation is another way to read one study, not another
   study, so it never counts towards the shelf's totals. */
const studyEditions = [];
for (const book of books) {
  const studies = (await book.load()).default;
  if (liveStudiesOf(book) !== studies.length) {
    throw new Error(`${book.title} declares ${liveStudiesOf(book)} live studies but loads ${studies.length}`);
  }
  shelved.push({ book, studies });

  for (const [language, edition] of Object.entries(book.translations ?? {})) {
    const translated = (await edition.load()).default;
    const declared = [...(edition.studies ?? [])].sort();
    const loaded = translated.map((s) => s.slug).sort();
    if (JSON.stringify(declared) !== JSON.stringify(loaded)) {
      throw new Error(`${book.title} [${language}] declares [${declared}] but loads [${loaded}]`);
    }
    for (const study of translated) {
      if (!studies.some((s) => s.slug === study.slug)) {
        throw new Error(`${book.title} [${language}]: ${study.slug} has no English edition`);
      }
      studyEditions.push({ book, study, language });
    }
  }
}

/* The HTML below promises a route-specific social image. Fail the build before
   deployment if generation was skipped, a filename drifted, or a card has the
   wrong dimensions. PNG stores width and height in the IHDR header. */
const expectedOgCards = new Set(['writing.png', 'books.png']);
for (const { piece, parts } of editions) {
  const imageSlug = piece.ogSlug ?? piece.slug;
  expectedOgCards.add(`${imageSlug}.png`);
  for (const part of parts) expectedOgCards.add(`${imageSlug}-part-${part.n}.png`);
}
for (const { book, studies } of shelved) {
  expectedOgCards.add(`books-${book.slug}.png`);
  for (const study of studies) expectedOgCards.add(`books-${book.slug}-${study.slug}.png`);
}
for (const { book, study, language } of studyEditions) {
  expectedOgCards.add(`books-${book.slug}-${study.slug}-${language}.png`);
}

const ogErrors = [];
for (const name of expectedOgCards) {
  const path = `dist/og/${name}`;
  if (!existsSync(path)) {
    ogErrors.push(`${name}: missing`);
    continue;
  }

  const png = readFileSync(path);
  const signature = png.subarray(1, 4).toString('ascii');
  if (png.length < 24 || signature !== 'PNG') {
    ogErrors.push(`${name}: not a readable PNG`);
    continue;
  }

  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== 1200 || height !== 630) {
    ogErrors.push(`${name}: ${width}×${height}, expected 1200×630`);
  }
}

if (ogErrors.length) {
  throw new Error(`OG card validation failed:\n  ${ogErrors.join('\n  ')}`);
}

const alternatesFor = (piece, part) => {
  if (!piece.translations?.hi) return [];
  const suffix = part ? `/part-${part}/` : '/';
  return [
    { language: 'en', href: `${SITE}/writing/${piece.slug}${suffix}` },
    { language: 'hi', href: `${SITE}/hi/writing/${piece.slug}${suffix}` },
    { language: 'x-default', href: `${SITE}/writing/${piece.slug}${suffix}` },
  ];
};

const url = ({ loc, lastmod, changefreq, priority, image, alternates = [] }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${alternates.map((alternate) => `
    <xhtml:link rel="alternate" hreflang="${alternate.language}" href="${alternate.href}" />`).join('')}${image ? `
    <image:image>
      <image:loc>${image.loc}</image:loc>
      <image:title>${image.title}</image:title>
    </image:image>` : ''}
  </url>`;

const urls = [
  url({
    loc: `${SITE}/`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '1.0',
    image: {
      loc: `${SITE}/og.png`,
      title: 'Lovepreet Singh — Cybersecurity Professional, Scholar and Writer',
    },
  }),
  // Trailing slashes throughout: these routes are pre-rendered as directories,
  // and GitHub Pages 301s the slash-less form to them. Pointing the sitemap and
  // canonicals at the form that answers 200 directly avoids sending every
  // crawl through a redirect.
  url({
    loc: `${SITE}/writing/`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.9',
    image: {
      loc: `${SITE}/og/writing.png`,
      title: 'Writing — long-form research by Lovepreet Singh',
    },
  }),
  url({
    loc: `${SITE}/books/`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.9',
    image: {
      loc: `${SITE}/og/books.png`,
      title: 'Books, taken apart — close readings by Lovepreet Singh',
    },
  }),
];

for (const { book, studies } of shelved) {
  urls.push(
    url({
      loc: `${SITE}/books/${book.slug}/`,
      lastmod: studies.at(-1)?.published ?? book.published,
      changefreq: 'monthly',
      priority: '0.8',
      image: {
        loc: `${SITE}/og/books-${book.slug}.png`,
        title: `${book.title} by ${book.author}, taken apart`.replace(/&/g, '&amp;'),
      },
    })
  );

  for (const study of studies) {
    const editionsOfStudy = studyEditions.filter((e) => (
      e.book.slug === book.slug && e.study.slug === study.slug
    ));
    /* A study that exists in one language claims no alternates; one that exists
       in two points each edition at the other, and names English as the default
       a crawler should fall back to. */
    const alternates = editionsOfStudy.length ? [
      { language: 'en', href: `${SITE}/books/${book.slug}/${study.slug}/` },
      ...editionsOfStudy.map((e) => ({
        language: e.language,
        href: `${SITE}/${e.language}/books/${book.slug}/${study.slug}/`,
      })),
      { language: 'x-default', href: `${SITE}/books/${book.slug}/${study.slug}/` },
    ] : [];

    urls.push(
      url({
        loc: `${SITE}/books/${book.slug}/${study.slug}/`,
        lastmod: study.published,
        changefreq: 'yearly',
        priority: '0.7',
        alternates,
      })
    );

    for (const edition of editionsOfStudy) {
      urls.push(
        url({
          loc: `${SITE}/${edition.language}/books/${book.slug}/${study.slug}/`,
          lastmod: edition.study.published,
          changefreq: 'yearly',
          priority: '0.7',
          alternates,
        })
      );
    }
  }
}

for (const { piece, parts } of editions) {
  const base = writingPathOf(piece);
  const imageSlug = piece.ogSlug ?? piece.slug;
  // The topic page is the piece's front door — what /writing links to and what
  // someone sharing "this research" would send.
  urls.push(
    url({
      loc: `${SITE}${base}/`,
      lastmod: publishedOf(piece, parts.at(-1)),
      changefreq: 'monthly',
      priority: '0.9',
      alternates: alternatesFor(piece),
      image: {
        loc: `${SITE}/og/${imageSlug}.png`,
        title: `${piece.title} — ${piece.subtitle}`.replace(/&/g, '&amp;'),
      },
    })
  );

  for (const part of parts) {
    urls.push(
      url({
        loc: `${SITE}${base}/part-${part.n}/`,
        lastmod: publishedOf(piece, part),
        changefreq: 'yearly',
        // Part 1 is the entry point readers should land on from search.
        priority: part.n === 1 ? '0.8' : '0.7',
        alternates: alternatesFor(piece, part.n),
      })
    );
  }
}

writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`
);

/* ------------------------------------------------------------------
   Pre-rendered route shells.

   GitHub Pages has no server-side rewrite: an unknown path falls back to
   404.html, which loads the SPA fine for a visitor but answers HTTP 404 with
   the homepage's <title>. Crawlers take that at face value and drop the page,
   so every writing route would stay unindexed no matter what the sitemap says.

   Writing a real index.html at each route makes the path a genuine 200 with
   its own title, description, canonical and structured data in the served
   markup — before any JavaScript runs. React still mounts and takes over; this
   only fixes what the crawler is handed first.
   ------------------------------------------------------------------ */
const template = readFileSync('dist/index.html', 'utf8');

/* The route stylesheets ship in lazy chunks, so index.html only links the main
   one. The pre-rendered markup below uses those route classes — without the
   stylesheet the static content lands unstyled for anyone whose JS has not run
   yet (or at all), and everyone else gets a repaint when the chunk finally
   arrives. Link them up front instead: the CSS then downloads in parallel with
   the bundle rather than after it. */
const cssFor = (name) => {
  const hit = readdirSync('dist/assets').find((f) => f.startsWith(`${name}-`) && f.endsWith('.css'));
  return hit ? `  <link rel="stylesheet" href="/assets/${hit}" />` : '';
};
const ROUTE_CSS = {
  article: cssFor('Article'),
  writing: cssFor('Writing'),
  books: cssFor('Books'),
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripTags = (s) =>
  s.replace(/<[^>]*>/g, ' ')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/* ------------------------------------------------------------------
   Static body.

   The SPA leaves <div id="root"> empty, so a crawler that does not execute
   JavaScript sees the metadata and nothing else — 291 words of a 7,800-word
   part. Google renders JS eventually, but rendering is deferred and most
   other crawlers (Bing, social unfurlers, the AI search bots) do not render
   at all. So each shell now ships the real article inside #root, using the
   site's own class names so the existing CSS styles it.

   main.jsx mounts with createRoot().render(), which replaces this markup
   rather than hydrating it — no mismatch warnings, and the reader sees text
   immediately instead of waiting on the bundle.
   ------------------------------------------------------------------ */

const crumbs = (trail, label = 'Breadcrumb') =>
  `<nav class="article__crumbs" aria-label="${esc(label)}">${trail
    .map((c, i) =>
      (i ? '<span class="article__crumb-sep" aria-hidden="true">/</span>' : '')
      + (c.href
        ? `<a class="article__crumb" href="${c.href}">${esc(c.name)}</a>`
        : `<span class="article__crumb is-current">${esc(c.name)}</span>`)
    )
    .join('')}</nav>`;

const staticCopy = (piece) => (piece.language === 'hi' ? {
  writing: 'लेखन',
  part: 'भाग',
  of: '/',
  sources: 'स्रोत और आगे की पढ़ाई',
  allParts: 'सभी भाग',
  back: 'सभी लेखों पर वापस जाएं →',
  parts: 'भाग',
  published: 'प्रकाशित',
  words: 'शब्द',
  contents: 'विषय सूची',
  minutes: 'मिनट',
  preparing: 'तैयार हो रहा है',
  download: (pdf) => `मूल अंग्रेज़ी PDF डाउनलोड करें · ${pdf.size}`,
  by: 'लेखक',
  readFull: 'पूरा भाग पढ़ें',
  inThisPart: 'इस भाग में',
  partsAria: 'लेख के भाग',
} : {
  writing: 'Writing',
  part: 'Part',
  of: 'of',
  sources: 'Sources & further reading',
  allParts: 'All parts',
  back: 'Back to all writing →',
  parts: 'parts',
  published: 'published',
  words: 'words',
  contents: 'Contents',
  minutes: 'min',
  preparing: 'In preparation',
  download: (pdf) => (
    piece.pdfs
      ? `Download ${pdf.label ?? 'the PDF'} · ${pdf.size}`
      : `Download ${piece.pdfLabel ?? 'the full PDF'} · ${piece.pdfSize}`
  ),
  by: 'by',
  readFull: 'Read the full part',
  inThisPart: 'In this part',
  partsAria: 'Article parts',
});

function articleBody(piece, part, live) {
  const base = writingPathOf(piece);
  const copy = staticCopy(piece);
  const pdf = pdfForPart(piece, part);
  const download = pdf
    ? `<p><a class="btn btn--ghost" href="/${pdf.file}" download>${esc(copy.download(pdf))}</a></p>`
    : '';
  return `<main id="main"><article class="article${piece.language === 'hi' ? ' article--hi' : ''}" lang="${piece.language}">
  <header class="article__head"><div class="container">
    ${crumbs([
      { name: copy.writing, href: '/writing/' },
      { name: piece.title, href: `${base}/` },
      { name: `${copy.part} ${part.n}` },
    ], piece.language === 'hi' ? 'पृष्ठ क्रम' : 'Breadcrumb')}
    <div class="article__head-grid"><div class="article__head-main">
      <span class="article__partno mono">${copy.part} ${String(part.n).padStart(2, '0')} <span class="dim">${copy.of} ${piece.parts}</span><span class="article__partlabel">${esc(part.label)}</span></span>
      <h1 class="article__title">${esc(part.title)}</h1>
      <p class="article__standfirst">${esc(part.lead)}</p>
    </div></div>
  </div></header>
  <div class="container"><div class="article__body"><div class="article__col">
    ${part.prologue ? `<section class="article__prologue">${part.prologueTitle ? `<h2 class="article__prologue-head">${esc(part.prologueTitle)}</h2>` : ''}<div class="prose">${part.prologue}</div></section>` : ''}
    <div class="prose">${part.html}</div>
    ${part.sources ? `<section class="article__sources" open><p class="mono">${copy.sources} — ${copy.part} ${part.n}</p><div class="prose prose--sources">${part.sources}</div></section>` : ''}
    ${download}
    <nav class="article__pager" aria-label="${copy.partsAria}">
      ${part.n > 1 ? `<a class="article__pager-link article__pager-link--prev" href="${base}/part-${part.n - 1}/"><span class="mono">← ${copy.part} ${String(part.n - 1).padStart(2, '0')}</span></a>` : '<span></span>'}
      ${part.n < live ? `<a class="article__pager-link article__pager-link--next" href="${base}/part-${part.n + 1}/"><span class="mono">${copy.part} ${String(part.n + 1).padStart(2, '0')} →</span></a>` : `<a class="article__pager-link article__pager-link--next" href="${isInProgress(piece) ? `${base}/` : '/writing/'}"><span class="mono">${isInProgress(piece) ? `${copy.allParts} →` : copy.back}</span></a>`}
    </nav>
  </div></div></div>
</article></main>`;
}

function topicBody(piece, parts) {
  const base = writingPathOf(piece);
  const copy = staticCopy(piece);
  const downloads = pdfsOf(piece)
    .map((pdf) => `<a class="btn btn--ghost" href="/${pdf.file}" download>${esc(copy.download(pdf))}</a>`)
    .join(' ');
  // The whole announced series, not just what is written: a crawler that sees
  // the shape of the work indexes the topic page for the subjects still to
  // come, and the unwritten rows are plain markup with no href to follow.
  const contents = contentsOf(piece, parts);
  const count = isInProgress(piece)
    ? `${parts.length} / ${piece.parts} ${copy.parts} ${copy.published}`
    : `${piece.parts} ${copy.parts}`;

  const row = (p) => `<span class="partrow__n mono">${String(p.n).padStart(2, '0')}</span><span class="partrow__body"><span class="partrow__label mono">${esc(p.label)}</span><span class="partrow__title">${esc(p.title)}</span><span class="partrow__lead">${esc(p.lead)}</span></span><span class="partrow__meta mono">${p.live ? `${p.minutes} ${copy.minutes}` : copy.preparing}</span>`;

  return `<main id="main"><div class="topicpage${piece.language === 'hi' ? ' topicpage--hi' : ''}" lang="${piece.language}"><div class="container">
  ${crumbs(
    [{ name: copy.writing, href: '/writing/' }, { name: piece.title }],
    piece.language === 'hi' ? 'पृष्ठ क्रम' : 'Breadcrumb'
  )}
  <h1 class="topic__title">${esc(piece.title)} — ${esc(piece.subtitle)}</h1>
  <p class="topicpage__stand">${esc(piece.standfirst)}</p>
  <p class="topicpage__summary">${esc(piece.summary)}</p>
  <p class="mono">${count} · ${piece.words.toLocaleString('en-IN')} ${copy.words} · ${esc(piece.displayDate)} · ${copy.by} Lovepreet Singh</p>
  <h2>${copy.contents}</h2>
  <ol class="feature__parts">${contents
    .map((p) => `<li>${p.live
      ? `<a class="partrow" href="${base}/part-${p.n}/">${row(p)}</a>`
      : `<span class="partrow partrow--soon">${row(p)}</span>`}</li>`)
    .join('')}</ol>
  ${downloads ? `<p>${downloads}</p>` : ''}
</div></div></main>`;
}

function shelfBody(loaded) {
  return `<main id="main"><div class="writingpage"><div class="container">
  <h1 class="writingpage__title">${esc(writingMeta.title)}</h1>
  <p class="writingpage__lead">${esc(writingMeta.lead)}</p>
  <p class="mono">${writingTotals.pieces} research pieces · ${writingTotals.parts} parts · ${writingTotals.words.toLocaleString('en-IN')} words</p>
  <ul class="topics">${loaded
    .map(({ piece: p, parts }) => `<li class="topic"><a class="topic__link" href="/writing/${p.slug}/"><span class="topic__body"><span class="mono topic__topic">${esc(p.topic)}</span><span class="topic__title">${esc(p.title)} — ${esc(p.subtitle)}</span><span class="topic__stand">${esc(p.standfirst)}</span><span class="topic__meta mono">${isInProgress(p) ? `${parts.length} of ${p.parts} parts` : `${p.parts} parts`} · ${p.words.toLocaleString('en-IN')} words · ${esc(p.displayDate)}</span></span></a><ol>${parts
      .map((x) => `<li><a href="/writing/${p.slug}/part-${x.n}/">Part ${x.n} — ${esc(x.title)}</a></li>`)
      .join('')}</ol></li>`)
    .join('')}</ul>
</div></div></main>`;
}

/* ---- Static bodies for the shelf at /books ---- */

/* The room's ground, set before first paint so a phone's browser chrome does
   not flash the library's cream on the way in. */
const BOOKS_GROUND = { light: '#E8E6DE', dark: '#15191A' };

const gradeCount = (scorecard, grade) => scorecard.filter((r) => r.grade === grade).length;

const loadStrip = (scorecard) => `<span class="loadstrip" role="img" aria-label="${
  scorecard.length} assumptions: ${gradeCount(scorecard, 'holds')} hold, ${
  gradeCount(scorecard, 'partly')} partly, ${gradeCount(scorecard, 'fails')} fail">${scorecard
  .map((r) => `<span class="pier pier--${r.grade}"></span>`)
  .join('')}</span>`;

/* The static form of the load diagram. The beam is drawn for anyone who gets
   the CSS, and the full list underneath carries the same information as text
   — so a crawler, a reader with no JavaScript and a screen reader all get the
   scorecard rather than a picture they cannot use. */
/* Kept in step with src/components/LoadDiagram.jsx — the drawing is the first
   argument the page makes, so it is translated with the prose. */
const LOAD_COPY = {
  en: {
    condition: ['sound', 'partial', 'failed'],
    caption: (book, label) => `Load test — ${book}, ${label}`,
    assumptions: (n) => `${n} assumptions`,
    assumption: (n) => `Assumption ${n}`,
    sentence: 'The sentence',
    legend: ['Holds', 'Partly, or contested', 'Fails'],
  },
  hi: {
    condition: ['टिकीं', 'आंशिक', 'नाकाम'],
    caption: (book, label) => `भार-परीक्षा — ${book}, ${label}`,
    assumptions: (n) => `${n} मान्यताएँ`,
    assumption: (n) => `मान्यता ${n}`,
    sentence: 'वाक्य',
    legend: ['टिकती है', 'आंशिक, या विवादित', 'नाकाम'],
  },
};

function loadDiagram(study, book, language = 'en') {
  const s = study.scorecard;
  const copy = LOAD_COPY[language];
  // Condition words, so the tally reads correctly at a count of one.
  const summary = [
    [gradeCount(s, 'holds'), copy.condition[0]],
    [gradeCount(s, 'partly'), copy.condition[1]],
    [gradeCount(s, 'fails'), copy.condition[2]],
  ].filter(([n]) => n > 0).map(([n, g]) => `${n} ${g}`).join(' · ');

  return `<figure class="load">
    <figcaption class="load__cap mono"><span>${esc(copy.caption(book.title, study.label))}</span><span>${esc(copy.assumptions(s.length))} · ${esc(summary)}</span></figcaption>
    <div class="load__beam">
      <div class="load__lintel" role="img" aria-label="${esc(copy.sentence)}: ${esc(study.sentence)}"></div>
      <ol class="load__piers">${s
        .map((r) => `<li><a class="pier pier--${r.grade}" href="#${r.href}"><span aria-hidden="true">${String(r.n).padStart(2, '0')}</span><span class="sr-only">${esc(copy.assumption(r.n))}: ${esc(r.axiom)} — ${esc(r.verdict)}</span></a></li>`)
        .join('')}</ol>
      <div class="load__legend mono">
        <span><i class="load__swatch load__swatch--holds"></i>${esc(copy.legend[0])}</span>
        <span><i class="load__swatch load__swatch--partly"></i>${esc(copy.legend[1])}</span>
        <span><i class="load__swatch load__swatch--fails"></i>${esc(copy.legend[2])}</span>
      </div>
    </div>
    <ol class="load__list">${s
      .map((r) => `<li><a class="load__row" href="#${r.href}"><span class="load__row-n">${String(r.n).padStart(2, '0')}</span><span class="load__row-t">${esc(r.axiom)}</span><span class="load__row-v grade-${r.grade}">${esc(r.verdict)}</span></a></li>`)
      .join('')}</ol>
  </figure>`;
}

function booksShelfBody(shelved) {
  return `<main id="main"><div class="writingpage bookspage"><div class="container">
  <h1 class="writingpage__title">${esc(booksMeta.title)}</h1>
  <p class="writingpage__lead">${esc(booksMeta.lead)}</p>
  <p class="mono">${booksTotals.books} ${booksTotals.books === 1 ? 'book' : 'books'} · ${booksTotals.studies} ${booksTotals.studies === 1 ? 'study' : 'studies'} · ${booksTotals.axioms} axioms graded</p>
  <ol class="shelfmethod__steps">${booksMeta.method
    .map((step) => `<li><span class="mono shelfmethod__n">${esc(step.n)}</span><span class="shelfmethod__t">${esc(step.t)}</span><span class="shelfmethod__d">${esc(step.d)}</span></li>`)
    .join('')}</ol>
  <ul class="topics">${shelved
    .map(({ book, studies }) => `<li class="topic shelfbook"><a class="topic__link" href="/books/${book.slug}/"><span class="topic__body"><span class="mono topic__topic">${esc(book.topic)}</span><span class="topic__title">${esc(book.title)} — ${esc(book.author)}</span><span class="topic__stand">${esc(book.standfirst)}</span><span class="topic__meta mono">${isOpen(book) ? `${studies.length} of ${book.studies} studies` : `${book.studies} ${book.studies === 1 ? 'study' : 'studies'}`} · ${book.axioms} axioms graded · ${esc(book.displayDate)}</span></span></a><ol>${studies
      .map((s) => `<li><a href="/books/${book.slug}/${s.slug}/">${esc(s.title)} — “${esc(s.sentence)}”</a></li>`)
      .join('')}</ol></li>`)
    .join('')}</ul>
</div></div></main>`;
}

function bookBody(book, studies) {
  const contents = studiesOf(book, studies);
  return `<main id="main"><div class="topicpage bookpage"><div class="container">
  ${crumbs([{ name: 'Books', href: '/books/' }, { name: book.title }])}
  <h1 class="topic__title">${esc(book.title)} — ${esc(book.subtitle)}, taken apart</h1>
  <p class="bookpage__by">The book: ${esc(book.title)} — ${esc(book.subtitle)}, by ${esc(book.author)}. ${esc(book.bookNote)}.</p>
  <p class="topicpage__stand">${esc(book.standfirst)}</p>
  <p class="topicpage__summary">${esc(book.summary)}</p>
  <p class="mono">${isOpen(book) ? `${studies.length} / ${book.studies} studies published` : `${book.studies} ${book.studies === 1 ? 'study' : 'studies'}`} · ${book.axioms} axioms graded · ${esc(book.displayDate)} · by Lovepreet Singh</p>
  <h2>The studies</h2>
  <ol class="feature__parts studylist">${contents
    .map((s) => {
      const row = `<span class="partrow__n mono">${String(s.n).padStart(2, '0')}</span><span class="partrow__body"><span class="partrow__label mono">${esc(s.label)}</span><span class="partrow__title">${esc(s.title)}</span>${s.sentence ? `<span class="studylist__sentence">“${esc(s.sentence)}”</span>` : ''}<span class="partrow__lead">${esc(s.lead)}</span>${s.scorecard ? loadStrip(s.scorecard) : ''}</span><span class="partrow__meta mono">${s.live ? `${s.minutes} min` : 'In preparation'}</span>`;
      return `<li>${s.live
        ? `<a class="partrow" href="/books/${book.slug}/${s.slug}/">${row}</a>`
        : `<span class="partrow partrow--soon">${row}</span>`}</li>`;
    })
    .join('')}</ol>
</div></div></main>`;
}

/* The furniture the static shell says for itself, per language. The prose it
   wraps arrives already translated from the importer. */
const STUDY_COPY = {
  en: {
    books: 'Books',
    studyOf: (n, total) => `Study ${n} <span class="dim">of ${total}</span>`,
    sources: 'Glossary, timeline and sources',
    download: (label, size) => `Download ${label ?? 'the PDF'} (${size})`,
    pager: 'Studies on this book',
  },
  hi: {
    books: 'किताबें',
    studyOf: (n, total) => `अध्ययन ${n} <span class="dim">/ ${total}</span>`,
    sources: 'शब्दावली, समय-रेखा और स्रोत',
    download: (label, size) => `${label ?? 'PDF'} डाउनलोड करें (${size})`,
    pager: 'इस किताब पर अध्ययन',
  },
};

/* `studies` is the shelf in English and the translated set in any other
   language, so a translated edition pages through its own siblings. */
function studyBody(book, study, studies, language = 'en', translated = false) {
  const copy = STUDY_COPY[language];
  const contents = language === 'en' ? studiesOf(book, studies) : [];
  const here = language === 'en' ? -1 : studies.findIndex((s) => s.slug === study.slug);
  const alsoPrev = here > 0 ? studies[here - 1] : null;
  const alsoNext = here >= 0 && here < studies.length - 1 ? studies[here + 1] : null;
  /* The switch is in the shell as well as in the app, so it works on the first
     paint and for a reader with no JavaScript at all. */
  const languageSwitch = translated
    ? `<nav class="language-switch" aria-label="${language === 'hi' ? 'पढ़ने की भाषा' : 'Reading language'}">`
      + `<a href="/books/${book.slug}/${study.slug}/" lang="en"${language === 'en' ? ' class="is-active" aria-current="page"' : ''}>English</a>`
      + `<a href="/hi/books/${book.slug}/${study.slug}/" lang="hi"${language === 'hi' ? ' class="is-active" aria-current="page"' : ''}>हिन्दी</a>`
      + '</nav>'
    : '';
  const next = contents.find((s) => s.n === study.n + 1);
  const prev = contents.find((s) => s.n === study.n - 1 && s.live);
  const download = study.pdf
    ? `<p><a class="btn btn--ghost" href="/${study.pdf}" download>${esc(copy.download(study.pdfLabel, study.pdfSize))}</a></p>`
    : '';
  const hi = language === 'hi';

  return `<main id="main"><article class="article study${hi ? ' article--hi' : ''}" lang="${language}">
  <header class="article__head"><div class="container">
    ${crumbs([
      { name: copy.books, href: '/books/' },
      { name: book.title, href: `/books/${book.slug}/` },
      { name: study.title },
    ])}
    ${languageSwitch}
    <div class="article__head-grid"><div class="article__head-main">
      <span class="article__partno mono">${copy.studyOf(String(study.n).padStart(2, '0'), book.studies)}<span class="article__partlabel">${esc(study.label)}</span></span>
      <h1 class="article__title">${esc(study.title)}</h1>
      <p class="article__standfirst">${esc(study.subtitle)}</p>
      <blockquote class="study__sentence"><p>“${esc(study.sentence)}”</p>${study.secondary ? `<p class="study__sentence-2">“${esc(study.secondary)}”</p>` : ''}<cite class="mono">${esc(book.author)}, <i>${esc(book.title)}</i> — ${esc(study.source)}</cite></blockquote>
    </div></div>
    ${study.scorecard ? loadDiagram(study, book, language) : ''}
  </div></header>
  <div class="container"><div class="article__body"><div class="article__col">
    ${study.prologue ? `<section class="article__prologue">${study.prologueTitle ? `<h2 class="article__prologue-head">${esc(study.prologueTitle)}</h2>` : ''}<div class="prose">${study.prologue}</div></section>` : ''}
    <div class="prose">${study.html}</div>
    ${study.sources ? `<section class="article__sources" open><p class="mono">${esc(copy.sources)}</p><div class="prose prose--sources">${study.sources}</div></section>` : ''}
    ${download}
    <nav class="article__pager" aria-label="${esc(copy.pager)}">
      ${hi
        ? `${alsoPrev ? `<a class="article__pager-link article__pager-link--prev" href="/hi/books/${book.slug}/${alsoPrev.slug}/"><span class="mono">← अध्ययन ${String(alsoPrev.n).padStart(2, '0')}</span></a>` : '<span></span>'}
      ${alsoNext
        ? `<a class="article__pager-link article__pager-link--next" href="/hi/books/${book.slug}/${alsoNext.slug}/"><span class="mono">अध्ययन ${String(alsoNext.n).padStart(2, '0')} →</span></a>`
        : `<a class="article__pager-link article__pager-link--next" href="/books/${book.slug}/"><span class="mono">बाकी अध्ययन →</span></a>`}`
        : `${prev ? `<a class="article__pager-link article__pager-link--prev" href="/books/${book.slug}/${prev.slug}/"><span class="mono">← Study ${String(prev.n).padStart(2, '0')}</span></a>` : '<span></span>'}
      ${next?.live
        ? `<a class="article__pager-link article__pager-link--next" href="/books/${book.slug}/${next.slug}/"><span class="mono">Study ${String(next.n).padStart(2, '0')} →</span></a>`
        : `<a class="article__pager-link article__pager-link--next" href="${next ? `/books/${book.slug}/` : '/books/'}"><span class="mono">${next ? 'That’s all so far →' : 'Back to the shelf →'}</span></a>`}`}
    </nav>
  </div></div></div>
</article></main>`;
}

function shell({
  path,
  title,
  description,
  canonical,
  jsonLd,
  noscript,
  keywords,
  image,
  imageAlt,
  body,
  theme,
  extraMeta,
  css,
  language = 'en',
  locale = 'en_US',
  alternates = [],
  bodyClass,
  themeColor,
}) {
  let html = template
    .replace(/<html lang="[^"]*"/, `<html lang="${language}"`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    // Share card: the piece's own artwork rather than the site banner, so a
    // shared part previews that part. Generated by scripts/make-og-cards.mjs.
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta property="og:image:secure_url" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, `$1${esc(imageAlt)}$2`)
    .replace(
      /(<meta property="og:image:width" content=")[^"]*(")/,
      (_, prefix, suffix) => `${prefix}1200${suffix}`
    )
    .replace(
      /(<meta property="og:image:height" content=")[^"]*(")/,
      (_, prefix, suffix) => `${prefix}630${suffix}`
    )
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta name="twitter:image:alt" content=")[^"]*(")/, `$1${esc(imageAlt)}$2`)
    // The homepage keywords describe the person and the wider archive. Each
    // reading route gets the terms for its own subject instead.
    .replace(/(<meta name="keywords" content=")[^"]*(")/, `$1${esc(keywords)}$2`)
    .replace(
      /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
      `$1${esc(description)}$2`
    )
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[\s\S]*?(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1article$2`)
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${locale}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[\s\S]*?(")/, `$1${esc(description)}$2`);

  const head = [];

  for (const ld of [].concat(jsonLd ?? [])) {
    head.push(`  <script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n    </script>`);
  }
  for (const [k, v] of Object.entries(extraMeta ?? {})) {
    head.push(`  <meta property="${k}" content="${esc(v)}" />`);
  }
  for (const alternate of alternates) {
    head.push(`  <link rel="alternate" hreflang="${alternate.language}" href="${alternate.href}" />`);
  }
  if (alternates.length) {
    head.push(`  <meta property="og:locale:alternate" content="${locale === 'hi_IN' ? 'en_IN' : 'hi_IN'}" />`);
  }
  head.push('  <link rel="alternate" type="application/rss+xml" title="Writing — Lovepreet Singh" href="https://misterlove.in/feed.xml" />');
  for (const c of [].concat(css ?? [])) if (c) head.push(c);

  // Set the reading theme before first paint so the article does not flash
  // from the site's dark default to paper. Matches useReaderTheme's key.
  if (theme) {
    head.push(
      '  <script>try{var t=localStorage.getItem("lws:reader-theme");'
      + `document.documentElement.dataset.theme=t==="dark"?"dark":"${theme}"}`
      + `catch(e){document.documentElement.dataset.theme="${theme}"}</script>`
    );
  }

  html = html.replace('</head>', `${head.join('\n')}\n  </head>`);

  // Swap the homepage's no-JS fallback for this route's own.
  //
  // Target it by content, not position: <head> also carries a <noscript> that
  // loads the reading serif, and a naive first-match replace drops article
  // markup into the head while leaving the real fallback in place — which
  // also left two <h1>s in the document.
  //
  // With #root now carrying the full article, this block is only a safety net,
  // so it stays short and headingless rather than duplicating the page.
  html = html.replace(
    /<noscript>\s*<h1>[\s\S]*?<\/noscript>/,
    `<noscript>\n${noscript}\n    </noscript>`
  );

  /* A section that declares its own room needs the class before first paint,
     or the shell renders in the library's cream and repaints when React
     mounts. Same reason the reader sets its theme in the head. */
  if (bodyClass) html = html.replace('<body>', `<body class="${bodyClass}">`);
  if (themeColor) {
    html = html.replace(
      /(<meta name="theme-color" content=")[^"]*(")/,
      `$1${themeColor.light}$2`
    ).replace(
      /(document\.querySelector\('meta\[name="theme-color"\]'\)\.setAttribute\('content', ')[^']*(')/,
      `$1${themeColor.dark}$2`
    );
  }

  // Ship the real content inside #root. React replaces it on mount.
  if (body) html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const dir = `dist${path}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, html);
}

let shells = 0;

/* ---- /writing — the shelf. Written once, listing every piece. ---- */
shell({
  path: '/writing',
  title: 'Writing — long-form research by Lovepreet Singh',
  description:
    'Long-form work on subjects I refused to have a lazy opinion about. Researched properly, written plainly, every side given its strongest case.',
  canonical: `${SITE}/writing/`,
  keywords: `Lovepreet Singh writing, long-form research, essays, ${pieces.map((p) => p.title).join(', ')}`,
  // The shelf has its own card listing the research — not a borrowed cover
  // from whichever piece happens to be newest.
  image: `${SITE}/og/writing.png`,
  imageAlt: `Writing by Lovepreet Singh — ${pieces.length} long-form research pieces, ${writingTotals.parts} parts, ${writingTotals.words.toLocaleString('en-IN')} words.`,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Writing — Lovepreet Singh',
    url: `${SITE}/writing/`,
    author: { '@id': `${SITE}/#lovepreet-singh` },
    hasPart: pieces.map((p) => ({
      '@type': 'CreativeWorkSeries',
      name: `${p.title} — ${p.subtitle}`,
      url: `${SITE}/writing/${p.slug}/`,
      numberOfItems: p.parts,
      abstract: p.standfirst,
    })),
  },
  body: shelfBody(loaded),
  css: ROUTE_CSS.writing,
  noscript:
    '      <p><strong>Writing — Lovepreet Singh</strong></p>\n' +
    loaded
      .map(({ piece: p, parts }) =>
        `      <h2><a href="/writing/${p.slug}/">${esc(p.title)} — ${esc(p.subtitle)}</a></h2>\n` +
        `      <p>${esc(p.standfirst)}</p>\n` +
        `      <ul>\n${parts
          .map((x) => `        <li><a href="/writing/${p.slug}/part-${x.n}/">Part ${x.n}: ${esc(x.title)}</a></li>`)
          .join('\n')}\n      </ul>`
      )
      .join('\n'),
});
shells += 1;

for (const { piece, parts } of editions) {
  /* ---- English or Hindi topic front door. ---- */
  const copy = staticCopy(piece);
  const topicPath = writingPathOf(piece);
  const topicUrl = `${SITE}${topicPath}/`;
  const imageSlug = piece.ogSlug ?? piece.slug;
  const alternates = alternatesFor(piece);
  shell({
    path: topicPath,
    title: `${piece.title} — ${piece.subtitle} | Lovepreet Singh`,
    description: piece.standfirst,
    canonical: topicUrl,
    keywords: [piece.title, ...piece.keywords, 'Lovepreet Singh'].join(', '),
    image: `${SITE}/og/${imageSlug}.png`,
    imageAlt: piece.language === 'hi'
      ? `${piece.title} — ${piece.subtitle}। Lovepreet Singh की ${piece.parts} भागों वाली शोध श्रृंखला।`
      : `${piece.title} — ${piece.subtitle}. ${piece.parts}-part research series by Lovepreet Singh.`,
    body: topicBody(piece, parts),
    css: ROUTE_CSS.writing,
    language: piece.language,
    locale: piece.locale,
    alternates,
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: copy.writing, item: `${SITE}/writing/` },
        { '@type': 'ListItem', position: 2, name: piece.title, item: topicUrl },
      ],
    }, {
      '@context': 'https://schema.org',
      '@type': 'CreativeWorkSeries',
      name: `${piece.title} — ${piece.subtitle}`,
      url: topicUrl,
      description: piece.standfirst,
      abstract: piece.summary,
      datePublished: piece.published,
      inLanguage: piece.language,
      numberOfItems: piece.parts,
      author: { '@type': 'Person', '@id': `${SITE}/#lovepreet-singh`, name: 'Lovepreet Singh' },
      about: piece.topic.split(' · ').map((t) => ({ '@type': 'Thing', name: t })),
      hasPart: parts.map((x) => ({
        '@type': 'Article',
        headline: x.title,
        url: `${SITE}${topicPath}/part-${x.n}/`,
        wordCount: x.words,
        position: x.n,
      })),
      ...(piece.language === 'hi' ? {
        translationOfWork: {
          '@type': 'CreativeWorkSeries',
          inLanguage: 'en',
          url: `${SITE}/writing/${piece.slug}/`,
        },
      } : piece.translations?.hi ? {
        workTranslation: {
          '@type': 'CreativeWorkSeries',
          inLanguage: 'hi',
          url: `${SITE}/hi/writing/${piece.slug}/`,
        },
      } : {}),
    }],
    noscript:
      `      <p><strong>${esc(piece.title)} — ${esc(piece.subtitle)}</strong></p>\n` +
      `      <p>${esc(piece.standfirst)}</p>\n` +
      `      <p>${esc(piece.summary)}</p>\n` +
      `      <p>${isInProgress(piece) ? `${parts.length} / ${piece.parts} ${copy.parts} ${copy.published}` : `${piece.parts} ${copy.parts}`} · ${piece.words.toLocaleString('en-IN')} ${copy.words} · ${copy.by} Lovepreet Singh, ${esc(piece.displayDate)}</p>\n` +
      `      <h2>${copy.contents}</h2>\n      <ul>\n${contentsOf(piece, parts)
        .map((x) => (x.live
          ? `        <li><a href="${topicPath}/part-${x.n}/">${copy.part} ${x.n} — ${esc(x.title)}</a></li>`
          : `        <li>${copy.part} ${x.n} — ${esc(x.title)} (${copy.preparing})</li>`))
        .join('\n')}\n      </ul>`,
  });
  shells += 1;

  for (const part of parts) {
    const canonical = `${SITE}${topicPath}/part-${part.n}/`;
    const partAlternates = alternatesFor(piece, part.n);
    const partPublished = publishedOf(piece, part);
    shell({
      path: `${topicPath}/part-${part.n}`,
      title: piece.language === 'hi'
        ? `${part.title} — ${piece.title}: भाग ${part.n}/${piece.parts} | Lovepreet Singh`
        : `${part.title} — ${piece.title}: Part ${part.n} of ${piece.parts} | Lovepreet Singh`,
      description: part.lead || piece.standfirst,
      canonical,
      keywords: [
        piece.title, `${piece.title} ${copy.part} ${part.n}`, part.label.toLowerCase(),
        ...piece.keywords, 'Lovepreet Singh',
      ].join(', '),
      image: `${SITE}/og/${imageSlug}-part-${part.n}.png`,
      imageAlt: piece.language === 'hi'
        ? `${piece.title}, ${piece.parts} में से भाग ${part.n} — ${part.title}। लेखक: Lovepreet Singh।`
        : `${piece.title}, Part ${part.n} of ${piece.parts} — ${part.title}. By Lovepreet Singh.`,
      body: articleBody(piece, part, parts.length),
      css: [ROUTE_CSS.article, ROUTE_CSS.writing],
      language: piece.language,
      locale: piece.locale,
      alternates: partAlternates,
      // The article reads on paper; set it before paint so there is no flash.
      theme: 'light',
      extraMeta: {
        'article:published_time': `${partPublished}T00:00:00+05:30`,
        'article:modified_time': `${partPublished}T00:00:00+05:30`,
        'article:author': 'Lovepreet Singh',
        'article:section': part.label,
        'article:tag': piece.keywords.slice(0, 6).join(', '),
      },
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: copy.writing, item: `${SITE}/writing/` },
          { '@type': 'ListItem', position: 2, name: piece.title, item: topicUrl },
          { '@type': 'ListItem', position: 3, name: part.title, item: canonical },
        ],
      }, {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: piece.language === 'hi'
          ? `${part.title} — ${piece.title}: भाग ${part.n}`
          : `${part.title} — ${piece.title}: Part ${part.n}`,
        description: part.lead || piece.standfirst,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        datePublished: partPublished,
        inLanguage: piece.language,
        wordCount: part.words,
        articleSection: part.label,
        isPartOf: {
          '@type': 'CreativeWorkSeries',
          name: `${piece.title} — ${piece.subtitle}`,
          url: topicUrl,
          numberOfItems: piece.parts,
        },
        author: { '@type': 'Person', '@id': `${SITE}/#lovepreet-singh`, name: 'Lovepreet Singh' },
        publisher: { '@id': `${SITE}/#lovepreet-singh` },
        about: piece.topic.split(' · ').map((t) => ({ '@type': 'Thing', name: t })),
        isAccessibleForFree: true,
        ...(piece.language === 'hi' ? {
          translationOfWork: {
            '@type': 'Article',
            inLanguage: 'en',
            url: `${SITE}/writing/${piece.slug}/part-${part.n}/`,
          },
        } : piece.translations?.hi ? {
          workTranslation: {
            '@type': 'Article',
            inLanguage: 'hi',
            url: `${SITE}/hi/writing/${piece.slug}/part-${part.n}/`,
          },
        } : {}),
      }],
      noscript:
        `      <p><strong>${esc(part.title)}</strong></p>\n` +
        `      <p><strong>${esc(piece.title)} — ${esc(piece.subtitle)}</strong> · ${copy.part} ${part.n} ${copy.of} ${piece.parts} · ${copy.by} Lovepreet Singh</p>\n` +
        `      <p>${esc(part.lead)}</p>\n` +
        `      <h2>${copy.inThisPart}</h2>\n      <ul>\n${part.toc
          .map((t) => `        <li>${esc(t.text)}</li>`)
          .join('\n')}\n      </ul>\n` +
        `      <p>${esc(stripTags(part.html).slice(0, 900))}…</p>\n` +
        `      <p><a href="${canonical}">${copy.readFull}</a></p>`,
    });
    shells += 1;
  }
}

/* ---- /books — the shelf of other people's books. -------------------------
   A different content type from /writing, and it says so in its structured
   data: each study is a Review whose itemReviewed is the book, not a part of
   a series of mine. That is what it actually is, and it is what lets a search
   engine show it against the book rather than against me. */
shell({
  path: '/books',
  title: 'Books, taken apart — close readings by Lovepreet Singh',
  description:
    'Famous books read one sentence at a time. The most quoted line gets pulled out, '
    + 'its hidden axioms named and graded, the argument steelmanned before it is attacked.',
  canonical: `${SITE}/books/`,
  keywords: `close reading, book criticism, hidden axioms, steelman, ${books.map((b) => `${b.title} ${b.author}`).join(', ')}, Lovepreet Singh`,
  image: `${SITE}/og/books.png`,
  imageAlt: `Books, taken apart — ${booksTotals.books} ${booksTotals.books === 1 ? 'book' : 'books'}, ${booksTotals.studies} single-sentence ${booksTotals.studies === 1 ? 'study' : 'studies'}, ${booksTotals.axioms} axioms graded.`,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Books, taken apart — Lovepreet Singh',
    url: `${SITE}/books/`,
    author: { '@id': `${SITE}/#lovepreet-singh` },
    hasPart: books.map((b) => ({
      '@type': 'Book',
      name: `${b.title}: ${b.subtitle}`,
      author: { '@type': 'Person', name: b.author },
      url: `${SITE}/books/${b.slug}/`,
      abstract: b.standfirst,
    })),
  },
  body: booksShelfBody(shelved),
  css: [ROUTE_CSS.writing, ROUTE_CSS.books],
  bodyClass: 'books-room',
  themeColor: BOOKS_GROUND,
  noscript:
    '      <p><strong>Books, taken apart — Lovepreet Singh</strong></p>\n'
    + shelved
      .map(({ book, studies }) =>
        `      <h2><a href="/books/${book.slug}/">${esc(book.title)} — ${esc(book.author)}</a></h2>\n`
        + `      <p>${esc(book.standfirst)}</p>\n`
        + `      <ul>\n${studies
          .map((s) => `        <li><a href="/books/${book.slug}/${s.slug}/">${esc(s.title)}: “${esc(s.sentence)}”</a></li>`)
          .join('\n')}\n      </ul>`
      )
      .join('\n'),
});
shells += 1;

for (const { book, studies } of shelved) {
  const bookUrl = `${SITE}/books/${book.slug}/`;
  shell({
    path: `/books/${book.slug}`,
    title: `${book.title} by ${book.author}, taken apart | Lovepreet Singh`,
    description: book.standfirst,
    canonical: bookUrl,
    keywords: [book.title, book.author, ...book.keywords, 'Lovepreet Singh'].join(', '),
    image: `${SITE}/og/books-${book.slug}.png`,
    imageAlt: `${book.title} by ${book.author}, taken apart sentence by sentence. Close readings by Lovepreet Singh.`,
    body: bookBody(book, studies),
    css: [ROUTE_CSS.writing, ROUTE_CSS.books],
    bodyClass: 'books-room',
    themeColor: BOOKS_GROUND,
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Books', item: `${SITE}/books/` },
        { '@type': 'ListItem', position: 2, name: book.title, item: bookUrl },
      ],
    }, {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: `${book.title}: ${book.subtitle}`,
      author: { '@type': 'Person', name: book.author },
      datePublished: book.bookYear,
      url: bookUrl,
      review: studies.map((s) => ({
        '@type': 'Review',
        name: s.title,
        url: `${SITE}/books/${book.slug}/${s.slug}/`,
        datePublished: s.published,
        reviewBody: s.lead,
        author: { '@id': `${SITE}/#lovepreet-singh` },
      })),
    }],
    noscript:
      `      <p><strong>${esc(book.title)} — ${esc(book.subtitle)}, by ${esc(book.author)}</strong></p>\n`
      + `      <p>${esc(book.standfirst)}</p>\n`
      + `      <p>${esc(book.summary)}</p>\n`
      + `      <h2>The studies</h2>\n      <ul>\n${studiesOf(book, studies)
        .map((s) => (s.live
          ? `        <li><a href="/books/${book.slug}/${s.slug}/">${esc(s.title)}: “${esc(s.sentence)}”</a></li>`
          : `        <li>${esc(s.title)}: “${esc(s.sentence)}” (In preparation)</li>`))
        .join('\n')}\n      </ul>`,
  });
  shells += 1;

  for (const study of studies) {
    const canonical = `${SITE}/books/${book.slug}/${study.slug}/`;
    shell({
      path: `/books/${book.slug}/${study.slug}`,
      title: `${study.title} — ${book.title} taken apart | Lovepreet Singh`,
      description: study.lead,
      canonical,
      keywords: [
        study.title, study.sentence, book.title, book.author,
        'hidden axioms', 'steelman', ...book.keywords, 'Lovepreet Singh',
      ].join(', '),
      image: `${SITE}/og/books-${book.slug}-${study.slug}.png`,
      imageAlt: `${study.title} — ${study.subtitle}. A study of one sentence from ${book.title} by ${book.author}, by Lovepreet Singh.`,
      body: studyBody(
        book,
        study,
        studies,
        'en',
        studyEditions.some((e) => e.book.slug === book.slug && e.study.slug === study.slug)
      ),
      css: [ROUTE_CSS.article, ROUTE_CSS.writing, ROUTE_CSS.books],
      bodyClass: 'books-room',
      themeColor: BOOKS_GROUND,
      theme: 'light',
      extraMeta: {
        'article:published_time': `${study.published}T00:00:00+05:30`,
        'article:modified_time': `${study.published}T00:00:00+05:30`,
        'article:author': 'Lovepreet Singh',
        'article:section': book.title,
        'article:tag': book.keywords.slice(0, 6).join(', '),
      },
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Books', item: `${SITE}/books/` },
          { '@type': 'ListItem', position: 2, name: book.title, item: bookUrl },
          { '@type': 'ListItem', position: 3, name: study.title, item: canonical },
        ],
      }, {
        '@context': 'https://schema.org',
        '@type': 'Review',
        headline: `${study.title} — ${study.subtitle}`,
        name: study.title,
        description: study.lead,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        datePublished: study.published,
        inLanguage: 'en',
        wordCount: study.words,
        reviewBody: study.lead,
        itemReviewed: {
          '@type': 'Book',
          name: `${book.title}: ${book.subtitle}`,
          author: { '@type': 'Person', name: book.author },
          datePublished: book.bookYear,
        },
        author: { '@type': 'Person', '@id': `${SITE}/#lovepreet-singh`, name: 'Lovepreet Singh' },
        publisher: { '@id': `${SITE}/#lovepreet-singh` },
        about: book.topic.split(' · ').map((t) => ({ '@type': 'Thing', name: t })),
        isAccessibleForFree: true,
      }],
      noscript:
        `      <p><strong>${esc(study.title)} — ${esc(study.subtitle)}</strong></p>\n`
        + `      <p>The sentence under the knife: “${esc(study.sentence)}” — ${esc(book.author)}, ${esc(study.source)}.</p>\n`
        + `      <p>${esc(study.lead)}</p>\n`
        + `      <h2>In this study</h2>\n      <ul>\n${study.toc
          .map((t) => `        <li>${esc(t.text)}</li>`)
          .join('\n')}\n      </ul>\n`
        + `      <p>${esc(stripTags(study.html).slice(0, 900))}…</p>\n`
        + `      <p><a href="${canonical}">Read the full study</a></p>`,
    });
    shells += 1;
  }

  /* Language editions of individual studies. Same route shape under a language
     prefix, same shell machinery — only the copy and the prose change. */
  for (const { study, language } of studyEditions.filter((e) => e.book.slug === book.slug)) {
    /* The siblings this edition can page to: the studies set in the same
       language, in the order the importer emitted them. */
    const siblings = studyEditions
      .filter((e) => e.book.slug === book.slug && e.language === language)
      .map((e) => e.study);
    const canonical = `${SITE}/${language}/books/${book.slug}/${study.slug}/`;
    const englishUrl = `${SITE}/books/${book.slug}/${study.slug}/`;
    shell({
      path: `/${language}/books/${book.slug}/${study.slug}`,
      language,
      title: `${study.title} — ${book.title} टुकड़ा-टुकड़ा करके | लवप्रीत सिंह`,
      description: study.lead,
      canonical,
      keywords: [
        study.title, study.sentence, book.title, book.author,
        'छिपी मान्यताएँ', 'स्टीलमैन', 'हिंदी', ...book.keywords, 'Lovepreet Singh',
      ].join(', '),
      image: `${SITE}/og/books-${book.slug}-${study.slug}-${language}.png`,
      imageAlt: `${study.title} — ${study.subtitle}। ${book.author} की ${book.title} के एक वाक्य का अध्ययन, लवप्रीत सिंह द्वारा।`,
      body: studyBody(book, study, siblings, language, true),
      css: [ROUTE_CSS.article, ROUTE_CSS.writing, ROUTE_CSS.books],
      bodyClass: 'books-room',
      themeColor: BOOKS_GROUND,
      theme: 'light',
      alternates: [
        { language: 'en', href: englishUrl },
        { language, href: canonical },
        { language: 'x-default', href: englishUrl },
      ],
      extraMeta: {
        'article:published_time': `${study.published}T00:00:00+05:30`,
        'article:modified_time': `${study.published}T00:00:00+05:30`,
        'article:author': 'Lovepreet Singh',
        'article:section': book.title,
      },
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'Review',
        headline: `${study.title} — ${study.subtitle}`,
        name: study.title,
        description: study.lead,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        datePublished: study.published,
        inLanguage: language,
        wordCount: study.words,
        reviewBody: study.lead,
        /* Same work, another language — so the English edition is named as the
           translation of record rather than left to look like a separate study. */
        translationOfWork: { '@type': 'CreativeWork', url: englishUrl },
        itemReviewed: {
          '@type': 'Book',
          name: `${book.title}: ${book.subtitle}`,
          author: { '@type': 'Person', name: book.author },
          datePublished: book.bookYear,
        },
        author: { '@type': 'Person', '@id': `${SITE}/#lovepreet-singh`, name: 'Lovepreet Singh' },
        publisher: { '@id': `${SITE}/#lovepreet-singh` },
        isAccessibleForFree: true,
      }],
      noscript:
        `      <p><strong>${esc(study.title)} — ${esc(study.subtitle)}</strong></p>\n`
        + `      <p>जिस वाक्य की जाँच है: “${esc(study.sentence)}” — ${esc(book.author)}, ${esc(study.source)}।</p>\n`
        + `      <p>${esc(study.lead)}</p>\n`
        + `      <p>${esc(stripTags(study.html).slice(0, 900))}…</p>\n`
        + `      <p><a href="${canonical}">पूरा अध्ययन पढ़ें</a></p>`,
    });
    shells += 1;
  }
}

/* ---- Retired routes ------------------------------------------------------
   A piece that has been withdrawn or renamed still has its old URL in feeds,
   in search results and in whatever anyone shared. GitHub Pages cannot issue a
   301, so each retired path gets a real page that points at its replacement
   and asks not to be indexed itself. */
const RETIRED = {
  // "Reservation Hatao" was withdrawn and rewritten from scratch as the
  // fourteen-part "The Reservation Files".
  '/writing/reservation-hatao': '/writing/reservation-files/',
  '/writing/reservation-hatao/part-1': '/writing/reservation-files/part-1/',
};

for (const [from, to] of Object.entries(RETIRED)) {
  const target = `${SITE}${to}`;
  mkdirSync(`dist${from}`, { recursive: true });
  writeFileSync(`dist${from}/index.html`, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Moved — The Reservation Files | Lovepreet Singh</title>
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${target}" />
    <meta http-equiv="refresh" content="0; url=${target}" />
  </head>
  <body>
    <p>This research has been rewritten and expanded as <strong>The Reservation Files</strong>.</p>
    <p><a href="${target}">Continue to its new home →</a></p>
  </body>
</html>
`);
  shells += 1;
}

/* ---- RSS ----------------------------------------------------------------
   One item per part, newest piece first. Gives readers and aggregators
   something to subscribe to, and gives crawlers a second discovery path
   into every part alongside the sitemap. */
const rssDate = (d) => new Date(`${d}T00:00:00+05:30`).toUTCString();

const items = [
  ...loaded.flatMap(({ piece, parts }) =>
    parts.map((part) => `    <item>
      <title>${esc(`${piece.title} — Part ${part.n}: ${part.title}`)}</title>
      <link>${SITE}/writing/${piece.slug}/part-${part.n}/</link>
      <guid isPermaLink="true">${SITE}/writing/${piece.slug}/part-${part.n}/</guid>
      <pubDate>${rssDate(publishedOf(piece, part))}</pubDate>
      <category>${esc(piece.topic.split(' · ')[0])}</category>
      <description>${esc(part.lead || piece.standfirst)}</description>
    </item>`)
  ),
  // The shelf feeds the same channel: one archive, one thing to subscribe to.
  ...shelved.flatMap(({ book, studies }) =>
    studies.map((study) => `    <item>
      <title>${esc(`${book.title} taken apart — ${study.title}`)}</title>
      <link>${SITE}/books/${book.slug}/${study.slug}/</link>
      <guid isPermaLink="true">${SITE}/books/${book.slug}/${study.slug}/</guid>
      <pubDate>${rssDate(study.published)}</pubDate>
      <category>Books</category>
      <description>${esc(`“${study.sentence}” — ${book.author}. ${study.lead}`)}</description>
    </item>`)
  ),
];

writeFileSync(
  'dist/feed.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Writing — Lovepreet Singh</title>
    <link>${SITE}/writing/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(writingMeta.lead)}</description>
    <language>en</language>
    <lastBuildDate>${rssDate(today)}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`
);

console.log(
  `postbuild ✓  404.html, .nojekyll, sitemap.xml (${urls.length} URLs), `
  + `feed.xml (${items.length} items), ${shells} pre-rendered routes, `
  + `${expectedOgCards.size} route-specific OG cards`
);
