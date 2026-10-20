import catalogue from 'virtual:reader:catalogue';

const indexes = new Map();
async function indexFor(kind, slug, language) {
  const key = `${kind}:${language}:${slug}`;
  if (!catalogue[key]) throw new Error(`No published reader for ${key}`);
  if (!indexes.has(key)) indexes.set(key, catalogue[key]().catch(error => {
    indexes.delete(key);
    throw error;
  }));
  return indexes.get(key);
}

async function loadReader(kind, slug, language, key) {
  const index = await indexFor(kind, slug, language);
  if (key === undefined) return { default: index.contents };
  const load = index.readers[key];
  if (!load) return { default: index.contents };
  const { default: part } = await load();
  return { default: index.contents.map(item =>
    (kind === 'writing' ? item.n : item.slug) === key ? part : item
  ) };
}

export const loadWritingContents = piece =>
  loadReader('writing', piece.slug, piece.language ?? 'en');
export const loadWritingPart = (piece, n) =>
  loadReader('writing', piece.slug, piece.language ?? 'en', n);
export const loadBookContents = book => loadReader('books', book.slug, 'en');
export const loadBookStudy = (book, language, slug) =>
  loadReader('books', book.slug, language, slug);
