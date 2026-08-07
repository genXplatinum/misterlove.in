import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Reveal from '../components/Reveal';
import Magnetic from '../components/Magnetic';
import BookPlate from '../components/BookPlate';
import useBooksRoom from '../components/BooksRoom';
import { LoadStrip } from '../components/LoadDiagram';
import { booksMeta, getBook, studiesOf, liveStudiesOf, isOpen } from '../data/books';
import { profile } from '../data/site';
import './Writing.css';
import './Books.css';

function useBookMeta(book) {
  useEffect(() => {
    if (!book) return undefined;
    const prevTitle = document.title;
    const url = `https://misterlove.in/books/${book.slug}/`;
    const image = `https://misterlove.in/og/books-${book.slug}.png`;
    const imageAlt = `${book.title} by ${book.author}, taken apart sentence by sentence. Close readings by ${profile.name}.`;
    document.title = `${book.title} by ${book.author}, taken apart | ${profile.name}`;

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
      set('meta[name="description"]', 'meta', { name: 'description', content: book.standfirst }),
      set('meta[property="og:title"]', 'meta', { property: 'og:title', content: `${book.title} — ${book.author}, taken apart` }),
      set('meta[property="og:description"]', 'meta', { property: 'og:description', content: book.standfirst }),
      set('meta[property="og:url"]', 'meta', { property: 'og:url', content: url }),
      set('meta[property="og:image"]', 'meta', { property: 'og:image', content: image }),
      set('meta[property="og:image:secure_url"]', 'meta', { property: 'og:image:secure_url', content: image }),
      set('meta[property="og:image:alt"]', 'meta', { property: 'og:image:alt', content: imageAlt }),
      set('meta[property="og:image:width"]', 'meta', { property: 'og:image:width', content: '1200' }),
      set('meta[property="og:image:height"]', 'meta', { property: 'og:image:height', content: '630' }),
      set('meta[name="twitter:title"]', 'meta', { name: 'twitter:title', content: `${book.title} — ${book.author}, taken apart` }),
      set('meta[name="twitter:description"]', 'meta', { name: 'twitter:description', content: book.standfirst }),
      set('meta[name="twitter:image"]', 'meta', { name: 'twitter:image', content: image }),
      set('meta[name="twitter:image:alt"]', 'meta', { name: 'twitter:image:alt', content: imageAlt }),
    ];

    window.scrollTo(0, 0);

    return () => {
      document.title = prevTitle;
      restores.forEach((restore) => restore());
    };
  }, [book]);
}

