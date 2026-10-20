/* ============================================================
   LOVEPREET SINGH — personal site
   Curated, public-facing biography and homepage copy.

   Keep factual claims modest. The research archive is the proof.
   ============================================================ */

export const profile = {
  name: 'Lovepreet Singh',
  first: 'Lovepreet',
  last: 'Singh',
  descriptor: 'Researcher · Writer · Founder of Lovelace · Student of philosophy',
  shortDescriptor: 'Research · Writing · Independent study',
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
  { label: 'Writing', to: '/writing', route: true },
  { label: 'Books', to: '/books', route: true },
  { label: 'Press', to: '/press/', route: true },
  { label: 'Method', to: '#method' },
  { label: 'About', to: '#about' },
  { label: 'Practice', to: '#practice' },
  { label: 'Education', to: '#education' },
  { label: 'Contact', to: '#contact' },
];

export const home = {
  hero: {
    eyebrow: profile.descriptor,
    title: 'I study how systems work and write about what I find.',
    lead:
      'My work spans cybersecurity, business strategy and public research. I founded Lovelace and taught myself the engineering I use. I write detailed investigations that check public claims against the record.',
    primary: { label: 'Read my work', to: '/writing', route: true },
    secondary: { label: 'About me', to: '#about' },
  },

  about: {
    label: 'About',
    title: 'My background.',
    statement:
      'I want to write the kind of argument that gets stronger the more you fact-check it, not weaker.',
    /* The clause the epigraph turns on. Set upright inside the italic, so
       the sentence carries its own emphasis instead of running flat. */
    statementEmphasis: 'gets stronger',
    paragraphs: [
      'I am Lovepreet Singh, a Certified Ethical Hacker, the founder of Lovelace, and the writer behind this archive. I took a B.Com in Business at Chandigarh University and am in the second year of an MBA in Business Strategy and Analysis at Panjab University, Chandigarh. I intend to pursue a doctorate after it. I read across technology, business, history, politics, psychology, philosophy and economics because the questions I study often overlap.',
      'I taught myself the technical skills I use. I have no science background and no computer-science degree. I learned C, C++ and data structures and algorithms on my own, followed by the MERN stack and security. I also prepared for the Certified Ethical Hacker qualification through independent study. I wanted to understand how computers work.',
      'I am an obsessive science and technology enthusiast. My business and technical training inform each other: strategy taught me to ask who benefits from a claim, while engineering taught me to examine how a system behaves and how its design shapes the result. I use both habits in my research.',
      'Philosophy is the part I would do for nothing. I am especially interested in epistemology: how we justify beliefs, when certainty is warranted, and what it takes to hold a position honestly. I also study ethics and political philosophy. Public arguments often mix questions of fact, the meaning of words and what we ought to value. I try to identify which question I am answering.',
      'I am wary of public arguments that sound certain before they have been examined carefully. I check the record, read opposing arguments and distinguish evidence from value judgements. Then I explain the reasoning in plain language. I use this archive to develop that method and prepare for the doctoral research I intend to pursue.',
    ],
    facts: [
      { label: 'Based in', value: 'Punjab, India' },
      { label: 'Qualified as', value: 'Certified Ethical Hacker' },
      { label: 'Self-taught in', value: 'C, C++, DSA and the MERN stack' },
      { label: 'Reading toward', value: 'Doctoral research, after the MBA' },
      { label: 'Writing principle', value: 'Simple language, checkable claims' },
    ],
    photoCaption: 'Lovepreet Singh.',
  },

  practice: {
    label: 'Practice',
    title: 'My work.',
    intro:
      'Across these fields, I try to understand how a system works and which assumptions it depends on, then explain my findings in a way someone else can use.',
    fields: [
      {
        n: '01',
        title: 'Research and writing',
        text:
          'I investigate independence, farmers’ movements, religion, gender, caste, merit and social justice. I begin by identifying the question and what would count as an answer. That helps me separate historical evidence from disagreements about meaning or values.',
        points: ['Primary records', 'Competing arguments', 'Plain-English synthesis'],
        href: '/writing',
        route: true,
        link: 'Open the research archive',
      },
      {
        n: '02',
        title: 'Lovelace',
        text:
          'I founded Lovelace, a design and digital studio. The studio combines research and engineering with visual design to build useful websites and interactive experiences.',
        points: ['Digital design', 'Web experiences', '3D and interaction'],
        href: 'https://lovelace.co.in',
        link: 'Visit lovelace.co.in',
      },
      {
        n: '03',
        title: 'Cybersecurity',
        text:
          'I work on risk, failure and trust in digital systems. As a Certified Ethical Hacker who trained through independent study, I help people understand what can go wrong and make better decisions about their security.',
        points: ['Offensive security', 'System review', 'Clear technical advice'],
      },
    ],
  },

  method: {
    label: 'Research method',
    title: 'How I research a question.',
    steps: [
      {
        n: '01',
        title: 'Begin with a real question.',
        text: 'I start with a question I have not already decided how to answer.',
      },
      {
        n: '02',
        title: 'Read across disagreement.',
        text: 'I read the strongest case for positions I disagree with and test my own against it.',
      },
      {
        n: '03',
        title: 'Check the important claims.',
        text: 'I look for original records, then relevant scholarship, and state what the evidence leaves uncertain.',
      },
      {
        n: '04',
        title: 'Write so anyone can follow.',
        text: 'I explain difficult ideas in plain language so readers can follow the reasoning.',
      },
    ],
  },

  writing: {
    label: 'Selected research',
    title: 'Explore the research.',
    intro:
      'These investigations explain the subject from the beginning, test common claims and include the evidence and disagreements that matter.',
  },

  education: {
    label: 'Education and inquiry',
    title: 'Education and independent study.',
    intro:
      'I continue to read, question and revise what I think I know. After my MBA, I intend to pursue doctoral research.',
    items: [
      {
        period: 'Next',
        title: 'Doctoral research',
        place: 'Planned on completion of the MBA',
        text:
          'I plan to pursue doctoral research after my MBA, with interests in epistemology, ethics and political philosophy. Publishing these investigations gives me practice in developing arguments that other people can examine.',
      },
      {
        period: 'Second year',
        title: 'MBA — Business Strategy and Analysis',
        place: 'Panjab University, Chandigarh',
        text:
          'I study strategy, analysis and how organisations make economic decisions.',
      },
      {
        period: 'Self-taught',
        title: 'Certified Ethical Hacker',
        place: 'Earned without a science background or a technology degree',
        text:
          'I learned C, C++ and data structures and algorithms through independent study, followed by the MERN stack and offensive security.',
      },
      {
        period: 'Completed',
        title: 'B.Com — Business',
        place: 'Chandigarh University',
        text:
          'My background in accounts and markets informs how I examine claims about who benefits from a policy.',
      },
      {
        period: 'Foundation',
        title: 'Senior secondary education',
        place: 'Jhamku Devi Senior Secondary School',
        text:
          'I completed senior secondary education before studying technology and the social sciences independently.',
      },
      {
        period: 'Continuing',
        title: 'Independent interdisciplinary study',
        place: 'Science · Technology · Business · Politics · Psychology · Philosophy · Economics · History',
        text:
          'I read and write across these subjects each day, following questions that connect them.',
      },
    ],
  },

  lovelace: {
    label: 'Founded by Lovepreet',
    title: 'Lovelace',
    text:
      'My design and digital studio, where I develop websites and interactive experiences.',
    href: 'https://lovelace.co.in',
  },

  contact: {
    label: 'Contact',
    /* Split so the closing clause can be set in the italic lichen the hero
       uses for the surname — the two ends of the page rhyme. */
    title: 'A serious question is',
    titleAccent: 'a good place to begin.',
    text:
      'For research conversations, cybersecurity work, collaborations or a digital project, write to me directly.',
    cta: 'Email Lovepreet',
  },
};
