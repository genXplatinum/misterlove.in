import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import Reveal from '../components/Reveal';
import Magnetic from '../components/Magnetic';
import CoverPlate from '../components/CoverPlate';
import {
  getPiece,
  getPieceForLanguage,
  contentsOf,
  livePartsOf,
  isInProgress,
  pdfsOf,
  writingPathOf,
} from '../data/writing';
import { profile } from '../data/site';
import './Writing.css';

const COPY = {
  en: {
    writing: 'Writing',
    breadcrumb: 'Breadcrumb',
    startAria: (title) => `Start reading ${title}`,
    parts: 'Parts',
    words: 'Words',
    read: 'Read',
    published: 'Published',
    hours: 'hrs',
    start: 'Start reading — Part 01',
    pdf: (label, size) => `${label ?? 'PDF'} · ${size}`,
    contents: 'CONTENTS',
    contentsSummary: (piece, live, inProgress) => (
      inProgress ? `${piece.parts} parts planned, ${live} published` : `${piece.parts} parts, in order`
    ),
    loadFail: 'Contents didn’t load — please refresh.',
    minutes: 'min',
    preparing: 'In preparation',
    switchLabel: 'Reading language',
    english: 'English',
    hindi: 'हिन्दी',
  },
  hi: {
    writing: 'लेखन',
    breadcrumb: 'पृष्ठ क्रम',
    startAria: (title) => `${title} पढ़ना शुरू करें`,
    parts: 'भाग',
    words: 'शब्द',
    read: 'पढ़ने का समय',
    published: 'प्रकाशित',
    hours: 'घंटे',
    start: 'पढ़ना शुरू करें — भाग 01',
    pdf: (_label, size) => `अंग्रेज़ी PDF · ${size}`,
    contents: 'सभी भाग',
    contentsSummary: (piece, live, inProgress) => (
      inProgress ? `${piece.parts} भाग तय, ${live} प्रकाशित` : `${piece.parts} भाग, सही क्रम में`
    ),
    loadFail: 'विषय सूची नहीं खुली—कृपया पृष्ठ दोबारा खोलें।',
    minutes: 'मिनट',
    preparing: 'तैयार हो रहा है',
    switchLabel: 'पढ़ने की भाषा',
    english: 'English',
    hindi: 'हिन्दी',
  },
};

function useTopicMeta(piece, original) {
  useEffect(() => {
    if (!piece) return undefined;
    const language = piece.language ?? 'en';
    const prevTitle = document.title;
    const prevLang = document.documentElement.lang;
    const path = writingPathOf(piece);
    const url = `https://misterlove.in${path}/`;
    const imageSlug = piece.ogSlug ?? piece.slug;
    const image = `https://misterlove.in/og/${imageSlug}.png`;
    const imageAlt = language === 'hi'
      ? `${piece.title} — ${piece.subtitle}। ${profile.name} की ${piece.parts} भागों वाली शोध श्रृंखला।`
      : `${piece.title} — ${piece.subtitle}. ${piece.parts}-part research series by ${profile.name}.`;
    document.title = `${piece.title} — ${piece.subtitle} | ${profile.name}`;
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

    document.head
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((link) => link.remove());
    document.head.querySelector('meta[property="og:locale:alternate"]')?.remove();

    const restores = [
      set('link[rel="canonical"]', 'link', { rel: 'canonical', href: url }),
      set('meta[name="description"]', 'meta', { name: 'description', content: piece.standfirst }),
      set('meta[property="og:title"]', 'meta', { property: 'og:title', content: `${piece.title} — ${piece.subtitle}` }),
      set('meta[property="og:description"]', 'meta', { property: 'og:description', content: piece.standfirst }),
      set('meta[property="og:url"]', 'meta', { property: 'og:url', content: url }),
      set('meta[property="og:locale"]', 'meta', { property: 'og:locale', content: piece.locale ?? 'en_IN' }),
      set('meta[property="og:image"]', 'meta', { property: 'og:image', content: image }),
      set('meta[property="og:image:secure_url"]', 'meta', { property: 'og:image:secure_url', content: image }),
      set('meta[property="og:image:alt"]', 'meta', { property: 'og:image:alt', content: imageAlt }),
      set('meta[property="og:image:width"]', 'meta', { property: 'og:image:width', content: '1200' }),
      set('meta[property="og:image:height"]', 'meta', { property: 'og:image:height', content: '630' }),
      set('meta[name="twitter:title"]', 'meta', { name: 'twitter:title', content: `${piece.title} — ${piece.subtitle}` }),
      set('meta[name="twitter:description"]', 'meta', { name: 'twitter:description', content: piece.standfirst }),
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
          href: `https://misterlove.in/writing/${piece.slug}/`,
        }),
        set('link[rel="alternate"][hreflang="hi"]', 'link', {
          rel: 'alternate',
          hreflang: 'hi',
          href: `https://misterlove.in/hi/writing/${piece.slug}/`,
        }),
        set('link[rel="alternate"][hreflang="x-default"]', 'link', {
          rel: 'alternate',
          hreflang: 'x-default',
          href: `https://misterlove.in/writing/${piece.slug}/`,
        })
      );
    }

    if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);

    return () => {
      document.title = prevTitle;
      document.documentElement.lang = prevLang;
      restores.forEach((restore) => restore());
    };
  }, [piece, original]);
}