/** One shelved book, and every study standing against it. */
export default function Book() {
  const { book: slug } = useParams();
  const book = getBook(slug);
  useBooksRoom();

  const [studies, setStudies] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!book) return undefined;
    let alive = true;
    setStudies(null);
    setFailed(false);
    book.load()
      .then((m) => { if (alive) setStudies(m.default); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [book]);

  useBookMeta(book);

  if (!book) return <Navigate to="/books" replace />;

  const live = liveStudiesOf(book);
  const contents = studiesOf(book, studies);
  const first = contents.find((s) => s.live);
  const open = isOpen(book);

  return (
    <div className="topicpage bookpage">
      <div className="container">
        <div className="topicpage__navrow">
          <nav className="article__crumbs" aria-label="Breadcrumb">
            <Link to="/books" className="article__crumb">Books</Link>
            <span className="article__crumb-sep" aria-hidden="true">/</span>
            <span className="article__crumb is-current">{book.title}</span>
          </nav>
        </div>

        {/* The plate is the visible title, but it is a decorative span, so the
            page states its own heading once for screen readers and crawlers. */}
        <h1 className="sr-only">
          {book.title} — {book.subtitle}, by {book.author}: taken apart
        </h1>

        <Reveal className="topicpage__cover">
          {first ? (
            <Link
              to={`/books/${book.slug}/${first.slug}`}
              className="topicpage__coverlink"
              aria-label={`Start reading ${first.title}`}
            >
              <BookPlate book={book} live={live} className="cover--full" />
            </Link>
          ) : (
            <BookPlate book={book} live={live} className="cover--full" />
          )}
        </Reveal>

        <div className="topicpage__body">
          <Reveal className="topicpage__intro">
            <span className="mono topicpage__topic">{book.topic}</span>
            <p className="bookpage__by">
              <span className="mono">The book</span> {book.title} — {book.subtitle},
              by {book.author}. {book.bookNote}.
            </p>
            <p className="topicpage__stand">{book.standfirst}</p>
            <p className="topicpage__summary">{book.summary}</p>

            <dl className="feature__stats">
              <div>
                <dt className="mono">Studies</dt>
                <dd>{open ? `${live} / ${book.studies}` : book.studies}</dd>
              </div>
              <div><dt className="mono">Axioms</dt><dd>{book.axioms}</dd></div>
              <div><dt className="mono">Read</dt><dd>~{Math.round((book.minutes / 60) * 10) / 10} hrs</dd></div>
              <div><dt className="mono">Shelved</dt><dd>{book.displayDate}</dd></div>
            </dl>

            {first && (
              <div className="feature__ctas">
                <Magnetic>
                  <Link to={`/books/${book.slug}/${first.slug}`} className="btn">
                    Read {first.title} <span className="btn__dot" />
                  </Link>
                </Magnetic>
                {first.pdf && (
                  <a
                    className="btn btn--ghost"
                    href={`${import.meta.env.BASE_URL}${first.pdf}`}
                    download
                  >
                    {first.pdfLabel ?? 'PDF'} · {first.pdfSize}
                  </a>
                )}
              </div>
            )}
          </Reveal>

          <Reveal className="feature__method" delay={80}>
            <span className="mono feature__method-title">How a book gets taken apart</span>
            <ol className="feature__promises">
              {booksMeta.method.map((step) => (
                <li key={step.n}>
                  <span className="mono feature__promise-n">{step.n}</span>
                  <span className="feature__promise-t">{step.t}</span>
                  <span className="feature__promise-d">{step.d}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <div className="feature__contents">
          <div className="section-head">
            <span className="mono">
              <span className="section-head__id">THE STUDIES</span>&nbsp;&nbsp;/&nbsp;&nbsp;
              {open ? `${book.studies} planned, ${live} published` : `${book.studies} in order`}
            </span>
            <span className="mono hide-sm">{book.topic}</span>
          </div>

          {failed && <p className="mono dim feature__loading">Contents didn’t load — please refresh.</p>}

          <ol className="feature__parts studylist">
            {contents.map((study, i) => {
              const body = (
                <>
                  <span className="partrow__n mono">{String(study.n).padStart(2, '0')}</span>
                  <span className="partrow__body">
                    <span className="partrow__label mono">{study.label}</span>
                    <span className="partrow__title">{study.title}</span>
                    {study.sentence && (
                      <span className="studylist__sentence">“{study.sentence}”</span>
                    )}
                    <span className="partrow__lead">{study.lead}</span>
                    {/* The load diagram at index size — this study's condition
                        at a glance, before anyone opens it. */}
                    {study.scorecard && (
                      <LoadStrip
                        scorecard={study.scorecard}
                        label={`${study.scorecard.length} assumptions: ${
                          study.scorecard.filter((r) => r.grade === 'holds').length
                        } hold, ${
                          study.scorecard.filter((r) => r.grade === 'partly').length
                        } partly, ${
                          study.scorecard.filter((r) => r.grade === 'fails').length
                        } fail`}
                      />
                    )}
                  </span>
                  <span className="partrow__meta mono">
                    {study.live ? `${study.minutes} min` : 'In preparation'}
                  </span>
                  <span className="partrow__arrow" aria-hidden="true">{study.live ? '→' : ''}</span>
                </>
              );

              return (
                <li key={study.n}>
                  <Reveal delay={Math.min(i, 6) * 40}>
                    {study.live ? (
                      <Link to={`/books/${book.slug}/${study.slug}`} className="partrow">{body}</Link>
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
