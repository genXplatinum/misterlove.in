import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import CoverPlate from '../components/CoverPlate';
import { pieces, writingMeta, writingTotals, livePartsOf, isInProgress } from '../data/writing';
import { profile } from '../data/site';
import './Writing.css';

function TopicCard({ piece, i }) {
  return (
    <Reveal as="li" className="topic" delay={i * 70}>
      <Link to={`/writing/${piece.slug}`} className="topic__link" data-cursor>
        <CoverPlate piece={piece} className="topic__cover" />

        <span className="topic__body">
          <span className="mono topic__topic">{piece.topic}</span>
          <span className="topic__title">{piece.title}</span>
          <span className="topic__stand">{piece.standfirst}</span>

          <span className="topic__meta">
            <span>
              <b>{isInProgress(piece) ? `${livePartsOf(piece)} of ${piece.parts}` : piece.parts}</b> parts
            </span>
            <span><b>{piece.words.toLocaleString('en-IN')}</b> words</span>
            <span><b>~{Math.round((piece.minutes / 60) * 10) / 10}</b> hrs</span>
            <span className="topic__date">{piece.displayDate}</span>
          </span>

          <span className="link topic__cta">
            Open this research <span className="link__arrow">→</span>
          </span>
        </span>
      </Link>
    </Reveal>
  );
}

export default function Writing() {
  useEffect(() => {
    const prev = document.title;
    document.title = `Writing — long-form research by ${profile.name}`;

    // The shelf's own card, matching the pre-rendered /writing shell.
    const image = 'https://misterlove.in/og/writing.png';
    const tags = ['meta[property="og:image"]', 'meta[property="og:image:secure_url"]', 'meta[name="twitter:image"]']
      .map((sel) => {
        const el = document.head.querySelector(sel);
        if (!el) return null;
        const was = el.getAttribute('content');
        el.setAttribute('content', image);
        return () => el.setAttribute('content', was);
      })
      .filter(Boolean);

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

            <dl className="writingpage__totals">
              <div><dt className="mono">Research</dt><dd>{writingTotals.pieces}</dd></div>
              <div><dt className="mono">Parts</dt><dd>{writingTotals.parts}</dd></div>
              <div><dt className="mono">Words</dt><dd>{writingTotals.words.toLocaleString('en-IN')}</dd></div>
            </dl>
          </Reveal>
        </div>
      </header>

      <div className="container">
        <div className="section-head">
          <span className="mono">
            <span className="section-head__id">ALL RESEARCH</span>&nbsp;&nbsp;/&nbsp;&nbsp;newest first
          </span>
          <span className="mono hide-sm">SELECT A TOPIC TO OPEN IT</span>
        </div>

        <ul className="topics">
          {pieces.map((p, i) => <TopicCard key={p.slug} piece={p} i={i} />)}
        </ul>
      </div>
    </div>
  );
}
