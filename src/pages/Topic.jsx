import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { useExperience } from '../components/ExperienceProvider';
import Magnetic from '../components/Magnetic';
import CoverPlate from '../components/CoverPlate';
import useRoom from '../components/PieceRoom';
import ChapterRun from '../components/ChapterRun';
import WritingLanguageSwitch from '../components/WritingLanguageSwitch';
import { clearWritingSchema } from '../components/writingSchema';
import {
  getPiece,
  getPieceForLanguage,
  contentsOf,
  livePartsOf,
  isInProgress,
  pdfsOf,
  writingPathOf,
  writingEditionsOf,
  writingLanguageFromPath,
  writingTranslationMeta,
} from '../data/writing';
import { profile } from '../data/site';
import { withVolumeCopy } from '../data/writingUnits.js';
import './Writing.css';
import './Rooms.css';
import { loadWritingContents } from '../data/readerData';

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
  pa: {
    writing: 'ਲਿਖਤਾਂ', breadcrumb: 'ਸਫ਼ੇ ਦਾ ਰਸਤਾ',
    startAria: (title) => `${title} ਪੜ੍ਹਨਾ ਸ਼ੁਰੂ ਕਰੋ`,
    parts: 'ਭਾਗ', words: 'ਸ਼ਬਦ', read: 'ਪੜ੍ਹਨ ਦਾ ਸਮਾਂ', published: 'ਪ੍ਰਕਾਸ਼ਿਤ', hours: 'ਘੰਟੇ',
    start: 'ਪੜ੍ਹਨਾ ਸ਼ੁਰੂ ਕਰੋ / ਭਾਗ 01', pdf: (label, size) => `${label ?? 'PDF'} · ${size}`,
    contents: 'ਵਿਸ਼ਾ ਸੂਚੀ', contentsSummary: (piece, live, inProgress) => (
      inProgress ? `${piece.parts} ਭਾਗਾਂ ਵਿੱਚੋਂ ${live} ਪੰਜਾਬੀ ਵਿੱਚ ਉਪਲਬਧ` : `${piece.parts} ਭਾਗ, ਲੜੀਵਾਰ`
    ),
    loadFail: 'ਵਿਸ਼ਾ ਸੂਚੀ ਨਹੀਂ ਖੁੱਲ੍ਹ ਸਕੀ। ਸਫ਼ਾ ਦੁਬਾਰਾ ਖੋਲ੍ਹੋ।', minutes: 'ਮਿੰਟ',
    preparing: 'ਅਜੇ ਤਿਆਰ ਨਹੀਂ', switchLabel: 'ਪੜ੍ਹਨ ਦੀ ਭਾਸ਼ਾ',
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
    pdf: (label, size) => `${label ?? 'PDF'} · ${size}`,
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
    const imageFile = piece.ogImage
      ? piece.ogImage
      : `${imageSlug}.png`;
    const image = `https://misterlove.in/og/${imageFile}`;
    const imageType = imageFile.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
    const imageAlt = language === 'pa'
      ? `${piece.title}: ${piece.subtitle}। ਲਵਪ੍ਰੀਤ ਸਿੰਘ ਦੀ ਪੜਤਾਲ ਦਾ ਪੰਜਾਬੀ ਸੰਸਕਰਣ।`
      : language === 'hi'
      ? `${piece.title} — ${piece.subtitle}। ${profile.name} की ${piece.parts} ${piece.unit === 'volume' ? 'पुस्तकों' : 'भागों'} वाली शोध श्रृंखला।`
      : `${piece.title} — ${piece.subtitle}. ${piece.parts}-${piece.unit === 'volume' ? 'volume' : 'part'} research series by ${profile.name}.`;
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
    document.head.querySelectorAll('meta[property="og:locale:alternate"]').forEach((meta) => meta.remove());

    const restores = [
      set('link[rel="canonical"]', 'link', { rel: 'canonical', href: url }),
      set('meta[name="description"]', 'meta', { name: 'description', content: piece.standfirst }),
      set('meta[property="og:title"]', 'meta', { property: 'og:title', content: `${piece.title} — ${piece.subtitle}` }),
      set('meta[property="og:description"]', 'meta', { property: 'og:description', content: piece.standfirst }),
      set('meta[property="og:url"]', 'meta', { property: 'og:url', content: url }),
      set('meta[property="og:locale"]', 'meta', { property: 'og:locale', content: piece.locale ?? 'en_IN' }),
      set('meta[property="og:image"]', 'meta', { property: 'og:image', content: image }),
      set('meta[property="og:image:secure_url"]', 'meta', { property: 'og:image:secure_url', content: image }),
      set('meta[property="og:image:type"]', 'meta', { property: 'og:image:type', content: imageType }),
      set('meta[property="og:image:alt"]', 'meta', { property: 'og:image:alt', content: imageAlt }),
      set('meta[property="og:image:width"]', 'meta', { property: 'og:image:width', content: '1200' }),
      set('meta[property="og:image:height"]', 'meta', { property: 'og:image:height', content: '630' }),
      set('meta[name="twitter:title"]', 'meta', { name: 'twitter:title', content: `${piece.title} — ${piece.subtitle}` }),
      set('meta[name="twitter:description"]', 'meta', { name: 'twitter:description', content: piece.standfirst }),
      set('meta[name="twitter:image"]', 'meta', { name: 'twitter:image', content: image }),
      set('meta[name="twitter:image:alt"]', 'meta', { name: 'twitter:image:alt', content: imageAlt }),
    ];

    const editions = writingEditionsOf(original);
    if (editions.length > 1) {
      for (const edition of editions) {
        restores.push(set(`link[rel="alternate"][hreflang="${edition.language}"]`, 'link', {
          rel: 'alternate', hreflang: edition.language, href: `https://misterlove.in${writingPathOf(edition)}/`,
        }));
        if (edition.language !== language) restores.push(set(`meta[property="og:locale:alternate"][content="${edition.locale}"]`, 'meta', {
          property: 'og:locale:alternate', content: edition.locale,
        }));
      }
      restores.push(set('link[rel="alternate"][hreflang="x-default"]', 'link', {
        rel: 'alternate', hreflang: 'x-default', href: `https://misterlove.in/writing/${piece.slug}/`,
      }));
    }

    clearWritingSchema();
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify([{
      '@context': 'https://schema.org', '@type': 'CreativeWorkSeries',
      name: `${piece.title} — ${piece.subtitle}`, url,
      description: piece.standfirst, abstract: piece.summary,
      datePublished: piece.published, inLanguage: language,
      numberOfItems: piece.parts,
      author: { '@type': 'Person', '@id': 'https://misterlove.in/#lovepreet-singh', name: profile.name },
      ...writingTranslationMeta(piece, undefined, 'CreativeWorkSeries'),
    }, {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: COPY[language].writing, item: 'https://misterlove.in/writing/' },
        { '@type': 'ListItem', position: 2, name: piece.title, item: url },
      ],
    }]);
    document.head.appendChild(ld);
    window.scrollTo(0, 0);

    return () => {
      document.title = prevTitle;
      document.documentElement.lang = prevLang;
      restores.forEach((restore) => restore());
      ld.remove();
    };
  }, [piece, original]);
}

