/* ============================================================
   LOVEPREET SINGH — personal portfolio
   Single source of truth for all content. Edit copy here.
   Identity order: cybersecurity professional first, founder second.
   ============================================================ */

export const profile = {
  name: 'Lovepreet Singh',
  first: 'Lovepreet',
  last: 'Singh',
  callsign: 'MISTERLOVE',
  roles: ['Ethical Hacker', 'Security Architect', 'Founder'],
  roleLine: 'Ethical Hacker · Security Architect · Founder',
  clearance: 'FOUNDER // FIVE RIVERS INC.',
  locations: ['London', 'Dubai', 'India'],
  coords: '28.6139°N · 77.2090°E',
  email: 'lovepreetsinghmk10@gmail.com',
  photo: import.meta.env.BASE_URL + 'founder.jpg', // drop a file at public/founder.jpg
  social: [
    { label: 'LinkedIn', short: 'IN', href: 'https://www.linkedin.com/in/fiverivers-founder/' },
    { label: 'Instagram', short: 'IG', href: 'https://www.instagram.com/misterlove.in' },
  ],
};

/* ---------- Anchor navigation (single-page, scene-to-scene) ---------- */
export const nav = [
  { label: 'Identity', to: '#identity', index: '01' },
  { label: 'Arsenal', to: '#arsenal', index: '02' },
  { label: 'Record', to: '#record', index: '03' },
  { label: 'Ventures', to: '#ventures', index: '04' },
  { label: 'Honours', to: '#recognition', index: '05' },
  { label: 'Journey', to: '#journey', index: '06' },
  { label: 'Contact', to: '#contact', index: '07' },
];

/* ---------- HERO ---------- */
export const hero = {
  kicker: 'TOP-100 ETHICAL HACKER · FOUNDER & MD, FIVE RIVERS INC.',
  // rotating one-liners under the name
  lines: [
    'I break systems so they can’t be broken.',
    'A decade studying how things fail — to build ones that don’t.',
    'Offense, understood. Defense, engineered.',
  ],
  lead:
    'I’m a security professional who turned a hacker’s instinct into a business. I find what others miss, secure what the world can’t afford to lose, and build the companies that do it at scale.',
  ctas: [
    { label: 'Open a secure channel', to: '#contact', primary: true },
    { label: 'View the record', to: '#record', primary: false },
  ],
};

/* ---------- IDENTITY / MANIFESTO ---------- */
export const identity = {
  index: '01',
  label: 'Identity',
  statement: [
    { text: 'Most people see a finished system. ', hl: false },
    { text: 'I see the way in.', hl: true },
  ],
  body: [
    'I’ve spent my life on both sides of the wall — learning exactly how software, networks and people fail, then rebuilding them so they hold. That instinct has put me among the world’s top-100 ethical hackers and onto cases that matter, working alongside national agencies when the stakes were real.',
    'But finding the flaw is only half the discipline. The other half is building — turning hard-won security knowledge into products, teams and companies. That’s the work I do now: a security-led technology group, engineered to last.',
  ],
  signature: 'Lovepreet Singh',
  meta: ['EST. CODING AGE 6', 'FIRST COMPANY AGE 15', 'THREE STARTUPS', 'STILL SHIPPING'],
};

