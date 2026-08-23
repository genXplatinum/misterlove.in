/* ============================================================
   WRITING — curated long-form research.
   Manifest only. The prose itself lives in src/data/writing/<slug>.js
   and is code-split, so nothing but the reader ever pays for it.

   Order here is the order shown on /writing — newest first.
   ============================================================ */

export const writingMeta = {
  index: 'Research',
  label: 'Writing',
  title: 'Questions I followed further.',
  lead:
    'Long-form work on difficult public questions. The evidence is checked, the competing arguments are stated fairly, and the conclusions are written in plain language.',
};

export const pieces = [
  {
    slug: 'sapiens-reading',
    kicker: 'An eleven-part reading',
    title: 'Sapiens',
    subtitle: 'My Own Reading of Sapiens',
    standfirst:
      'Everybody quotes Sapiens and almost nobody argues with it. So I read all twenty chapters myself, slowly, with a pen in my hand, and wrote down what Harari actually claims — chapter by chapter, in the plainest English I could manage, flagging exactly where the evidence gets thin.',
    summary:
      'I picked up Sapiens for the same reason most people do — it sits on shelves everywhere and gets quoted constantly by people who have not read it, and the bits that reach you second-hand (money is a fiction, farming was a mistake) sound either brilliant or annoying depending on who is repeating them. So I read the whole thing, slowly, with a pen, then read the arguments against it, which took longer than the book did. It is an easier book than Darwin’s, and that turns out to be the problem: Harari is a genuinely wonderful writer, and beautiful sentences make weak evidence feel strong. So this reading does two jobs at once — explaining what he actually says, simply and completely, and flagging, every time, where the ground under a claim is softer than the sentence sounds. Direct quotation is kept short, since Sapiens is a living book with a living author and a publisher rather than an 1859 text that belongs to everybody; where a passage matters, it goes in a box labelled his point, in my words, and the argument is given rather than the sentence. Eleven parts walk the whole book: the animal we were for two million years and the other kinds of human who died out around us, the Cognitive Revolution and the fiction that lets strangers cooperate, what life was actually like before farming and what happened to every large animal we met, the agricultural revolution as history’s biggest fraud, the imagined orders that hold societies of millions together, the ladders every society builds and calls natural, money and empire as two of the three glues, religion as the third, the scientific revolution’s founding admission of ignorance, capitalism and the industrial revolution, and the ending — happiness, the family’s dissolution, and the animal that is starting to redesign itself. Every part closes with a glossary and a running timeline, and every part says, in its own box, where I think Harari is wrong.',
    topic: 'Anthropology · History · Close Reading',
    keywords: [
      'Sapiens', 'Yuval Noah Harari', 'Sapiens explained', 'Sapiens summary',
      'cognitive revolution', 'agricultural revolution', 'imagined reality',
      'Homo sapiens', 'Neanderthals', 'history of money', 'scientific revolution',
      'history of capitalism', 'Sapiens book review', 'Sapiens chapter summary',
    ],
    published: '2026-08-23',
    displayDate: 'August 2026',
    parts: 11,
    live: 11,
    words: 56504,
    minutes: 258,
    status: 'Complete',
    accent: 'harvest',
    pdf: 'sapiens-reading-part-1.pdf',
    pdfSize: '0.2 MB',
    pdfLabel: 'Part 1 PDF',
    pdfs: [
      { n: 1, file: 'sapiens-reading-part-1.pdf', size: '0.2 MB', label: 'Part 1 PDF' },
      { n: 2, file: 'sapiens-reading-part-2.pdf', size: '0.2 MB', label: 'Part 2 PDF' },
      { n: 3, file: 'sapiens-reading-part-3.pdf', size: '0.2 MB', label: 'Part 3 PDF' },
      { n: 4, file: 'sapiens-reading-part-4.pdf', size: '0.2 MB', label: 'Part 4 PDF' },
      { n: 5, file: 'sapiens-reading-part-5.pdf', size: '0.2 MB', label: 'Part 5 PDF' },
      { n: 6, file: 'sapiens-reading-part-6.pdf', size: '0.2 MB', label: 'Part 6 PDF' },
      { n: 7, file: 'sapiens-reading-part-7.pdf', size: '0.2 MB', label: 'Part 7 PDF' },
      { n: 8, file: 'sapiens-reading-part-8.pdf', size: '0.2 MB', label: 'Part 8 PDF' },
      { n: 9, file: 'sapiens-reading-part-9.pdf', size: '0.2 MB', label: 'Part 9 PDF' },
      { n: 10, file: 'sapiens-reading-part-10.pdf', size: '0.2 MB', label: 'Part 10 PDF' },
      { n: 11, file: 'sapiens-reading-part-11.pdf', size: '0.2 MB', label: 'Part 11 PDF' },
    ],
    principlesTitle: 'The rules this reading runs on',
    principles: [
      { n: '01', t: 'No word bigger than it needs to be', d: 'Every technical term is explained the moment it turns up — not in a glossary at the back, right there on the spot — and every part closes with a glossary of its own.' },
      { n: '02', t: 'Quotation is kept short, on purpose', d: 'Sapiens is a living book with a living author and a publisher, not an 1859 text that belongs to everybody. Direct quotation is rare; where a passage matters, it goes in a box labelled his point, in my words, and the argument is given rather than the sentence.' },
      { n: '03', t: 'Where he is guessing, it says so', d: 'When Harari presents a contested idea in the same confident voice as a settled one, the box marked the thing nobody questions is where that gets separated out.' },
      { n: '04', t: 'My opinion is labelled as mine', d: 'What Harari argues and what I think of it are two different things, and every part ends with a section on where I think he is wrong.' },
    ],
    /* The author's own "map: all eleven parts" table, printed on the cover
       of Part One. */
    outline: [
      { n: 1, label: 'Origins', title: 'The Animal Nobody Would Have Bet On', blurb: 'Who Harari is, what the whole book stands on, and Chapter 1, where we are still a nervous animal eating other predators’ leftovers.' },
      { n: 2, label: 'Cognition', title: 'The Tree of Knowledge', blurb: 'Chapter 2: The Tree of Knowledge. The heart of the book. It gets a whole part to itself, the way Darwin’s Chapter 4 did.' },
      { n: 3, label: 'Foragers', title: 'The World We Were Built For, and What We Did To It', blurb: 'Chapter 3: what life was like before farming · Chapter 4: what happened to every large animal on Earth the moment we arrived.' },
      { n: 4, label: 'Farming', title: 'History’s Biggest Fraud', blurb: 'Chapter 5: History’s Biggest Fraud. His most famous argument — that farming made life worse. Its own part.' },
      { n: 5, label: 'Order & Writing', title: 'The Story That Holds, and the Receipt That Started History', blurb: 'Chapter 6: how millions of strangers were kept in line · Chapter 7: why writing had to be invented, and why the first writing was a tax record.' },
      { n: 6, label: 'Hierarchy', title: 'The Ladder and the Arrow', blurb: 'Chapter 8: why every large society ends up with someone on top · Chapter 9: whether history is going anywhere.' },
      { n: 7, label: 'Money & Empire', title: 'The Two Glues — Money and Empire', blurb: 'Chapter 10: money · Chapter 11: empire. Two of the three glues that stuck the world together.' },
      { n: 8, label: 'Religion', title: 'The Third Glue, and Why the Winners Won', blurb: 'Chapter 12: religion, the third glue · Chapter 13: why the ideas that won did not win because they were good.' },
      { n: 9, label: 'Science', title: 'The Blank Space on the Map', blurb: 'Chapter 14: the Scientific Revolution, which began with an admission · Chapter 15: science and conquest, which grew up together.' },
      { n: 10, label: 'Capitalism', title: 'The Pie That Grows, and the Fire That Turns the Wheel', blurb: 'Chapter 16: capitalism · Chapter 17: energy, industry, and what we did to farm animals.' },
      { n: 11, label: 'The Future', title: 'The Animal That Became a God', blurb: 'Chapters 18–20: family, happiness, and the end of our species · plus what I actually think, now that I have finished it.' },
    ],
    load: () => import('./writing/sapiens-reading.js'),
  },
  {
    slug: 'origin-of-species',
    kicker: 'An eight-part reading',
    title: 'On the Origin of Species',
    subtitle: 'My Own Reading of Darwin',
    standfirst:
      'Everybody quotes Darwin and almost nobody has read him. So I read the 1859 first edition myself, slowly, with a pen in my hand, and wrote down what he actually says — chapter by chapter, in the plainest English I could manage.',
    summary:
      'I picked up On the Origin of Species because everybody talks about it and almost nobody has opened it. So I opened it — the first edition, 1859, fourteen chapters, the version that went through the world’s window like a brick — and read the whole thing with a pen in my hand. It was harder than I expected, and not because the idea is hard. The idea is embarrassingly simple. Darwin is the difficulty. He writes like a man who is terrified of being shouted at, he apologises to the reader roughly every four pages, and he assumed I already knew what a Compositae was, which I did not. Somewhere in the pigeon chapter I nearly quit. Then it clicked, and I couldn’t put it down. This is my reading of the book, written the way I would explain it to a friend over chai. Every time Darwin uses a technical term I stop and explain it before moving on, and every part closes with a glossary of its own. When a chapter is boring I say so, and say why he bothered with it. When Darwin is wrong — about inheritance, about what causes variation, about use and disuse — I say that too, instead of treating him like a saint. Where I am giving you my own opinion rather than his, I make it obvious. Eight parts walk the whole book: the farmyard and the pigeons, the quiet war in the wild, the engine itself, the chapter where Darwin cross-examines his own theory, the two cases he could not explain, the broken record in the rocks, the geography, and the ending. All eight are here.',
    topic: 'Science · Evolution · Close Reading',
    keywords: [
      'Darwin', 'On the Origin of Species', 'Origin of Species explained',
      'natural selection', 'evolution in plain English', '1859 first edition',
      'variation under domestication', 'struggle for existence',
      'divergence of character', 'tree of life', 'sexual selection',
      'Alfred Russel Wallace', 'Malthus', 'geological record', 'Gregor Mendel',
    ],
    published: '2026-08-21',
    displayDate: 'August 2026',
    // The series as the author set it out on his own map, printed in Part One.
    // `live` is what is actually published — the sitemap, share cards, RSS and
    // pager all follow the data file, never this number.
    parts: 8,
    live: 8,
    words: 46798,
    minutes: 211,
    status: 'Complete',
    accent: 'specimen',
    /* This piece brings its own reading room — The Specimen Sheet, in
       src/pages/Rooms.css — rather than the archive's library colours. Its
       palette is lifted out of the author's own print edition. */
    room: 'origin',
    pdf: 'origin-of-species-part-1.pdf',
    pdfSize: '5.0 MB',
    pdfLabel: 'Part 1 PDF',
    pdfs: [
      { n: 1, file: 'origin-of-species-part-1.pdf', size: '5.0 MB', label: 'Part 1 PDF' },
      { n: 2, file: 'origin-of-species-part-2.pdf', size: '4.8 MB', label: 'Part 2 PDF' },
      { n: 3, file: 'origin-of-species-part-3.pdf', size: '4.6 MB', label: 'Part 3 PDF' },
      { n: 4, file: 'origin-of-species-part-4.pdf', size: '4.5 MB', label: 'Part 4 PDF' },
      { n: 5, file: 'origin-of-species-part-5.pdf', size: '4.7 MB', label: 'Part 5 PDF' },
      { n: 6, file: 'origin-of-species-part-6.pdf', size: '4.3 MB', label: 'Part 6 PDF' },
      { n: 7, file: 'origin-of-species-part-7.pdf', size: '4.3 MB', label: 'Part 7 PDF' },
      { n: 8, file: 'origin-of-species-part-8.pdf', size: '0.6 MB', label: 'Part 8 PDF' },
    ],
    principlesTitle: 'The rules this reading runs on',
    principles: [
      { n: '01', t: 'No word bigger than it needs to be', d: 'Every time Darwin uses a technical term, the reading stops and explains it before moving on, and every part closes with a glossary of the words that will come back.' },
      { n: '02', t: 'The first edition, and no other', d: 'Darwin rewrote this book six times between 1859 and 1872, adding more “well, possibly, perhaps” each round to calm his critics. This reading follows the 1859 original. Where a later edition adds something that genuinely matters, it is flagged in a box.' },
      { n: '03', t: 'Where he is wrong, it says so', d: 'Darwin had no idea how inheritance works, thought comfortable conditions cause variation, and believed in use and disuse. All three are wrong. Being honest about that makes the good parts more believable, not less.' },
      { n: '04', t: 'My opinion is labelled as mine', d: 'What Darwin said and what I think of it are two different things. The boxes marked MY TAKE are where the second one lives; everything else is the book.' },
    ],
    load: () => import('./writing/origin-of-species.js'),
  },
  {
    slug: 'architecture-of-money',
    kicker: 'A nine-part study',
    title: 'The Architecture of Money',
    subtitle: 'Money, Power and the Dollar',
    standfirst:
      'How money was invented, how one country came to own the world’s accounting system, why every attempt to replace it has failed — and where India actually stands.',
    summary:
      'This began at an exchange rate screen. One dollar cost about ninety-five rupees, and the author could not answer a simple question about it: who decided that? Nobody in Washington rings a bell each morning and nobody in Mumbai signs a form, and yet the number decides whether an Indian family can afford a laptop and whether the country’s oil bill goes up by nine billion dollars this year. Pulling at that thread produced forty-four chapters, running from the clay tablets of Mesopotamia to where the rupee stands in 2026. What money actually is, and why the barter story in every textbook never happened. How the world organised itself around one currency at Bretton Woods, and what changed on 15 August 1971. The seven pillars that hold the dollar up, what America earns from them, and the bill it pays for them. Why sterling, the yen, the euro and the yuan each failed to take its place. How an exchange rate is really set, why the same haircut costs two dollars in Patna and forty in Boston, who owes whom, and what India can and cannot do about any of it. One rule runs through every page: if a sentence cannot be said in ordinary words it does not belong, so each technical term is defined where it first appears and again in a glossary of eighty. It is not a collapse story and it is not a nothing-changes story. The dollar is eroding slowly at the edges and unchallenged at the centre, and the report shows exactly which edges and which centre, with the numbers attached.',
    topic: 'Money · Geopolitics · India',
    keywords: [
      'dollar dominance', 'reserve currency', 'history of money', 'Bretton Woods',
      'Nixon Shock 1971', 'petrodollar', 'eurodollar', 'de-dollarisation',
      'rupee internationalisation', 'exchange rates explained', 'purchasing power parity',
      'IMF', 'SWIFT sanctions', 'BRICS currency', 'India economy 2026',
    ],
    published: '2026-08-08',
    displayDate: 'August 2026',
    parts: 9,
    words: 38997,
    minutes: 177,
    status: 'Complete',
    accent: 'harvest',
    // Written as one report rather than a serial, so it ships as one download.
    pdf: 'the-architecture-of-money.pdf',
    pdfSize: '1.5 MB',
    pdfLabel: 'The complete report',
    principlesTitle: 'The rules this report runs on',
    principles: [
      { n: '01', t: 'Ordinary words, or it does not go in', d: 'Every technical term is defined the moment it first appears, and again in a glossary of eighty at the back. There is no equation here that a school student cannot follow.' },
      { n: '02', t: 'Neither a collapse story nor a nothing-changes story', d: 'The internet is full of confident people announcing that the dollar dies next year, and equally confident people announcing that nothing will ever change. Both are selling something.' },
      { n: '03', t: 'The uncomfortable part is written down', d: 'Every major section carries a box holding the fact that is inconvenient for the argument just made. The author calls them the most important boxes in the report.' },
      { n: '04', t: 'India gets no flattery', d: 'The fastest-growing large economy on earth also runs a persistent trade deficit, a currency that is not fully convertible, and a bond market foreigners can barely access. A study that reports only the first half is a press release, not research.' },
    ],
    load: () => import('./writing/architecture-of-money.js'),
  },
  {
    slug: 'congress-record',
    kicker: 'A nineteen-part audit',
    title: 'The Congress Record',
    subtitle: 'What a Party Did With Seventy Years of Power',
    standfirst:
      'An audit of what Congress governments did with power in India, from 1947 to the present day. Every charge carries a grade, every source is named, and the accusations that were invented are marked as invented.',
    summary:
      'This book says on its own first page that it argues one side. It selects like a prosecutor and checks like an auditor, and it holds that the distinction matters: choosing which government to examine is a legitimate editorial act, while inventing evidence against it is not — and is also self-defeating, because a single fabricated charge rescues the accused from twenty real ones. So every claim here carries a grade that states what kind of thing it is: court-found, audited, contested, alleged. Part One sets the rules before a single accusation is made — what counts as a blunder rather than a bad outcome, why "they should have done otherwise" is usually not an argument, where the evidence comes from, how numbers are made to lie, and what would prove the author wrong. Its sixth chapter is given over entirely to the charges against Congress that are false. The series then works forward through the record: the inheritance of 1947, the amending of the constitution, the licence-permit economy and the map of who it rewarded, China and 1962, the wars and Kashmir, the Emergency, Punjab, November 1984, and on to the two UPA governments and a like-for-like comparison with what followed. It ends with an honest accounting of what held, what did not, and what could not be proved either way.',
    topic: 'India · Politics · Accountability',
    keywords: [
      'Congress record', 'Indian National Congress', 'Indian political history',
      'Emergency 1975', 'government accountability', 'Nehru', 'Indira Gandhi',
      'Rajiv Gandhi', 'UPA', '1984 anti-Sikh violence', 'Operation Blue Star',
      'licence raj', 'freight equalisation', 'India China 1962', 'evidence grading',
    ],
    published: '2026-08-07',
    displayDate: 'August 2026',
    // The series as planned. `live` is what is actually published — the sitemap,
    // share cards, RSS and pager all follow the data file, never this number.
    parts: 19,
    live: 19,
    words: 350305,
    minutes: 1593,
    status: 'Complete',
    accent: 'blight',
    // The series is complete, so it ships as one book rather than nineteen
    // downloads — bound by scripts/make-book-pdfs.mjs. Every download button
    // points here.
    pdf: 'congress-record.pdf',
    pdfSize: '4.8 MB',
    pdfLabel: 'The complete book',
    principlesTitle: 'The rules this audit runs on',
    principles: [
      { n: '01', t: 'Selects like a prosecutor, checks like an auditor', d: 'Choosing to examine one party’s time in power is a legitimate editorial choice, and the book says so on its first page. Inventing evidence is not legitimate — and it is also stupid, because one made-up charge rescues the accused from the true ones.' },
      { n: '02', t: 'Every claim carries a grade', d: 'Court-found, audited, contested, alleged. The grade states what kind of thing the claim is, so a finding of fact and an accusation are never allowed to wear the same clothes.' },
      { n: '03', t: 'The fabrications are named as fabrications', d: 'An entire chapter of Part One is given to the accusations against Congress that are false. A charge that cannot survive its own sourcing is struck out here before anyone else has to do it.' },
      { n: '04', t: 'What would prove me wrong is written down', d: 'Each part states the evidence that would overturn its own conclusion, and closes with an honest list of what is still not known.' },
    ],
    /* The author's own printed index, from the "ground this series covers"
       table in Part 1. Published parts come from the data file; everything
       else shows here as announced-but-unwritten, so the shape of the series
       is visible from day one and a part landing later changes nothing but
       the data. */
    outline: [
      { n: 1, label: 'The Method', title: 'How to Judge a Government', blurb: 'What counts as a blunder, where the evidence comes from, how charges are graded — and which accusations against Congress are fabricated.' },
      { n: 2, label: 'The Inheritance', title: 'The Inheritance, 1947–1950', blurb: 'Independence and partition. The princely states absorbed, Kashmir’s accession and the reference to the United Nations, and the writing of the constitution.' },
      { n: 3, label: 'The Constitution', title: 'The Constitution Amended, 1950–1959', blurb: 'The First Amendment restricts speech. Land reform begins. The first general elections. The elected Kerala government is dismissed by the centre.' },
      { n: 4, label: 'The Economy', title: 'The Economic Model, 1950–1991', blurb: 'The planning and licensing system in operation, what it was meant to do, and what it actually did.' },
      { n: 5, label: 'Who Got What', title: 'The Map of Who Got What', blurb: 'Freight equalisation from 1952 to 1993, and the geography of who the model rewarded and who paid for it.' },
      { n: 6, label: 'China and 1962', title: 'China, Tibet and 1962', blurb: 'The agreement on Tibet, how the border dispute developed, and the war that followed.' },
      { n: 7, label: 'Pakistan and Kashmir', title: 'The Wars and Kashmir, 1947–1989', blurb: 'Wars with Pakistan in 1947–48, 1965 and 1971. The Simla agreement. The governing of Kashmir up to the insurgency.' },
      { n: 8, label: 'Indira', title: 'The Rise of Indira Gandhi, 1966–1975', blurb: 'Her rise, the party split, the nationalisation of the banks, and the confrontation with the judiciary.' },
      { n: 9, label: 'The Emergency', title: 'The Emergency, 1975–1977', blurb: 'Censorship, detention without trial, the forced sterilisation programme, and the postponed election.' },
      { n: 10, label: 'Punjab', title: 'Punjab, 1978–1993', blurb: 'The rise of militancy, Operation Blue Star in 1984, and the decade that followed.' },
      { n: 11, label: 'November 1984', title: 'The Killing of Sikhs, November 1984', blurb: 'Delhi and elsewhere after the assassination, and the four decades of impunity that followed.' },
      { n: 12, label: 'Rajiv', title: 'Rajiv Gandhi, 1984–1989', blurb: 'Shah Bano. The Babri locks. Bofors. Sri Lanka. The 1987 Kashmir election.' },
      { n: 13, label: 'The Margins', title: 'The North East, the Tribal Belt and the Naxal Corridor', blurb: 'From 1958 to the present — the geography these accounts usually skip.' },
      { n: 14, label: '1991–1996', title: 'Liberalisation and Babri', blurb: 'Economic liberalisation and the demolition of the Babri Masjid, under one government.' },
      { n: 15, label: 'UPA I', title: 'The First UPA Government, 2004–2009', blurb: 'The nuclear deal, the terror wave, and Mumbai in 2008.' },
      { n: 16, label: 'UPA II', title: 'The Second UPA Government, 2009–2014', blurb: 'Spectrum, coal, the games — and what the courts later actually found.' },
      { n: 17, label: 'What Was Said', title: 'The Record of Words', blurb: 'The statements themselves, with dates and full wording rather than the version that circulates.' },
      { n: 18, label: 'The Comparison', title: '2014–2026, on the Same Ruler', blurb: 'The comparison, measured the same way in both directions.' },
      { n: 19, label: 'The Verdict', title: 'The Final Accounting', blurb: 'What held, what did not, and everything I could not prove.' },
    ],
    load: () => import('./writing/congress-record.js'),
  },
  {
    slug: 'rules-about-women',
    kicker: 'A 16-part audit',
    title: 'The Rules About Women',
    subtitle: 'Every claim on both sides, held against the evidence',
    standfirst:
      'A photograph from a protest, and a rumour that discredited the woman in it. Underneath: why does a woman’s sexual history work as a universal solvent on her public standing, and does the old rulebook that makes that possible actually protect anyone? Sixteen parts test every claim on both sides against the record.',
    summary:
      'This book takes a question people are already arguing about and refuses to answer it the way either side wants. The traditionalist says the rules exist for a reason, change them and it will be a disaster — name it, measure it. The reformer says the rules are patriarchy, remove them and the world gets better — where has that been tried, and what happened after. The book grants each side its strongest case, and then goes to the record. Every effect size is stated. Every hidden assumption is named. The four commitments — plain language, evidence first, competing views, and the author’s own position declared where it applies — are the same rules that govern every book in this archive. Where the honest answer is nobody knows, that is written down as a finding.',
    topic: 'Gender · Society · Evidence',
    keywords: [
      'women', 'gender', 'feminism', 'patriarchy', 'sex differences',
      'fertility', 'reputation', 'evidence', 'India', 'social policy',
      'gender equality paradox', 'natural experiment', 'plain language',
    ],
    published: '2026-08-05',
    displayDate: 'August 2026',
    parts: 16,
    live: 16,
    words: 301393,
    minutes: 1369,
    status: 'Complete',
    accent: 'ink',
    pdf: 'rules-about-women.pdf',
    pdfSize: '4.0 MB',
    pdfLabel: 'The complete book',
    principlesTitle: 'The four commitments',
    principles: [
      { n: '01', t: 'Brutal toward comfortable stories', d: 'Not cruel toward women. Not sneering at religious people. If the data shows a real cost, the cost goes in at full size. If a traditional claim is empty, it gets called empty in plain words — even when it is held sincerely by people the reader loves. Neither "everything is patriarchy" nor "ancestors knew best" survives contact with evidence intact.' },
      { n: '02', t: 'Correlation stays labelled as correlation', d: 'This literature is drowning in people reading causation into selection effects, in both directions. Every finding says what it is and what it is not. The natural-experiment cases — where history changed the rule and we can measure what happened afterwards — do the work that observation cannot.' },
      { n: '03', t: 'Both sides get their strongest case', d: 'The traditionalist argument is stated the way its cleverest advocate would state it, then answered. The feminist argument is stated at full strength, then tested. Beating a weak opponent proves nothing. Where the field genuinely disagrees, both positions stay on the page and the open questions stay open.' },
      { n: '04', t: 'The author’s position is declared where it applies', d: 'Indian, Punjabi, male, young, writing in English, evidently sympathetic to loosening the rules. That pull is stated in the text at the points where it matters, not buried in a preface. What I actually think is Chapter 9 of Part 16, marked as the least evidenced thing in the book — read it knowing that.' },
    ],
    outline: [
      { n: 1, label: 'The Question', title: 'The Question Underneath the Question', blurb: 'A photograph from a protest, a rumour that followed it, and the machinery underneath both — the three claims that get made constantly and almost never tested.' },
      { n: 2, label: 'The Origin', title: 'Where the Rules Came From', blurb: 'The actual causal story — heritable property, paternity uncertainty and plough agriculture — and the matrilineal societies that prove the rules are not human universals.' },
      { n: 3, label: 'India', title: 'The Indian Machine', blurb: 'How the rules are transmitted and enforced here. Caste, kinship, the joint family, and the two centuries of reform arguments the record can actually settle.' },
      { n: 4, label: 'Biology', title: 'The Bodies Themselves', blurb: 'Measured sex differences with an effect-size table — where the gaps are large, where they overlap almost entirely, and what an average difference does and does not license about any individual.' },
      { n: 5, label: 'The Paradox', title: 'The Paradox of the Free Countries', blurb: 'Why outcomes in the freest societies matched nobody’s prediction. Four competing accounts, tested against the same data, with what each one cannot explain.' },
      { n: 6, label: 'The Old Rules', title: 'The Case for the Old Rules', blurb: 'The strongest version of the traditionalist argument — seven claims at full strength, scored against four conditions. What holds, what falls, and where the case is weaker than its own advocates think.' },
      { n: 7, label: 'Feminism', title: 'What Feminism Actually Claims', blurb: 'Four movements with one name, the claims each one made, and a scorecard: what feminism has established, what it is still contesting, and what it predicted that did not happen.' },
      { n: 8, label: 'The Ledger', title: 'The Ledger of the Equality Project', blurb: 'Eighteen rows of outcomes across work, power, bodies and happiness — and a column asking who each change actually reached.' },
      { n: 9, label: 'Descendants', title: 'The Arithmetic of Descendants', blurb: 'The fertility figure everybody quotes and almost nobody understands. What it measures, why it fell, whether anybody has turned it around, and what it would cost if somebody tried.' },
      { n: 10, label: 'The Evidence', title: 'What the Evidence Says Happens to a Woman', blurb: 'The core warning at the centre of the whole series, unpacked into four claims and tested — where the numbers land, and where the story turns out to be selection rather than cause.' },
      { n: 11, label: 'The Other Half', title: 'The Half Nobody Studied', blurb: 'Men as the missing comparison group. Every rule governs one sex; almost every study measures one sex. What the missing counterfactual actually looks like when it is drawn.' },
      { n: 12, label: 'Reputation', title: 'The Community With No Edges', blurb: 'Reputation used to be a local technology with a small audience. What happens to the old rules when the audience becomes everybody with a phone, forever.' },
      { n: 13, label: 'History', title: 'When History Ran the Experiment', blurb: 'Nine natural experiments where a society changed one of these rules and we can measure what happened afterwards — graded against six tests.' },
      { n: 14, label: 'What Works', title: 'What Would Actually Work', blurb: 'A taxonomy of interventions — ban the output, change the price, change who is in the room, supply the substitute — and which ones the evidence actually supports.' },
      { n: 15, label: 'The Rebuttal', title: 'The Case Against This Series', blurb: 'Fourteen parts audited everybody else. This one puts the series in the dock — the strongest argument that the questions were wrong, the evidence was not neutral, and the even-handedness cost more than it bought.' },
      { n: 16, label: 'The Verdict', title: 'What Survived', blurb: 'The last part. What fifteen parts actually established rather than argued, which claims on each side survived contact with evidence, and what the author actually thinks — declared as the least evidenced thing in the book.' },
    ],
    load: () => import('./writing/rules-about-women.js'),
  },
  {
    slug: 'punjab-history',
    kicker: 'A 14-part history',
    title: 'The Complete History of Punjab',
    subtitle: 'Every Argument, Every Assumption, in Plain English',
    standfirst:
      'A narrative history of Punjab from the making of the land itself to the present — written so that anyone can follow it, with every dispute shown as a dispute and every assumption named rather than assumed.',
    summary:
      'There are two kinds of book about Punjab. Scholarly ones that are honest but unreadable, and popular ones that are readable but leave out all the arguments and present one clean version of contested events. This is meant to be a third kind. Every argument is included, every hidden assumption is pointed at, and the whole thing is written at a reading level anyone can follow. That makes the books longer, not shorter: explaining something plainly takes more words than explaining it technically, and nothing is dropped for being complicated. Where the field genuinely disagrees — and on Punjab’s deep past it disagrees a great deal — both sides get their strongest case and the open questions are left open.',
    topic: 'Punjab · History · Archaeology',
    keywords: [
      'Punjab history', 'history of Punjab', 'Harappa', 'Indus Valley',
      'the five rivers', 'Rigveda', 'Aryan migration', 'Soanian', 'Mehrgarh',
      'Saraswati', 'Vedic age', 'Punjab prehistory',
    ],
    published: '2026-08-04',
    displayDate: 'August 2026',
    parts: 14,
    live: 14,
    words: 189364,
    minutes: 861,
    status: 'Complete',
    accent: 'harvest',
    pdf: 'punjab-history.pdf',
    pdfSize: '6.5 MB',
    pdfLabel: 'The complete book',
    principlesTitle: 'The three house rules',
    principles: [
      { n: '01', t: 'Plain language', d: 'Hard ideas explained in ordinary words, with nothing left out to make them fit. Simpler words, not less content — if a sentence needs a difficult word, the word gets explained where it appears rather than avoided.' },
      { n: '02', t: 'Evidence first', d: 'Show the thing itself — a bone, a broken pot, a mark on a rock, a line of a hymn — and then be clear about what it can and cannot prove. History is only as good as its evidence, so the evidence is put in front of you.' },
      { n: '03', t: 'Competing views', d: 'Where the field disagrees, both sides get their strongest case, stated the way its own best advocate would state it. Open questions stay open. Nobody is told what to think about an argument that is genuinely unsettled.' },
    ],
    outline: [
      { n: 1, label: 'The Land', title: 'The Land Itself', blurb: 'Plate tectonics, the Himalayas, how the rivers built the soil, the five rivers one by one, the ice ages, the Soanian stone tools and the arrival of farming.' },
      { n: 2, label: 'Harappa', title: 'Harappa', blurb: 'Discovery, scale, city planning, the kingless problem, the undeciphered script, trade and craft, religion, the Saraswati question and the decline.' },
      { n: 3, label: 'The Vedic Age', title: 'The Vedic Age and the Aryan Question', blurb: 'The Rigveda in the land of seven rivers, the Battle of the Ten Kings on the Ravi, the emergence of varna, and the full Aryan migration debate.' },
      { n: 4, label: 'Antiquity', title: 'Persians, Alexander, Mauryas', blurb: 'Achaemenid satrapy, Alexander and Porus at the Jhelum, the army’s refusal at the Beas, Chandragupta, Ashoka and Taxila.' },
      { n: 5, label: 'Greeks & Kushans', title: 'Greeks, Kushans and the Face of the Buddha', blurb: 'Menander, the Sakas and Parthians, the Kushans and Kanishka, Gandhara art, the Guptas, Toramana and Mihirakula.' },
      { n: 6, label: 'Sultans & Sufis', title: 'Sultans and Sufis', blurb: 'The Hindu Shahis, Mahmud of Ghazni, Muhammad Ghori and Tarain, the Delhi Sultanate, Lahore and Multan, Timur in 1398, Baba Farid and the birth of written Punjabi.' },
      { n: 7, label: 'The First Gurus', title: 'Guru Nanak to Guru Arjan', blurb: 'The first five Gurus, the founding of Amritsar, the compilation of the Adi Granth, Babur and Akbar, and the martyrdom of Guru Arjan.' },
      { n: 8, label: 'The Khalsa', title: 'Guru Hargobind to Guru Gobind Singh', blurb: 'Miri-Piri and the turn to arms, Aurangzeb, the martyrdom of Guru Tegh Bahadur, the Khalsa in 1699, and the Guru Granth Sahib as eternal Guru.' },
      { n: 9, label: 'The Misls', title: 'Banda Singh Bahadur to the Misls', blurb: 'The rising of 1710–16, the persecutions and the Ghallugharas, Nadir Shah, Ahmad Shah Abdali, and the twelve misls.' },
      { n: 10, label: 'The Sikh Empire', title: 'Ranjit Singh and the Fall', blurb: 'The Sikh Empire, the Lahore Durbar, the army, the succession collapse, the Anglo-Sikh Wars and annexation in 1849.' },
      { n: 11, label: 'Under the Raj', title: 'British Punjab', blurb: 'Canal colonies, the remaking of the agrarian economy, the martial-races policy and army recruitment, land alienation, famine and revenue.' },
      { n: 12, label: 'Ghadar', title: 'Ghadar to Independence', blurb: 'Ghadar, Jallianwala Bagh in 1919, Bhagat Singh, the Unionist Party, the Muslim League and the politics of the 1940s.' },
      { n: 13, label: 'Partition', title: 'Partition and Indian Punjab', blurb: '1947 and the Radcliffe Line, the Punjabi Suba movement, the 1966 reorganisation, the Green Revolution, the 1980s, 1984, the 1990s, water disputes and the present.' },
      { n: 14, label: 'The Diaspora', title: 'Pakistani Punjab and the Diaspora', blurb: 'Lahore, One Unit, Punjab’s dominance in Pakistan, 1971 and the present — plus the global Punjabi diaspora in the UK, Canada, the US and Australia.' },
    ],
    load: () => import('./writing/punjab-history.js'),
  },
  {
    slug: 'punjab',
    kicker: 'A 13-part investigation',
    title: 'Punjab: The Whole Truth',
    subtitle: 'Five Thousand Years, One Honest Look',
    standfirst:
      'From the first farmers to the Khalistan question — every disputed number shown with its range and its source, and every side given its strongest argument before it is answered.',
    summary:
      'Punjab is one of the most argued-about places on earth. Say the word and people reach for a story. One person says Punjab is the sword-arm of India, the land that fed the country and guarded its border. Another says Punjab is a colony that India bled dry. One says Bhindranwale was a saint; another says he was a terrorist. One says Khalistan is a freedom movement; another says it is a Pakistani intelligence project run by lawyers in New Jersey. All of these people can produce facts — that is the problem. Almost every claim in the Punjab argument has some evidence behind it, and what people do is pick the facts that suit them and hide the rest. This tries to do the opposite: put all of it on the table, the glory and the shame, what Punjab did to others and what was done to Punjab, and then ask what the full picture actually supports. Most writing on the subject is a lawyer’s argument — pick a side, then hunt for evidence. This is meant to be a doctor’s report: look at everything, then say what you found, even if nobody likes it.',
    topic: 'Punjab · History · Politics',
    keywords: [
      'Punjab history', 'Punjab: The Whole Truth', 'Khalistan', 'Bhindranwale',
      '1984', 'Operation Blue Star', 'Sikh history', 'Harappa', 'Rigveda',
      'the five rivers', 'doab', 'Miri-Piri', 'Anandpur Sahib Resolution',
      'Punjab partition', 'Sikh Empire', 'Ranjit Singh',
    ],
    published: '2026-08-02',
    displayDate: 'August 2026',
    parts: 13,
    live: 13,
    words: 110992,
    minutes: 505,
    status: 'Complete',
    accent: 'ember',
    pdf: 'punjab.pdf',
    pdfSize: '8.6 MB',
    pdfLabel: 'The complete book',
    principlesTitle: 'The five rules every part follows',
    principles: [
      { n: '01', t: 'Plain English, always', d: 'If a student in Class 6 cannot follow a sentence, that sentence is badly written. Every specialist word — doab, Miri-Piri, riparian rights, the Anandpur Sahib Resolution — is explained in ordinary words the first time it appears.' },
      { n: '02', t: 'When the numbers are disputed, you see the dispute', d: 'How many died in Operation Blue Star? The White Paper said 493; independent estimates run to several thousand. Both are shown, with who said what and why they disagree. A book that hides its uncertainty is not being confident, it is being dishonest.' },
      { n: '03', t: 'Every side gets its best case, not its worst', d: 'The case for Khalistan is stated the way its cleverest supporter would state it, and then answered. The Indian state’s justification is stated at full strength, and then tested. Beating a weak opponent proves nothing.' },
      { n: '04', t: 'Groups of people are never the explanation', d: '“Punjabis are hot-headed” is not analysis; it is an insult wearing a lab coat. It also explains nothing, because it cannot explain change — and Punjab changed enormously, for reasons: geography, money, water, politics, war, named decisions by named people.' },
      { n: '05', t: 'Nobody here is only a hero or only a villain', d: 'The Indian state defeated a genuinely murderous insurgency and also killed innocent people and covered it up. Punjab produced extraordinary courage and also men who machine-gunned bus passengers for their religion. Both halves are true.' },
    ],
    outline: [
      { n: 1, label: 'Before the Name', title: 'The Land Before the Name', blurb: 'From the first villages to about 500 BCE — where Punjab actually is, the five rivers that made it, and the awkward fact hidden inside Harappa.' },
      { n: 2, label: 'Antiquity', title: 'Porus to the Huns', blurb: 'Alexander at the Jhelum, the Mauryas, the Greeks who stayed, and the invasions that set the pattern for everything after.' },
      { n: 3, label: 'The Highway', title: 'The Invasion Highway', blurb: 'Why the same road was walked by everyone who wanted India, and what being the corridor does to the people who live in it.' },
      { n: 4, label: 'The Gurus', title: 'Gurus and the Khalsa', blurb: '1469 to 1708 — ten Gurus, two executions, four dead children, and the origin of shaheedi.' },
      { n: 5, label: 'The Empire', title: 'The Sikh Empire', blurb: 'Ranjit Singh, the state he built, and what happened to it.' },
      { n: 6, label: 'Under the Raj', title: 'Loyal and Rebel at Once', blurb: 'Punjab under British rule — the martial-race army, the canal colonies, Jallianwala Bagh and the Ghadar men.' },
      { n: 7, label: 'Partition', title: 'The Cut', blurb: 'Why Punjab was the worst of 1947 — the arithmetic, the Radcliffe Line, the killing, and the water.' },
      { n: 8, label: 'Redrawing', title: 'Redrawing Punjab', blurb: 'Punjabi Suba, the 1966 reorganisation, Chandigarh, and the river waters that were never settled.' },
      { n: 9, label: 'Bhindranwale', title: 'Bhindranwale: Full Autopsy', blurb: '1977 to June 1984 — who he was, who built him, what he actually said, and the two tests he fails.' },
      { n: 10, label: 'The Dark Decade', title: 'The Dark Decade', blurb: 'The years after 1984 — the insurgency, the state response, and the evidence graded document by document.' },
      { n: 11, label: 'The Network', title: 'Khalistan: The Idea and the Network', blurb: 'Where the idea came from, who funds and organises it now, and the ideology examined in its own words.' },
      { n: 12, label: 'The Arithmetic', title: 'The Feasibility Audit', blurb: 'The full arithmetic — land-locked borders, river water, army, currency and trade — against the claim that Punjab is an ancient nation temporarily occupied.' },
      { n: 13, label: 'Punjab Now', title: 'The Reckoning', blurb: 'The inheritance of the dark decade: capital flight, halted investment, a lost generation, and the crisis the state still has to account for.' },
    ],
    load: () => import('./writing/punjab.js'),
  },
  {
    slug: 'reservation-files',
    kicker: 'A 14-part investigation',
    title: 'The Reservation Files',
    subtitle: 'A Complete, Honest History',
    standfirst:
      'India’s biggest argument, from the beginning: what reservation is, where caste came from, what the evidence shows — both sides at full strength.',
    summary:
      'In the last week of July 2026 an Instagram account went from nothing to nearly six million followers in seven days, and the comment sections underneath it were some of the angriest writing I have ever read from Indians about other Indians. The anger was not what struck me. Anger about jobs and exams in this country is completely understandable — I have felt it myself. What struck me was that almost nobody arguing seemed to know what they were arguing about. People were furious about a system whose actual rules they had never read, quoting history they had never checked, repeating numbers that were wrong on both sides. I include myself in that. So I went back to the beginning — the oldest texts, the archaeology, the genetics, the court records, the census files, and what the great minds on every side actually wrote rather than what people claim they wrote — and then came forward, slowly, until we reach the argument happening on our phones right now.',
    topic: 'India · Caste · Reservation · History',
    keywords: [
      'reservation in India', 'caste reservation', 'The Reservation Files',
      'Reservation Hatao Andolan', 'affirmative action India', 'merit and reservation',
      'SC ST OBC EWS', 'creamy layer', 'varna and jati', 'Manusmriti',
      'Purusha Sukta', 'endogamy', 'untouchability', 'Ambedkar',
      'Indian Constitution reservation', 'caste census 2027',
      'reservation debate fact check',
    ],
    published: '2026-07-31',
    displayDate: 'July 2026',
    // All fourteen are written, so `live` is omitted: livePartsOf falls back
    // to the part count and nothing claims a part that is not there.
    parts: 14,
    // The web edition's Part 1 is the long, everything-explained rewrite, so
    // these are 4,067 words above the printed book's total.
    words: 109054,
    minutes: 497,
    status: 'Complete',
    accent: 'ink',
    // One book, not fourteen downloads. The per-part PDFs were right while the
    // series was being serialised; now that it is finished the collected
    // edition is the thing a reader actually wants.
    pdf: 'the-reservation-files.pdf',
    pdfSize: '2.4 MB',
    pdfLabel: 'The complete book',
    principlesTitle: 'The house rules every part follows',
    principles: [
      { n: '01', t: 'Class-8 English, always', d: 'Short sentences, no jargon, every hard word explained where it first appears. If a fifteen-year-old who hates reading cannot follow a page, that page is badly written.' },
      { n: '02', t: 'Both sides at full strength', d: 'Every argument is written the way its smartest defender would write it — the steelman, never the stupid version that is easy to knock down.' },
      { n: '03', t: 'Three colours of truth, kept apart', d: 'Fact, interpretation and contested claim are separated on the page and never blurred together — and the contested-claim box appears for both sides.' },
      { n: '04', t: 'Sources on the page, verdicts labelled', d: 'Every number and quote is traceable, and where a verdict is mine it sits in a box that says so, with the reasoning shown so you can disagree precisely.' },
    ],
    /* The series as announced in the author's own blueprint. Published parts
       come from the data file; everything else shows here as announced-but-
       unwritten, so the shape of the work is visible from day one and a part
       landing later changes nothing but the data. */
    outline: [
      { n: 1, label: 'The Basics', title: 'Ground Zero', blurb: 'What reservation literally is, the exact numbers, how the roster actually works, the twelve biggest myths, and why July 2026 exploded.' },
      { n: 2, label: 'Origins', title: 'Before Caste', blurb: 'The Indus Valley, the oldest layer of the Rig Veda, the Purusha Sukta read both ways, and what the genetics does and does not settle.' },
      { n: 3, label: 'The Mechanism', title: 'How Varna Became Jati', blurb: 'The Dharmashastras and the actual verses of the Manusmriti, endogamy as the lock, where untouchability came from, and the first revolts.' },
      { n: 4, label: 'Invasions', title: '1,000 Years of Outsiders', blurb: 'Caste under the Sultanate and the Mughals, caste inside Indian Islam and Christianity, the Bhakti movement, and whether conversion was an escape.' },
      { n: 5, label: 'Colonial Rule', title: 'The British Machine', blurb: 'The Census of 1871 onwards, the colonial-construction thesis and its rebuttal, Shahu Maharaj’s 1902 quota, and the Poona Pact.' },
      { n: 6, label: 'The Evidence', title: 'The Evidence File', blurb: 'Court, land, temple and missionary records, Mahad and Vaikom, modern measurement of untouchability, NCRB data, and CV field experiments.' },
      { n: 7, label: 'The Thinkers', title: 'The Great Minds Argue', blurb: 'Ambedkar, Gandhi, Phule, Periyar, Vivekananda, Savarkar, Nehru, Kanshi Ram and the modern economists — quoted in full context, strongest and weakest points each.' },
      { n: 8, label: 'The Constitution', title: 'The Constitution Room', blurb: 'The Constituent Assembly debates, the “ten years” myth killed properly, Articles 15, 16, 46, 330 to 342, and the amendment timeline.' },
      { n: 9, label: 'Mandal', title: 'Mandal and Fire', blurb: 'The Kalelkar and Mandal Commissions, 1990 and the protests, and where the 50% ceiling and the creamy layer actually came from.' },
      { n: 10, label: '2019–2026', title: 'The Modern Rewrite', blurb: 'The 103rd Amendment and EWS, dominant communities demanding inclusion, the 2024 sub-classification ruling, and the 2027 caste census.' },
      { n: 11, label: 'The Data', title: 'The Data War', blurb: 'Every popular statistic from both sides run through the same test — dropout data, faculty vacancies, officer composition, wealth share and mobility.' },
      { n: 12, label: 'Both Cases', title: 'The Two Cases, Steelmanned', blurb: 'Abolish it and keep it, each written by its best possible advocate, then cross-examined, then scored claim by claim.' },
      { n: 13, label: 'Blind Spots', title: 'The Blind Spots', blurb: 'The questions neither side raises, plus what actually happened in the USA, Malaysia, South Africa, Brazil, Nepal and Northern Ireland.' },
      { n: 14, label: 'The Verdict', title: 'The Verdict', blurb: 'What is true in each case, what each side is lying to itself about, a labelled verdict with its reasoning shown, and a concrete model for 2047.' },
    ],
    // The web edition, which layers the rewritten Part 1 over the generated
    // parts. See reservation-files-web.js.
    load: () => import('./writing/reservation-files-web.js'),
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
    principlesTitle: 'The four commitments the whole series follows',
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
    principlesTitle: 'The method, stated up front',
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
    principlesTitle: 'The four promises this book opens with',
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
        principlesTitle: 'इस पुस्तक के चार वादे',
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
    slug: 'debunked-sikhism',
    /* The cover sets the title in the display face at up to 6.3rem, where an
       em dash is a bar half the width of a word — so the series name stands
       alone and the volume moves into the subtitle, which sits directly under
       it on the plate and on the share card alike. The kicker carries the
       method rather than repeating the title. */
    kicker: 'A claim-by-claim examination',
    title: 'Debunked',
    subtitle: 'The Sikhism Series',
    standfirst:
      'The claims made about Sikhi, and the claims Sikhs make about themselves — each one traced to its source, tested against Gurbani and the historical record, and answered in plain language.',
    summary:
      'This is a different book to write. The previous eleven parts of Debunked were about claims made by other people about another tradition — I was an outsider examining a neighbour’s house, and an outsider’s care has a particular shape. This series is about my own house. I am a Sikh. I love this tradition the way a person loves a parent: the love is not in question, but the love does not exempt the parent from the truth. Two kinds of claim need careful undoing here. The first are claims made about us, often by Hindutva writers, that try to absorb Sikhism back into the tradition we deliberately walked out of in 1469. The second are the claims we make about ourselves — supernatural sakhis presented as history, scientific properties invented for the Five Ks, inflated battle figures repeated at school assemblies as if numbers were a measure of valour. Both kinds are debunked here, in the same plain language, with the same Gurbani citations, with the same care for the named source. I do not believe that loving Sikhi requires us to defend every claim that has been attached to her. I believe it requires us to remove the claims that diminish her.',
    topic: 'Sikhi · History · Identity',
    keywords: [
      'Sikhism', 'Sikhi', 'Debunked Sikhism', 'Sri Guru Granth Sahib Ji',
      'Guru Nanak Dev Ji', 'janamsakhi', 'sakhi and history', 'Khalsa',
      'is Sikhism part of Hinduism', 'na hum hindu na musalman',
      'Sikh identity', 'Hindutva and Sikhs', 'Sikh history fact check',
      'Gurbani citations', 'the ten Gurus',
    ],
    // The date the first part was written, following the rest of this shelf —
    // these books predate the site, and their own dating is what a reader
    // means by "when was this written".
    published: '2026-06-02',
    displayDate: 'June 2026',
    parts: 13,
    live: 3,
    words: 25567,
    minutes: 116,
    status: 'In progress',
    /* The book itself is oxblood and gold, which is `ember` — but this piece
       sits directly above The Forgotten Gods on the shelf and two ember plates
       in a row read as one. `quartz` is the deep green the source already uses
       for its definition panels and its Gurbani rules. */
    accent: 'quartz',
    // One book, not three downloads — bound by scripts/make-book-pdfs.mjs.
    // The series is still being written, so the label says how far it goes.
    pdf: 'debunked-sikhism.pdf',
    pdfSize: '847 KB',
    pdfLabel: 'Parts 1–3, collected',
    principlesTitle: 'The rules this series argues by',
    principles: [
      { n: '01', t: 'The same five steps, ten times a part', d: 'Where the claim came from · what the Sikh texts say · the real history · the debunk · the honest picture. Every chapter, no exceptions, so the method can be checked as easily as the conclusion.' },
      { n: '02', t: 'Both directions, not one', d: 'Claims made about Sikhs by outsiders, and claims Sikhs make about themselves. The second kind is harder to write and gets exactly the same treatment as the first.' },
      { n: '03', t: 'Gurbani cited by raag and ang', d: 'Every scriptural claim is given with its raag and its page in the Sri Guru Granth Sahib Ji, so a reader can open it tonight and disagree precisely.' },
      { n: '04', t: 'Love is not a reason to leave a false thing standing', d: 'Where a beloved story does not hold, this says so — and says what stands in its place, which on the evidence is almost always larger than the story.' },
    ],
    /* Only what the author has announced in print. Part 4 is named in Part 3's
       closing; parts 5 to 13 are promised by the cover and not yet described,
       so they show as unwritten rather than invented. */
    outline: [
      { n: 4, label: 'The Tenth Guru', title: 'Guru Gobind Singh Ji and the Khalsa', blurb: 'Vaisakhi 1699 and what the sources say about the five who stood up, the arithmetic of the battles, Chamkaur, the Five Ks and the sciences invented for them.' },
    ],
    load: () => import('./writing/debunked-sikhism.js'),
  },
  {
    slug: 'debunked',
    /* The first Debunked volume. It shares the series name with the Sikhism
       one directly above, which is correct — they are two volumes of one
       project — so the subtitle carries the distinction and the plates take
       different registers. */
    kicker: 'A field guide, in eleven parts',
    title: 'Debunked',
    subtitle: 'Modern Myths Sold as Ancient Indian Science',
    standfirst:
      'A grounded look at the claims flooding our feeds — vimanas, brahmastras, cow urine cures, ancient nuclear weapons — and how to test any one of them in sixty seconds, using six simple steps.',
    summary:
      'Your uncle forwards you a message. Lord Hanuman calculated the exact distance from the Earth to the Sun seven thousand years ago, it is written in the Hanuman Chalisa, NASA confirmed it, forward to ten people. Most of us either forward it on or believe it quietly and move along. This book is for anyone who wants to learn the third option — stop, ask one question, find out whether it is actually true — even when the claim arrives wrapped in a flag, a god’s name, or your grandfather’s voice. It takes about seventy-nine such claims one at a time: flying machines and ancient aircraft, the brahmastra as a nuclear weapon, Ganesha’s head as plastic surgery, cow urine as a cancer cure, relativity hidden in the Vedas, the world having stolen everything from us. It is not anti-Hindu and it is not pro-anything-else. Every religion has people who insist their oldest book predicted everything; this one is about the Indian version because that is what is filling our own feeds. And where the record does support a real Indian achievement — and it does, in mathematics, astronomy, surgery and linguistics — that gets stated at full strength, with the date and the manuscript.',
    topic: 'India · Science · Evidence',
    keywords: [
      'Debunked', 'ancient Indian science claims', 'vimana', 'Vaimanika Shastra',
      'brahmastra nuclear weapon', 'cow urine cancer', 'Ganesha plastic surgery',
      'Sushruta', 'Aryabhata', 'zero invented in India', 'Sanskrit NASA',
      'Aryan invasion theory', 'pseudoscience India', 'Hindutva pseudoscience',
      'fact check WhatsApp forwards', 'Hindu vs Hindutva',
    ],
    published: '2026-06-01',
    displayDate: 'June 2026',
    parts: 11,
    words: 100136,
    minutes: 455,
    status: 'Complete',
    accent: 'harvest',
    // One book, not eleven downloads — bound by scripts/make-book-pdfs.mjs.
    pdf: 'debunked.pdf',
    pdfSize: '3.2 MB',
    pdfLabel: 'The complete book',
    principlesTitle: 'What this book is, and what it is not',
    principles: [
      { n: '01', t: 'It is not anti-Hindu', d: 'The tradition produced the Gita and the Upanishads, six schools of philosophy, Aryabhata’s astronomy, Sushruta’s surgery, Panini’s grammar. None of that is mocked here. The target is the inflation, never the tradition it is attached to.' },
      { n: '02', t: 'The same six steps, on every claim', d: 'What exactly is being claimed · where the claim came from · what the text actually says · what the evidence shows · the debunk · the honest picture. Seventy-nine claims, one method.' },
      { n: '03', t: 'What is real gets its own box', d: 'Where India genuinely did it first — zero as a number, the decimal system, the sine table, the Kerala calculus, rhinoplasty — it is stated at full strength, with the date and the manuscript named.' },
      { n: '04', t: 'Simple words on purpose', d: 'Big words are a good way to hide a weak argument. Every unfamiliar term is explained where it first appears, so any claim in the book can be checked by the reader rather than taken on trust.' },
    ],
    load: () => import('./writing/debunked.js'),
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
    principlesTitle: 'How this one is written',
    principles: [
      { n: '01', t: 'Simple language on purpose', d: 'Big words are often used to hide weak arguments. I do not want to hide anything.' },
      { n: '02', t: 'Every claim can be checked', d: 'Historians who spent their lives on this, and writings from people who lived through it.' },
      { n: '03', t: 'No myths, no conspiracies', d: 'The real history is heavy enough on its own. It does not need help.' },
      { n: '04', t: 'Explained from zero', d: 'Wherever an unfamiliar word appears, it is explained right there on the spot.' },
    ],
    translations: {
      hi: {
        language: 'hi',
        locale: 'hi_IN',
        ogSlug: 'forgotten-gods-hi',
        published: '2026-08-19',
        kicker: 'सरल भाषा में एक ज़मीनी इतिहास',
        title: 'भूले-बिसरे देवता',
        subtitle: 'चार भागों का इतिहास',
        standfirst:
          'एक सीधी-सादी, ज़मीनी पड़ताल — कि जब जंगल, नदी और तूफ़ान के पुराने धर्मों की जगह बाहर से आए एक नए धर्म ने ले ली, तो असल में क्या कुछ खो गया।',
        summary:
          'एक दिन मैं धर्म के बारे में सोच रहा था। मैंने एक बात पर ध्यान दिया। दुनिया भर की ज़्यादातर पुरानी सभ्यताएँ प्रकृति की पूजा करती थीं — पेड़ों, नदियों, पहाड़ों, सूरज और बारिश को ही पवित्र मानकर। फिर कहीं किसी मोड़ पर आकर ये ज़्यादातर पुराने धर्म ख़त्म हो गए, उनकी जगह ईसाई धर्म और इस्लाम जैसे बड़े, संगठित धर्मों ने ले ली। मैं जानना चाहता था कि असल में हुआ क्या, सो मैंने पढ़ना शुरू किया। जो मुझे मिला, वह मेरे मन में बैठी सीधी-सादी कहानी से कहीं ज़्यादा निर्मम भी था और कहीं ज़्यादा दिलचस्प भी। सच को किसी झूठी कहानी या गढ़ी हुई साज़िश की ज़रूरत नहीं होती। असली इतिहास अपने आप में ही काफ़ी भारी है।',
        topic: 'इतिहास · धर्म · सभ्यता',
        keywords: ['भूले-बिसरे देवता', 'पेगन यूरोप', 'ईसाई धर्म का इतिहास', 'ज़बरदस्ती धर्मांतरण', 'औपनिवेशिक भारत', 'सिंधु घाटी', 'धर्म का इतिहास'],
        displayDate: 'अगस्त 2026',
        words: 55042,
        minutes: 307,
        status: 'पूर्ण',
        pdf: 'the-forgotten-gods-hi.pdf',
        pdfSize: '1.2 MB',
        principlesTitle: 'यह किताब जिन उसूलों पर लिखी गई है',
        principles: [
          { n: '01', t: 'सरल भाषा जान-बूझकर', d: 'बड़े-बड़े शब्द अक्सर कमज़ोर दलीलों को छिपाने के लिए इस्तेमाल होते हैं। मुझे कुछ भी नहीं छिपाना।' },
          { n: '02', t: 'हर दावे की जाँच हो सकती है', d: 'ऐसे इतिहासकार जिन्होंने अपनी पूरी ज़िंदगी इसी पर लगाई, और उन लोगों के लेख जो ख़ुद उस दौर में जिए।' },
          { n: '03', t: 'न मिथक, न साज़िश', d: 'असली इतिहास अपने आप में ही काफ़ी भारी है। उसे किसी सहारे की ज़रूरत नहीं।' },
          { n: '04', t: 'शुरू से समझाया गया', d: 'जहाँ भी कोई अनजान शब्द आता है, उसे वहीं समझा दिया जाता है।' },
        ],
        load: () => import('./writing/forgotten-gods-hi.js'),
      },
    },
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
