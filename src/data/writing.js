/* ============================================================
   WRITING — curated long-form research.
   Manifest only. The prose itself lives in src/data/writing/<slug>.js
   and is code-split, so the homepage never pays for it.
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
    published: '2026-07-25',
    displayDate: 'July 2026',
    parts: 12,
    words: 24889,
    minutes: 113,
    status: 'Complete',
    accent: 'harvest',
    pdf: 'kissan-andolan-the-complete-story.pdf',
    pdfSize: '853 KB',
    // The four promises the book opens with — used as the piece's "method" panel.
    promises: [
      { n: '01', t: 'Simple words', d: 'If a class-6 student can’t follow it, I’ve written it wrong. No jargon without a plain explanation.' },
      { n: '02', t: 'Every side gets a fair turn', d: 'Government, farmers, supporters, critics — each one gets its strongest case, in its own voice.' },
      { n: '03', t: 'Fact and opinion kept separate', d: 'What is proven, what is claimed, and who is claiming it — never blurred together.' },
      { n: '04', t: 'No hiding the hard parts', d: 'The uncomfortable truths on every side stay in.' },
    ],
    load: () => import('./writing/kissan-andolan.js'),
  },
];

export const getPiece = (slug) => pieces.find((p) => p.slug === slug);
