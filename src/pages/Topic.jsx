import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Reveal from '../components/Reveal';
import Magnetic from '../components/Magnetic';
import CoverPlate from '../components/CoverPlate';
import { getPiece } from '../data/writing';
import { profile } from '../data/site';
import './Writing.css';

/**
 * One research topic: what it is, how it was written, and its full contents.
 * The parts themselves live at /writing/<slug>/part-N.
 */
export default function Topic() {
  const { slug } = useParams();
  const piece = getPiece(slug);

  const [parts, setParts] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!piece) return;
    let alive = true;
    piece.load()
      .then((m) => { if (alive) setParts(m.default); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [piece]);

  useEffect(() => {
    if (!piece) return;
    const prevTitle = document.title;
    document.title = `${piece.title} — ${piece.subtitle} | ${profile.name}`;

    const url = `https://misterlove.in/writing/${piece.slug}/`;
    const image = `https://misterlove.in/og/${piece.slug}.png`;
    const patch = [
      ['link[rel="canonical"]', 'href', url],
      ['meta[name="description"]', 'content', piece.standfirst],
      ['meta[property="og:title"]', 'content', `${piece.title} — ${piece.subtitle}`],
      ['meta[property="og:description"]', 'content', piece.standfirst],
      ['meta[property="og:url"]', 'content', url],
      ['meta[property="og:image"]', 'content', image],
      ['meta[property="og:image:secure_url"]', 'content', image],
      ['meta[name="twitter:image"]', 'content', image],
    ].map(([sel, attr, value]) => {
      const el = document.head.querySelector(sel);
      if (!el) return null;
      const was = el.getAttribute(attr);
      el.setAttribute(attr, value);
      return () => el.setAttribute(attr, was);
    }).filter(Boolean);

    if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);

    return () => {
      document.title = prevTitle;
      patch.forEach((restore) => restore());
    };
  }, [piece]);

  if (!piece) return <Navigate to="/writing" replace />;

  const read = `/writing/${piece.slug}/part-1`;

  return (
    <div className="topicpage">
      <div className="container">
        <nav className="article__crumbs" aria-label="Breadcrumb">
          <Link to="/writing" className="article__crumb" data-cursor>Writing</Link>
          <span className="article__crumb-sep" aria-hidden="true">/</span>
          <span className="article__crumb is-current">{piece.title}</span>
        </nav>

        <Reveal className="topicpage__cover">
          <Link to={read} className="topicpage__coverlink" data-cursor aria-label={`Start reading ${piece.title}`}>
            <CoverPlate piece={piece} className="cover--full" />
          </Link>
        </Reveal>

        <div className="topicpage__body">
          <Reveal className="topicpage__intro">
            <span className="mono topicpage__topic">{piece.topic}</span>
            <p className="topicpage__stand">{piece.standfirst}</p>
            <p className="topicpage__summary">{piece.summary}</p>

            <dl className="feature__stats">
              <div><dt className="mono">Parts</dt><dd>{piece.parts}</dd></div>
              <div><dt className="mono">Words</dt><dd>{piece.words.toLocaleString('en-IN')}</dd></div>
              <div><dt className="mono">Read</dt><dd>~{Math.round((piece.minutes / 60) * 10) / 10} hrs</dd></div>
              <div><dt className="mono">Published</dt><dd>{piece.displayDate}</dd></div>
            </dl>

            <div className="feature__ctas">
              <Magnetic>
                <Link to={read} className="btn" data-cursor>
                  Start reading — Part 01 <span className="btn__dot" />
                </Link>
              </Magnetic>
              <a
                className="btn btn--ghost"
                href={`${import.meta.env.BASE_URL}${piece.pdf}`}
                download
                data-cursor
              >
                PDF · {piece.pdfSize}
              </a>
            </div>
          </Reveal>

          <Reveal className="feature__method" delay={80}>
            <span className="mono feature__method-title">{piece.principlesTitle}</span>
            <ol className="feature__promises">
              {piece.principles.map((p) => (
                <li key={p.n}>
                  <span className="mono feature__promise-n">{p.n}</span>
                  <span className="feature__promise-t">{p.t}</span>
                  <span className="feature__promise-d">{p.d}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <div className="feature__contents">
          <div className="section-head">
            <span className="mono">
              <span className="section-head__id">CONTENTS</span>&nbsp;&nbsp;/&nbsp;&nbsp;{piece.parts} parts, in order
            </span>
            <span className="mono hide-sm">{piece.topic}</span>
          </div>

          {parts ? (
            <ol className="feature__parts">
              {parts.map((p, i) => (
                <li key={p.n}>
                  <Reveal delay={Math.min(i, 6) * 40}>
                    <Link to={`/writing/${piece.slug}/part-${p.n}`} className="partrow" data-cursor>
                      <span className="partrow__n mono">{String(p.n).padStart(2, '0')}</span>
                      <span className="partrow__body">
                        <span className="partrow__label mono">{p.label}</span>
                        <span className="partrow__title">{p.title}</span>
                        <span className="partrow__lead">{p.lead}</span>
                      </span>
                      <span className="partrow__meta mono">{p.minutes} min</span>
                      <span className="partrow__arrow" aria-hidden="true">→</span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mono dim feature__loading">
              {failed ? 'Contents didn’t load — please refresh.' : 'Loading contents…'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
