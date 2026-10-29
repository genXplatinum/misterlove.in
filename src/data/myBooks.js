// Author paperbacks. This catalog is independent of the close-reading shelf.
// A store URL is added only after Pothi exposes a public, verified listing.
export const myBooksMeta = {
  path: '/my-books/',
  title: 'Books by Lovepreet Singh | MisterLove',
  description: 'Explore The Sacred Mirage, God Has an Evidence Problem, and DEBUNKED: ISLAM by Lovepreet Singh. Buy available paperbacks directly from Pothi.',
  image: '/og/my-books.png',
  imageAlt: 'The three books by Lovepreet Singh: The Sacred Mirage, God Has an Evidence Problem, and DEBUNKED: ISLAM.',
};

export const myBooks = [
  {
    id: 'god-has-an-evidence-problem',
    title: 'God Has an Evidence Problem',
    subtitle: 'Creation, Miracles, and the Claims We Were Taught to Believe',
    subject: 'Science & belief',
    question: 'What would change your mind?',
    description: 'An ancient Earth. A first human couple. A worldwide flood. Sixteen chapters examine familiar religious claims through science, historical sources and philosophy, explaining how the evidence was gathered and what it can establish.',
    cover: '/book-covers/god-has-an-evidence-problem.png',
    pages: 410,
    storeUrl: 'https://store.pothi.com/book/lovepreet-singh-god-has-evidence-problem/',
    previewUrl: 'https://publish.pothi.com/preview?sku=SKU50364',
    status: 'available',
    color: 'wine',
  },
  {
    id: 'the-sacred-mirage',
    title: 'The Sacred Mirage',
    subtitle: "Why I Don’t Believe · Book One: Belief, Evidence and Our Origins",
    subject: 'Origins & evidence',
    question: 'How do you know?',
    description: 'Begin with the question behind every serious argument. Follow the evidence for an ancient Earth, evolution, human ancestry and a hot early universe, with explanations that take the time to make sense without a science degree.',
    cover: '/book-covers/the-sacred-mirage.jpg',
    pages: 208,
    storeUrl: 'https://store.pothi.com/book/lovepreet-singh-the-sacred-mirage/',
    previewUrl: 'https://publish.pothi.com/preview?sku=SKU49658',
    status: 'available',
    color: 'forest',
  },
  {
    id: 'debunked-islam',
    title: 'DEBUNKED: ISLAM',
    subtitle: 'Testing scripture, miracles and moral authority',
    subject: 'Scripture & authority',
    question: 'Would you accept the same evidence from another religion?',
    description: 'A close examination of the Quran’s history, miracle claims and moral authority. Thirty-six chapters work through the arguments and the strongest documented replies, with 416 source notes readers can check for themselves.',
    cover: '/book-covers/debunked-islam.png',
    pages: 496,
    storeUrl: null,
    readingPath: '/writing/debunked-islam/',
    status: 'review',
    color: 'gold',
  },
];

export function myBooksStructuredData(site = 'https://misterlove.in') {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Books by Lovepreet Singh',
    url: `${site}${myBooksMeta.path}`,
    description: myBooksMeta.description,
    author: { '@type': 'Person', name: 'Lovepreet Singh', url: `${site}/` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: myBooks.map((book, index) => ({
        '@type': 'ListItem', position: index + 1,
        item: {
          '@type': 'Book', name: book.title,
          alternativeHeadline: book.subtitle,
          description: book.description,
          image: `${site}${book.cover}`,
          author: { '@type': 'Person', name: 'Lovepreet Singh' },
          inLanguage: 'en', bookFormat: 'https://schema.org/Paperback',
          numberOfPages: book.pages,
          url: book.storeUrl ?? `${site}${book.readingPath}`,
        },
      })),
    },
  };
}
