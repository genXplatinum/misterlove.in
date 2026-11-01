export const listenMeta = {
  path: '/listen/',
  title: 'Listen Books & Podcasts | MisterLove',
  description: 'Listen to Punjabi chapter discussions of DEBUNKED: ISLAM by Lovepreet Singh. Explore the chapters, follow the book, and pick up where you left off. English and Hindi are coming soon.',
  image: '/og/listen.png',
  imageAlt: 'The MisterLove listening room: DEBUNKED: ISLAM, Punjabi chapter discussions.',
  feed: '/podcasts/debunked-islam-pa.xml',
  artwork: '/podcast-covers/debunked-islam-pa.png',
};

export function podcastStructuredData(podcast, site = 'https://misterlove.in') {
  const seriesId = `${site}/listen/#debunked-islam-pa`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${site}/listen/`, name: listenMeta.title,
        description: listenMeta.description, url: `${site}/listen/`,
        mainEntity: { '@id': seriesId } },
      { '@type': 'PodcastSeries', '@id': seriesId, name: 'DEBUNKED: ISLAM — Punjabi chapter discussions',
        url: `${site}/listen/`, inLanguage: 'pa', image: site + listenMeta.artwork,
        webFeed: site + listenMeta.feed, publisher: { '@type': 'Organization', name: 'MisterLove', url: site },
        about: { '@type': 'Book', name: 'DEBUNKED: ISLAM', author: { '@type': 'Person', name: 'Lovepreet Singh' } },
        episode: podcast.episodes.filter(episode => episode.src).map(episode => ({
          '@type': 'PodcastEpisode', name: `Chapter ${episode.n}: ${episode.title}`,
          episodeNumber: episode.n, inLanguage: 'pa', url: `${site}/listen/?chapter=${episode.n}`,
          duration: `PT${Math.round(episode.duration)}S`, partOfSeries: { '@id': seriesId },
          associatedMedia: { '@type': 'AudioObject', contentUrl: site + episode.src,
            encodingFormat: 'audio/mpeg', contentSize: `${episode.bytes} bytes` },
        })),
      },
    ],
  };
}
