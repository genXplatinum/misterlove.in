// Public sources and the original clippings supplied by Lovepreet Singh.
// A captured page is archival evidence, not a newly verified endorsement.
export const pressSite = 'https://misterlove.in';
export const pressIntro = 'Big ideas. Bigger ambition. Explore the stories, profiles and preserved clippings surrounding Lovepreet Singh, Five Rivers Inc. and Lovelace.';
export const pressCollectionCard = '/og/press-spotlight.jpg';
export const carousels = [
  { id: 'one', title: 'The first collection', count: 10, url: 'https://www.instagram.com/p/Cjd-c1gPh9-/' },
  { id: 'two', title: 'The second collection', count: 9, url: 'https://www.instagram.com/p/Cjd-zqXvYLj/' },
];
const clipping = (set, slide, alt) => ({
  src: `/press/clippings/carousel-${set}-${String(slide).padStart(2, '0')}.webp`,
  alt,
  provenance: `${carousels.find(c => c.id === set).url}?img_index=${slide}`,
  caption: `Original Instagram archive · collection ${set === 'one' ? 'one' : 'two'}, slide ${slide} · shared 9 October 2022`,
});

export const features = [
  {
    slug: 'ein-presswire-five-rivers-lovelace', publisher: 'EIN Presswire', kind: 'Press release',
    title: 'Lovepreet Singh Connects Technology and Design at Five Rivers Inc. and Lovelace',
    cardTitle: 'Technology meets thoughtful design.',
    excerpt: 'A founder’s perspective on connecting technical depth, practical business needs and considered digital experiences across Five Rivers Inc. and Lovelace.',
    dateLabel: '9 October 2026 · India', published: '2026-10-08T20:16:00Z',
    credit: 'News provided by Lovelace IT Solutions; distributed by EIN Presswire.',
    source: 'https://www.einpresswire.com/article/948264030/lovepreet-singh-connects-technology-and-design-at-five-rivers-inc-and-lovelace',
    images: [{ src: '/press/clippings/ein-presswire.jpg', alt: 'EIN Presswire masthead, release headline and Lovelace IT Solutions source credit', caption: 'Published release · headline and publisher capture' }],
    accent: 'oxblood',
  },
  {
    slug: 'dwi-media-youthful-visionary', publisher: 'DWI Media Wire on Medium', kind: 'Article',
    title: 'Youthful Visionary: Lovepreet Singh’s Journey from Hacker to Entrepreneurial Power-house.',
    cardTitle: 'From hacker to entrepreneur.',
    excerpt: 'A founder profile following Lovepreet Singh’s interests in cybersecurity and entrepreneurship, published by DWI Media News Network on Medium.',
    dateLabel: '31 August 2023', published: '2023-08-31',
    credit: 'DWI Media News Network, publishing as @dwimediawire on Medium.',
    source: 'https://medium.com/@dwimediawire/youthful-visionary-lovepreet-singhs-journey-from-hacker-to-entrepreneurial-power-house-60468715d441',
    images: [{ src: '/press/clippings/dwi-medium.png', alt: 'Medium article headline with DWI Media News Network byline and 31 August 2023 date', caption: 'Article capture · headline, author and publication date' }],
    accent: 'forest',
  },
  {
    slug: 'growth-business-founder-profile', publisher: 'GrowthBusiness', kind: 'Article', archived: true,
    title: 'All you need to know about Asia’s first-ever Business of making Businesses, Founded by 20 Years old cybersecurity professional Lovepreet Singh',
    cardTitle: 'The business of building businesses.',
    excerpt: 'A preserved founder-profile headline from GrowthBusiness, carrying a 21 January 2022 date in the original clipping.',
    dateLabel: '21 January 2022 · captured date',
    credit: 'GrowthBusiness masthead and headline appear in the supplied clipping.',
    images: [clipping('two', 7, 'GrowthBusiness masthead and founder-profile headline about Lovepreet Singh')],
    accent: 'forest',
  },
  {
    slug: 'economic-times-cybersecurity-commentary', publisher: 'The Economic Times', kind: 'Article', archived: true,
    title: 'Cybersecurity and the Union Budget — an archived comment',
    cardTitle: 'A voice in the cybersecurity conversation.',
    excerpt: 'An archived article excerpt quotes Lovepreet Singh of Five Rivers Security discussing budget announcements relating to technology and cybersecurity.',
    dateLabel: 'Preserved in October 2022',
    credit: 'The Economic Times mobile domain is visible in the original image. The awards panel below the excerpt is an advertisement.',
    images: [clipping('one', 6, 'Economic Times article excerpt quoting Lovepreet Singh on technology and cybersecurity budget announcements')],
    accent: 'oxblood',
  },
  {
    slug: 'yourstory-five-river-company-profile', publisher: 'YourStory', kind: 'Company profile',
    title: 'Five River Group of Industries — company profile',
    cardTitle: 'Five Rivers in the company directory.',
    excerpt: 'The YourStory company directory carries a Five River Group of Industries profile. These archived captures preserve the company description and team listing.',
    dateLabel: 'Company directory · archive shared 2022',
    credit: 'YourStory company directory. This is a company listing rather than a newsroom feature.',
    source: 'https://yourstory.com/companies/five-river-group-of-industries',
    images: [clipping('two', 1, 'YourStory company profile showing the Five Rivers legal name and a Lovepreet Singh team listing'), clipping('one', 5, 'Archived Five Rivers company-description continuation')],
    accent: 'oxblood',
  },
  {
    slug: 'crunchbase-founder-profile', publisher: 'Crunchbase', kind: 'Profile', archived: true,
    title: 'Lovepreet Singh — archived founder profile',
    cardTitle: 'A founder profile, preserved.',
    excerpt: 'A Crunchbase profile capture and its accompanying search result, saved in the original Instagram collection.',
    dateLabel: 'Preserved in October 2022',
    credit: 'Crunchbase is visible in the captured profile and search result; the search capture also includes an EasyLeadz listing.',
    images: [clipping('one', 2, 'Archived Crunchbase profile for Lovepreet Singh'), clipping('one', 1, 'Search results showing a Lovepreet Singh Crunchbase profile and EasyLeadz listing')],
    accent: 'forest',
  },
  {
    slug: 'researchgate-profile-capture', publisher: 'ResearchGate', kind: 'Profile', archived: true,
    title: 'Lovepreet Singh — ResearchGate search capture',
    cardTitle: 'A professional profile in the archive.',
    excerpt: 'An older search capture shows a ResearchGate profile result for Lovepreet Singh. The original image also contains a separate Bellabeat company result.',
    dateLabel: 'Preserved in October 2022',
    credit: 'Archived search-result capture, not a ResearchGate editorial article or a PitchBook feature about Lovepreet Singh.',
    images: [clipping('two', 5, 'Archived search result displaying a Lovepreet Singh ResearchGate profile and a separate Bellabeat PitchBook result')],
    accent: 'forest',
  },
  {
    slug: 'wellness-technology-case-study', publisher: 'Varun Srivatsa', kind: 'Case study', archived: true,
    title: 'How Can a Wellness Technology Company Play It Smart?',
    cardTitle: 'Technology through a wellness lens.',
    excerpt: 'A wellness-technology case study by Varun Srivatsa, dated 2 July 2022 in the captured page, and a related preserved company-background excerpt.',
    dateLabel: '2 July 2022 · captured date',
    credit: 'Author and date are visible in the clipping. The original publishing URL could not be located.',
    images: [clipping('two', 2, 'Wellness technology case-study headline credited to Varun Srivatsa on 2 July 2022'), clipping('two', 3, 'Related archived wellness-technology company-background excerpt')],
    accent: 'forest',
  },
  {
    slug: 'kaggle-thomas-bertotto-case-study', publisher: 'Kaggle community', kind: 'Case study', archived: true,
    title: 'Case Study — Thomas Bertotto',
    cardTitle: 'A mention in a community case study.',
    excerpt: 'A Kaggle notebook capture by Thomas Bertotto includes Lovepreet Singh in a Bellabeat company-background passage.',
    dateLabel: 'Preserved in October 2022',
    credit: 'Community-authored notebook hosted on Kaggle; this is not an endorsement by Kaggle.',
    images: [clipping('two', 4, 'Kaggle notebook headed Case Study — Thomas Bertotto with a company-background passage')],
    accent: 'forest',
  },
  {
    slug: 'zumutor-funding-article-clipping', publisher: 'Article archive', kind: 'Article', archived: true,
    title: 'Zumutor Biologics funding — an archived article clipping',
    cardTitle: 'Five River Ventures in a funding story.',
    excerpt: 'The preserved headline mentions Zumutor Biologics, a Series A2 round and Five River Ventures. The original article’s publisher and URL have not been verified.',
    dateLabel: '30 November 2019 · captured date',
    credit: 'Headline and date transcribed from the supplied image. No additional publisher or byline attribution is asserted here.',
    images: [clipping('one', 7, 'Archived Zumutor Biologics funding headline naming Five River Ventures')],
    accent: 'oxblood',
  },
  {
    slug: 'early-founder-profile-excerpt', publisher: 'Clipping archive', kind: 'Archived mention', archived: true,
    title: 'An early founder profile — preserved excerpt',
    cardTitle: 'An early chapter of the journey.',
    excerpt: 'A founder-profile excerpt preserved in the first Instagram collection. The original page’s title, publisher and URL are not visible in the capture.',
    dateLabel: 'Preserved in October 2022',
    credit: 'Source unidentified; original image preserved without assigning it to a publication.',
    images: [clipping('one', 8, 'Archived founder-profile excerpt mentioning Lovepreet Singh')],
    accent: 'oxblood',
  },
  {
    slug: 'bellabeat-page-captures', publisher: 'Wikipedia & search captures', kind: 'Archived mention', archived: true,
    title: 'Bellabeat — archived page and search captures',
    cardTitle: 'Bellabeat mentions, as captured.',
    excerpt: 'Four original captures preserve older Bellabeat page text and search panels that mention Lovepreet Singh.',
    dateLabel: 'Preserved in October 2022',
    credit: 'Historical page and search captures, rather than current verified company records or editorial endorsements.',
    images: [clipping('one', 3, 'Older mobile Wikipedia Bellabeat page capture'), clipping('one', 9, 'Archived Bellabeat company-description excerpt'), clipping('one', 10, 'Older Bellabeat search knowledge panel in a light theme'), clipping('two', 6, 'Older Bellabeat search knowledge panel in a dark theme')],
    accent: 'forest',
  },
  {
    slug: 'biographical-page-capture', publisher: 'Biographical archive', kind: 'Archived mention', archived: true,
    title: 'Lovepreet Singh — an archived biographical page',
    cardTitle: 'A biographical page from the archive.',
    excerpt: 'An older biographical page capture preserved in the first carousel. Its original live page could not be located.',
    dateLabel: 'Preserved in October 2022',
    credit: 'Archived page capture only. Awards and affiliations stated inside the old image are not independently verified by this collection.',
    images: [clipping('one', 4, 'Archived biographical page headed Lovepreet Singh')],
    accent: 'oxblood',
  },
  {
    slug: 'company-directory-captures', publisher: 'Directory archive', kind: 'Archived mention', archived: true,
    title: 'Company directory — archived location captures',
    cardTitle: 'A local footprint, preserved.',
    excerpt: 'Two supplied directory captures show a Punjab business location and a January 2022 update date. The company and directory names are outside the captured area.',
    dateLabel: '25 January 2022 · captured update',
    credit: 'Unidentified directory screenshots; preserved as part of the original collection without inventing a publisher or company attribution.',
    images: [clipping('two', 8, 'Archived directory location capture with Punjab address and 25 January 2022 update'), clipping('two', 9, 'Second supplied directory location capture')],
    accent: 'forest',
  },
];

export const featurePath = feature => `/press/${feature.slug}/`;
export const featureCard = feature => `/og/press-spotlight-${feature.slug}.jpg`;
export const featureStory = feature => `/press/social/${feature.slug}-spotlight-story.jpg`;
export const pressFilters = ['All', 'Articles', 'Profiles', 'Case studies', 'Archived mentions'];
export function matchesPressFilter(feature, filter) {
  if (filter === 'Articles') return ['Article', 'Press release'].includes(feature.kind);
  if (filter === 'Profiles') return ['Profile', 'Company profile'].includes(feature.kind);
  if (filter === 'Case studies') return feature.kind === 'Case study';
  if (filter === 'Archived mentions') return feature.kind === 'Archived mention';
  return true;
}
