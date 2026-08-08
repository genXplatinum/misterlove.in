import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import Prose from '../components/Prose';
import ThemeToggle from '../components/ThemeToggle';
import WordLookup from '../components/WordLookup';
import LoadDiagram from '../components/LoadDiagram';
import useBooksRoom from '../components/BooksRoom';
import { axiomWord, getBook, getStudy, hasEdition, loaderFor, studiesOf } from '../data/books';
import { profile } from '../data/site';
import './Article.css';
import './Books.css';

const RAIL_KEY = 'lws:reader-rail';

/* Every word the page says for itself, in each language it can be read in. The
   prose comes from the importer already translated; this is only the furniture
   around it. */
const COPY = {
  en: {
    books: 'Books',
    breadcrumb: 'Breadcrumb',
    studyOf: (n, total) => [`Study ${n}`, `of ${total}`],
    theBook: 'The book',
    axiomsFound: 'Axioms found',
    verdict: 'Verdict',
    thisStudy: 'This study',
    minutes: 'min',
    words: 'words',
    loadCaption: (book, label) => `Load test — ${book}, ${label}`,
    contents: 'Contents',
    inThisStudy: 'In this study',
    showContents: 'Show contents',
    hideContents: 'Hide contents',
    opening: 'Opening the study…',
    failed: 'This study didn’t load.',
    tryAgain: 'Try again',
    beginsNow: 'The study begins',
    sources: 'Glossary, timeline and sources',
    endOfStudy: 'End of the study',
    writtenBy: (name) => `Researched and written by ${name}`,
    colophon: (date, words) => `Single-sentence study · ${date} · ${words} words`,
    download: (label, size) => `Download ${label ?? 'the PDF'} (${size})`,
    theStudies: 'THE STUDIES',
    axiomsGraded: (n, word) => `${n} axioms ${word}`,
    inPreparation: 'In preparation',
    darkMode: 'Dark mode',
    darkAria: 'Dark reading theme',
    toDark: 'Switch to dark mode',
    toLight: 'Switch to light mode',
    switchLabel: 'Reading language',
    english: 'English',
    hindi: 'हिन्दी',
  },
  hi: {
    books: 'किताबें',
    breadcrumb: 'पृष्ठ क्रम',
    studyOf: (n, total) => [`अध्ययन ${n}`, `/ ${total}`],
    theBook: 'किताब',
    axiomsFound: 'मान्यताएँ मिलीं',
    verdict: 'फ़ैसला',
    thisStudy: 'यह अध्ययन',
    minutes: 'मिनट',
    words: 'शब्द',
    loadCaption: (book, label) => `भार-परीक्षा — ${book}, ${label}`,
    contents: 'विषय सूची',
    inThisStudy: 'इस अध्ययन में',
    showContents: 'विषय सूची दिखाएँ',
    hideContents: 'विषय सूची छिपाएँ',
    opening: 'अध्ययन खुल रहा है…',
    failed: 'यह अध्ययन नहीं खुला।',
    tryAgain: 'दोबारा कोशिश करें',
    beginsNow: 'अध्ययन यहाँ से शुरू',
    sources: 'शब्दावली, समय-रेखा और स्रोत',
    endOfStudy: 'अध्ययन समाप्त',
    writtenBy: () => 'शोध और लेखन: लवप्रीत सिंह',
    colophon: (date, words) => `एक-वाक्य अध्ययन · ${date} · ${words} शब्द`,
    download: (label, size) => `${label ?? 'PDF'} डाउनलोड करें (${size})`,
    theStudies: 'सभी अध्ययन',
    axiomsGraded: (n) => `${n} मान्यताओं पर फ़ैसला`,
    inPreparation: 'तैयार हो रहा है',
    darkMode: 'गहरा रूप',
    darkAria: 'पढ़ने के लिए गहरा रूप',
    toDark: 'गहरे रूप में बदलें',
    toLight: 'हल्के रूप में बदलें',
    switchLabel: 'पढ़ने की भाषा',
    english: 'English',
    hindi: 'हिन्दी',
  },
};

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