/** One research topic, including its complete English or Hindi contents. */
export default function Topic() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const language = pathname.startsWith('/hi/') ? 'hi' : 'en';
  const original = getPiece(slug);
  const piece = useMemo(() => getPieceForLanguage(slug, language), [slug, language]);
  const copy = COPY[language];

  const [parts, setParts] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!piece) return undefined;
    let alive = true;
    setParts(null);
    setFailed(false);
    piece.load()
      .then((m) => { if (alive) setParts(m.default); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [piece]);

  useTopicMeta(piece, original);

  if (!original) return <Navigate to="/writing" replace />;
  if (!piece) return <Navigate to={`/writing/${slug}`} replace />;

  const base = writingPathOf(piece);
  const read = writingPathOf(piece, 1);
  const inProgress = isInProgress(piece);
  const contents = contentsOf(piece, parts);
  const hasHindi = Boolean(original.translations?.hi);
  const pdfs = pdfsOf(piece);

  return (
    <div
      className={`topicpage ${language === 'hi' ? 'topicpage--hi' : ''}`}
      lang={language}
    >
      <div className="container">
        <div className="topicpage__navrow">
          <nav className="article__crumbs" aria-label={copy.breadcrumb}>
            <Link to="/writing" className="article__crumb" data-cursor>{copy.writing}</Link>
            <span className="article__crumb-sep" aria-hidden="true">/</span>
            <span className="article__crumb is-current">{piece.title}</span>
          </nav>

          {hasHindi && (
            <nav className="language-switch" aria-label={copy.switchLabel}>
              <Link
                to={`/writing/${piece.slug}`}
                className={language === 'en' ? 'is-active' : ''}
                aria-current={language === 'en' ? 'page' : undefined}
                data-cursor
              >
                {copy.english}
              </Link>
              <Link
                to={`/hi/writing/${piece.slug}`}
                className={language === 'hi' ? 'is-active' : ''}
                aria-current={language === 'hi' ? 'page' : undefined}
                data-cursor
              >
                {copy.hindi}
              </Link>
            </nav>
          )}
        </div>

        <Reveal className="topicpage__cover">
          <Link to={read} className="topicpage__coverlink" data-cursor aria-label={copy.startAria(piece.title)}>
            <CoverPlate piece={piece} className="cover--full" />
          </Link>
        </Reveal>

        <div className="topicpage__body">
          <Reveal className="topicpage__intro">
            <span className="mono topicpage__topic">{piece.topic}</span>
            <p className="topicpage__stand">{piece.standfirst}</p>
            <p className="topicpage__summary">{piece.summary}</p>

            <dl className="feature__stats">
              <div>
                <dt className="mono">{copy.parts}</dt>
                <dd>{inProgress ? `${livePartsOf(piece)} / ${piece.parts}` : piece.parts}</dd>
              </div>
              <div><dt className="mono">{copy.words}</dt><dd>{piece.words.toLocaleString('en-IN')}</dd></div>
              <div><dt className="mono">{copy.read}</dt><dd>~{Math.round((piece.minutes / 60) * 10) / 10} {copy.hours}</dd></div>
              <div><dt className="mono">{copy.published}</dt><dd>{piece.displayDate}</dd></div>
            </dl>

            <div className="feature__ctas">
              <Magnetic>
                <Link to={read} className="btn" data-cursor>
                  {copy.start} <span className="btn__dot" />
                </Link>
              </Magnetic>
              {pdfs.map((pdf) => (
                <a
                  key={pdf.file}
                  className="btn btn--ghost"
                  href={`${import.meta.env.BASE_URL}${pdf.file}`}
                  download
                  data-cursor
                >
                  {copy.pdf(pdf.label, pdf.size)}
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal className="feature__method" delay={80}>
            <span className="mono feature__method-title">{piece.principlesTitle}</span>
            <ol className="feature__promises">
              {piece.principles.map((promise) => (
                <li key={promise.n}>
                  <span className="mono feature__promise-n">{promise.n}</span>
                  <span className="feature__promise-t">{promise.t}</span>
                  <span className="feature__promise-d">{promise.d}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <div className="feature__contents">
          <div className="section-head">
            <span className="mono">
              <span className="section-head__id">{copy.contents}</span>&nbsp;&nbsp;/&nbsp;&nbsp;
              {copy.contentsSummary(piece, livePartsOf(piece), inProgress)}
            </span>
            <span className="mono hide-sm">{piece.topic}</span>
          </div>

          {failed && <p className="mono dim feature__loading">{copy.loadFail}</p>}

          <ol className="feature__parts">
            {contents.map((part, i) => {
              const body = (
                <>
                  <span className="partrow__n mono">{String(part.n).padStart(2, '0')}</span>
                  <span className="partrow__body">
                    <span className="partrow__label mono">{part.label}</span>
                    <span className="partrow__title">{part.title}</span>
                    <span className="partrow__lead">{part.lead}</span>
                  </span>
                  <span className="partrow__meta mono">
                    {part.live ? `${part.minutes} ${copy.minutes}` : copy.preparing}
                  </span>
                  <span className="partrow__arrow" aria-hidden="true">{part.live ? '→' : ''}</span>
                </>
              );

              return (
                <li key={part.n}>
                  <Reveal delay={Math.min(i, 6) * 40}>
                    {part.live ? (
                      <Link to={`${base}/part-${part.n}`} className="partrow" data-cursor>
                        {body}
                      </Link>
                    ) : (
                      <span className="partrow partrow--soon">{body}</span>
                    )}
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
