import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import CoverPlate from '../components/CoverPlate';
import { pieces, writingMeta, writingTotals, livePartsOf, isInProgress } from '../data/writing';
import { profile } from '../data/site';
import './Writing.css';

/** Topic strings read like "Gender · Society · Evidence" — split into tokens. */
const topicTokens = (piece) => piece.topic.split('·').map((token) => token.trim()).filter(Boolean);

const STATUS_OPTIONS = [
  ['all', 'All'],
  ['complete', 'Complete'],
  ['progress', 'In progress'],
];

const SORT_OPTIONS = [
  ['newest', 'Newest first'],
  ['longest', 'Longest first'],
  ['parts', 'Most parts'],
];

function TopicCard({ piece, i }) {
  return (
    <Reveal as="li" className="topic" delay={i * 70}>
      <Link to={`/writing/${piece.slug}`} className="topic__link">
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
            Read this work <span className="link__arrow">→</span>
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
    const cards = [
      ['meta[property="og:image"]', image],
      ['meta[property="og:image:secure_url"]', image],
      ['meta[property="og:image:width"]', '1200'],
      ['meta[property="og:image:height"]', '630'],
      ['meta[name="twitter:image"]', image],
    ];
    const tags = cards
      .map(([sel, content]) => {
        const el = document.head.querySelector(sel);
        if (!el) return null;
        const was = el.getAttribute('content');
        el.setAttribute('content', content);
        return () => el.setAttribute('content', was);
      })
      .filter(Boolean);

    return () => {
      document.title = prev;
      tags.forEach((restore) => restore());
    };
  }, []);

  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState(null);
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');

  const topics = useMemo(() => {
    const seen = new Set();
    pieces.forEach((piece) => topicTokens(piece).forEach((token) => seen.add(token)));
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = pieces.filter((piece) => {
      if (topic && !topicTokens(piece).includes(topic)) return false;
      if (status === 'complete' && isInProgress(piece)) return false;
      if (status === 'progress' && !isInProgress(piece)) return false;
      if (q) {
        const hay = [
          piece.title,
          piece.subtitle,
          piece.standfirst,
          piece.topic,
          (piece.keywords || []).join(' '),
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sort === 'longest') out.sort((a, b) => b.words - a.words);
    else if (sort === 'parts') out.sort((a, b) => livePartsOf(b) - livePartsOf(a));
    return out;
  }, [query, topic, status, sort]);

  const hasFilters = Boolean(query.trim()) || Boolean(topic) || status !== 'all';
  const clearFilters = () => { setQuery(''); setTopic(null); setStatus('all'); };

  return (
    <div className="writingpage">
      <header className="writingpage__head">
        <div className="container">
          <Reveal>
            <span className="eyebrow">{writingMeta.index} — {writingMeta.label}</span>
            <h1 className="writingpage__title">{writingMeta.title}</h1>
            <p className="writingpage__lead lead muted">{writingMeta.lead}</p>

            <dl className="writingpage__totals">
              <div><dt className="mono">Works</dt><dd>{writingTotals.pieces}</dd></div>
              <div><dt className="mono">Parts</dt><dd>{writingTotals.parts}</dd></div>
              <div><dt className="mono">Words</dt><dd>{writingTotals.words.toLocaleString('en-IN')}</dd></div>
            </dl>
          </Reveal>
        </div>
      </header>

      <div className="container">
        <form
          className="shelf-filter"
          role="search"
          aria-label="Filter the writing"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="shelf-filter__search">
            <label htmlFor="shelf-search" className="mono shelf-filter__label">Search</label>
            <input
              id="shelf-search"
              type="search"
              className="shelf-filter__input"
              placeholder="Title, subject or keyword…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="shelf-filter__facet" role="group" aria-label="Filter by topic">
            <span className="mono shelf-filter__label">Topic</span>
            <div className="shelf-chips">
              <button
                type="button"
                className={`shelf-chip ${!topic ? 'is-active' : ''}`}
                aria-pressed={!topic}
                onClick={() => setTopic(null)}
              >
                All
              </button>
              {topics.map((token) => (
                <button
                  key={token}
                  type="button"
                  className={`shelf-chip ${topic === token ? 'is-active' : ''}`}
                  aria-pressed={topic === token}
                  onClick={() => setTopic((current) => (current === token ? null : token))}
                >
                  {token}
                </button>
              ))}
            </div>
          </div>

          <div className="shelf-filter__controls">
            <div className="shelf-filter__facet" role="group" aria-label="Filter by status">
              <span className="mono shelf-filter__label">Status</span>
              <div className="shelf-seg">
                {STATUS_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`shelf-seg__btn ${status === value ? 'is-active' : ''}`}
                    aria-pressed={status === value}
                    onClick={() => setStatus(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="shelf-filter__facet">
              <label htmlFor="shelf-sort" className="mono shelf-filter__label">Sort</label>
              <select
                id="shelf-sort"
                className="shelf-select"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {SORT_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </form>

        <div className="section-head">
          <span className="mono">
            <span className="section-head__id">ALL WRITING</span>&nbsp;&nbsp;/&nbsp;&nbsp;
            <span aria-live="polite">
              {results.length === pieces.length
                ? `${pieces.length} works`
                : `${results.length} of ${pieces.length}`}
            </span>
          </span>
          {hasFilters
            ? (
              <button type="button" className="mono shelf-clear" onClick={clearFilters}>
                Clear filters <span aria-hidden="true">✕</span>
              </button>
            )
            : <span className="mono hide-sm">CHOOSE A WORK TO BEGIN</span>}
        </div>

        {results.length ? (
          <ul className="topics">
            {results.map((p, i) => <TopicCard key={p.slug} piece={p} i={i} />)}
          </ul>
        ) : (
          <div className="shelf-empty">
            <p className="shelf-empty__title">No works match those filters.</p>
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              Clear filters <span className="btn__dot" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
