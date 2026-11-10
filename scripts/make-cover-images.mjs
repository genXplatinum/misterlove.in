// Print cover masters remain byte-for-byte intact; web derivatives are built
// reproducibly for both static rendering and client navigation.
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { myBooks } from '../src/data/myBooks.js';
import { coverWidths } from '../src/data/coverImages.js';

await mkdir('public/book-covers/responsive', { recursive: true });
for (const book of myBooks) {
  for (const width of coverWidths) {
    await sharp(`public${book.cover}`).rotate().resize({ width, withoutEnlargement: true })
      .webp({ quality: 92, effort: 6, smartSubsample: true })
      .toFile(`public/book-covers/responsive/${book.id}-${width}.webp`);
  }
}
console.log(`covers ✓ ${myBooks.length * coverWidths.length} responsive images; original masters preserved`);
