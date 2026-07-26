/* ============================================================
   WRITING — curated long-form research.
   Manifest only. The prose itself lives in src/data/writing/<slug>.js
   and is code-split, so nothing but the reader ever pays for it.

   Order here is the order shown on /writing — newest first.
   ============================================================ */

export const writingMeta = {
  index: '07',
  label: 'Writing',
  title: 'Things I research until I actually understand them.',
  lead:
    'Long-form work on subjects I refused to have a lazy opinion about. Researched properly, written plainly, every side given its strongest case.',
};

export const pieces = [
  {
    slug: 'kissan-andolan',
    kicker: 'A plain-English deep dive',
    title: 'Kissan Andolan',
    subtitle: 'The Complete Story',
    standfirst:
      'India’s farmers’ movement, 2020–2024 and beyond — every side of the story, told in the simplest words, after months of research.',
    summary:
      'For four years the farmers’ protest filled our news, our phones and our arguments at the dinner table. Everyone had a strong opinion; almost nobody had the full story. So I spent months reading the actual laws, government papers, court orders, farm-economics studies and reporting from every side — left, right and centre — and wrote down what I found.',
    topic: 'India · Agriculture · Policy',
    keywords: ['kisan andolan', 'farmers protest India', 'farm laws 2020', 'MSP', 'Punjab farmers', 'Delhi Chalo'],
    published: '2026-07-25',
    displayDate: 'July 2026',
    parts: 12,
    words: 24889,
    minutes: 113,
    status: 'Complete',
    // Drives the cover plate palette — see .cover--* in Writing.css
    accent: 'harvest',
    pdf: 'kissan-andolan-the-complete-story.pdf',
    pdfSize: '853 KB',
    principlesTitle: '// The four promises this book opens with',
    principles: [
      { n: '01', t: 'Simple words', d: 'If a class-6 student can’t follow it, I’ve written it wrong. No jargon without a plain explanation.' },
      { n: '02', t: 'Every side gets a fair turn', d: 'Government, farmers, supporters, critics — each one gets its strongest case, in its own voice.' },
      { n: '03', t: 'Fact and opinion kept separate', d: 'What is proven, what is claimed, and who is claiming it — never blurred together.' },
      { n: '04', t: 'No hiding the hard parts', d: 'The uncomfortable truths on every side stay in.' },
    ],
    load: () => import('./writing/kissan-andolan.js'),
  },
  {
    slug: 'forgotten-gods',
    kicker: 'A grounded, plain-language history',
    title: 'The Forgotten Gods',
    subtitle: 'A Four-Part History',
    standfirst:
      'A grounded, plain-language look at what was lost when the old religions of forest, river and storm were replaced by a religion brought in from outside.',
    summary:
      'One day I was thinking about religion, and noticed something. Most old cultures around the world used to worship nature — trees, rivers, mountains, the sun, the rain. Then, somewhere along the way, most of those religions died, replaced by the big organised ones. I wanted to know what really happened, so I started reading. What I found was both more brutal and more interesting than the simple story I had in my head. The truth does not need any fake stories or made-up conspiracies. The real history is heavy enough on its own.',
    topic: 'History · Religion · Civilisation',
    keywords: ['forgotten gods', 'pagan Europe', 'history of Christianity', 'forced conversion', 'colonial India', 'Indus Valley', 'history of religion'],
    published: '2026-05-19',
    displayDate: 'May 2026',
    parts: 4,
    words: 49022,
    minutes: 222,
    status: 'Complete',
    accent: 'ember',
    pdf: 'the-forgotten-gods.pdf',
    pdfSize: '996 KB',
    principlesTitle: '// How this one is written',
    principles: [
      { n: '01', t: 'Simple language on purpose', d: 'Big words are often used to hide weak arguments. I do not want to hide anything.' },
      { n: '02', t: 'Every claim can be checked', d: 'Historians who spent their lives on this, and writings from people who lived through it.' },
      { n: '03', t: 'No myths, no conspiracies', d: 'The real history is heavy enough on its own. It does not need help.' },
      { n: '04', t: 'Explained from zero', d: 'Wherever an unfamiliar word appears, it is explained right there on the spot.' },
    ],
    load: () => import('./writing/forgotten-gods.js'),
  },
];

export const getPiece = (slug) => pieces.find((p) => p.slug === slug);

/** Totals for the index header. */
export const writingTotals = {
  pieces: pieces.length,
  parts: pieces.reduce((a, p) => a + p.parts, 0),
  words: pieces.reduce((a, p) => a + p.words, 0),
};
