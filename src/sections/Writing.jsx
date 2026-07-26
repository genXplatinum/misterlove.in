import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import Magnetic from '../components/Magnetic';
import SectionHead from '../components/SectionHead';
import { pieces, writingMeta } from '../data/writing';
import './Writing.css';

/**
 * Homepage act: the thinking behind the operator.
 * A teaser only — the shelf lives at /writing and the reading at
 * /writing/<slug>/part-n, so the one-pager never carries the prose.
 */
export default function WritingTeaser() {
  const piece = pieces[0];
  if (!piece) return null;

  return (
    <section id="writing" className="section writingsec">
      <div className="container">
        <SectionHead index={writingMeta.index} label={writingMeta.label} right="LONG-FORM" />

        <Reveal as="h2" className="writingsec__title" variant="up">
          {writingMeta.title}
        </Reveal>

        <Reveal as="p" className="writingsec__lead muted" delay={80}>
          {writingMeta.lead}
        </Reveal>

        <Reveal className="writingsec__card" delay={120}>
          <Link to={`/writing/${piece.slug}/part-1`} className="writingsec__link" data-cursor>
            <div className="writingsec__plate">
              <span className="writingsec__plate-kicker mono">{piece.kicker}</span>
              <span className="writingsec__plate-title">
                {piece.title}
                <span className="writingsec__plate-sub">{piece.subtitle}</span>
              </span>
              <span className="writingsec__plate-rule" aria-hidden="true" />
              <span className="writingsec__plate-badge mono">{piece.parts} parts · {piece.status}</span>
            </div>

            <div className="writingsec__meat">
              <span className="mono writingsec__topic">{piece.topic}</span>
              <p className="writingsec__stand">{piece.standfirst}</p>
              <p className="writingsec__summary">{piece.summary}</p>

              <dl className="writingsec__stats">
                <div><dt className="mono">Parts</dt><dd>{piece.parts}</dd></div>
                <div><dt className="mono">Words</dt><dd>{piece.words.toLocaleString('en-IN')}</dd></div>
                <div><dt className="mono">Read</dt><dd>~{Math.round((piece.minutes / 60) * 10) / 10} hrs</dd></div>
              </dl>

              <span className="link writingsec__cta">
                Start reading — Part 01 <span className="link__arrow">→</span>
              </span>
            </div>
          </Link>
        </Reveal>

        <Reveal className="writingsec__all" delay={160}>
          <Magnetic>
            <Link to="/writing" className="btn btn--ghost" data-cursor>
              All writing <span className="btn__dot" />
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
