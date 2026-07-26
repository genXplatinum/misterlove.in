import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import Magnetic from '../components/Magnetic';
import SectionHead from '../components/SectionHead';
import CoverPlate from '../components/CoverPlate';
import { pieces, writingMeta, writingTotals } from '../data/writing';
import './Writing.css';

/**
 * Homepage act: the thinking behind the operator.
 * A shelf preview only — each topic opens at /writing/<slug>, and the reading
 * at /writing/<slug>/part-n, so the one-pager never carries the prose.
 */
export default function WritingTeaser() {
  if (!pieces.length) return null;

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

        <ul className="writingsec__grid">
          {pieces.map((piece, i) => (
            <Reveal as="li" key={piece.slug} delay={120 + i * 80}>
              <Link to={`/writing/${piece.slug}`} className="writingsec__card" data-cursor>
                <CoverPlate piece={piece} className="writingsec__cover" />
                <span className="writingsec__meat">
                  <span className="mono writingsec__topic">{piece.topic}</span>
                  <span className="writingsec__stand">{piece.standfirst}</span>
                  <span className="writingsec__meta mono">
                    {piece.parts} parts · {piece.words.toLocaleString('en-IN')} words · {piece.displayDate}
                  </span>
                  <span className="link writingsec__cta">
                    Open <span className="link__arrow">→</span>
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal className="writingsec__all" delay={220}>
          <Magnetic>
            <Link to="/writing" className="btn btn--ghost" data-cursor>
              All {writingTotals.pieces} research pieces <span className="btn__dot" />
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
