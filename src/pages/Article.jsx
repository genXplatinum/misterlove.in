import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Prose from '../components/Prose';
import { getPiece } from '../data/writing';
import { profile } from '../data/site';
import './Article.css';

const THEME_KEY = 'lws:reader-theme';
const RAIL_KEY = 'lws:reader-rail';

function scrollToTop() {
  if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

/**
 * Reader theme. Long-form defaults to the light "paper" surface — the site's
 * own light-act tokens — because 25,000 words of obsidian is punishing. The
 * choice is written to the document element so the nav, footer and HUD flip
 * with the article rather than fighting it, and remembered between visits.
 */
function useReaderTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof localStorage === 'undefined') return 'light';
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = theme;
    document.body.classList.add('is-reading');
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode */ }

    return () => {
      // Hand the document back exactly as we found it — the homepage drives
      // its own light act via section-level data-theme and must not inherit ours.
      if (previous) root.dataset.theme = previous;
      else delete root.dataset.theme;
      document.body.classList.remove('is-reading');
    };
  }, [theme]);

  return [theme, setTheme];
}

/** Contents rail open/closed, remembered between parts and visits. */
function useRail() {
  const [open, setOpen] = useState(() => {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem(RAIL_KEY) !== 'closed';
  });

  useEffect(() => {
    try { localStorage.setItem(RAIL_KEY, open ? 'open' : 'closed'); } catch { /* private mode */ }
  }, [open]);

  return [open, setOpen];
}

/** Per-part <title>, description and canonical, so each page is its own result. */
function useArticleMeta(piece, part) {
  useEffect(() => {
    if (!piece || !part) return;
    const prevTitle = document.title;
    document.title = `${part.title} — ${piece.title}: Part ${part.n} of ${piece.parts} | ${profile.name}`;

    // Trailing slash: these routes are pre-rendered as directories, so this is
    // the form that answers 200 without a redirect. Keep it identical to the
    // canonical the pre-rendered shell ships (see scripts/postbuild.mjs).
    const url = `https://misterlove.in/writing/${piece.slug}/part-${part.n}/`;
    const set = (selector, attr, value) => {
      let el = document.head.querySelector(selector);
      const created = !el;
      if (!el) {
        el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
        if (selector.includes('canonical')) el.rel = 'canonical';
        if (selector.includes('name=')) el.name = selector.match(/name="([^"]+)"/)[1];
        if (selector.includes('property=')) el.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute(attr);
      el.setAttribute(attr, value);
      return () => { if (created) el.remove(); else if (prev !== null) el.setAttribute(attr, prev); };
    };

    // Keeps the tags matching the pre-rendered shell after a client-side
    // navigation, so anything reading the live DOM sees this part, not the last.
    const image = `https://misterlove.in/og/${piece.slug}-part-${part.n}.png`;
    const imageAlt = `${piece.title}, Part ${part.n} of ${piece.parts} — ${part.title}. By ${profile.name}.`;

    const restores = [
      set('link[rel="canonical"]', 'href', url),
      set('meta[name="description"]', 'content', part.lead || piece.standfirst),
      set('meta[property="og:title"]', 'content', `${part.title} — ${piece.title}`),
      set('meta[property="og:description"]', 'content', part.lead || piece.standfirst),
      set('meta[property="og:url"]', 'content', url),
      set('meta[property="og:type"]', 'content', 'article'),
      set('meta[property="og:image"]', 'content', image),
      set('meta[property="og:image:secure_url"]', 'content', image),
      set('meta[property="og:image:alt"]', 'content', imageAlt),
      set('meta[name="twitter:image"]', 'content', image),
      set('meta[name="twitter:image:alt"]', 'content', imageAlt),
    ];

    // Per-part Article schema. Each part is its own page with its own
    // canonical, so it gets its own node linked back to the series and author.
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${part.title} — ${piece.title}: Part ${part.n}`,
      description: part.lead || piece.standfirst,
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      datePublished: piece.published,
      inLanguage: 'en',
      wordCount: part.words,
      articleSection: part.label,
      isPartOf: {
        '@type': 'CreativeWorkSeries',
        name: `${piece.title} — ${piece.subtitle}`,
        url: `https://misterlove.in/writing/${piece.slug}/part-1/`,
        numberOfItems: piece.parts,
      },
      author: { '@type': 'Person', '@id': 'https://misterlove.in/#lovepreet-singh', name: profile.name },
      publisher: { '@id': 'https://misterlove.in/#lovepreet-singh' },
      about: piece.topic.split(' · ').map((t) => ({ '@type': 'Thing', name: t })),
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      restores.forEach((r) => r());
      ld.remove();
    };
  }, [piece, part]);
}