function useReadingSurface() {
  useEffect(() => {
    document.body.classList.add('is-reading');
    return () => document.body.classList.remove('is-reading');
  }, []);
}

function useRail() {
  const [open, setOpen] = useState(() => getStoredPreference(RAIL_KEY) !== 'closed');
  useEffect(() => {
    try { localStorage.setItem(RAIL_KEY, open ? 'open' : 'closed'); } catch { /* private mode */ }
  }, [open]);
  return [open, setOpen];
}

function useStudyMeta(book, study, language, translated) {
  useEffect(() => {
    if (!book || !study) return undefined;
    const prevTitle = document.title;
    const prevLang = document.documentElement.lang;
    const prefix = language === 'hi' ? '/hi' : '';
    const enUrl = `https://misterlove.in/books/${book.slug}/${study.slug}/`;
    const url = `https://misterlove.in${prefix}/books/${book.slug}/${study.slug}/`;
    const suffix = language === 'hi' ? '-hi' : '';
    const image = `https://misterlove.in/og/books-${book.slug}-${study.slug}${suffix}.png`;
    const imageAlt = language === 'hi'
      ? `${study.title} — ${study.subtitle}। ${book.author} की ${book.title} के एक वाक्य का अध्ययन, ${profile.name} द्वारा।`
      : `${study.title} — ${study.subtitle}. A study of one sentence from ${book.title} by ${book.author}, by ${profile.name}.`;
    document.title = language === 'hi'
      ? `${study.title} — ${book.title} टुकड़ा-टुकड़ा करके | लवप्रीत सिंह`
      : `${study.title} — ${book.title} taken apart | ${profile.name}`;
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

    const restores = [
      set('link[rel="canonical"]', 'link', { rel: 'canonical', href: url }),
      set('meta[name="description"]', 'meta', { name: 'description', content: study.lead }),
      set('meta[property="og:title"]', 'meta', { property: 'og:title', content: `${study.title} — ${study.subtitle}` }),
      set('meta[property="og:description"]', 'meta', { property: 'og:description', content: study.lead }),
      set('meta[property="og:url"]', 'meta', { property: 'og:url', content: url }),
      set('meta[property="og:type"]', 'meta', { property: 'og:type', content: 'article' }),
      set('meta[property="og:image"]', 'meta', { property: 'og:image', content: image }),
      set('meta[property="og:image:secure_url"]', 'meta', { property: 'og:image:secure_url', content: image }),
      set('meta[property="og:image:alt"]', 'meta', { property: 'og:image:alt', content: imageAlt }),
      set('meta[property="og:image:width"]', 'meta', { property: 'og:image:width', content: '1200' }),
      set('meta[property="og:image:height"]', 'meta', { property: 'og:image:height', content: '630' }),
      set('meta[name="twitter:title"]', 'meta', { name: 'twitter:title', content: `${study.title} — ${study.subtitle}` }),
      set('meta[name="twitter:description"]', 'meta', { name: 'twitter:description', content: study.lead }),
      set('meta[name="twitter:image"]', 'meta', { name: 'twitter:image', content: image }),
      set('meta[name="twitter:image:alt"]', 'meta', { name: 'twitter:image:alt', content: imageAlt }),
      set('meta[property="og:locale"]', 'meta', {
        property: 'og:locale',
        content: language === 'hi' ? 'hi_IN' : 'en_IN',
      }),
    ];

    /* Only a study that exists in both languages claims alternates. Pointing a
       crawler at a translation that was never written is worse than staying
       quiet about the one that was. */
    if (translated) {
      const hiUrl = `https://misterlove.in/hi/books/${book.slug}/${study.slug}/`;
      restores.push(
        set('meta[property="og:locale:alternate"]', 'meta', {
          property: 'og:locale:alternate',
          content: language === 'hi' ? 'en_IN' : 'hi_IN',
        }),
        set('link[rel="alternate"][hreflang="en"]', 'link', { rel: 'alternate', hreflang: 'en', href: enUrl }),
        set('link[rel="alternate"][hreflang="hi"]', 'link', { rel: 'alternate', hreflang: 'hi', href: hiUrl }),
        set('link[rel="alternate"][hreflang="x-default"]', 'link', { rel: 'alternate', hreflang: 'x-default', href: enUrl })
      );
    }

    /* A study is a critical review of a named work, so it says so in its
       structured data: the thing being reviewed is the book, not this page. */
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Review',
      headline: `${study.title} — ${study.subtitle}`,
      name: study.title,
      description: study.lead,
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      datePublished: study.published,
      inLanguage: language,
      wordCount: study.words,
      reviewBody: study.lead,
      itemReviewed: {
        '@type': 'Book',
        name: `${book.title}: ${book.subtitle}`,
        author: { '@type': 'Person', name: book.author },
        datePublished: book.bookYear,
      },
      author: { '@type': 'Person', '@id': 'https://misterlove.in/#lovepreet-singh', name: profile.name },
      publisher: { '@id': 'https://misterlove.in/#lovepreet-singh' },
      isAccessibleForFree: true,
    });
    document.head.appendChild(ld);

    window.scrollTo(0, 0);

    return () => {
      document.title = prevTitle;
      document.documentElement.lang = prevLang;
      restores.forEach((restore) => restore());
      ld.remove();
    };
  }, [book, study, language, translated]);
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
      frame = requestAnimationFrame(() => { frame = 0; update(); });
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
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

