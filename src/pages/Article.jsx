import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import Prose from '../components/Prose';
import ThemeToggle from '../components/ThemeToggle';
import WordLookup from '../components/WordLookup';
import {
  getPiece,
  getPieceForLanguage,
  contentsOf,
  isInProgress,
  pdfForPart,
  publishedOf,
  writingPathOf,
} from '../data/writing';
import { profile } from '../data/site';
import './Article.css';

const RAIL_KEY = 'lws:reader-rail';

function getStoredPreference(key) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Parts are numbered like a book's divisions in the closing colophon. */
const ROMAN = [
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function roman(n) {
  let left = n;
  let out = '';
  for (const [value, numeral] of ROMAN) {
    while (left >= value) {
      out += numeral;
      left -= value;
    }
  }
  return out || String(n);
}

const COPY = {
  en: {
    writing: 'Writing',
    breadcrumb: 'Breadcrumb',
    part: 'Part',
    of: 'of',
    series: 'Series',
    author: 'Author',
    published: 'Published',
    thisPart: 'This part',
    minute: 'min',
    words: 'words',
    themeLabel: 'Dark mode',
    themeAria: 'Dark reading theme',
    themeDarkAction: 'Switch to dark mode',
    themeLightAction: 'Switch to light mode',
    showContents: 'Show contents',
    hideContents: 'Hide contents',
    contents: 'Contents',
    inThisPart: 'In this part',
    allParts: (count) => `All ${count} parts`,
    loading: (n) => `Loading part ${n}…`,
    loadFail: 'This part didn’t load.',
    retry: 'Try again',
    begins: (n) => `Part ${String(n).padStart(2, '0')} begins`,
    sources: (n) => `Sources & further reading — Part ${n}`,
    partsAria: 'Article parts',
    finished: 'You’ve finished →',
    backWriting: 'Back to all writing',
    allPartsHead: 'ALL PARTS',
    preparing: 'In preparation',
    allSoFar: 'That’s all so far →',
    beingWritten: (n, title) => `Part ${String(n).padStart(2, '0')} — ${title} is being written`,
    download: (piece, pdf) => (
      piece.pdfs
        ? `Download ${pdf.label ?? 'the PDF'} (${pdf.size})`
        : isInProgress(piece)
          ? `Download ${piece.pdfLabel ?? 'the PDF'} (${piece.pdfSize})`
          : `Download all ${piece.parts} parts (PDF, ${piece.pdfSize})`
    ),
    switchLabel: 'Reading language',
    english: 'English',
    hindi: 'हिन्दी',
    endOfPart: (n) => `End of Part ${roman(n)}`,
    researchedBy: 'Researched and written by',
    edition: 'First edition',
  },
  hi: {
    writing: 'लेखन',
    breadcrumb: 'पृष्ठ क्रम',
    part: 'भाग',
    of: '/',
    series: 'श्रृंखला',
    author: 'लेखक',
    published: 'प्रकाशित',
    thisPart: 'यह भाग',
    minute: 'मिनट',
    words: 'शब्द',
    themeLabel: 'गहरा रंग',
    themeAria: 'गहरा पठन रंग',
    themeDarkAction: 'गहरे रंग में पढ़ें',
    themeLightAction: 'हल्के रंग में पढ़ें',
    showContents: 'विषय सूची दिखाएं',
    hideContents: 'विषय सूची छिपाएं',
    contents: 'विषय सूची',
    inThisPart: 'इस भाग में',
    allParts: (count) => `सभी ${count} भाग`,
    loading: (n) => `भाग ${n} खुल रहा है…`,
    loadFail: 'यह भाग नहीं खुल पाया।',
    retry: 'फिर कोशिश करें',
    begins: (n) => `भाग ${String(n).padStart(2, '0')} शुरू होता है`,
    sources: (n) => `स्रोत और आगे की पढ़ाई — भाग ${n}`,
    partsAria: 'लेख के भाग',
    finished: 'आपने पूरा पढ़ लिया →',
    backWriting: 'सभी लेखों पर वापस जाएं',
    allPartsHead: 'सभी भाग',
    preparing: 'तैयार हो रहा है',
    allSoFar: 'अभी तक इतना ही →',
    beingWritten: (n, title) => `भाग ${String(n).padStart(2, '0')} — ${title} लिखा जा रहा है`,
    download: (piece, pdf) => (
      piece.pdfs
        ? `${pdf.label ?? 'PDF'} डाउनलोड करें (${pdf.size})`
        : isInProgress(piece)
          ? `${piece.pdfLabel ?? 'PDF'} डाउनलोड करें (${piece.pdfSize})`
          : `सभी ${piece.parts} भाग डाउनलोड करें (PDF, ${piece.pdfSize})`
    ),
    switchLabel: 'पढ़ने की भाषा',
    english: 'English',
    hindi: 'हिन्दी',
    endOfPart: (n) => `भाग ${n} समाप्त`,
    researchedBy: 'शोध और लेखन',
    edition: 'पहला संस्करण',
  },
};

function scrollToTop() {
  window.scrollTo(0, 0);
}

function useReadingSurface() {
  useEffect(() => {
    document.body.classList.add('is-reading');

    return () => {
      document.body.classList.remove('is-reading');
    };
  }, []);
}

function useRail() {
  const [open, setOpen] = useState(() => {
    return getStoredPreference(RAIL_KEY) !== 'closed';
  });

  useEffect(() => {
    try { localStorage.setItem(RAIL_KEY, open ? 'open' : 'closed'); } catch { /* private mode */ }
  }, [open]);

  return [open, setOpen];
}

/** Per-part metadata, including reciprocal English/Hindi alternate URLs. */
function useArticleMeta(piece, part, original) {
  useEffect(() => {
    if (!piece || !part) return undefined;
    const language = piece.language ?? 'en';
    const prevTitle = document.title;
    const prevLang = document.documentElement.lang;
    const path = writingPathOf(piece, part.n);
    const url = `https://misterlove.in${path}/`;
    const title = language === 'hi'
      ? `${part.title} — ${piece.title}: भाग ${part.n}/${piece.parts} | ${profile.name}`
      : `${part.title} — ${piece.title}: Part ${part.n} of ${piece.parts} | ${profile.name}`;
    document.title = title;
    document.documentElement.lang = language;

    const set = (selector, tag, attrs) => {
      let el = document.head.querySelector(selector);
      const created = !el;
      if (!el) {
        el = document.createElement(tag);
        document.head.appendChild(el);
      }
      const previous = Object.fromEntries(
        Object.keys(attrs).map((name) => [name, el.getAttribute(name)])
      );
      Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
      return () => {
        if (created) el.remove();
        else Object.entries(previous).forEach(([name, value]) => {
          if (value === null) el.removeAttribute(name);
          else el.setAttribute(name, value);
        });
      };
    };

    const imageSlug = piece.ogSlug ?? piece.slug;
    const image = `https://misterlove.in/og/${imageSlug}-part-${part.n}.png`;
    const imageAlt = language === 'hi'
      ? `${piece.title}, ${piece.parts} में से भाग ${part.n} — ${part.title}। लेखक: ${profile.name}।`
      : `${piece.title}, Part ${part.n} of ${piece.parts} — ${part.title}. By ${profile.name}.`;

    document.head
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((link) => link.remove());
    document.head.querySelector('meta[property="og:locale:alternate"]')?.remove();

    const restores = [
      set('link[rel="canonical"]', 'link', { rel: 'canonical', href: url }),
      set('meta[name="description"]', 'meta', { name: 'description', content: part.lead || piece.standfirst }),
      set('meta[property="og:title"]', 'meta', { property: 'og:title', content: `${part.title} — ${piece.title}` }),
      set('meta[property="og:description"]', 'meta', { property: 'og:description', content: part.lead || piece.standfirst }),
      set('meta[property="og:url"]', 'meta', { property: 'og:url', content: url }),
      set('meta[property="og:type"]', 'meta', { property: 'og:type', content: 'article' }),
      set('meta[property="og:locale"]', 'meta', { property: 'og:locale', content: piece.locale ?? 'en_IN' }),
      set('meta[property="og:image"]', 'meta', { property: 'og:image', content: image }),
      set('meta[property="og:image:secure_url"]', 'meta', { property: 'og:image:secure_url', content: image }),
      set('meta[property="og:image:alt"]', 'meta', { property: 'og:image:alt', content: imageAlt }),
      set('meta[property="og:image:width"]', 'meta', { property: 'og:image:width', content: '1200' }),
      set('meta[property="og:image:height"]', 'meta', { property: 'og:image:height', content: '630' }),
      set('meta[name="twitter:title"]', 'meta', { name: 'twitter:title', content: `${part.title} — ${piece.title}` }),
      set('meta[name="twitter:description"]', 'meta', { name: 'twitter:description', content: part.lead || piece.standfirst }),
      set('meta[name="twitter:image"]', 'meta', { name: 'twitter:image', content: image }),
      set('meta[name="twitter:image:alt"]', 'meta', { name: 'twitter:image:alt', content: imageAlt }),
    ];

    if (original?.translations?.hi) {
      restores.push(
        set('meta[property="og:locale:alternate"]', 'meta', {
          property: 'og:locale:alternate',
          content: language === 'hi' ? 'en_IN' : 'hi_IN',
        }),
        set('link[rel="alternate"][hreflang="en"]', 'link', {
          rel: 'alternate',
          hreflang: 'en',
          href: `https://misterlove.in/writing/${piece.slug}/part-${part.n}/`,
        }),
        set('link[rel="alternate"][hreflang="hi"]', 'link', {
          rel: 'alternate',
          hreflang: 'hi',
          href: `https://misterlove.in/hi/writing/${piece.slug}/part-${part.n}/`,
        }),
        set('link[rel="alternate"][hreflang="x-default"]', 'link', {
          rel: 'alternate',
          hreflang: 'x-default',
          href: `https://misterlove.in/writing/${piece.slug}/part-${part.n}/`,
        })
      );
    }

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: language === 'hi'
        ? `${part.title} — ${piece.title}: भाग ${part.n}`
        : `${part.title} — ${piece.title}: Part ${part.n}`,
      description: part.lead || piece.standfirst,
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      datePublished: publishedOf(piece, part),
      inLanguage: language,
      wordCount: part.words,
      articleSection: part.label,
      isPartOf: {
        '@type': 'CreativeWorkSeries',
        name: `${piece.title} — ${piece.subtitle}`,
        url: `https://misterlove.in${writingPathOf(piece)}/`,
        numberOfItems: piece.parts,
      },
      author: { '@type': 'Person', '@id': 'https://misterlove.in/#lovepreet-singh', name: profile.name },
      publisher: { '@id': 'https://misterlove.in/#lovepreet-singh' },
      about: piece.topic.split(' · ').map((topic) => ({ '@type': 'Thing', name: topic })),
      ...(language === 'hi' ? {
        translationOfWork: {
          '@type': 'Article',
          inLanguage: 'en',
          url: `https://misterlove.in/writing/${piece.slug}/part-${part.n}/`,
        },
      } : original?.translations?.hi ? {
        workTranslation: {
          '@type': 'Article',
          inLanguage: 'hi',
          url: `https://misterlove.in/hi/writing/${piece.slug}/part-${part.n}/`,
        },
      } : {}),
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      document.documentElement.lang = prevLang;
      restores.forEach((restore) => restore());
      ld.remove();
    };
  }, [piece, part, original]);
}

function useReadingProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const start = el.offsetTop;
      const span = el.offsetHeight - window.innerHeight * 0.75;
      if (span <= 0) return setProgress(1);
      return setProgress(Math.min(1, Math.max(0, (window.scrollY - start) / span)));
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(schedule)
      : null;
    if (ref.current) resizeObserver?.observe(ref.current);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resizeObserver?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);

  return progress;
}

function useActiveSection(toc, deps) {
  const [active, setActive] = useState('');

  useEffect(() => {
    if (!toc.length) return undefined;
    const elements = toc.map((entry) => document.getElementById(entry.id)).filter(Boolean);
    if (!elements.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
      },
      { rootMargin: '-12% 0px -70% 0px' }
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return active;
}

export default function Article() {
  const { slug, part: partParam } = useParams();
  const { pathname } = useLocation();
  const language = pathname.startsWith('/hi/') ? 'hi' : 'en';
  const original = getPiece(slug);
  const piece = useMemo(() => getPieceForLanguage(slug, language), [slug, language]);
  const copy = COPY[language];

  const [parts, setParts] = useState(null);
  const [loadError, setLoadError] = useState(false);
  useReadingSurface();
  const [railOpen, setRailOpen] = useRail();
  const bodyRef = useRef(null);
  const railCloseRef = useRef(null);
  const railReopenRef = useRef(null);
  const mobileNavRef = useRef(null);

  const n = partParam ? Number(String(partParam).replace(/^part-/, '')) : 1;
  const valid = Number.isInteger(n) && n >= 1 && piece && n <= piece.parts;

  useEffect(() => {
    if (!piece) return undefined;
    let alive = true;
    setParts(null);
    setLoadError(false);
    piece.load()
      .then((module) => { if (alive) setParts(module.default); })
      .catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [piece]);

  const part = parts && valid ? parts[n - 1] : null;
  const articlePdf = part ? pdfForPart(piece, part) : null;
  const toc = useMemo(() => part?.toc ?? [], [part]);
  const progress = useReadingProgress(bodyRef);
  const active = useActiveSection(toc, [toc]);
  useArticleMeta(piece, part, original);

  useEffect(() => { scrollToTop(); }, [n, slug, language]);

  if (!original) return <Navigate to="/writing" replace />;
  if (!piece) return <Navigate to={`/writing/${slug}/part-${n || 1}`} replace />;

  const base = writingPathOf(piece);
  if (!valid) return <Navigate to={`${base}/part-1`} replace />;
  if (parts && !parts[n - 1]) return <Navigate to={`${base}/part-1`} replace />;

  const prev = n > 1 ? n - 1 : null;
  const next = parts && n < parts.length ? n + 1 : null;
  const contents = contentsOf(piece, parts);
  const hasHindi = Boolean(original.translations?.hi);

  const goSection = (event, id) => {
    event.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;
    const reduced = prefersReducedMotion();
    const top = element.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  };

  // On small screens the rail is hidden, so the same jump also closes the
  // mobile contents disclosure to hand the screen back to the reader.
  const goSectionMobile = (event, id) => {
    goSection(event, id);
    if (mobileNavRef.current) mobileNavRef.current.open = false;
  };

  return (
    <article
      className={`article ${language === 'hi' ? 'article--hi' : ''}`}
      lang={language}
    >
      <div className="article__meter" aria-hidden="true">
        <span className="article__meter-fill" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {!railOpen && (
        <button
          ref={railReopenRef}
          type="button"
          className="article__rail-reopen"
          onClick={() => {
            setRailOpen(true);
            requestAnimationFrame(() => railCloseRef.current?.focus());
          }}
          aria-label={copy.showContents}
          aria-expanded="false"
          aria-controls="article-rail"
        >
          <span className="article__rail-chev is-flipped" aria-hidden="true" />
          <span className="mono">{copy.contents}</span>
        </button>
      )}

      <header className="article__head">
        <div className="container">
          <div className="article__navrow">
            <nav className="article__crumbs" aria-label={copy.breadcrumb}>
              <Link to="/writing" className="article__crumb">{copy.writing}</Link>
              <span className="article__crumb-sep" aria-hidden="true">/</span>
              <Link to={base} className="article__crumb">{piece.title}</Link>
            </nav>

            <div className="article__reading-tools" role="group" aria-label="Reading preferences">
              {hasHindi && (
                <nav className="language-switch" aria-label={copy.switchLabel}>
                  <Link
                    to={`/writing/${piece.slug}/part-${n}`}
                    className={language === 'en' ? 'is-active' : ''}
                    aria-current={language === 'en' ? 'page' : undefined}
                  >
                    {copy.english}
                  </Link>
                  <Link
                    to={`/hi/writing/${piece.slug}/part-${n}`}
                    className={language === 'hi' ? 'is-active' : ''}
                    aria-current={language === 'hi' ? 'page' : undefined}
                  >
                    {copy.hindi}
                  </Link>
                </nav>
              )}
              <ThemeToggle
                className="article__theme-toggle"
                label={copy.themeLabel}
                ariaLabel={copy.themeAria}
                darkAction={copy.themeDarkAction}
                lightAction={copy.themeLightAction}
              />
            </div>
          </div>

          <div className="article__head-grid">
            <div className="article__head-main">
              <span className="article__partno mono">
                {copy.part} {String(n).padStart(2, '0')} <span className="dim">{copy.of} {piece.parts}</span>
                <span className="article__partlabel">{part?.label}</span>
              </span>
              <h1 className="article__title">{part ? part.title : piece.title}</h1>
              {part?.lead && <p className="article__standfirst">{part.lead}</p>}
            </div>

            <aside className="article__head-aside">
              <dl className="article__facts">
                <div><dt className="mono">{copy.series}</dt><dd>{piece.title} — {piece.subtitle}</dd></div>
                <div><dt className="mono">{copy.author}</dt><dd>{profile.name}</dd></div>
                <div><dt className="mono">{copy.published}</dt><dd>{piece.displayDate}</dd></div>
                {part && (
                  <div>
                    <dt className="mono">{copy.thisPart}</dt>
                    <dd>{part.minutes} {copy.minute} · {part.words.toLocaleString('en-IN')} {copy.words}</dd>
                  </div>
                )}
              </dl>
            </aside>
          </div>
        </div>
      </header>

      <div className="container">
        <div className={`article__body ${railOpen ? '' : 'is-rail-closed'}`} ref={bodyRef}>
          <aside className="article__rail" id="article-rail" hidden={!railOpen}>
            <div className="article__rail-inner">
              <div className="article__rail-head">
                <span className="mono article__rail-title">{copy.inThisPart}</span>
                <button
                  ref={railCloseRef}
                  type="button"
                  className="article__rail-btn"
                  onClick={() => {
                    setRailOpen(false);
                    requestAnimationFrame(() => railReopenRef.current?.focus());
                  }}
                  aria-label={copy.hideContents}
                  aria-expanded="true"
                  aria-controls="article-rail"
                >
                  <span className="article__rail-chev" aria-hidden="true" />
                </button>
              </div>
              <ol className="article__toc">
                {toc.map((entry) => (
                  <li key={entry.id}>
                    <a
                      href={`#${entry.id}`}
                      onClick={(event) => goSection(event, entry.id)}
                      className={`article__toc-link ${active === entry.id ? 'is-active' : ''}`}
                    >
                      <span className="article__toc-n mono">{entry.num}</span>
                      <span>{entry.text}</span>
                    </a>
                  </li>
                ))}
              </ol>

              <span className="mono article__rail-title article__rail-title--sub">
                {copy.allParts(piece.parts)}
              </span>
              <div className="article__pips">
                {contents.map((entry) => (entry.live ? (
                  <Link
                    key={entry.n}
                    to={`${base}/part-${entry.n}`}
                    className={`article__pip ${entry.n === n ? 'is-current' : ''}`}
                    title={`${copy.part} ${entry.n} — ${entry.title}`}
                    aria-current={entry.n === n ? 'page' : undefined}
                  >
                    {entry.n}
                  </Link>
                ) : (
                  <span
                    key={entry.n}
                    className="article__pip is-soon"
                    title={`${copy.part} ${entry.n} — ${entry.title} (${copy.preparing})`}
                  >
                    {entry.n}
                  </span>
                )))}
              </div>
            </div>
          </aside>

          <div className="article__col">
            {toc.length > 0 && (
              <details className="article__toc-mobile" ref={mobileNavRef}>
                <summary className="article__toc-mobile-summary">
                  <span className="mono">{copy.contents}</span>
                  <span className="article__toc-mobile-chev" aria-hidden="true" />
                </summary>
                <div className="article__toc-mobile-panel">
                  <nav aria-label={copy.inThisPart}>
                    <span className="mono article__rail-title">{copy.inThisPart}</span>
                    <ol className="article__toc">
                      {toc.map((entry) => (
                        <li key={entry.id}>
                          <a
                            href={`#${entry.id}`}
                            onClick={(event) => goSectionMobile(event, entry.id)}
                            className={`article__toc-link ${active === entry.id ? 'is-active' : ''}`}
                          >
                            <span className="article__toc-n mono">{entry.num}</span>
                            <span>{entry.text}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>

                  {contents.length > 1 && (
                    <nav aria-label={copy.allParts(piece.parts)}>
                      <span className="mono article__rail-title article__rail-title--sub">
                        {copy.allParts(piece.parts)}
                      </span>
                      <div className="article__pips">
                        {contents.map((entry) => (entry.live ? (
                          <Link
                            key={entry.n}
                            to={`${base}/part-${entry.n}`}
                            className={`article__pip ${entry.n === n ? 'is-current' : ''}`}
                            title={`${copy.part} ${entry.n} — ${entry.title}`}
                            aria-current={entry.n === n ? 'page' : undefined}
                          >
                            {entry.n}
                          </Link>
                        ) : (
                          <span
                            key={entry.n}
                            className="article__pip is-soon"
                            title={`${copy.part} ${entry.n} — ${entry.title} (${copy.preparing})`}
                          >
                            {entry.n}
                          </span>
                        )))}
                      </div>
                    </nav>
                  )}
                </div>
              </details>
            )}

            {!parts && !loadError && <p className="article__loading mono">{copy.loading(n)}</p>}
            {loadError && (
              <p className="article__loading">
                {copy.loadFail}{' '}
                <button type="button" className="link" onClick={() => window.location.reload()}>
                  {copy.retry}
                </button>
              </p>
            )}

            {part?.prologue && (
              <section className="article__prologue">
                {part.prologueTitle && <h2 className="article__prologue-head">{part.prologueTitle}</h2>}
                {part.prologueTag && <p className="mono article__prologue-tag">{part.prologueTag}</p>}
                <Prose html={part.prologue} />
                <div className="article__prologue-rule" aria-hidden="true" />
                <span className="mono article__prologue-next">{copy.begins(n)}</span>
              </section>
            )}

            {part && <Prose html={part.html} />}

            {part?.sources && (
              <details className="article__sources">
                <summary>
                  <span className="mono">{copy.sources(n)}</span>
                  <span className="article__sources-icon" aria-hidden="true" />
                </summary>
                <Prose html={part.sources} className="prose--sources" />
              </details>
            )}

            {part && (
              <div className="article__colophon">
                <span className="article__colophon-mark" aria-hidden="true">❦</span>
                <p className="mono article__colophon-end">{copy.endOfPart(n)}</p>
                <p className="article__colophon-title">
                  {piece.title} — {part.title}
                </p>
                <p className="article__colophon-by">
                  {copy.researchedBy} {profile.name}
                </p>
                <p className="mono article__colophon-meta">
                  {copy.edition} · {piece.displayDate} · {part.words.toLocaleString('en-IN')} {copy.words}
                </p>
              </div>
            )}

            {part && (
              <nav className="article__pager" aria-label={copy.partsAria}>
                {prev ? (
                  <Link to={`${base}/part-${prev}`} className="article__pager-link article__pager-link--prev">
                    <span className="mono">← {copy.part} {String(prev).padStart(2, '0')}</span>
                    <span className="article__pager-title">{parts[prev - 1].title}</span>
                  </Link>
                ) : <span />}
                {next ? (
                  <Link to={`${base}/part-${next}`} className="article__pager-link article__pager-link--next">
                    <span className="mono">{copy.part} {String(next).padStart(2, '0')} →</span>
                    <span className="article__pager-title">{parts[next - 1].title}</span>
                  </Link>
                ) : isInProgress(piece) ? (
                  <Link to={base} className="article__pager-link article__pager-link--next">
                    <span className="mono">{copy.allSoFar}</span>
                    <span className="article__pager-title">
                      {copy.beingWritten(n + 1, contents[n]?.title)}
                    </span>
                  </Link>
                ) : (
                  <Link to="/writing" className="article__pager-link article__pager-link--next">
                    <span className="mono">{copy.finished}</span>
                    <span className="article__pager-title">{copy.backWriting}</span>
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>

      {parts && (
        <section className="article__contents">
          <div className="container">
            <div className="section-head">
              <span className="mono">
                <span className="section-head__id">{copy.allPartsHead}</span>&nbsp;&nbsp;/&nbsp;&nbsp;
                {piece.title} — {piece.subtitle}
              </span>
              <span className="mono hide-sm">
                {piece.words.toLocaleString('en-IN')} {copy.words}
              </span>
            </div>

            <ol className="article__contents-list">
              {contents.map((entry) => {
                const inner = (
                  <>
                    <span className="article__entry-n mono">{String(entry.n).padStart(2, '0')}</span>
                    <span className="article__entry-body">
                      <span className="article__entry-label mono">{entry.label}</span>
                      <span className="article__entry-title">{entry.title}</span>
                      <span className="article__entry-lead">{entry.lead}</span>
                    </span>
                    <span className="article__entry-meta mono">
                      {entry.live ? `${entry.minutes} ${copy.minute}` : copy.preparing}
                    </span>
                  </>
                );

                return (
                  <li key={entry.n}>
                    {entry.live ? (
                      <Link
                        to={`${base}/part-${entry.n}`}
                        className={`article__entry ${entry.n === n ? 'is-current' : ''}`}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <span className="article__entry is-soon">{inner}</span>
                    )}
                  </li>
                );
              })}
            </ol>

            {articlePdf && (
              <div className="article__grabpdf">
                <a
                  className="btn btn--ghost"
                  href={`${import.meta.env.BASE_URL}${articlePdf.file}`}
                  download
                >
                  {copy.download(piece, articlePdf)} <span className="btn__dot" />
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      <WordLookup scope=".prose" />
    </article>
  );
}
