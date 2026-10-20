// Split checked manuscripts at the delivery boundary. Source files and the
// static publisher still use the complete, unchanged collections.
import { pieces, getPieceForLanguage } from '../src/data/writing.js';
import { books, loaderFor } from '../src/data/books.js';

const prefix = 'virtual:reader:';
const bodyFields = new Set(['html', 'prologue', 'sources', 'toc']);
export const summaryOf = part => Object.fromEntries(
  Object.entries(part).filter(([key]) => !bodyFields.has(key))
);

export async function readerCollections() {
  const collections = new Map();
  for (const piece of pieces) {
    for (const language of ['en', ...Object.keys(piece.translations ?? {})]) {
      const edition = getPieceForLanguage(piece.slug, language);
      collections.set(`writing:${language}:${piece.slug}`, (await edition.load()).default);
    }
  }
  for (const book of books) {
    for (const language of ['en', ...Object.keys(book.translations ?? {})]) {
      collections.set(`books:${language}:${book.slug}`, (await loaderFor(book, language)()).default);
    }
  }
  return collections;
}

export function readerChunks() {
  let collections;
  return {
    name: 'reader-chunks',
    resolveId(id) {
      if (id.startsWith(prefix)) return `\0${id}`;
    },
    async load(id) {
      if (!id.startsWith(`\0${prefix}`)) return;
      collections ??= await readerCollections();
      const key = id.slice(prefix.length + 1);
      if (key === 'catalogue') {
        return `export default {${[...collections.keys()].map(name =>
          `${JSON.stringify(name)}:()=>import(${JSON.stringify(prefix + name)})`
        ).join(',')}};`;
      }
      const [kind, language, slug, partKey] = key.split(':');
      const parts = collections.get(`${kind}:${language}:${slug}`);
      if (!parts) throw new Error(`Unknown reader collection: ${key}`);
      if (partKey) {
        const part = parts.find(item => String(kind === 'writing' ? item.n : item.slug) === partKey);
        if (!part) throw new Error(`Unknown reader part: ${key}`);
        return `export default ${JSON.stringify(part)};`;
      }
      const readers = parts.map(part => {
        const partKey = kind === 'writing' ? part.n : part.slug;
        return `${JSON.stringify(partKey)}:()=>import(${JSON.stringify(prefix + key + ':' + partKey)})`;
      });
      return `export const contents=${JSON.stringify(parts.map(summaryOf))};export const readers={${readers.join(',')}};`;
    },
  };
}