/** Both levels of the contents are watched, so the rail tracks the subsection. */
function useActiveSection(ids, deps) {
  const [active, setActive] = useState('');

  useEffect(() => {
    if (!ids.length) return undefined;
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
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

/** The two-level contents, shared by the rail and the mobile disclosure. */
function Contents({ toc, active, onJump }) {
  return (
    <ol className="article__toc study__toc">
      {toc.map((entry) => (
        <li key={entry.id}>
          <a
            href={`#${entry.id}`}
            onClick={(event) => onJump(event, entry.id)}
            className={`article__toc-link ${active === entry.id ? 'is-active' : ''}`}
          >
            <span className="article__toc-n mono">{entry.num}</span>
            <span>{entry.text}</span>
          </a>

          {entry.kids.length > 0 && (
            <ol className="study__toc-kids">
              {entry.kids.map((kid) => (
                <li key={kid.id}>
                  <a
                    href={`#${kid.id}`}
                    onClick={(event) => onJump(event, kid.id)}
                    className={`study__toc-kid ${active === kid.id ? 'is-active' : ''}`}
                  >
                    <span className="mono study__toc-kidn">{kid.num}</span>
                    <span>{kid.text}</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  );
}

/** One study: a single sentence from a shelved book, taken apart. */
export default function Study() {
  const { book: bookSlug, study: studySlug } = useParams();
  const { pathname } = useLocation();
  const language = pathname.startsWith('/hi/') ? 'hi' : 'en';
  const book = getBook(bookSlug);
  const copy = COPY[language];
  /* Declared in the manifest, so the switch can be drawn before either edition
     has been fetched. */
  const translated = hasEdition(book, studySlug, 'hi');

  const [studies, setStudies] = useState(null);
  const [loadError, setLoadError] = useState(false);
  useBooksRoom();
  useReadingSurface();
  const [railOpen, setRailOpen] = useRail();
  const bodyRef = useRef(null);
  const railCloseRef = useRef(null);
  const railReopenRef = useRef(null);
  const mobileNavRef = useRef(null);

  useEffect(() => {
    const load = loaderFor(book, language);
    if (!load) return undefined;
    let alive = true;
    setStudies(null);
    setLoadError(false);
    load()
      .then((module) => { if (alive) setStudies(module.default); })
      .catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [book, language]);

  const study = studies ? getStudy(studies, studySlug) : null;
  const toc = useMemo(() => study?.toc ?? [], [study]);
  const watched = useMemo(
    () => toc.flatMap((entry) => [entry.id, ...entry.kids.map((kid) => kid.id)]),
    [toc]
  );
  const progress = useReadingProgress(bodyRef);
  const active = useActiveSection(watched, [watched]);
  useStudyMeta(book, study, language, translated);

  if (!book) return <Navigate to="/books" replace />;
  /* A study nobody has set in this language sends the reader to the edition
     that does exist, rather than to a page that is half translated. */
  if (language !== 'en' && !translated) {
    return <Navigate to={`/books/${book.slug}/${studySlug}`} replace />;
  }
  if (studies && !study) return <Navigate to={`/books/${book.slug}`} replace />;

  /* The shelf around a study — its siblings and the pager — is only built in
     English, because that is the only language every study exists in. */
  const contents = language === 'en' ? studiesOf(book, studies) : [];
  const displayDate = book.translations?.[language]?.displayDate ?? book.displayDate;

  /* A translated edition pages through the studies that exist in that language,
     which need not be all of them or run from one — so it walks the loaded
     array rather than the book's numbering. */
  const here = language === 'en' || !studies
    ? -1
    : studies.findIndex((s) => s.slug === studySlug);
  const alsoPrev = here > 0 ? studies[here - 1] : null;
  const alsoNext = here >= 0 && here < studies.length - 1 ? studies[here + 1] : null;
  const n = study?.n ?? 0;
  const prev = contents.find((s) => s.n === n - 1 && s.live);
  const next = contents.find((s) => s.n === n + 1 && s.live);
  const upcoming = contents.find((s) => s.n === n + 1 && !s.live);

  const goSection = (event, id) => {
    event.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const goSectionMobile = (event, id) => {
    goSection(event, id);
    if (mobileNavRef.current) mobileNavRef.current.open = false;
  };

  return (
    <article className={`article study ${language === 'hi' ? 'article--hi' : ''}`} lang={language}>
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
          aria-controls="study-rail"
        >
          <span className="article__rail-chev is-flipped" aria-hidden="true" />
          <span className="mono">{copy.contents}</span>
        </button>
      )}

      <header className="article__head">
        <div className="container">
          <div className="article__navrow">
            <nav className="article__crumbs" aria-label={copy.breadcrumb}>
              <Link to="/books" className="article__crumb">{copy.books}</Link>
              <span className="article__crumb-sep" aria-hidden="true">/</span>
              <Link to={`/books/${book.slug}`} className="article__crumb">{book.title}</Link>
            </nav>

            <div className="article__reading-tools" role="group" aria-label="Reading preferences">
              {/* Only offered where both editions exist, so the switch never
                  promises a translation that was never written. */}
              {translated && (
                <nav className="language-switch" aria-label={copy.switchLabel}>
                  <Link
                    to={`/books/${book.slug}/${studySlug}`}
                    className={language === 'en' ? 'is-active' : ''}
                    aria-current={language === 'en' ? 'page' : undefined}
                    lang="en"
                  >
                    {copy.english}
                  </Link>
                  <Link
                    to={`/hi/books/${book.slug}/${studySlug}`}
                    className={language === 'hi' ? 'is-active' : ''}
                    aria-current={language === 'hi' ? 'page' : undefined}
                    lang="hi"
                  >
                    {copy.hindi}
                  </Link>
                </nav>
              )}

              <ThemeToggle
                className="article__theme-toggle"
                label={copy.darkMode}
                ariaLabel={copy.darkAria}
                darkAction={copy.toDark}
                lightAction={copy.toLight}
              />
            </div>
          </div>

          <div className="article__head-grid">
            <div className="article__head-main">
              {/* "of 1" is noise on a book with a single study. */}
              <span className="article__partno mono">
                {copy.studyOf(String(n || 1).padStart(2, '0'), book.studies)[0]}{' '}
                {book.studies > 1 && (
                  <span className="dim">
                    {copy.studyOf(String(n || 1).padStart(2, '0'), book.studies)[1]}
                  </span>
                )}
                <span className="article__partlabel">{study?.label ?? book.title}</span>
              </span>
              <h1 className="article__title">{study ? study.title : book.title}</h1>
              {study?.subtitle && <p className="article__standfirst">{study.subtitle}</p>}

              {/* The line the whole study is about, set before anything else —
                  a reader who reads nothing further should still leave knowing
                  exactly which sentence is under the knife. */}
              {study?.sentence && (
                <blockquote className="study__sentence">
                  <p>“{study.sentence}”</p>
                  {study.secondary && <p className="study__sentence-2">“{study.secondary}”</p>}
                  <cite className="mono">
                    {book.author}, <i>{book.title}</i> — {study.source}
                  </cite>
                </blockquote>
              )}
            </div>

            <aside className="article__head-aside">
              <dl className="article__facts">
                <div><dt className="mono">{copy.theBook}</dt><dd>{book.title} — {book.author}, {book.bookYear}</dd></div>
                <div><dt className="mono">{copy.axiomsFound}</dt><dd>{study?.axioms ?? '—'}</dd></div>
                <div><dt className="mono">{copy.verdict}</dt><dd>{study?.verdict ?? '—'}</dd></div>
                {study && (
                  <div>
                    <dt className="mono">{copy.thisStudy}</dt>
                    <dd>
                      {study.minutes} {copy.minutes} · {study.words.toLocaleString('en-IN')} {copy.words}
                    </dd>
                  </div>
                )}
              </dl>
            </aside>
          </div>

          {/* The thesis of the whole section, drawn: the sentence is a lintel
              and these are the assumptions holding it up. Full measure, under
              the masthead, because it is the first argument the page makes. */}
          {study?.scorecard && (
            <LoadDiagram
              scorecard={study.scorecard}
              sentence={study.sentence}
              caption={copy.loadCaption(book.title, study.label)}
              language={language}
            />
          )}
        </div>
      </header>

      <div className="container">
        <div className={`article__body ${railOpen ? '' : 'is-rail-closed'}`} ref={bodyRef}>
          <aside className="article__rail" id="study-rail" hidden={!railOpen}>
            <div className="article__rail-inner">
              <div className="article__rail-head">
                <span className="mono article__rail-title">{copy.inThisStudy}</span>
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
                  aria-controls="study-rail"
                >
                  <span className="article__rail-chev" aria-hidden="true" />
                </button>
              </div>

              <Contents toc={toc} active={active} onJump={goSection} />
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
                  <nav aria-label={copy.inThisStudy}>
                    <span className="mono article__rail-title">{copy.inThisStudy}</span>
                    <Contents toc={toc} active={active} onJump={goSectionMobile} />
                  </nav>
                </div>
              </details>
            )}

            {!studies && !loadError && <p className="article__loading mono">{copy.opening}</p>}
            {loadError && (
              <p className="article__loading">
                {copy.failed}{' '}
                <button type="button" className="link" onClick={() => window.location.reload()}>
                  {copy.tryAgain}
                </button>
              </p>
            )}

            {study?.prologue && (
              <section className="article__prologue">
                {study.prologueTitle && <h2 className="article__prologue-head">{study.prologueTitle}</h2>}
                {study.prologueTag && <p className="mono article__prologue-tag">{study.prologueTag}</p>}
                <Prose html={study.prologue} />
                <div className="article__prologue-rule" aria-hidden="true" />
                <span className="mono article__prologue-next">{copy.beginsNow}</span>
              </section>
            )}

            {study && <Prose html={study.html} />}

            {study?.sources && (
              <details className="article__sources">
                <summary>
                  <span className="mono">{copy.sources}</span>
                  <span className="article__sources-icon" aria-hidden="true" />
                </summary>
                <Prose html={study.sources} className="prose--sources" />
              </details>
            )}

            {study && (
              <div className="article__colophon">
                <span className="article__colophon-mark" aria-hidden="true">❦</span>
                <p className="mono article__colophon-end">{copy.endOfStudy}</p>
                <p className="article__colophon-title">{study.title} — {book.title}</p>
                <p className="article__colophon-by">{copy.writtenBy(profile.name)}</p>
                <p className="mono article__colophon-meta">
                  {copy.colophon(displayDate, study.words.toLocaleString('en-IN'))}
                </p>
              </div>
            )}

            {study?.pdf && (
              <div className="article__grabpdf">
                <a
                  className="btn btn--ghost"
                  href={`${import.meta.env.BASE_URL}${study.pdf}`}
                  download
                >
                  {copy.download(study.pdfLabel, study.pdfSize)} <span className="btn__dot" />
                </a>
              </div>
            )}

            {/* The other studies on this book have only been set in English, so
                a Hindi reader is offered the shelf entry rather than a pager
                into pages they cannot read. */}
            {study && language !== 'en' && (
              <nav className="article__pager" aria-label="इस किताब पर अध्ययन">
                {alsoPrev ? (
                  <Link
                    to={`/hi/books/${book.slug}/${alsoPrev.slug}`}
                    className="article__pager-link article__pager-link--prev"
                  >
                    <span className="mono">← अध्ययन {String(alsoPrev.n).padStart(2, '0')}</span>
                    <span className="article__pager-title">{alsoPrev.title}</span>
                  </Link>
                ) : <span />}

                {alsoNext ? (
                  <Link
                    to={`/hi/books/${book.slug}/${alsoNext.slug}`}
                    className="article__pager-link article__pager-link--next"
                  >
                    <span className="mono">अध्ययन {String(alsoNext.n).padStart(2, '0')} →</span>
                    <span className="article__pager-title">{alsoNext.title}</span>
                  </Link>
                ) : (
                  <Link to={`/books/${book.slug}`} className="article__pager-link article__pager-link--next">
                    <span className="mono">बाकी अध्ययन →</span>
                    <span className="article__pager-title">
                      इस किताब के बाकी अध्ययन अभी अंग्रेज़ी में हैं
                    </span>
                  </Link>
                )}
              </nav>
            )}

            {study && language === 'en' && (
              <nav className="article__pager" aria-label="Studies on this book">
                {prev ? (
                  <Link to={`/books/${book.slug}/${prev.slug}`} className="article__pager-link article__pager-link--prev">
                    <span className="mono">← Study {String(prev.n).padStart(2, '0')}</span>
                    <span className="article__pager-title">{prev.title}</span>
                  </Link>
                ) : <span />}

                {next ? (
                  <Link to={`/books/${book.slug}/${next.slug}`} className="article__pager-link article__pager-link--next">
                    <span className="mono">Study {String(next.n).padStart(2, '0')} →</span>
                    <span className="article__pager-title">{next.title}</span>
                  </Link>
                ) : upcoming ? (
                  <Link to={`/books/${book.slug}`} className="article__pager-link article__pager-link--next">
                    <span className="mono">That’s all so far →</span>
                    <span className="article__pager-title">
                      Study {String(upcoming.n).padStart(2, '0')} — {upcoming.title} is being written
                    </span>
                  </Link>
                ) : (
                  <Link to="/books" className="article__pager-link article__pager-link--next">
                    <span className="mono">You’ve finished →</span>
                    <span className="article__pager-title">Back to the shelf</span>
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>

      {studies && language === 'en' && (
        <section className="article__contents">
          <div className="container">
            <div className="section-head">
              <span className="mono">
                <span className="section-head__id">{copy.theStudies}</span>&nbsp;&nbsp;/&nbsp;&nbsp;
                {book.title} — {book.author}
              </span>
              <span className="mono hide-sm">{copy.axiomsGraded(book.axioms, axiomWord(book))}</span>
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
                      {entry.live ? `${entry.minutes} min` : 'In preparation'}
                    </span>
                  </>
                );

                return (
                  <li key={entry.n}>
                    {entry.live ? (
                      <Link
                        to={`/books/${book.slug}/${entry.slug}`}
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
          </div>
        </section>
      )}

      <WordLookup scope=".prose" />
    </article>
  );
}
