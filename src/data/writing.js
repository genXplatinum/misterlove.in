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
    slug: 'reservation-hatao',
    kicker: 'A plain-English, all-sides investigation',
    title: 'Reservation Hatao',
    subtitle: 'Merit, Caste and Justice in India',
    standfirst:
      'The viral campaign, the constitutional system it wants to change, and the hardest arguments about merit, caste, poverty and equal citizenship — investigated one part at a time.',
    summary:
      'Reservation Hatao Andolan appeared online almost overnight and gathered an audience of millions. Supporters called it a long-overdue demand for equal rules and merit. Critics called it an attempt to erase the history and present reality of caste. Before deciding who is right, I wanted to know what the movement actually is, who speaks for it, what it demands, what millions of followers really prove, and which claims survive checking. This twenty-part series starts with that evidence audit, then moves through history, the Constitution, present data, world comparisons, reform choices and the final verdict.',
    topic: 'India · Caste · Reservation · Public Policy',
    keywords: [
      'Reservation Hatao Andolan', 'reservation in India', 'caste reservation',
      'affirmative action India', 'merit and reservation', 'SC ST OBC EWS',
      'creamy layer', 'economic reservation', 'caste discrimination',
      'Indian Constitution reservation', 'reservation debate fact check',
    ],
    published: '2026-07-29',
    displayDate: 'July 2026',
    parts: 20,
    live: 1,
    words: 7651,
    minutes: 35,
    status: 'In progress',
    accent: 'ink',
    pdf: 'reservation-hatao-part-1.pdf',
    pdfSize: '242 KB',
    pdfLabel: 'Part 1 PDF',
    pdfs: [
      { n: 1, file: 'reservation-hatao-part-1.pdf', size: '242 KB', label: 'Part 1 PDF' },
    ],
    principlesTitle: '// The four rules this investigation follows',
    principles: [
      { n: '01', t: 'The movement and the policy are separate', d: 'A campaign can raise a valid grievance without proving its proposal, and a flawed campaign does not automatically make the existing policy correct.' },
      { n: '02', t: 'Every side gets its strongest argument', d: 'Abolition, retention and reform are tested by their best evidence and reasoning, not by their worst viral post.' },
      { n: '03', t: 'History, law and outcomes stay distinct', d: 'Why a policy began, what the Constitution permits, and what the policy achieves today are different questions.' },
      { n: '04', t: 'The final verdict comes last', d: 'Follower counts, slogans and one painful example cannot settle a system affecting hundreds of millions of people.' },
    ],
    outline: [
      { n: 1, label: 'The Movement', title: 'What Is the Reservation Hatao Andolan?', blurb: 'Its rise, public demands, channels, reach, unknowns and provisional institutional verdict.' },
      { n: 2, label: 'The System', title: 'What Is Reservation in India, Exactly?', blurb: 'Categories, vertical and horizontal reservation, open competition, cutoffs, fees, age rules and federal variation.' },
      { n: 3, label: 'History I', title: 'Caste Before British Rule', blurb: 'Varna, jati, region, occupation, mobility, exclusion and what the surviving evidence can actually establish.' },
      { n: 4, label: 'History II', title: 'Colonial Rule, Census and Classification', blurb: 'What the British hardened, changed or merely recorded, and where rival histories overreach.' },
      { n: 5, label: 'Constitution', title: 'Ambedkar, the Constituent Assembly and the Original Design', blurb: 'The competing constitutional arguments, safeguards and purposes in their own words.' },
      { n: 6, label: 'The Courts', title: 'How Reservation Law Was Built', blurb: 'Major amendments and Supreme Court judgments, from early doctrine to present limits and sub-classification.' },
      { n: 7, label: 'Merit', title: 'What Does Merit Actually Mean?', blurb: 'Scores, opportunity, competence, selection error, inherited advantage and the difference between merit and rank.' },
      { n: 8, label: 'Present India', title: 'Who Is Disadvantaged Today?', blurb: 'Caste, income, assets, schooling, geography, networks, discrimination and the limits of available data.' },
      { n: 9, label: 'Education', title: 'Reservation in Schools, Colleges and Competitive Exams', blurb: 'Admissions, cutoffs, completion, performance, stigma, institutional quality and unequal preparation.' },
      { n: 10, label: 'Employment', title: 'Government Jobs, Promotions and Representation', blurb: 'Recruitment, promotion, administrative performance, backlog vacancies and who reaches senior positions.' },
      { n: 11, label: 'Distribution', title: 'Creamy Layer, Elite Capture and Sub-classification', blurb: 'Whether benefits concentrate, who remains excluded within broad categories, and how targeting could improve.' },
      { n: 12, label: 'Economic Need', title: 'Poverty, EWS and the Case for Income-Based Support', blurb: 'What economic criteria solve, what they miss, and whether caste and poverty policies should coexist.' },
      { n: 13, label: 'Social Justice', title: 'Discrimination, Dignity and Representation', blurb: 'The strongest evidence on exclusion and the competing purposes of affirmative action.' },
      { n: 14, label: 'Abolition Case', title: 'The Strongest Case for Ending Caste Reservation', blurb: 'Equal formal rules, common citizenship, policy permanence, individual burdens and political incentives.' },
      { n: 15, label: 'Retention Case', title: 'The Strongest Case for Keeping It', blurb: 'Historical exclusion, unequal opportunity, institutional representation and the risks of premature removal.' },
      { n: 16, label: 'Reform', title: 'The Serious Middle Positions', blurb: 'Review, better targeting, sub-quotas, outreach, anti-discrimination enforcement and opportunity-first reforms.' },
      { n: 17, label: 'The World', title: 'What Other Countries Tried', blurb: 'Affirmative action, class-based assistance, indigenous protections, court reversals and transferable lessons.' },
      { n: 18, label: 'Politics & Media', title: 'Parties, Protests, Algorithms and Hypocrisy', blurb: 'How every camp uses identity, selectively invokes merit and turns policy into a loyalty test.' },
      { n: 19, label: 'Transition', title: 'If India Changes the System, What Happens Next?', blurb: 'Legal routes, timelines, grandfathering, data safeguards, institutional risk and measurable review.' },
      { n: 20, label: 'Final Verdict', title: 'Who Is Right, Who Is Wrong, and What Should India Do?', blurb: 'A claim-by-claim judgment and a practical model that follows from the full historical and empirical record.' },
    ],
    load: () => import('./writing/reservation-hatao.js'),
  },
  {
    slug: 'patriarchy-feminism',
    kicker: 'An evidence-led, all-sides report',
    title: 'Patriarchy & Feminism',
    subtitle: 'And the Arguments Between Them',
    standfirst:
      'A fifteen-part deep dive into the argument about men and women — every position stated in its own words, every factual claim footnoted, and the value questions left to you.',
    summary:
      'I did not set out to write fifteen volumes. I set out to settle an argument I kept losing — not losing on the evidence, but losing in the sense that it never ended, and neither side, including mine, ever seemed to be talking about the same thing as the other. Patriarchy against matriarchy. Whether the pay gap is real. Whether a woman’s clothing is her business alone. Whether men are the oppressed sex now, or were never oppressed at all. What eventually struck me was that most of these fights are not about facts at all. They are three different arguments wearing one costume: a factual dispute, a dispute about what a word means, and a dispute about what ought to matter. Nobody says which one they are having. So the conversation cannot end.',
    topic: 'Gender · Society · India',
    keywords: [
      'patriarchy', 'feminism', 'gender equality', 'sex and gender', 'matriarchy',
      'feminist waves', 'men’s rights', 'MGTOW', 'incels', 'gender pay gap',
      'equality of opportunity', 'gender-equality paradox', 'India gender debate',
      'Brahmanical patriarchy', 'fact check gender claims',
    ],
    published: '2026-07-27',
    displayDate: 'July 2026',
    // The series as planned. `live` is what is actually published — the sitemap,
    // share cards, RSS and pager all follow the data file, never this number.
    parts: 15,
    live: 2,
    words: 61211,
    minutes: 278,
    status: 'In progress',
    accent: 'quartz',
    pdf: 'patriarchy-and-feminism-part-1.pdf',
    pdfSize: '582 KB',
    pdfLabel: 'Part 1 PDF',
    pdfs: [
      { n: 1, file: 'patriarchy-and-feminism-part-1.pdf', size: '582 KB', label: 'Part 1 PDF' },
      { n: 2, file: 'patriarchy-and-feminism-part-2.pdf', size: '565 KB', label: 'Part 2 PDF' },
    ],
    principlesTitle: '// The four commitments the whole series follows',
    principles: [
      { n: '01', t: 'Loaded questions get answered, not dodged', d: 'Where a claim is well supported, this says so. Where it is false as stated, it says that too — with equal force on both sides.' },
      { n: '02', t: 'Value questions are labelled as value questions', d: 'Some disputes no amount of data settles. Those get the strongest version of each position, and no verdict smuggled in.' },
      { n: '03', t: 'Everything factual is footnoted', d: 'Named studies, years, effect sizes, statutes, judgments. Where sources disagree, the disagreement is reported rather than resolved.' },
      { n: '04', t: 'India is in focus, not a footnote', d: 'Indian law, data and debate treated in depth; the US, Europe, the Nordics, East Asia and the Middle East supply the comparison.' },
    ],
    /* The author's own printed index, from the "fifteen parts" table in Part 1.
       Published parts come from the data file; everything else shows here as
       announced-but-unwritten, so the shape of the series is visible from day
       one and a part landing later changes nothing but the data. */
    outline: [
      { n: 1, label: 'Definitions & Method', title: 'The Ground Rules', blurb: 'Definitions, the map of every position, and the reasoning failures.' },
      { n: 2, label: 'Origins & Change', title: 'How Patriarchal Institutions Emerged and Changed', blurb: 'Why patriarchal institutions became widespread, what sustained them, and why their forms varied, weakened, or changed.' },
      { n: 3, label: 'Religion I', title: 'Dharmic Traditions', blurb: 'Hindu, Buddhist, Jain and Sikh texts, practice, caste, and reform.' },
      { n: 4, label: 'Religion II', title: 'Christianity', blurb: 'Scripture, church history, the modern complementarian–egalitarian split.' },
      { n: 5, label: 'Religion III', title: 'Islam', blurb: 'Qur’an, hadith, the schools of law, and why outcomes differ so wildly by country.' },
      { n: 6, label: 'Religion IV', title: 'Judaism, East Asia, Indigenous & Colonialism', blurb: 'Halakhah, Confucian norms, pre-colonial gender, and what colonial rule did.' },
      { n: 7, label: 'Bodies & Minds', title: 'The Science', blurb: 'How different are men and women really — bodies, minds, interests.' },
      { n: 8, label: 'India I', title: 'India I: Law', blurb: 'Personal law, the Constitution, dowry law, marital rape, the courts.' },
      { n: 9, label: 'India II', title: 'India II: Society', blurb: 'Sex ratio, work, caste, violence, and the data.' },
      { n: 10, label: 'Pay & Work', title: 'Work and Money', blurb: 'The pay gap, the child penalty, hours, and who does what.' },
      { n: 11, label: 'Dress & Consent', title: 'Bodies and Consent', blurb: 'Dress, sexual attention, pornography, sex work, false accusation.' },
      { n: 12, label: 'The Male Ledger', title: 'Where Men Are Losing', blurb: 'Education, suicide, custody, conscription, sentencing, loneliness.' },
      { n: 13, label: 'Quotas & Privilege', title: 'Quotas and the Global Ledger', blurb: 'Reservation, boards, privilege claims — and where women remain unequal.' },
      { n: 14, label: 'The Specialists', title: 'The Expert Map', blurb: 'What professionals in each field actually say, and where they split.' },
      { n: 15, label: 'The Verdict', title: 'The Internet War & Verdict', blurb: 'The online gender conflict, direct answers, and the balance sheet.' },
    ],
    load: () => import('./writing/patriarchy-feminism.js'),
  },
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
    translations: {
      hi: {
        language: 'hi',
        locale: 'hi_IN',
        ogSlug: 'kissan-andolan-hi',
        published: '2026-07-28',
        kicker: 'सरल हिंदी में गहरी पड़ताल',
        title: 'किसान आंदोलन',
        subtitle: 'पूरी कहानी',
        standfirst:
          'भारत के किसान आंदोलन की पूरी कहानी — 2020 से 2024 और उसके बाद तक। महीनों की खोज के बाद हर पक्ष को सबसे सरल और साफ हिंदी में समझाया गया है।',
        summary:
          'चार साल तक किसान आंदोलन हमारी खबरों, हमारे फोन और खाने की मेज पर होने वाली बहसों में छाया रहा। हर किसी की राय मजबूत थी, लेकिन पूरी कहानी बहुत कम लोगों को मालूम थी। इसलिए मैंने महीनों लगाकर असली कानून, सरकारी दस्तावेज़, अदालतों के आदेश, कृषि-अर्थव्यवस्था पर हुए अध्ययन और हर नज़रिये की रिपोर्टिंग — बाएँ, दाएँ और बीच की भी — पढ़ी। यह लेख उसी खोज का नतीजा है।',
        topic: 'भारत · खेती · नीति',
        keywords: [
          'किसान आंदोलन', 'भारत किसान प्रदर्शन', 'कृषि कानून 2020',
          'न्यूनतम समर्थन मूल्य', 'MSP', 'पंजाब के किसान', 'दिल्ली चलो',
        ],
        displayDate: 'जुलाई 2026',
        words: 31209,
        minutes: 174,
        status: 'पूर्ण',
        pdfLabel: 'अंग्रेज़ी PDF',
        principlesTitle: '// इस पुस्तक के चार वादे',
        principles: [
          { n: '01', t: 'आसान भाषा', d: 'अगर कक्षा 6 का विद्यार्थी इसे न समझ सके, तो गलती मेरे लिखने में है। किसी कठिन शब्द को सरल अर्थ बताए बिना नहीं छोड़ा गया है।' },
          { n: '02', t: 'हर पक्ष को पूरी और निष्पक्ष जगह', d: 'सरकार, किसान, समर्थक और आलोचक—हर पक्ष की सबसे मजबूत दलील उसी की भाषा में रखी गई है।' },
          { n: '03', t: 'तथ्य और राय अलग-अलग', d: 'क्या साबित है, क्या दावा है और दावा कौन कर रहा है—इन तीनों को कभी एक-दूसरे में नहीं मिलाया गया है।' },
          { n: '04', t: 'कठिन बातों को नहीं छिपाना', d: 'किसी भी पक्ष के लिए असहज सच इस कहानी से बाहर नहीं रखे गए हैं।' },
        ],
        load: () => import('./writing/kissan-andolan-hi.js'),
      },
    },
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

