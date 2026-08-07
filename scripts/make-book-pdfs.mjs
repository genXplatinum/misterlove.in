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
    slug: 'rules-about-women',
    dir: 'C:/Users/rajpa/Documents/books/Females',
    /* The naming pattern changed midway: parts 1 to 14 are
       `Rules_About_Women_...`, parts 15 to 16 gained a `The_` prefix. */
    parts: [
      'Rules_About_Women_Part_1_The_Question_Underneath_the_Question.pdf',
      'Rules_About_Women_Part_2_Where_the_Rules_Came_From.pdf',
      'Rules_About_Women_Part_3_The_Indian_Machine.pdf',
      'Rules_About_Women_Part_4_The_Bodies_Themselves.pdf',
      'Rules_About_Women_Part_5_The_Paradox_of_the_Free_Countries.pdf',
      'Rules_About_Women_Part_6_The_Case_for_the_Old_Rules.pdf',
      'Rules_About_Women_Part_7_What_Feminism_Actually_Claims.pdf',
      'Rules_About_Women_Part_8_The_Ledger_of_the_Equality_Project.pdf',
      'Rules_About_Women_Part_9_The_Arithmetic_of_Descendants.pdf',
      'Rules_About_Women_Part_10_What_the_Evidence_Says_Happens_to_a_Woman.pdf',
      'Rules_About_Women_Part_11_The_Half_Nobody_Studied.pdf',
      'Rules_About_Women_Part_12_The_Community_With_No_Edges.pdf',
      'Rules_About_Women_Part_13_When_History_Ran_the_Experiment.pdf',
      'Rules_About_Women_Part_14_What_Would_Actually_Work.pdf',
      'The_Rules_About_Women_Part_15_The_Case_Against_This_Series.pdf',
      'The_Rules_About_Women_Part_16_What_Survived.pdf',
    ],
    title: 'The Rules About Women',
    subject: 'A sixteen-part audit of the argument about women, tested against evidence.',
  },
  {
    slug: 'punjab-history',
    dir: 'C:/Users/rajpa/Documents/books/Punjab history',
    // Part 12 was named to a different pattern from the rest, and typeset on
    // A5 while every other part is A4 — see the page normalising below.
    parts: [
      'Punjab_History_Part_1_The_Land_Itself.pdf',
      'Punjab_History_Part_2_Harappa.pdf',
      'Punjab_History_Part_3_The_Vedic_Age_and_the_Aryan_Question.pdf',
      'Punjab_History_Part_4_Persians_Alexander_Mauryas.pdf',
      'Punjab_History_Part_5_Greeks_Kushans_and_the_Face_of_the_Buddha.pdf',
      'Punjab_History_Part_6_Sultans_and_Sufis.pdf',
      'Punjab_History_Part_7_Guru_Nanak_to_Guru_Arjan.pdf',
      'Punjab_History_Part_8_Guru_Hargobind_to_Guru_Gobind_Singh.pdf',
      'Punjab_History_Part_9_Banda_Singh_Bahadur_to_the_Misls.pdf',
      'Punjab_History_Part_10_Ranjit_Singh_and_the_Fall.pdf',
      'Punjab_History_Part_11_British_Punjab.pdf',
      'Punjab_Part12_Ghadar_to_Independence.pdf',
      'Punjab_History_Part_13_Partition_and_Indian_Punjab.pdf',
      'Punjab_History_Part_14_Pakistani_Punjab_and_the_Diaspora.pdf',
    ],
    title: 'The Complete History of Punjab',
    subject: 'A fourteen-part history of Punjab, from the making of the land itself to the present.',
  },
  {
    slug: 'punjab',
    dir: 'C:/Users/rajpa/Documents/books/The Punjab Files/PDF',
    // Each file carries its part's title, so the names are listed rather than
    // built from a number. scripts/render-punjab-pdfs.mjs writes them.
    parts: [
      'Punjab_Part_01_The_Land_Before_the_Name.pdf',
      'Punjab_Part_02_Porus_to_the_Huns.pdf',
      'Punjab_Part_03_The_Invasion_Highway.pdf',
      'Punjab_Part_04_Gurus_and_the_Khalsa.pdf',
      'Punjab_Part_05_The_Sikh_Empire.pdf',
      'Punjab_Part_06_Loyal_and_Rebel_at_Once.pdf',
      'Punjab_Part_07_The_Cut.pdf',
      'Punjab_Part_08_Redrawing_Punjab.pdf',
      'Punjab_Part_09_Bhindranwale_Full_Autopsy.pdf',
      'Punjab_Part_10_The_Dark_Decade.pdf',
      'Punjab_Part_11_Khalistan_The_Idea_and_the_Network.pdf',
      'Punjab_Part_12_The_Feasibility_Audit.pdf',
      'Punjab_Part_13_The_Reckoning.pdf',
    ],
    title: 'Punjab: The Whole Truth',
    subject: 'Five thousand years of history, one honest look — from the first farmers to the Khalistan question.',
  },
  {
    slug: 'congress-record',
    dir: 'C:/Users/rajpa/Documents/books/Congress Files',
    parts: [
      'The_Congress_Record_Part_1_How_to_Judge_a_Government.pdf',
      'The_Congress_Record_Part_2_The_Inheritance.pdf',
      'The_Congress_Record_Part_3_The_Constitution_Amended.pdf',
      'The_Congress_Record_Part_4_The_Economic_Model.pdf',
      'The_Congress_Record_Part_5_The_Map_of_Who_Got_What.pdf',
      'The_Congress_Record_Part_6_China_Tibet_and_1962.pdf',
      'The_Congress_Record_Part_7_Pakistan_Kashmir_and_the_Wars.pdf',
      'The_Congress_Record_Part_8_Indira_Rising.pdf',
      'The_Congress_Record_Part_9_The_Emergency.pdf',
      'The_Congress_Record_Part_10_Punjab.pdf',
      'The_Congress_Record_Part_11_November_1984.pdf',
      'The_Congress_Record_Part_12_Rajiv_Gandhi.pdf',
      'The_Congress_Record_Part_13_The_Other_India.pdf',
      'The_Congress_Record_Part_14_Reform_and_Demolition.pdf',
      'The_Congress_Record_Part_15_UPA_I.pdf',
      'The_Congress_Record_Part_16_UPA_II.pdf',
      'The_Congress_Record_Part_17_What_Was_Said.pdf',
      'The_Congress_Record_Part_18_The_Comparison.pdf',
      'The_Congress_Record_Part_19_The_Honest_List.pdf',
    ],
    title: 'The Congress Record',
    subject: 'A nineteen-part audit of what Congress governments did with power in India, 1947 to the present.',
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

  const loaded = [];
  for (const part of parts) {
    const path = resolve(book.dir, part.file ?? book.file(part.n));
    // A missing source here would silently publish a book with a part cut out
    // of the middle, so it stops instead.
    if (!existsSync(path)) throw new Error(`${book.slug}: missing ${path}`);
    const source = await PDFDocument.load(await readFile(path), { ignoreEncryption: true });
    loaded.push({ part, source });
  }

  /* A book that changes paper size halfway through reads as a mistake, and one
     part of Punjab's history was typeset on A5 while the rest are A4. The
     majority size wins and the odd part is scaled into it — the proportions
     are the same, so nothing is cropped and the type stays vector-sharp. */
  const sizeOf = (page) => `${Math.round(page.getWidth())}x${Math.round(page.getHeight())}`;
  const tally = new Map();
  for (const { source } of loaded) {
    for (const page of source.getPages()) tally.set(sizeOf(page), (tally.get(sizeOf(page)) ?? 0) + 1);
  }
  const [dominant] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  const [sheetWidth, sheetHeight] = dominant.split('x').map(Number);

  let pages = 0;
  let rescaled = 0;
  for (const { part, source } of loaded) {
    const indices = source.getPageIndices();
    const odd = source.getPages().some((page) => sizeOf(page) !== dominant);

    if (!odd) {
      for (const page of await merged.copyPages(source, indices)) merged.addPage(page);
    } else {
      const embedded = await merged.embedPages(source.getPages());
      for (const stamp of embedded) {
        const scale = Math.min(sheetWidth / stamp.width, sheetHeight / stamp.height);
        const sheet = merged.addPage([sheetWidth, sheetHeight]);
        sheet.drawPage(stamp, {
          xScale: scale,
          yScale: scale,
          x: (sheetWidth - stamp.width * scale) / 2,
          y: (sheetHeight - stamp.height * scale) / 2,
        });
        rescaled += 1;
      }
      console.log(`    ${part.file ?? book.file(part.n)} was not ${dominant}; scaled to fit`);
    }
    pages += indices.length;
  }

  const out = resolve('public', `${book.slug}.pdf`);
  await writeFile(out, await merged.save({ useObjectStreams: true }));
  const { size } = await stat(out);

  console.log(
    `✓ public/${book.slug}.pdf — ${parts.length} parts · ${pages} pages · ${human(size)}`
    + (rescaled ? ` · ${rescaled} pages scaled to ${dominant}` : '')
  );
  console.log(`    set pdfSize: '${human(size)}' in the manifest`);
}