/* ---------- ARSENAL (security capabilities) ---------- */
export const arsenal = {
  index: '02',
  label: 'Arsenal',
  title: 'What I do when the stakes are real.',
  modules: [
    {
      code: 'OPS·01',
      title: 'Offensive Security & Penetration Testing',
      desc: 'Red-team engagements, web/app/network pentests and adversary simulation — I attack systems the way a real threat actor would, then hand you the map of every door left open.',
      skills: ['Red teaming', 'Web & API exploitation', 'Network / infra', 'Social engineering'],
    },
    {
      code: 'DFI·02',
      title: 'Digital Forensics & Incident Response',
      desc: 'When something has already gone wrong, I trace it — reconstructing intrusions, recovering evidence and producing analysis that stands up where it counts. 15+ cyber-forensics cases supported.',
      skills: ['Intrusion analysis', 'Evidence recovery', 'Malware triage', 'Expert reporting'],
    },
    {
      code: 'INT·03',
      title: 'Threat Intelligence & Research',
      desc: 'Tracking how attackers think and operate — vulnerability research, OSINT and emerging-threat analysis that turns noise into early warning.',
      skills: ['Vulnerability research', 'OSINT', 'Threat modelling', 'Zero-day analysis'],
    },
    {
      code: 'ARC·04',
      title: 'Secure Architecture & DevSecOps',
      desc: 'Designing systems that are hard to break by construction — secure-by-design architecture, cloud hardening and security baked into the build pipeline, not bolted on after.',
      skills: ['Secure-by-design', 'Cloud hardening', 'Zero-trust', 'CI/CD security'],
    },
    {
      code: 'AIS·05',
      title: 'AI & Emerging-Tech Security',
      desc: 'Securing the next surface — AI/ML systems, IoT fleets and connected devices, the frontier where most defenders haven’t caught up yet.',
      skills: ['AI / ML security', 'IoT & devices', 'Model risk', 'Abuse resistance'],
    },
    {
      code: 'ADV·06',
      title: 'Advisory, Training & Leadership',
      desc: 'Board-level security strategy, building and leading security teams, and training the next generation of defenders — the multiplier that makes everything else scale.',
      skills: ['Security strategy', 'Team building', 'Workshops', 'Public speaking'],
    },
  ],
};

/* ---------- TRACK RECORD (stats + dossier) ---------- */
export const stats = [
  { value: 'Top 100', label: 'Ethical hackers worldwide' },
  { value: '15+', label: 'Cyber-forensics cases supported' },
  { value: '3', label: 'Startups founded' },
  { value: '3', label: 'Continents — LDN · DXB · IND' },
];

export const record = {
  index: '03',
  label: 'Track Record',
  title: 'The dossier.',
  intro:
    'A career measured in problems solved and systems secured — recognised by the industry, and trusted where it mattered most.',
  files: [
    {
      id: 'F-01',
      tag: 'NATIONAL SECURITY',
      title: 'Cyber-forensics for national agencies',
      body: 'Supported India’s Ministry of Defence, the CBI and state police across 15+ cyber-forensics and investigation cases — the kind of work where the analysis has to be right.',
      status: 'CLASSIFIED · CONFIRMED',
    },
    {
      id: 'F-02',
      tag: 'GLOBAL RANKING',
      title: 'Top-100 ethical hacker',
      body: 'Ranked among the world’s top-100 ethical hackers for sustained, high-impact security work across disclosure, research and live engagements.',
      status: 'VERIFIED',
    },
    {
      id: 'F-03',
      tag: 'INDUSTRY',
      title: 'Microsoft MVP',
      body: 'Awarded Microsoft’s Most Valuable Professional title for technical leadership and contribution to the security community.',
      status: 'AWARDED',
    },
    {
      id: 'F-04',
      tag: 'RECORDS',
      title: 'Guinness & Limca world records',
      body: 'Holder of Guinness World Records and Limca Book of Records entries — recognition that the work has measurably broken new ground.',
      status: 'ON RECORD',
    },
  ],
};

