/* ============================================================
   LOVEPREET SINGH — personal site
   Curated, public-facing biography and homepage copy.

   Keep factual claims modest. The research archive is the proof.
   ============================================================ */

export const profile = {
  name: 'Lovepreet Singh',
  first: 'Lovepreet',
  last: 'Singh',
  descriptor: 'Certified Ethical Hacker · Founder of Lovelace · MBA candidate · Researcher',
  shortDescriptor: 'Security · Research · Lovelace',
  location: 'Punjab, India',
  email: 'lovepreetsinghmk10@gmail.com',
  photo: import.meta.env.BASE_URL + 'founder.jpg',
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/fiverivers-founder/' },
    { label: 'Instagram', href: 'https://www.instagram.com/misterlove.in' },
    { label: 'Lovelace', href: 'https://lovelace.co.in' },
  ],
};

export const nav = [
  { label: 'About', to: '#about' },
  { label: 'Practice', to: '#practice' },
  { label: 'Method', to: '#method' },
  { label: 'Writing', to: '/writing', route: true },
  { label: 'Education', to: '#education' },
  { label: 'Contact', to: '#contact' },
];

export const home = {
  hero: {
    eyebrow: profile.descriptor,
    title: 'I study systems, then write until they become clear.',
    lead:
      'My work moves between security, business strategy and public research. I founded Lovelace, taught myself the engineering I use, and build long-form investigations that take difficult public questions back to the record.',
    primary: { label: 'Read my work', to: '/writing', route: true },
    secondary: { label: 'About me', to: '#about' },
  },

  about: {
    label: 'About',
    title: 'Curiosity became a method.',
    statement:
      'I want to write the kind of argument that gets stronger the more you fact-check it, not weaker.',
    /* The clause the epigraph turns on. Set upright inside the italic, so
       the sentence carries its own emphasis instead of running flat. */
    statementEmphasis: 'gets stronger',
    paragraphs: [
      'I am Lovepreet Singh — a Certified Ethical Hacker, the founder of Lovelace, and the writer behind this archive. I took a B.Com in Business at Chandigarh University and am in the second year of an MBA in Business Strategy and Analysis at Panjab University, Chandigarh. A doctorate is what I intend to do after it. I read across technology, business, history, politics, psychology, philosophy and economics, because the questions that matter rarely stay inside one subject.',
      'Everything technical about me is self-taught. I have no science background and no computer-science degree. I learned C, C++ and data structures and algorithms on my own, then the MERN stack, then security — and earned the Certified Ethical Hacker qualification the same way. I did it because I wanted to know how the machine actually works, not because a syllabus required it.',
      'I am an obsessive science and technology enthusiast, and I think the two halves of my training feed each other. Strategy taught me to ask who benefits from a claim. Engineering taught me that a system will do exactly what it was built to do, whatever anyone intended. They are the same discipline pointed at different objects.',
      'Philosophy is the part I would do for nothing. Epistemology above all — how a claim earns the right to be believed, where certainty is warranted and where it is merely loud, and what it costs to hold a position honestly. Ethics and political philosophy follow from it, because most public arguments turn out to be three arguments wearing one coat: a dispute about facts, a dispute about what a word means, and a dispute about what ought to matter. Almost nobody says which one they are having, which is why so few of them ever end.',
      'So my writing begins with a simple discomfort: public arguments are usually confident long before they are careful. I go back to the record, read across disagreement, separate what is evidence from what is a value judgement, and explain what survives in plain language. This archive is where that method is being built — and it is deliberate preparation for the doctoral research I mean to do, not a detour from it.',
    ],
    facts: [
      { label: 'Based in', value: 'Punjab, India' },
      { label: 'Qualified as', value: 'Certified Ethical Hacker' },
      { label: 'Self-taught in', value: 'C, C++, DSA and the MERN stack' },
      { label: 'Reading toward', value: 'Doctoral research, after the MBA' },
      { label: 'Writing principle', value: 'Simple language, checkable claims' },
    ],
    photoCaption: 'Speaking about digital systems and security, Delhi, 2025.',
  },

  practice: {
    label: 'Practice',
    title: 'Three fields. One habit of mind.',
    intro:
      'Each field asks the same thing of me: understand the system, find the hidden assumptions, and make the result useful to someone else.',
    fields: [
      {
        n: '01',
        title: 'Cybersecurity',
        text:
          'I work on practical questions of risk, failure and trust in digital systems, as a Certified Ethical Hacker who learned the craft outside any syllabus. The work is technical, but the purpose is simple: help people understand what can go wrong and make better decisions before it does.',
        points: ['Offensive security', 'System review', 'Clear technical advice'],
      },
      {
        n: '02',
        title: 'Research and writing',
        text:
          'I investigate subjects that public debate often reduces to slogans: independence, farmers’ movements, religion, gender, caste, merit and social justice. The method is philosophical before it is historical — establish what kind of question is being asked, then answer that question rather than a louder one standing next to it.',
        points: ['Primary records', 'Competing arguments', 'Plain-English synthesis'],
        href: '/writing',
        route: true,
        link: 'Open the research archive',
      },
      {
        n: '03',
        title: 'Lovelace',
        text:
          'I founded Lovelace, a design and digital studio. It brings research, visual judgement and engineering together to make websites that feel considered, useful and alive.',
        points: ['Digital design', 'Web experiences', '3D and interaction'],
        href: 'https://lovelace.co.in',
        link: 'Visit lovelace.co.in',
      },
    ],
  },

  method: {
    label: 'Research method',
    title: 'A clear argument should show its workings.',
    steps: [
      {
        n: '01',
        title: 'Begin with a real question.',
        text: 'Not a conclusion looking for evidence. A question that can still surprise me.',
      },
      {
        n: '02',
        title: 'Read across disagreement.',
        text: 'A position deserves to be tested in its strongest form, not through its weakest spokesperson.',
      },
      {
        n: '03',
        title: 'Check the important claims.',
        text: 'Original records first where possible, then serious scholarship, with uncertainty named honestly.',
      },
      {
        n: '04',
        title: 'Write so anyone can follow.',
        text: 'Depth does not require fog. If a difficult idea matters, it should be explained clearly.',
      },
    ],
  },

  writing: {
    label: 'Selected research',
    title: 'The work is the argument.',
    intro:
      'Five continuing investigations, built part by part. Each one starts from zero, tests the popular stories, and keeps the hard parts visible.',
  },

  education: {
    label: 'Education and inquiry',
    title: 'Formal study, independent reading, public work.',
    intro:
      'Education is not a finished badge here. It is a continuing practice of reading, testing and revising what I think I know — and it is heading somewhere specific.',
    items: [
      {
        period: 'Next',
        title: 'Doctoral research',
        place: 'Planned on completion of the MBA',
        text:
          'The intention this whole archive is pointed at. Philosophy is the spine of it — epistemology, ethics and political philosophy — and every investigation published here is groundwork: practice at holding a position honestly, in public, before anyone requires it of me.',
      },
      {
        period: 'Second year',
        title: 'MBA — Business Strategy and Analysis',
        place: 'Panjab University, Chandigarh',
        text:
          'Strategy, analysis and the economics of how organisations actually decide — the formal counterpart to the reasoning this archive runs on.',
      },
      {
        period: 'Self-taught',
        title: 'Certified Ethical Hacker',
        place: 'Earned without a science background or a technology degree',
        text:
          'C, C++ and data structures and algorithms first, then the MERN stack, then offensive security. All of it outside a syllabus, because I wanted to know how the machine actually works.',
      },
      {
        period: 'Completed',
        title: 'B.Com — Business',
        place: 'Chandigarh University',
        text:
          'The commerce foundation: accounts, markets and the structures sitting underneath every claim about who gains from a policy.',
      },
      {
        period: 'Foundation',
        title: 'Senior secondary education',
        place: 'Jhamku Devi Senior Secondary School',
        text:
          'The formal foundation before a wider, self-directed path through technology and the social sciences.',
      },
      {
        period: 'Continuing',
        title: 'Independent interdisciplinary study',
        place: 'Science · Technology · Business · Politics · Psychology · Philosophy · Economics · History',
        text:
          'A daily reading and writing practice that moves between disciplines instead of treating them as sealed rooms.',
      },
    ],
  },

  lovelace: {
    label: 'Founded by Lovepreet',
    title: 'Lovelace',
    text:
      'A design and digital studio for people who care about how an idea feels, how it works, and whether it will still make sense when the novelty wears off.',
    href: 'https://lovelace.co.in',
  },

  contact: {
    label: 'Contact',
    /* Split so the closing clause can be set in the italic lichen the hero
       uses for the surname — the two ends of the page rhyme. */
    title: 'A serious question is',
    titleAccent: 'a good place to begin.',
    text:
      'For research conversations, cybersecurity work, collaborations or a considered digital project, write to me directly.',
    cta: 'Email Lovepreet',
  },
};
