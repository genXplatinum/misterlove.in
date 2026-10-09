import { features, carousels, featurePath, featureCard, featureStory, pressIntro, pressSite } from '../src/data/press.js';

const e = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const image = (src, alt) => `<img src="${e(src)}" alt="${e(alt)}" loading="lazy" />`;
const link = (url, label) => `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a>`;
const source = feature => `<p class="press-source"><span>${e(feature.publisher)}</span><span>${e(feature.kind)}${feature.archived ? ' · clipping' : ''}</span></p>`;
const nav = '<nav class="press-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/press/">Press &amp; features</a></nav>';

export function pressIndexBody() {
  return `<main id="main" class="press-page container">${nav}
    <header class="press-opening"><div class="press-opening__copy"><p class="press-kicker">Lovepreet Singh · Press &amp; features</p><h1>Stories,<br />beyond<br /><em>this site.</em></h1><p class="press-opening__intro">${e(pressIntro)}</p><a class="press-button" href="#collection">Explore the collection ↓</a></div><div class="press-lead"><div class="press-lead__art">${image('/press/release-portrait.webp', 'Lovepreet Singh — portrait accompanying the EIN Presswire release').replace('<img', '<img class="press-lead__portrait"')}</div><div class="press-lead__caption"><p class="press-kicker">Latest release · 9 October 2026</p><h2><a href="${featurePath(features[0])}">Five Rivers Inc.<br />&amp; Lovelace.</a></h2><p>Technology, design and the work of making ideas useful.</p><a class="press-text-link" href="${featurePath(features[0])}">Read the feature ↗</a><small>${e(features[0].credit)}</small></div></div></header>
    <section id="collection" class="press-collection"><div class="press-collection__head"><h2>In print. Online. On record.</h2><span>${features.length} entries · originals &amp; preserved clippings</span></div><div class="press-grid">${features.map(feature => `<article class="press-card press-card--${feature.accent}"><a class="press-card__image" href="${featurePath(feature)}">${image(feature.images[0].src, feature.images[0].alt)}</a><div class="press-card__body">${source(feature)}<h3><a href="${featurePath(feature)}">${e(feature.cardTitle)}</a></h3><p>${e(feature.excerpt)}</p><div class="press-card__foot"><span>${e(feature.dateLabel)}</span><a href="${featurePath(feature)}" aria-label="Open ${e(feature.title)}">↗</a></div></div></article>`).join('')}</div><p class="press-archive-note">Older clippings reflect the pages as captured. Where an original page could not be located, its Instagram source and full image are preserved here. An archived mention is not a current endorsement.</p></section>
    <section class="press-originals"><h2>Kept, as they were shared.</h2><p>Both Instagram collections, preserved in full.</p><div class="press-contact-sheet">${carousels.flatMap(post => Array.from({ length: post.count }, (_, i) => `<a href="${post.url}?img_index=${i + 1}">${image(`/press/clippings/carousel-${post.id}-${String(i + 1).padStart(2, '0')}.webp`, `Collection ${post.id}, slide ${i + 1}`)}<span>Collection ${post.id} · ${i + 1}</span></a>`)).join('')}</div>${carousels.map(post => link(post.url, post.title)).join(' · ')}</section>
    <section class="press-thanks"><h2>Every story has<br /><em>more than one voice.</em></h2><p>Thank you to the writers, editors and platforms that have made space for these stories — and to everyone who has followed the work along the way.</p><a href="/writing/">Discover the work behind the stories →</a></section>
  </main>`;
}

export function pressFeatureBody(feature) {
  return `<main id="main" class="press-page press-detail container">${nav}<article>
    <header class="press-detail__heading">${source(feature)}<h1>${e(feature.title)}</h1><p>${e(feature.excerpt)}</p><span class="press-detail__date">${e(feature.dateLabel)}</span></header>
    <div class="press-detail__layout"><aside class="press-detail__context"><h2>The source</h2><p>${e(feature.credit)}</p>${feature.source ? link(feature.source, 'Read the original') : `<p>The original article link could not be located. The complete supplied clipping remains available here.</p>${link(feature.images[0].provenance, 'View Instagram source')}`}${feature.archived ? '<p class="press-detail__archive">An archival capture reflects the page at the time it was saved. It is not a current verification of the claims inside the image.</p>' : ''}<div class="press-detail__sharing"><h2>Take the story with you.</h2><p>Share this page or save its ready-to-post artwork. The source credit travels with the card.</p><div class="press-share__buttons"><a href="${featureCard(feature)}" download>Download social card ↓</a><a href="${featureStory(feature)}" download>Download Story ↓</a></div><a class="press-preview" href="${featureCard(feature)}">${image(featureCard(feature), `${feature.publisher} — social preview`)}Preview social card ↗</a></div></aside><div class="press-gallery">${feature.images.map(item => `<figure><a href="${item.src}" target="_blank" rel="noopener noreferrer">${image(item.src, item.alt)}</a><figcaption>${e(item.caption)}${item.provenance ? ` · ${link(item.provenance, 'Original slide')}` : ''}</figcaption></figure>`).join('')}</div></div>
    <nav class="press-next"><a href="/press/">← Back to the collection</a><a href="/writing/">Explore the writing →</a></nav>
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