/* ---------- VENTURES (the business — light act) ---------- */
export const ventures = {
  index: '04',
  label: 'Ventures',
  title: 'The business of security.',
  intro:
    'Three startups in, the instinct is the same: find the gap, build the thing that closes it. Today that’s a security-led technology group — and the companies growing under it.',
  items: [
    {
      id: 'five-rivers',
      index: '01',
      name: 'Five Rivers Inc.',
      role: 'Founder & Managing Director',
      kind: 'Technology group',
      years: 'Flagship',
      blurb:
        'A multinational technology group built around cybersecurity, AI and IoT, with offices across London, Dubai and India. The parent vehicle for everything — scaling toward a billion-dollar valuation by 2030.',
      tags: ['Cybersecurity', 'AI', 'IoT'],
      featured: true,
    },
    {
      id: 'lovelace',
      index: '02',
      name: 'Lovelace',
      role: 'Founder',
      kind: 'Design & 3D web studio',
      years: '2024',
      blurb:
        'A design-and-engineering studio — “beautiful on the surface, engineered underneath.” Websites, brands and immersive 3D, built with a security team’s instincts.',
      tags: ['Design', 'WebGL', 'Brand'],
      href: 'https://lovelace.co.in',
    },
    {
      id: 'digithrive',
      index: '03',
      name: 'Digithrive Institute',
      role: 'Built & shipped',
      kind: 'EdTech platform',
      years: '2026',
      blurb:
        'A complete student-management CRM for a digital-marketing academy, with a bank-statement reconciler that auto-matches payments to the right student. Fintech-grade UX, hardened data layer.',
      tags: ['React 19', 'Fintech UX', 'Dashboards'],
    },
    {
      id: 'five-river-solutions',
      index: '04',
      name: 'Five River Solutions',
      role: 'Founder · Age 15',
      kind: 'First company',
      years: 'The start',
      blurb:
        'The company I founded at fifteen — where the habit of turning technical skill into a business began. Everything since traces back to here.',
      tags: ['Origin', 'Software', 'Services'],
    },
  ],
  goal: {
    big: '$1B',
    label: 'The 2030 goal — scaling Five Rivers Inc. toward a billion-dollar valuation.',
  },
};

/* ---------- RECOGNITION (awards wall — light act) ---------- */
export const recognition = {
  index: '05',
  label: 'Recognition',
  title: 'On the record.',
  awards: [
    { name: 'Microsoft MVP', note: 'Most Valuable Professional' },
    { name: 'Fortune 40 Under 40', note: 'Leaders to watch' },
    { name: 'Guinness World Records', note: 'Record holder' },
    { name: 'Limca Book of Records', note: 'Record holder' },
    { name: 'Bharat Yuva Award', note: 'National recognition' },
    { name: 'Young Achievers Award', note: 'Industry honour' },
  ],
};

/* ---------- JOURNEY (timeline — light act) ---------- */
export const journey = {
  index: '06',
  label: 'Journey',
  title: 'From age six to the war room.',
  milestones: [
    { when: 'Age 6', what: 'First line of code', detail: 'The obsession started early — long before it had a name.' },
    { when: 'Age 10', what: 'Shipped a first website', detail: 'Turning ideas into things that actually run, for the first time.' },
    { when: 'Age 15', what: 'Founded the first company', detail: 'Five River Solutions — the first time skill became a business.' },
    { when: 'Rise', what: 'Top-100 ethical hacker', detail: 'Years of disclosure, research and live engagements compounding into a global ranking.' },
    { when: 'Trust', what: 'National-agency casework', detail: '15+ cyber-forensics cases supporting the Ministry of Defence, CBI and state police.' },
    { when: 'Honours', what: 'MVP · Guinness · 40 Under 40', detail: 'The work, recognised — across industry, records and leadership.' },
    { when: 'Today', what: 'Founder & MD, Five Rivers Inc.', detail: 'A security-led technology group across London, Dubai and India.' },
    { when: '2030', what: 'The billion-dollar goal', detail: 'Scaling the group toward a billion-dollar valuation — the next system to build.' },
  ],
};

/* ---------- CONTACT (secure channel — dark bookend) ---------- */
export const contact = {
  index: '07',
  label: 'Contact',
  title: 'Open a secure channel.',
  body:
    'Security engagement, advisory, a venture, or a problem nobody else has cracked — if it’s serious, I want to hear it.',
  availability: 'Selectively available · Worldwide, remote-first',
};

/* ---------- Capabilities marquee ---------- */
export const marquee = [
  'Penetration Testing', 'Digital Forensics', 'Threat Intelligence', 'Red Teaming',
  'Secure Architecture', 'Incident Response', 'AI Security', 'OSINT',
  'Zero Trust', 'Vulnerability Research', 'DevSecOps', 'Security Strategy',
];
