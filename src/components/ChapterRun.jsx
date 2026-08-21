import { Link } from 'react-router-dom';

/* Darwin's first edition, 1859: an introduction and fourteen chapters. The
   spine is the book's, not the series', so it is written here once and does not
   move when a part lands. */
const SPINE = ['Intro', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];

const CHAPTER_TITLE = {
  Intro: 'Introduction',
  I: 'I · Variation Under Domestication',
  II: 'II · Variation Under Nature',
  III: 'III · The Struggle for Existence',
  IV: 'IV · Natural Selection',
  V: 'V · Laws of Variation',
  VI: 'VI · Difficulties on Theory',
  VII: 'VII · Instinct',
  VIII: 'VIII · Hybridism',
  IX: 'IX · On the Imperfection of the Geological Record',
  X: 'X · On the Geological Succession of Organic Beings',
  XI: 'XI · Geographical Distribution',
  XII: 'XII · Geographical Distribution, continued',
  XIII: 'XIII · Mutual Affinities, Morphology, Embryology',
  XIV: 'XIV · Recapitulation and Conclusion',
};

/**
 * The chapter run — the room's one component nobody else has.
 *
 * It draws Darwin's book as fifteen cells and shows how much of it this reading
 * has walked: solid where a written part covers the chapter, hatched where the
 * part is announced but not yet written, and filled in the accent on whichever
 * chapters the part in front of you is walking now. Every solid cell is a link
 * into the part that covers it.
 *
 * Nothing here is authored twice. The chapters each part covers come off the
 * part objects the importer wrote, straight from the covers of the PDFs, and
 * the unwritten ones come off the manifest's outline — so the picture cannot
 * drift from the series.
 */
export default function ChapterRun({ piece, parts, current, base }) {
  if (!piece) return null;

  /* chapter → { n, title, live } */
  const owner = new Map();
  const claim = (source, live) => {
    for (const entry of source ?? []) {
      for (const chapter of entry.chapters ?? []) {
        if (!owner.has(chapter)) owner.set(chapter, { n: entry.n, title: entry.title, live });
      }
    }
  };
  claim(parts, true);
  claim(piece.outline, false);

  const walked = SPINE.filter((chapter) => owner.get(chapter)?.live).length;
  const here = new Set(
    (parts?.find((part) => part.n === current)?.chapters) ?? []
  );

  const rows = [...(parts ?? []), ...(piece.outline ?? [])]
    .filter((entry) => (entry.chapters ?? []).length)
    .sort((a, b) => a.n - b.n);

  return (
    <section className="chapter-run" aria-labelledby="chapter-run-title">
      <div className="chapter-run__head">
        <h2 className="chapter-run__title" id="chapter-run-title">
          The book, chapter by chapter
        </h2>
        <p className="chapter-run__count">
          {walked} of {SPINE.length} walked
        </p>
      </div>

      <div className="chapter-run__strip">
        {SPINE.map((chapter) => {
          const home = owner.get(chapter);
          const isHere = here.has(chapter);
          const label = CHAPTER_TITLE[chapter] ?? chapter;
          const className = [
            'chapter-run__cell',
            home?.live ? 'chapter-run__cell--done' : 'chapter-run__cell--soon',
            isHere ? 'chapter-run__cell--here' : '',
          ].filter(Boolean).join(' ');

          if (home?.live && base) {
            return (
              <Link
                key={chapter}
                to={`${base}/part-${home.n}`}
                className={className}
                title={`${label} — Part ${home.n}, ${home.title}`}
                aria-current={isHere ? 'true' : undefined}
              >
                {chapter}
              </Link>
            );
          }

          return (
            <span
              key={chapter}
              className={className}
              title={home ? `${label} — Part ${home.n}, not written yet` : label}
            >
              {chapter}
            </span>
          );
        })}
      </div>

      {/* Fifteen cells on a phone are two characters wide, so the same
          information is repeated as rows and the strip is hidden. */}
      <div className="chapter-run__list">
        {rows.map((entry) => {
          const live = Boolean(parts?.some((part) => part.n === entry.n));
          const isHere = entry.n === current;
          const className = [
            'chapter-run__row',
            live ? '' : 'chapter-run__row--soon',
            isHere ? 'chapter-run__row--here' : '',
          ].filter(Boolean).join(' ');
          const inner = (
            <>
              <span className="chapter-run__row-n">
                {entry.chapters.join(' · ')}
              </span>
              <span className="chapter-run__row-t">
                {entry.title}
                {live ? '' : ' — being written'}
              </span>
            </>
          );
          return live && base
            ? <Link key={entry.n} to={`${base}/part-${entry.n}`} className={className}>{inner}</Link>
            : <div key={entry.n} className={className}>{inner}</div>;
        })}
      </div>

      <p className="chapter-run__foot">
        Hatched chapters are announced and not yet written.
      </p>
    </section>
  );
}
