import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { pressPlacements } from '../data/pressPlacements';
import './PressLogoStrip.css';

function PublisherMark({ placement }) {
  return <img className={`press-ribbon__logo press-ribbon__logo--${placement.id}`}
    src={placement.logo} alt={placement.name} width={placement.width} height={placement.height}
    loading="lazy" decoding="async" />;
}

function revealFocusedPublisher(event) {
  const link = event.currentTarget;
  if (link.matches(':focus-visible')) {
    requestAnimationFrame(() => link.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' }));
  }
}

export default function PressLogoStrip({ paused: parentPaused = false }) {
  const titleId = useId();
  const railId = useId();
  const [paused, setPaused] = useState(false);
  const stopped = paused || parentPaused;

  return <section className={`press-ribbon ${stopped ? 'press-ribbon--paused' : ''}`} aria-labelledby={titleId}>
    <div className="press-ribbon__inner">
      <div className="press-ribbon__heading">
        <div><h2 id={titleId}>In the <em>spotlight.</em></h2><p>Selected press release placements</p></div>
        <div className="press-ribbon__actions">
          <Link to="/press/">Explore the press archive <span aria-hidden="true">↗</span></Link>
          <button type="button" aria-controls={railId} aria-pressed={stopped} disabled={parentPaused}
            onClick={() => setPaused(value => !value)}>
            <span aria-hidden="true">{stopped ? '▷' : 'Ⅱ'}</span> {parentPaused ? 'Motion paused' : stopped ? 'Resume movement' : 'Pause movement'}
          </button>
        </div>
      </div>
      <div className="press-ribbon__glass" id={railId}>
        <div className="press-ribbon__track">
          <ul className="press-ribbon__group" aria-label="Read the releases on publisher websites">
            {pressPlacements.map(placement => <li key={placement.id}>
              <a href={placement.url} target="_blank" rel="noopener noreferrer" onFocus={revealFocusedPublisher}
                aria-label={`Read the press release on ${placement.name} (opens in a new tab)`}>
                <PublisherMark placement={placement} />
              </a>
            </li>)}
          </ul>
          <div className="press-ribbon__group press-ribbon__echo" aria-hidden="true">
            {pressPlacements.map(placement => <a className="press-ribbon__duplicate" key={placement.id}
              href={placement.url} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
              <PublisherMark placement={placement} />
            </a>)}
          </div>
        </div>
      </div>
      <p className="press-ribbon__note">Select a publisher to read the release on its site.</p>
    </div>
  </section>;
}
