import { useMemo, useState } from 'react';

/**
 * The load diagram.
 *
 * A quotable sentence looks like one solid piece. It is not: it is resting on
 * numbered assumptions, and the whole point of a study is that some of them
 * are cracked. This draws that — the sentence as a lintel, each assumption as
 * a pier under it, hatched where it fails — and every pier is a link to the
 * chapter where that assumption is actually argued.
 *
 * Every value comes from `study.scorecard`, which the importer reads back out
 * of the author's own grading table. Nothing here is restated by hand, so the
 * picture cannot drift away from the argument it illustrates.
 */

/* Condition words rather than verbs: "5 sound · 5 partial · 1 failed" reads
   correctly at every count, where "1 holds / 5 holds" does not. */
const CONDITION = {
  holds: 'sound',
  partly: 'partial',
  fails: 'failed',
};

const ORDER = ['holds', 'partly', 'fails'];

const tallyOf = (scorecard) => ORDER
  .map((grade) => ({ grade, n: scorecard.filter((row) => row.grade === grade).length }))
  .filter((entry) => entry.n > 0);

/** The compact form: condition at a glance on a contents row. */
export function LoadStrip({ scorecard, label }) {
  if (!scorecard?.length) return null;
  return (
    <span className="loadstrip" role="img" aria-label={label}>
      {scorecard.map((row) => (
        <span key={row.n} className={`pier pier--${row.grade}`} />
      ))}
    </span>
  );
}

export default function LoadDiagram({ scorecard, sentence, caption }) {
  const [active, setActive] = useState(null);
  const tally = useMemo(() => tallyOf(scorecard ?? []), [scorecard]);

  if (!scorecard?.length) return null;

  const row = scorecard.find((entry) => entry.n === active);
  const summary = tally.map(({ grade, n }) => `${n} ${CONDITION[grade]}`).join(' · ');

  return (
    <figure className="load">
      <figcaption className="load__cap mono">
        <span>{caption}</span>
        <span>{scorecard.length} assumptions · {summary}</span>
      </figcaption>

      <div className="load__beam">
        <div className="load__lintel" role="img" aria-label={`The sentence: ${sentence}`} />

        <ol className="load__piers">
          {scorecard.map((entry) => (
            <li key={entry.n}>
              <a
                href={`#${entry.href}`}
                className={`pier pier--${entry.grade} ${active === entry.n ? 'is-current' : ''}`}
                onMouseEnter={() => setActive(entry.n)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(entry.n)}
                onBlur={() => setActive(null)}
              >
                <span aria-hidden="true">{String(entry.n).padStart(2, '0')}</span>
                <span className="sr-only">
                  Assumption {entry.n}: {entry.axiom} — {entry.verdict}
                </span>
              </a>
            </li>
          ))}
        </ol>

        {/* Carries the tally until a pier is pointed at, then that assumption.
            A tooltip would be invisible to anyone on a touchscreen. */}
        <div className={`load__readout ${row ? '' : 'load__readout--idle'}`} aria-hidden="true">
          {row ? (
            <>
              <span className="load__readout-n mono">{String(row.n).padStart(2, '0')}</span>
              <span className="load__readout-t">
                {row.axiom}
                {' — '}
                <span className={`load__readout-v grade-${row.grade}`}>{row.verdict}</span>
              </span>
              <span className="load__readout-d">{row.why}</span>
            </>
          ) : (
            <span className="load__readout-d">
              Point at a pier to read the assumption it stands for, or open it to jump
              to the chapter where it is argued.
            </span>
          )}
        </div>

        <div className="load__legend mono">
          <span><i className="load__swatch load__swatch--holds" />Holds</span>
          <span><i className="load__swatch load__swatch--partly" />Partly, or contested</span>
          <span><i className="load__swatch load__swatch--fails" />Fails</span>
        </div>
      </div>

      {/* Under the beam's usable width the drawing stops being readable, so the
          same rows are listed in full rather than squeezed into slivers. */}
      <ol className="load__list">
        {scorecard.map((entry) => (
          <li key={entry.n}>
            <a className="load__row" href={`#${entry.href}`}>
              <span className="load__row-n">{String(entry.n).padStart(2, '0')}</span>
              <span className="load__row-t">{entry.axiom}</span>
              <span className={`load__row-v grade-${entry.grade}`}>{entry.verdict}</span>
            </a>
          </li>
        ))}
      </ol>
    </figure>
  );
}
