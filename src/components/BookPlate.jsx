import './CoverPlate.css';
import './BookPlate.css';

/**
 * A shelved book's plate — somebody else's book, so it is set the way a spine
 * is: the author's name above, the title, the subtitle, and the count of
 * studies standing against it underneath.
 *
 * It shares the private-press cloth of CoverPlate rather than restating it, so
 * the two shelves at /writing and /books read as one archive. The difference
 * that matters is the author line: on this shelf the name on the cover is not
 * mine, and the plate should say so before anything else does.
 */
export default function BookPlate({ book, live, className = '' }) {
  const count = live ?? book.live ?? book.studies;

  return (
    <span className={`cover cover--book cover--${book.accent} ${className}`}>
      <span className="cover__kicker mono">{book.author}</span>
      <span className="cover__title">
        {book.title}
        <span className="cover__sub">{book.subtitle}</span>
      </span>
      <span className="cover__rule" aria-hidden="true" />
      <span className="cover__badge mono">
        {count} {count === 1 ? 'study' : 'studies'} · {book.bookYear}
      </span>
    </span>
  );
}
