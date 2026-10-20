import { getPieceForLanguage } from '../data/writing';
import { books } from '../data/books';

/** Routes and existing metadata are the single source for publication jackets. */
export function publicationForPath(pathname, articleTitle = '') {
  const match = pathname.match(/^\/(?:(hi|pa)\/)?(writing|books)\/([^/]+)(?:\/([^/]+))?\/?$/);
  if (!match) return null;
  const [, language = 'en', section, slug, part] = match;
  const piece = section === 'writing'
    ? getPieceForLanguage(slug, language)
    : books.find(book => book.slug === slug);
  if (!piece) return null;
  const isArticle = Boolean(part);
  const number = part?.match(/^part-(\d+)$/)?.[1];
  const unit = piece.unit === 'volume' ? 'Volume' : 'Part';
  const label = isArticle
    ? number ? `${({ hi: piece.unit === 'volume' ? 'पुस्तक' : 'भाग', pa: 'ਭਾਗ' }[language] ?? unit)} ${number.padStart(2, '0')}` : 'Close reading'
    : section === 'books' ? 'Reading notes' : ({ hi: 'शोध संग्रह', pa: 'ਖੋਜ ਸੰਗ੍ਰਹਿ' }[language] ?? 'Research collection');
  return {
    piece,
    title: isArticle && articleTitle ? articleTitle : piece.title,
    label,
    collection: piece.title,
    language,
    isArticle,
  };
}
