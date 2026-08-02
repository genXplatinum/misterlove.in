/**
 * make-book-pdfs.mjs
 *
 * Binds a serialised book's per-part PDFs into one collected edition in
 * public/, so the reader offers a single download rather than a row of them.
 *
 * The Reservation Files set the pattern: per-part PDFs are right while a
 * series is being published one part at a time, but once a reader can have
 * the whole thing, one book is what they actually want. A series still in
 * progress gets the same treatment — the edition simply says how far it goes.
 *
 * The part list comes from the generated data file rather than being repeated
 * here, so a new part landing changes only the importer's output.
 *
 * Usage:
 *   node scripts/make-book-pdfs.mjs
 *   node scripts/make-book-pdfs.mjs debunked
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PDFDocument } from 'pdf-lib';

const BOOKS = [
  {
    slug: 'debunked',
    dir: 'C:/Users/rajpa/Documents/Debunk',
    data: '../src/data/writing/debunked.js',
    file: (n) => `Part_${String(n).padStart(2, '0')}.pdf`,
    title: 'Debunked — Modern Myths Sold as Ancient Indian Science',
    subject: 'The complete eleven-part field guide to modern claims about ancient India.',
  },
  {
    slug: 'debunked-sikhism',
    dir: 'C:/Users/rajpa/Documents/Debunk',
    data: '../src/data/writing/debunked-sikhism.js',
    file: (n) => `Sikh_Part_${String(n).padStart(2, '0')}.pdf`,
    title: 'Debunked — The Sikhism Series',
    subject: 'The Sikhism series, claim by claim.',
  },
  {
    slug: 'punjab',
    dir: 'C:/Users/rajpa/Documents/Debunk/Punjab - The Whole Truth',
    // No generated data file yet — the web edition of this series is still
    // being recovered from the PDFs — so the parts are named outright.
    parts: [
      'Punjab_Part_01_The_Land_Before_the_Name.pdf',
      'Punjab_Part_02_Porus_to_the_Huns.pdf',
      'Punjab_Part_03_The_Invasion_Highway.pdf',
      'Punjab_Part_04_Gurus_and_the_Khalsa.pdf',
    ],
    title: 'Punjab: The Whole Truth',
    subject: 'Five thousand years of history, one honest look — from the first farmers to the Khalistan question.',
  },
];

const only = process.argv[2];
const wanted = only ? BOOKS.filter((b) => b.slug === only) : BOOKS;
if (!wanted.length) throw new Error(`No book called "${only}". Known: ${BOOKS.map((b) => b.slug).join(', ')}`);

const human = (bytes) => (bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${Math.round(bytes / 1024)} KB`);

for (const book of wanted) {
  const parts = book.parts
    ? book.parts.map((file, i) => ({ n: i + 1, file }))
    : (await import(book.data)).default;
  if (!parts.length) throw new Error(`${book.slug}: no parts to bind`);

  const merged = await PDFDocument.create();
  merged.setTitle(`${book.title} — Parts ${parts[0].n} to ${parts[parts.length - 1].n}`);
  merged.setAuthor('Lovepreet Singh');
  merged.setSubject(book.subject);
  merged.setCreator('misterlove.in');

  let pages = 0;
  for (const part of parts) {
    const path = resolve(book.dir, part.file ?? book.file(part.n));
    // A missing source here would silently publish a book with a part cut out
    // of the middle, so it stops instead.
    if (!existsSync(path)) throw new Error(`${book.slug}: missing ${path}`);
    const source = await PDFDocument.load(await readFile(path), { ignoreEncryption: true });
    const indices = source.getPageIndices();
    for (const page of await merged.copyPages(source, indices)) merged.addPage(page);
    pages += indices.length;
  }

  const out = resolve('public', `${book.slug}.pdf`);
  await writeFile(out, await merged.save({ useObjectStreams: true }));
  const { size } = await stat(out);

  console.log(
    `✓ public/${book.slug}.pdf — ${parts.length} parts · ${pages} pages · ${human(size)}`
  );
  console.log(`    set pdfSize: '${human(size)}' in the manifest`);
}
