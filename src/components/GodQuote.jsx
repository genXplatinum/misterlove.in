import { useEffect, useRef, useState } from 'react';
import { nextQuote, readQuoteHistory, rememberQuote } from '../lib/quoteRotation';
import './GodQuote.css';

function browserStorage() {
  try { return window.localStorage; } catch { return undefined; }
}

export default function GodQuote({ paused }) {
  const [quote, setQuote] = useState(() => nextQuote(readQuoteHistory(browserStorage())));
  const history = useRef(readQuoteHistory(browserStorage()));
  const card = useRef(null);
  useEffect(() => { history.current = rememberQuote(quote, history.current, browserStorage()); }, [quote]);
  useEffect(() => {
    const onRestore = event => { if (event.persisted) setQuote(nextQuote(history.current)); };
    window.addEventListener('pageshow', onRestore);
    return () => window.removeEventListener('pageshow', onRestore);
  }, []);
  const reset = () => {
    if (!card.current) return;
    for (const [key, value] of Object.entries({ '--tilt-x': '0deg', '--tilt-y': '0deg', '--light-x': '75%', '--light-y': '0%' })) card.current.style.setProperty(key, value);
  };
  useEffect(() => { if (paused) reset(); }, [paused]);
  const tilt = event => {
    if (paused || event.pointerType !== 'mouse') return;
    const rect = card.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    card.current.style.setProperty('--tilt-x', `${(0.5 - y) * 4}deg`);
    card.current.style.setProperty('--tilt-y', `${(x - 0.5) * 5}deg`);
    card.current.style.setProperty('--light-x', `${x * 100}%`);
    card.current.style.setProperty('--light-y', `${y * 100}%`);
  };
  return <section id="question" className="god-question" aria-labelledby="god-question-title">
    <div className="obs-wrap">
      <div className="god-question__heading" data-reveal>
        <div><p className="section-note">An enduring question</p><h2 id="god-question-title">The question of God.</h2></div>
        <p>Faith. Doubt. The reasons for both.<br />A different voice with every visit.</p>
      </div>
      <div className="quote-stage" data-reveal>
        <div className="quote-orbit" aria-hidden="true"><i /><i /><i /><span>∞</span></div>
        <div className="god-quote" ref={card} onPointerMove={tilt} onPointerLeave={reset}>
          <div className="god-quote__reflection" aria-hidden="true" />
          <figure key={quote.id} className="god-quote__passage" aria-live="polite" aria-atomic="true">
            <div className="god-quote__eyebrow"><span>{quote.perspective}</span><span>{quote.argument}</span></div>
            <blockquote>“{quote.quote}”</blockquote>
            <figcaption><strong>{quote.author}</strong><cite>{quote.work}</cite><span>{quote.section}</span></figcaption>
          </figure>
          <div className="god-quote__base">
            <details key={quote.id}><summary>Behind the argument <span aria-hidden="true">+</span></summary><p>{quote.context}</p></details>
            <a href={quote.source} target="_blank" rel="noopener noreferrer">Read the source <span aria-hidden="true">↗</span></a>
          </div>
          <div className="god-quote__actions"><span>Belief and its counterarguments</span><button type="button" onClick={() => setQuote(nextQuote(history.current))}>Another perspective <span aria-hidden="true">↻</span></button></div>
        </div>
      </div>
    </div>
  </section>;
}