/** A research topic and the parts available in the selected language. */
export default function Topic() {
  const { white } = useExperience();
  const showOpening = white;
  const { slug } = useParams();
  const { pathname } = useLocation();
  const language = writingLanguageFromPath(pathname);
  const original = getPiece(slug);
  const piece = useMemo(() => getPieceForLanguage(slug, language), [slug, language]);
  const copy = withVolumeCopy(piece, COPY[language]);

  const [parts, setParts] = useState(null);
  const [failed, setFailed] = useState(false);

  /* A piece may bring its own room. Keyed on the room name, because React
     Router reuses this component from one piece to the next. */
  useRoom(piece?.room);

  useEffect(() => {
    if (!piece) return undefined;
    let alive = true;
    setParts(null);
    setFailed(false);
    loadWritingContents(piece)
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
  // Whether any part can actually be opened in the reader yet.
  const readable = livePartsOf(piece) > 0;
  const contents = contentsOf(piece, parts);
  const pdfs = pdfsOf(piece);

  return (
    <div
      className={`topicpage ${language !== 'en' ? `topicpage--${language}` : ''}`}
      lang={language}
    >
      <div className="container">
        <div className="topicpage__navrow">
          <nav className="article__crumbs" aria-label={copy.breadcrumb}>
            <Link to="/writing" className="article__crumb">{copy.writing}</Link>
            <span className="article__crumb-sep" aria-hidden="true">/</span>
            <span className="article__crumb is-current">{piece.title}</span>
          </nav>

          <WritingLanguageSwitch piece={piece} label={copy.switchLabel} />
        </div>

        {/* A series can be announced before any part is readable on the web —
            the book exists, the PDF is here, the reader is not. Then the cover
            is not a link, because there is nothing yet to link it to. */}
        <header className={showOpening ? "work-opening" : undefined}>
        <div className="topicpage__cover">
          {readable ? (
            <Link to={read} className="topicpage__coverlink" aria-label={copy.startAria(piece.title)}>
              <CoverPlate piece={piece} className="cover--full" />
            </Link>
          ) : (
            <CoverPlate piece={piece} className="cover--full" />
          )}
        </div>
        {showOpening && <div className="work-opening__copy">
          <p className="work-opening__subject">{piece.topic}</p>
          <h1>{piece.title}</h1>
          <p className="work-opening__subtitle">{piece.subtitle}</p>
          <p className="work-opening__lead">{piece.standfirst}</p>
          <div className="work-opening__actions">
            {readable && <Link to={read} className="btn">{copy.start}</Link>}
            <a href="#contents" className="work-contents-link">{copy.contents}</a>
          </div>
        </div>}
        </header>

        <div className="topicpage__body">
          <Reveal className="topicpage__intro">
            {showOpening ? <h2 className="work-about-title">{language === 'pa' ? 'ਇਸ ਪੜਤਾਲ ਬਾਰੇ' : language === 'hi' ? 'इस अध्ययन के बारे में' : 'Inside the investigation'}</h2> : <><span className="mono topicpage__topic">{piece.topic}</span><p className="topicpage__stand">{piece.standfirst}</p></>}
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
              {readable && (
                <Magnetic>
                  <Link to={read} className="btn">
                    {copy.start} <span className="btn__dot" />
                  </Link>
                </Magnetic>
              )}
              {pdfs.map((pdf) => (
                <a
                  key={pdf.file}
                  className="btn btn--ghost"
                  href={`${import.meta.env.BASE_URL}${pdf.file}`}
                  download
                >
                  {copy.pdf(pdf.label, pdf.size)}
                </a>
              ))}
            </div>
          </Reveal>

          {piece.principles?.length > 0 && <Reveal className="feature__method" delay={80}>
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
          </Reveal>}
        </div>

        {piece.room && (
          <ChapterRun piece={piece} parts={parts} base={base} />
        )}

        <div id="contents" className="feature__contents">
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
              // A part can be announced with its own finished PDF well before
              // the web edition exists — the row still reads as available,
              // just pointed at the PDF instead of the in-browser reader.
              const pdfOnly = !part.live && part.pdf ? part : null;

              const body = (
                <>
                  <span className="partrow__n mono">{String(part.n).padStart(2, '0')}</span>
                  <span className="partrow__body">
                    <span className="partrow__label mono">{part.label}</span>
                    <span className="partrow__title">{part.title}</span>
                    <span className="partrow__lead">{part.lead}</span>
                  </span>
                  <span className="partrow__meta mono">
                    {part.live
                      ? `${part.minutes} ${copy.minutes}`
                      : pdfOnly ? copy.pdf(pdfOnly.pdfLabel, pdfOnly.pdfSize) : copy.preparing}
                  </span>
                  <span className="partrow__arrow" aria-hidden="true">
                    {part.live ? '→' : pdfOnly ? '↓' : ''}
                  </span>
                </>
              );

              return (
                <li key={part.n}>
                  <Reveal delay={Math.min(i, 6) * 40}>
                    {part.live ? (
                      <Link to={`${base}/part-${part.n}`} className="partrow">
                        {body}
                      </Link>
                    ) : pdfOnly ? (
                      <a
                        href={`${import.meta.env.BASE_URL}${pdfOnly.pdf}`}
                        className="partrow"
                        download
                      >
                        {body}
                      </a>
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