/**
 * A language edition keeps the original piece's identity and publication
 * details, but replaces every reader-facing field and the prose loader.
 * Returning undefined for an unavailable edition lets the router redirect
 * cleanly instead of showing a half-translated page.
 */
export const getPieceForLanguage = (slug, language = 'en') => {
  const piece = getPiece(slug);
  if (!piece) return undefined;
  if (language === 'en') return { ...piece, language: 'en', locale: 'en_IN' };

  const translation = piece.translations?.[language];
  return translation ? { ...piece, ...translation } : undefined;
};

/** Canonical client-side path for either a topic or one numbered part. */
export const writingPathOf = (piece, part) => {
  const prefix = piece?.language === 'hi' ? '/hi' : '';
  const base = `${prefix}/writing/${piece.slug}`;
  return part ? `${base}/part-${part}` : base;
};

/**
 * Parts actually published. A finished piece omits `live`, so this is just its
 * part count; a serialised one declares how far it has got. Everything that
 * makes a promise to a reader or a crawler — totals, the sitemap, RSS, share
 * cards — counts these, never the planned total.
 */
export const livePartsOf = (p) => p.live ?? p.parts;

/** Whether a piece is still being written. */
export const isInProgress = (p) => livePartsOf(p) < p.parts;

/** Every downloadable PDF attached to a piece, including legacy single PDFs. */
export const pdfsOf = (piece) => (
  piece?.pdfs
  ?? (piece?.pdf
    ? [{
        n: null,
        file: piece.pdf,
        size: piece.pdfSize,
        label: piece.pdfLabel ?? 'PDF',
      }]
    : [])
);

