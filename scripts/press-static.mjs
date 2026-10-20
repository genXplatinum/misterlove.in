import { features, carousels, featurePath, featureCard, featureStory, pressIntro, pressSite } from '../src/data/press.js';

const e = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const image = (src, alt) => `<img src="${e(src)}" alt="${e(alt)}" loading="lazy" />`;
const link = (url, label) => `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a>`;
const source = feature => `<p class="press-source"><span>${e(feature.publisher)}</span><span>${e(feature.kind)}${feature.archived ? ' · clipping' : ''}</span></p>`;
const nav = '<nav class="press-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/press/">Press &amp; features</a></nav>';

export function pressIndexBody() {
  const latest = features[0];
  return `<main id="main" class="press-page press-index">
    <header class="press-hero"><div class="press-opening container">
      <div class="press-opening__copy"><p class="press-kicker">Press &amp; features</p><p class="press-opening__name">Lovepreet Singh</p><h1>Articles<br />and mentions.</h1><p class="press-opening__intro">${e(pressIntro)}</p><a class="press-button" href="#collection">Browse the collection ↓</a><p class="press-opening__signature">Five Rivers Inc. / Lovelace</p></div>
      <div class="press-lead"><div class="press-lead__art"><img class="press-lead__portrait" src="/press/release-portrait.webp" alt="Lovepreet Singh — portrait accompanying the EIN Presswire release" width="1000" height="667" fetchpriority="high" /><a class="press-lead__clipping" href="${featurePath(latest)}" aria-label="View the EIN Presswire release">${image(latest.images[0].src, 'EIN Presswire release headline')}</a></div><div class="press-lead__caption"><p class="press-kicker">Latest press release · 9 October 2026</p><h2><a href="${featurePath(latest)}">Five Rivers Inc.<br />and Lovelace.</a></h2><p>Lovepreet Singh discusses technology, business needs and digital design at the two companies.</p><a class="press-text-link" href="${featurePath(latest)}">Read the press release ↗</a><small>${e(latest.credit)}</small></div></div>
    </div><div class="press-publisher-band"><div class="container"><p>Articles, releases and archived clippings</p><div><span class="press-publisher-band__ein">EIN Presswire</span><span class="press-publisher-band__dwi">DWI Media Wire <small>on Medium</small></span><span>GrowthBusiness</span><span class="press-publisher-band__yourstory">YourStory</span></div></div></div></header>
    <div class="container press-content"><section id="collection" class="press-collection"><div class="press-collection__head"><div><p class="press-kicker">The collection</p><h2>Articles, profiles<br />and clippings.</h2></div><span>${features.length} entries<br />Original links and archived images</span></div><div class="press-grid">${features.map(feature => `<article class="press-card press-card--${feature.accent}"><a class="press-card__image" href="${featurePath(feature)}">${image(feature.images[0].src, feature.images[0].alt)}</a><div class="press-card__body">${source(feature)}<h3><a href="${featurePath(feature)}">${e(feature.cardTitle)}</a></h3><p>${e(feature.excerpt)}</p><div class="press-card__foot"><span>${e(feature.dateLabel)}</span><a href="${featurePath(feature)}" aria-label="Open ${e(feature.title)}">↗</a></div></div></article>`).join('')}</div><p class="press-archive-note">Older clippings show past pages, not current endorsements. Entries without an original page link include the full image and its Instagram source.</p></section>
    <section class="press-originals"><div><p class="press-kicker">Original collections</p><h2>The 2022 Instagram posts</h2><p>Both posts are preserved in full. Each archived clipping links to the slide it came from.</p></div><div class="press-originals__posts">${carousels.map(post => `<a href="${post.url}" target="_blank" rel="noopener noreferrer">${image(`/press/clippings/carousel-${post.id}-${post.id === 'one' ? '02' : '07'}.webp`, '')}<span><strong>${post.title}</strong><small>${post.count} original slides · 9 October 2022</small><b>View on Instagram ↗</b></span></a>`).join('')}</div><details class="press-originals__all"><summary>Browse all 19 original slides <span>+</span></summary><div class="press-contact-sheet">${carousels.flatMap(post => Array.from({ length: post.count }, (_, i) => `<a href="${post.url}?img_index=${i + 1}" target="_blank" rel="noopener noreferrer">${image(`/press/clippings/carousel-${post.id}-${String(i + 1).padStart(2, '0')}.webp`, `Collection ${post.id}, slide ${i + 1}`)}<span>Collection ${post.id} · ${i + 1}</span></a>`)).join('')}</div></details></section>
    <section class="press-thanks"><p class="press-kicker">Keep reading</p><h2>Essays and<br />research.</h2><p>Read my work on history, belief and public life, or share this press collection.</p><a class="press-text-link" href="/writing/">Browse the writing →</a></section></div>
  </main>`;
}

export function pressFeatureBody(feature) {
  return `<main id="main" class="press-page press-detail container">${nav}<article>
    <header class="press-detail__heading">${source(feature)}<h1>${e(feature.title)}</h1><p>${e(feature.excerpt)}</p><span class="press-detail__date">${e(feature.dateLabel)}</span></header>
    <div class="press-detail__layout"><aside class="press-detail__context"><h2>The source</h2><p>${e(feature.credit)}</p>${feature.source ? link(feature.source, 'Read the original') : `<p>The original page link could not be found. The full clipping is shown here.</p>${link(feature.images[0].provenance, 'View Instagram source')}`}${feature.archived ? '<p class="press-detail__archive">This clipping records what the page said when it was saved. It does not verify the claims in the image.</p>' : ''}<div class="press-detail__sharing"><h2>Share this page</h2><p>Copy the page link or download an image to share. Each image includes a source credit.</p><div class="press-share__buttons"><a href="${featureCard(feature)}" download>Download post image ↓</a><a href="${featureStory(feature)}" download>Download story image ↓</a></div><a class="press-preview" href="${featureCard(feature)}">${image(featureCard(feature), `${feature.publisher} — social preview`)}Preview post image ↗</a></div></aside><div class="press-gallery">${feature.images.map(item => `<figure><a href="${item.src}" target="_blank" rel="noopener noreferrer">${image(item.src, item.alt)}</a><figcaption>${e(item.caption)}${item.provenance ? ` · ${link(item.provenance, 'Original slide')}` : ''}</figcaption></figure>`).join('')}</div></div>
    <nav class="press-next"><a href="/press/">← Back to the collection</a><a href="/writing/">Browse the writing →</a></nav>
  </article></main>`;
}

export function pressStructuredData(feature) {
  if (!feature) return {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Press & Features — Lovepreet Singh', description: pressIntro, url: `${pressSite}/press/`,
    mainEntity: { '@type': 'ItemList', itemListElement: features.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: pressSite + featurePath(item) })) },
  };
  return {
    '@context': 'https://schema.org', '@type': 'WebPage', name: feature.title,
    description: feature.excerpt, url: pressSite + featurePath(feature),
    about: { '@type': 'Person', name: 'Lovepreet Singh', url: pressSite },
    primaryImageOfPage: { '@type': 'ImageObject', url: pressSite + featureCard(feature), width: 1200, height: 630 },
    citation: { '@type': 'CreativeWork', name: feature.title, url: feature.source ?? feature.images[0].provenance },
    isPartOf: { '@type': 'CollectionPage', name: 'Press & Features — Lovepreet Singh', url: `${pressSite}/press/` },
  };
}
