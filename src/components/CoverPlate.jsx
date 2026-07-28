import './CoverPlate.css';

/**
 * A research piece's typographic cover — no stock photography anywhere on this
 * site, so each piece announces itself in type. Shared by the homepage teaser,
 * the shelf at /writing and the topic page, so all three stay identical.
 *
 * Its own module rather than living in pages/Writing.jsx: the homepage teaser
 * needs it, and importing it from the page would pull the whole route into the
 * main bundle.
 */
export default function CoverPlate({ piece, className = '' }) {
  return (
    <span className={`cover cover--${piece.accent} ${className}`}>
      <span className="cover__kicker mono">{piece.kicker}</span>
      <span className="cover__title">
        {piece.title}
        <span className="cover__sub">{piece.subtitle}</span>
      </span>
      <span className="cover__rule" aria-hidden="true" />
      <span className="cover__badge mono">
        {piece.parts} {piece.language === 'hi' ? 'भाग' : 'parts'} · {piece.status}
      </span>
    </span>
  );
}
