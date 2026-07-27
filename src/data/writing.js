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
    slug: 'independence',
    kicker: 'A fact-tested history',
    title: 'How India Became Free',
    subtitle: 'And Why It Was Cut in Two',
    standfirst:
      'Every major claim about Independence, Partition and its leaders, tested against the documentary record and explained in plain English.',
    summary:
      'I kept hearing the same arguments again and again — on television, on YouTube, in WhatsApp groups, at family dinners. Someone says Gandhi gave us nothing. Someone says the British left only because they went broke. Someone says one man caused Partition. Someone else says all of that is a lie. Everybody sounds certain. Almost nobody shows the paper. So I decided to go and look for the paper myself.',
    topic: 'India · History · Partition',
    keywords: [
      'Indian independence', 'Partition 1947', 'Gandhi', 'Jinnah', 'Nehru', 'Ambedkar',
      'Bhagat Singh', 'Subhas Chandra Bose', 'two-nation theory', 'Quit India',
      'divide and rule', 'Indian history fact check',
    ],
    published: '2026-07-27',
    displayDate: 'July 2026',
    parts: 12,
    words: 78023,
    minutes: 352,
    status: 'Complete',
    accent: 'ink',
    pdf: 'how-india-became-free.pdf',
    pdfSize: '1.7 MB',
    principlesTitle: '// The method, stated up front',
    principles: [
      { n: '01', t: 'Every claim gets its strongest version', d: 'Stated fairly first, then tested against the evidence, then a clear verdict.' },
      { n: '02', t: 'The record decides, not the side', d: 'True is true even when it damages someone I admire. False is false even when it protects them.' },
      { n: '03', t: '“We do not know” is an answer', d: 'When that is the honest position, I say so instead of pretending otherwise.' },
      { n: '04', t: 'Simple English on purpose', d: 'Hard words are a good way to stop ordinary people checking your claims. Simple words let them.' },
    ],
    load: () => import('./writing/independence.js'),
  },
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
