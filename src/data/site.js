/* ============================================================
   LOVEPREET SINGH — personal site
   Curated, public-facing biography and homepage copy.

   Keep factual claims modest. The research archive is the proof.
   ============================================================ */

export const profile = {
  name: 'Lovepreet Singh',
  first: 'Lovepreet',
  last: 'Singh',
  descriptor: 'Cybersecurity professional · Founder of Lovelace · Scholar · PhD candidate',
  shortDescriptor: 'Cybersecurity · Research · Lovelace',
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
      'My work moves between cybersecurity, history and public research. I founded Lovelace, work with digital systems, and build long-form investigations around difficult public questions.',
    primary: { label: 'Read my work', to: '/writing', route: true },
    secondary: { label: 'About me', to: '#about' },
  },

  about: {
    label: 'About',
    title: 'Curiosity became a method.',
    statement:
      'I want to write the kind of argument that gets stronger the more you fact-check it, not weaker.',
    paragraphs: [
      'I am Lovepreet Singh, a cybersecurity professional, founder of Lovelace, scholar and PhD candidate. I read across technology, business, history, politics, psychology, philosophy and economics because the questions that matter rarely stay inside one subject.',
      'My writing begins with a simple discomfort: public arguments are often confident long before they are careful. I go back to the record, read across disagreement, separate evidence from values, and explain what survives in plain language.',
      'I am Punjabi and come from a Sikh family shaped by the memory of Partition. My grandmother crossed on foot from what is now Pakistan to India. That family history is one reason I take memory, identity and political storytelling seriously.',
    ],
    facts: [
      { label: 'Based in', value: 'Punjab, India' },
      { label: 'Working across', value: 'Technology, history and public reasoning' },
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
          'I work on practical questions of risk, failure and trust in digital systems. The work is technical, but the purpose is simple: help people understand what can go wrong and make better decisions before it does.',
        points: ['Security research', 'System review', 'Clear technical advice'],
      },
      {
        n: '02',
        title: 'Research and writing',
        text:
          'I investigate subjects that public debate often reduces to slogans: independence, farmers’ movements, religion, gender, caste, merit and social justice.',
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
      'Education is not a finished badge here. It is a continuing practice of reading, testing and revising what I think I know.',
    items: [
      {
        period: 'Current',
        title: 'PhD candidate',
        place: 'Doctoral study in progress',
        text:
          'Formal research continues alongside an independent body of public writing and technology work.',
      },
      {
        period: 'Foundation',
        title: 'Senior secondary education',
        place: 'Jhamku Devi Senior Secondary School',
        text:
          'The formal foundation before a wider, self-directed path through technology and the social sciences.',
      },
      {
        period: 'Ongoing',
        title: 'Independent interdisciplinary study',
        place: 'Business · Technology · Politics · Psychology · Philosophy · Economics · History',
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
    title: 'A serious question is a good place to begin.',
    text:
      'For research conversations, cybersecurity work, collaborations or a considered digital project, write to me directly.',
    cta: 'Email Lovepreet',
  },
};
