import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import Magnetic from '../components/Magnetic';
import { pieces, writingMeta } from '../data/writing';
import { profile } from '../data/site';
import './Writing.css';

/** Fetches the part manifest for a piece so the index can list its contents. */
function usePieceParts(piece) {
  const [parts, setParts] = useState(null);
  useEffect(() => {
    let alive = true;
    piece.load().then((m) => { if (alive) setParts(m.default); }).catch(() => {});
    return () => { alive = false; };
  }, [piece]);
  return parts;
}

function Feature({ piece }) {
  const parts = usePieceParts(piece);
  const read = `/writing/${piece.slug}/part-1`;

  return (
    <article className="feature">
      {/* Typographic cover — no stock photography anywhere on this site,
          so the piece announces itself in type, the way the book does. */}
      <Reveal className="feature__cover" variant="fade">
        <Link to={read} className="feature__cover-link" data-cursor aria-label={`Read ${piece.title}`}>
          <span className="feature__cover-kicker mono">{piece.kicker}</span>
          <span className="feature__cover-title">
            {piece.title}
            <span className="feature__cover-sub">{piece.subtitle}</span>
          </span>
          <span className="feature__cover-rule" aria-hidden="true" />
          <span className="feature__cover-stand">{piece.standfirst}</span>
          <span className="feature__cover-foot">
            <span className="feature__badge mono">{piece.parts} parts · {piece.status}</span>
            <span className="mono dim">Written &amp; researched by {profile.name}</span>
          </span>
        </Link>
      </Reveal>

      <div className="feature__body">
        <Reveal className="feature__intro">
          <p className="feature__summary">{piece.summary}</p>

          <dl className="feature__stats">
            <div><dt className="mono">Parts</dt><dd>{piece.parts}</dd></div>
            <div><dt className="mono">Words</dt><dd>{piece.words.toLocaleString('en-IN')}</dd></div>
            <div><dt className="mono">Read</dt><dd>~{Math.round(piece.minutes / 60 * 10) / 10} hrs</dd></div>
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
          <span className="mono feature__method-title">// The four promises this book opens with</span>
          <ol className="feature__promises">
            {piece.promises.map((p) => (
              <li key={p.n}>
                <span className="mono feature__promise-n">{p.n}</span>
                <span className="feature__promise-t">{p.t}</span>
                <span className="feature__promise-d">{p.d}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>

      {/* Contents */}
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
          <p className="mono dim feature__loading">Loading contents…</p>
        )}
      </div>
    </article>
  );
}

export default function Writing() {
  useEffect(() => {
    const prev = document.title;
    document.title = `Writing — long-form research by ${profile.name}`;

    // Match the pre-rendered /writing shell after a client-side navigation.
    const featured = pieces[0];
    const image = featured ? `https://misterlove.in/og/${featured.slug}.png` : null;
    const tags = image
      ? ['meta[property="og:image"]', 'meta[property="og:image:secure_url"]', 'meta[name="twitter:image"]']
          .map((sel) => {
            const el = document.head.querySelector(sel);
            if (!el) return null;
            const was = el.getAttribute('content');
            el.setAttribute('content', image);
            return () => el.setAttribute('content', was);
          })
          .filter(Boolean)
      : [];

    return () => {
      document.title = prev;
      tags.forEach((restore) => restore());
    };
  }, []);

  return (
    <div className="writingpage">
      <header className="writingpage__head">
        <div className="container">
          <Reveal>
            <span className="eyebrow">{writingMeta.index} — {writingMeta.label}</span>
            <h1 className="writingpage__title">{writingMeta.title}</h1>
            <p className="writingpage__lead lead muted">{writingMeta.lead}</p>
          </Reveal>
        </div>
      </header>

      <div className="container">
        {pieces.map((p) => <Feature key={p.slug} piece={p} />)}
      </div>
    </div>
  );
}