/** Fraction of the article body scrolled past — drives the reading meter. */
function useReadingProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const start = el.offsetTop;
      const span = el.offsetHeight - window.innerHeight * 0.75;
      if (span <= 0) return setProgress(1);
      setProgress(Math.min(1, Math.max(0, (window.scrollY - start) / span)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);

  return progress;
}

/** Highlights the section currently being read in the contents rail. */
function useActiveSection(toc, deps) {
  const [active, setActive] = useState('');

  useEffect(() => {
    if (!toc.length) return;
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: '-12% 0px -70% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return active;
}

export default function Article() {
  const { slug, part: partParam } = useParams();
  const piece = getPiece(slug);

  const [parts, setParts] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [theme, setTheme] = useReaderTheme();
  const [railOpen, setRailOpen] = useRail();
  const bodyRef = useRef(null);

  // URLs read /writing/<slug>/part-3; the router hands us the whole segment.
  const n = partParam ? Number(String(partParam).replace(/^part-/, '')) : 1;
  const valid = Number.isInteger(n) && n >= 1 && piece && n <= piece.parts;

  // The prose is ~240 KB of data — code-split so it is only fetched by
  // readers who actually open the piece, never by the homepage.
  useEffect(() => {
    if (!piece) return;
    let alive = true;
    piece
      .load()
      .then((m) => { if (alive) setParts(m.default); })
      .catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [piece]);

  const part = parts && valid ? parts[n - 1] : null;
  const toc = useMemo(() => part?.toc ?? [], [part]);
  const progress = useReadingProgress(bodyRef);
  const active = useActiveSection(toc, [toc]);
  useArticleMeta(piece, part);

  useEffect(() => { scrollToTop(); }, [n, slug]);

  if (!piece) return <Navigate to="/writing" replace />;
  if (!valid) return <Navigate to={`/writing/${slug}/part-1`} replace />;

  const base = `/writing/${piece.slug}`;
  const prev = n > 1 ? n - 1 : null;
  const next = n < piece.parts ? n + 1 : null;

  const goSection = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    if (window.lenis) window.lenis.scrollTo(el, { offset: -100, duration: 1.1 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <article className="article">
      <div className="article__meter" aria-hidden="true">
        <span className="article__meter-fill" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {/* Edge tab to bring the collapsed rail back. Rendered only when the rail
          is hidden, and only shown at the widths where the rail exists at all. */}
      {!railOpen && (
        <button
          type="button"
          className="article__rail-reopen"
          onClick={() => setRailOpen(true)}
          aria-label="Show contents"
          aria-expanded="false"
          aria-controls="article-rail"
          data-cursor
        >
          <span className="article__rail-chev is-flipped" aria-hidden="true" />
          <span className="mono">Contents</span>
        </button>
      )}

      {/* ---------- Masthead ---------- */}
      <header className="article__head">
        <div className="container">
          <nav className="article__crumbs" aria-label="Breadcrumb">
            <Link to="/writing" className="article__crumb" data-cursor>Writing</Link>
            <span className="article__crumb-sep" aria-hidden="true">/</span>
            <Link to={base} className="article__crumb" data-cursor>{piece.title}</Link>
          </nav>

          <div className="article__head-grid">
            <div className="article__head-main">
              <span className="article__partno mono">
                Part {String(n).padStart(2, '0')} <span className="dim">of {piece.parts}</span>
                <span className="article__partlabel">{part?.label}</span>
              </span>
              <h1 className="article__title">{part ? part.title : piece.title}</h1>
              {part?.lead && <p className="article__standfirst">{part.lead}</p>}
            </div>

            <aside className="article__head-aside">
              <dl className="article__facts">
                <div><dt className="mono">Series</dt><dd>{piece.title} — {piece.subtitle}</dd></div>
                <div><dt className="mono">Author</dt><dd>{profile.name}</dd></div>
                <div><dt className="mono">Published</dt><dd>{piece.displayDate}</dd></div>
                {part && <div><dt className="mono">This part</dt><dd>{part.minutes} min · {part.words.toLocaleString('en-IN')} words</dd></div>}
              </dl>
              <button
                type="button"
                className="article__themetoggle"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                data-cursor
              >
                <span className="mono">{theme === 'light' ? 'Dark' : 'Light'} reading</span>
                <span className={`article__themedot ${theme === 'dark' ? 'is-dark' : ''}`} aria-hidden="true" />
              </button>
            </aside>
          </div>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="container">
        <div className={`article__body ${railOpen ? '' : 'is-rail-closed'}`} ref={bodyRef}>
          {/* Contents rail — collapsible, so the reader can give the prose the
              full width of the screen. State persists across parts and visits. */}
          <aside className="article__rail" id="article-rail" hidden={!railOpen}>
            <div className="article__rail-inner">
              <div className="article__rail-head">
                <span className="mono article__rail-title">In this part</span>
                <button
                  type="button"
                  className="article__rail-btn"
                  onClick={() => setRailOpen(false)}
                  aria-label="Hide contents"
                  aria-expanded="true"
                  aria-controls="article-rail"
                  data-cursor
                >
                  <span className="article__rail-chev" aria-hidden="true" />
                </button>
              </div>
              <ol className="article__toc">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      onClick={(e) => goSection(e, t.id)}
                      className={`article__toc-link ${active === t.id ? 'is-active' : ''}`}
                    >
                      <span className="article__toc-n mono">{t.num}</span>
                      <span>{t.text}</span>
                    </a>
                  </li>
                ))}
              </ol>

              <span className="mono article__rail-title article__rail-title--sub">All {piece.parts} parts</span>
              <div className="article__pips">
                {parts?.map((p) => (
                  <Link
                    key={p.n}
                    to={`${base}/part-${p.n}`}
                    className={`article__pip ${p.n === n ? 'is-current' : ''}`}
                    title={`Part ${p.n} — ${p.title}`}
                    aria-current={p.n === n ? 'page' : undefined}
                    data-cursor
                  >
                    {p.n}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Prose column */}
          <div className="article__col">
            {!parts && !loadError && (
              <p className="article__loading mono">Loading part {n}…</p>
            )}
            {loadError && (
              <p className="article__loading">
                This part didn’t load. <button type="button" className="link" onClick={() => window.location.reload()}>Try again</button>
              </p>
            )}

            {part?.prologue && (
              <section className="article__prologue">
                {part.prologueTitle && (
                  <h2 className="article__prologue-head">{part.prologueTitle}</h2>
                )}
                {part.prologueTag && (
                  <p className="mono article__prologue-tag">{part.prologueTag}</p>
                )}
                <Prose html={part.prologue} dark={theme === 'dark'} />
                <div className="article__prologue-rule" aria-hidden="true" />
                <span className="mono article__prologue-next">
                  Part {String(n).padStart(2, '0')} begins
                </span>
              </section>
            )}

            {part && <Prose html={part.html} dark={theme === 'dark'} />}

            {part?.sources && (
              <details className="article__sources">
                <summary data-cursor>
                  <span className="mono">Sources &amp; further reading — Part {n}</span>
                  <span className="article__sources-icon" aria-hidden="true" />
                </summary>
                <Prose html={part.sources} className="prose--sources" dark={theme === 'dark'} />
              </details>
            )}

            {/* Prev / next */}
            {part && (
              <nav className="article__pager" aria-label="Article parts">
                {prev ? (
                  <Link to={`${base}/part-${prev}`} className="article__pager-link article__pager-link--prev" data-cursor>
                    <span className="mono">← Part {String(prev).padStart(2, '0')}</span>
                    <span className="article__pager-title">{parts[prev - 1].title}</span>
                  </Link>
                ) : <span />}
                {next ? (
                  <Link to={`${base}/part-${next}`} className="article__pager-link article__pager-link--next" data-cursor>
                    <span className="mono">Part {String(next).padStart(2, '0')} →</span>
                    <span className="article__pager-title">{parts[next - 1].title}</span>
                  </Link>
                ) : (
                  <Link to="/writing" className="article__pager-link article__pager-link--next" data-cursor>
                    <span className="mono">You’ve finished →</span>
                    <span className="article__pager-title">Back to all writing</span>
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Full contents ---------- */}
      {parts && (
        <section className="article__contents">
          <div className="container">
            <div className="section-head">
              <span className="mono">
                <span className="section-head__id">ALL PARTS</span>&nbsp;&nbsp;/&nbsp;&nbsp;{piece.title} — {piece.subtitle}
              </span>
              <span className="mono hide-sm">{piece.words.toLocaleString('en-IN')} WORDS</span>
            </div>

            <ol className="article__contents-list">
              {parts.map((p) => (
                <li key={p.n}>
                  <Link
                    to={`${base}/part-${p.n}`}
                    className={`article__entry ${p.n === n ? 'is-current' : ''}`}
                    data-cursor
                  >
                    <span className="article__entry-n mono">{String(p.n).padStart(2, '0')}</span>
                    <span className="article__entry-body">
                      <span className="article__entry-label mono">{p.label}</span>
                      <span className="article__entry-title">{p.title}</span>
                      <span className="article__entry-lead">{p.lead}</span>
                    </span>
                    <span className="article__entry-meta mono">{p.minutes} min</span>
                  </Link>
                </li>
              ))}
            </ol>

            <div className="article__grabpdf">
              <a
                className="btn btn--ghost"
                href={`${import.meta.env.BASE_URL}${piece.pdf}`}
                download
                data-cursor
              >
                Download all {piece.parts} parts (PDF, {piece.pdfSize}) <span className="btn__dot" />
              </a>
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
