import { Link, useLocation } from 'react-router-dom';
import { writingEditionsOf, writingLanguageName, writingPathOf } from '../data/writing.js';

export default function WritingLanguageSwitch({ piece, part, label }) {
  const { hash } = useLocation();
  const editions = writingEditionsOf(piece, part);
  if (editions.length < 2) return null;
  const section = part && piece.slug === 'why-i-dont-believe' ? hash : '';
  return (
    <nav className="language-switch" aria-label={label}>
      {editions.map((edition) => (
        <Link
          key={edition.language}
          to={`${writingPathOf(edition, part)}${section}`}
          lang={edition.language}
          hrefLang={edition.language}
          className={piece.language === edition.language ? 'is-active' : ''}
          aria-current={piece.language === edition.language ? 'page' : undefined}
        >
          {writingLanguageName(edition.language)}
        </Link>
      ))}
    </nav>
  );
}