/** The PDF that belongs with one part, falling back to a piece-level book. */
export const pdfForPart = (piece, part) => {
  if (part?.pdf) {
    return {
      n: part.n,
      file: part.pdf,
      size: part.pdfSize,
      label: part.pdfLabel ?? `Part ${part.n} PDF`,
    };
  }
  return pdfsOf(piece).find((pdf) => pdf.n === part?.n) ?? pdfsOf(piece)[0];
};

/** Per-part publication dates let new volumes retain their real release date. */
export const publishedOf = (piece, part) => part?.published ?? piece?.published;

/**
 * The full contents of a piece: its published parts, plus any announced-but-
 * unwritten ones from the manifest outline. Given the loaded data file, the
 * written part always wins — the outline only fills the gap after it.
 */
export const contentsOf = (piece, parts) => {
  const written = new Map((parts ?? []).map((p) => [p.n, p]));
  const planned = piece.outline ?? [];
  const total = Math.max(piece.parts, written.size, ...planned.map((o) => o.n), 0);

  return Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    const part = written.get(n);
    if (part) return { ...part, n, live: true };
    const o = planned.find((x) => x.n === n);
    return { n, live: false, label: o?.label ?? '', title: o?.title ?? `Part ${n}`, lead: o?.blurb ?? '' };
  });
};

/** Totals for the index header — published work only. */
export const writingTotals = {
  pieces: pieces.length,
  parts: pieces.reduce((a, p) => a + livePartsOf(p), 0),
  words: pieces.reduce((a, p) => a + p.words, 0),
};
