import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { carousels, features, featurePath, featureCard, featureStory, pressCollectionCard, pressSite, pressIntro, pressFilters, matchesPressFilter } from '../data/press';
import './Press.css';

function usePressMeta(feature) {
  useEffect(() => {
    const title = feature ? `${feature.title} | Lovepreet Singh — Press` : 'Press & Features | Lovepreet Singh';
    const description = feature?.excerpt ?? pressIntro;
    const url = pressSite + (feature ? featurePath(feature) : '/press/');
    const image = pressSite + (feature ? featureCard(feature) : pressCollectionCard);
    const previousTitle = document.title;
    document.title = title;
    const values = {
      'meta[name="description"]': description,
      'meta[property="og:title"]': title, 'meta[property="og:description"]': description,
      'meta[property="og:url"]': url, 'meta[property="og:type"]': 'website',
      'meta[property="og:image"]': image, 'meta[property="og:image:secure_url"]': image,
      'meta[property="og:image:type"]': 'image/jpeg',
      'meta[property="og:image:width"]': '1200', 'meta[property="og:image:height"]': '630',
      'meta[property="og:image:alt"]': feature ? `${feature.publisher} — ${feature.cardTitle} — Lovepreet Singh` : 'Press & features — Lovepreet Singh',
      'meta[name="twitter:title"]': title, 'meta[name="twitter:description"]': description,
      'meta[name="twitter:image"]': image, 'meta[name="twitter:card"]': 'summary_large_image',
      'meta[name="twitter:image:alt"]': feature ? `${feature.publisher} — ${feature.cardTitle} — Lovepreet Singh` : 'Press & features — Lovepreet Singh',
    };
    const restores = Object.entries(values).map(([selector, value]) => {
      let el = document.head.querySelector(selector);
      const created = !el;
      if (!el) {
        el = document.createElement('meta');
        const [, attr, name] = selector.match(/\[(name|property)="([^"]+)"\]/);
        el.setAttribute(attr, name); document.head.append(el);
      }
      const before = el.getAttribute('content'); el.setAttribute('content', value);
      return () => { if (created) el.remove(); else el.setAttribute('content', before); };
    });
    const canonical = document.head.querySelector('link[rel="canonical"]');
    const oldCanonical = canonical?.getAttribute('href');
    canonical?.setAttribute('href', url);
    return () => {
      document.title = previousTitle; restores.forEach(restore => restore());
      if (oldCanonical) canonical?.setAttribute('href', oldCanonical);
    };
  }, [feature]);
}

function ShareTools({ feature, compact = false }) {
  const [status, setStatus] = useState('');
  const [manual, setManual] = useState(false);
  const url = pressSite + (feature ? featurePath(feature) : '/press/');
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus('Link copied'); }
    catch { setManual(true); setStatus('Select and copy the link below.'); }
  }
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: feature?.title ?? 'Lovepreet Singh — Press & Features', url });
        setStatus('Shared');
      } else {
        await navigator.clipboard.writeText(url); setStatus('Link copied');
      }
    } catch (error) {
      if (error.name !== 'AbortError') { setManual(true); setStatus('Select and copy the link below.'); }
    }
  }
  return <div className={`press-share ${compact ? 'press-share--compact' : ''}`}>
    <div className="press-share__buttons">
      <button type="button" onClick={share}>Share this page <span aria-hidden="true">↗</span></button>
      <button type="button" onClick={copy}>Copy link <span aria-hidden="true">⧉</span></button>
      {!compact && <>
        <a href={feature ? featureCard(feature) : pressCollectionCard} download>Download post image <span aria-hidden="true">↓</span></a>
        {feature && <a href={featureStory(feature)} download>Download story image <span aria-hidden="true">↓</span></a>}
      </>}
    </div>
    <p className="press-share__status" role="status" aria-live="polite">{status}</p>
    {manual && <label className="press-share__manual">Share link<input readOnly value={url} onFocus={event => event.target.select()} /></label>}
  </div>;
}

function SourceLabel({ feature }) {
  return <p className="press-source"><span>{feature.publisher}</span><span>{feature.kind}{feature.archived ? ' · clipping' : ''}</span></p>;
}

function FeatureCard({ feature }) {
  return <article className={`press-card press-card--${feature.accent}`}>
    <Link className="press-card__image" to={featurePath(feature)} tabIndex={-1} aria-hidden="true">
      <img src={feature.images[0].src} alt="" loading="lazy" decoding="async" />
      <span className="press-card__view">View entry <span aria-hidden="true">↗</span></span>
    </Link>
    <div className="press-card__body">
      <SourceLabel feature={feature} />
      <h3><Link to={featurePath(feature)}>{feature.cardTitle}</Link></h3>
      <p>{feature.excerpt}</p>
      <div className="press-card__foot"><span>{feature.dateLabel}</span><Link to={featurePath(feature)} aria-label={`Open ${feature.title}`}><span aria-hidden="true">↗</span></Link></div>
    </div>
  </article>;
}

function OriginalCollections() {
  return <section className="press-originals" aria-labelledby="originals-title">
    <div><p className="press-kicker">Original collections</p><h2 id="originals-title">The 2022 Instagram posts</h2><p>Both posts are preserved in full. Each archived clipping links to the slide it came from.</p></div>
    <div className="press-originals__posts">{carousels.map(post => <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer">
      <img src={`/press/clippings/carousel-${post.id}-${post.id === 'one' ? '02' : '07'}.webp`} alt="" loading="lazy" />
      <span><strong>{post.title}</strong><small>{post.count} original slides · 9 October 2022</small><b>View on Instagram ↗</b></span>
    </a>)}</div>
    <details className="press-originals__all"><summary>Browse all 19 original slides <span aria-hidden="true">+</span></summary>
      <div className="press-contact-sheet">{carousels.flatMap(post => Array.from({ length: post.count }, (_, i) => <a key={`${post.id}-${i}`} href={`${post.url}?img_index=${i + 1}`} target="_blank" rel="noopener noreferrer">
        <img src={`/press/clippings/carousel-${post.id}-${String(i + 1).padStart(2, '0')}.webp`} alt={`Original collection ${post.id}, slide ${i + 1}`} loading="lazy" /><span>Collection {post.id} · {i + 1}</span>
      </a>))}</div>
    </details>
  </section>;
}

export default function Press() {
  const [filter, setFilter] = useState('All');
  usePressMeta();
  const latest = features[0];
  const results = features.filter(feature => matchesPressFilter(feature, filter));
  return <div className="press-page press-index">
    <header className="press-hero"><div className="press-opening container">
      <div className="press-opening__copy"><p className="press-kicker">Press & features</p><p className="press-opening__name">Lovepreet Singh</p><h1>Articles<br />and mentions.</h1><p className="press-opening__intro">{pressIntro}</p><a href="#collection" className="press-button">Browse the collection <span aria-hidden="true">↓</span></a><p className="press-opening__signature">Five Rivers Inc. <span aria-hidden="true">/</span> Lovelace</p></div>
      <div className="press-lead">
        <div className="press-lead__art"><img className="press-lead__portrait" src="/press/release-portrait.webp" alt="Lovepreet Singh, in the portrait accompanying the EIN Presswire release" fetchPriority="high" width="1000" height="667" /><Link to={featurePath(latest)} className="press-lead__clipping" aria-label="View the EIN Presswire release"><img src={latest.images[0].src} alt="EIN Presswire release headline" width="1255" height="569" /></Link></div>
        <div className="press-lead__caption"><p className="press-kicker">Latest press release · 9 October 2026</p><h2><Link to={featurePath(latest)}>Five Rivers Inc.<br />and Lovelace.</Link></h2><p>Lovepreet Singh discusses technology, business needs and digital design at the two companies.</p><Link to={featurePath(latest)} className="press-text-link">Read the press release <span aria-hidden="true">↗</span></Link><small>{latest.credit}</small></div>
      </div>
    </div><div className="press-publisher-band"><div className="container"><p>Articles, releases and archived clippings</p><div><span className="press-publisher-band__ein">EIN Presswire</span><span className="press-publisher-band__dwi">DWI Media Wire <small>on Medium</small></span><span>GrowthBusiness</span><span className="press-publisher-band__yourstory">YourStory</span></div></div></div></header>

    <div className="container press-content">
    <section id="collection" className="press-collection" aria-labelledby="collection-title">
      <div className="press-collection__head"><div><p className="press-kicker">The collection</p><h2 id="collection-title">Articles, profiles<br />and clippings.</h2></div><span>{features.length} entries<br />Original links and archived images</span></div>
      <div className="press-filters" aria-label="Filter the press collection">{pressFilters.map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div>
      <p className="press-results" role="status">{results.length} {results.length === 1 ? 'entry' : 'entries'}{filter !== 'All' ? ` · ${filter}` : ''}</p>
      <div className="press-grid">{results.map(feature => <FeatureCard key={feature.slug} feature={feature} />)}</div>
      <p className="press-archive-note">Older clippings show past pages, not current endorsements. Entries without an original page link include the full image and its Instagram source.</p>
    </section>

    <OriginalCollections />
    <section className="press-thanks"><p className="press-kicker">Keep reading</p><h2>Essays and<br />research.</h2><p>Read my work on history, belief and public life, or share this press collection.</p><ShareTools /><Link to="/writing/" className="press-text-link">Browse the writing <span aria-hidden="true">→</span></Link></section>
    </div>
  </div>;
}

function ImageGallery({ images }) {
  const dialog = useRef(null);
  const [active, setActive] = useState(0);
  function open(index) { setActive(index); dialog.current.showModal(); }
  return <div className="press-gallery">
    {images.map((image, index) => <figure key={image.src}><button type="button" onClick={() => open(index)} aria-label={`Enlarge image ${index + 1}: ${image.alt}`}><img src={image.src} alt={image.alt} loading={index ? 'lazy' : 'eager'} /><span>Enlarge original <b aria-hidden="true">↗</b></span></button><figcaption>{image.caption}{image.provenance && <> · <a href={image.provenance} target="_blank" rel="noopener noreferrer">Original slide ↗</a></>}</figcaption></figure>)}
    <dialog className="press-lightbox" ref={dialog} aria-label="Original clipping enlarged">
      <div className="press-lightbox__bar"><p>Original clipping · {active + 1} of {images.length}</p><button type="button" onClick={() => dialog.current.close()} aria-label="Close enlarged clipping">Close ×</button></div>
      <img src={images[active].src} alt={images[active].alt} />
      <div className="press-lightbox__bar"><a href={images[active].src} target="_blank" rel="noopener noreferrer">Open full image ↗</a>{images.length > 1 && <div><button type="button" onClick={() => setActive(value => (value - 1 + images.length) % images.length)}>← Previous</button><button type="button" onClick={() => setActive(value => (value + 1) % images.length)}>Next →</button></div>}</div>
    </dialog>
  </div>;
}

export function PressFeature() {
  const { slug } = useParams();
  const feature = features.find(item => item.slug === slug);
  usePressMeta(feature);
  if (!feature) return <div className="press-page container press-missing"><h1>Page not found.</h1><Link to="/press/">Return to the collection →</Link></div>;
  const position = features.indexOf(feature);
  const next = features[(position + 1) % features.length];
  return <article className="press-page press-detail container">
    <nav className="press-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/press/">Press & features</Link><span aria-hidden="true">/</span><span>{feature.publisher}</span></nav>
    <header className="press-detail__heading"><SourceLabel feature={feature} /><h1>{feature.title}</h1><p>{feature.excerpt}</p><span className="press-detail__date">{feature.dateLabel}</span></header>
    <div className="press-detail__layout"><aside className="press-detail__context"><h2>The source</h2><p>{feature.credit}</p>{feature.source ? <a className="press-button" href={feature.source} target="_blank" rel="noopener noreferrer">Read the original <span aria-hidden="true">↗</span></a> : <><p className="press-detail__archive">The original page link could not be found. The full clipping is shown here.</p><a className="press-button" href={feature.images[0].provenance} target="_blank" rel="noopener noreferrer">View Instagram source <span aria-hidden="true">↗</span></a></>}
      {feature.archived && <p className="press-detail__archive">This clipping records what the page said when it was saved. It does not verify the claims in the image.</p>}
      <div className="press-detail__sharing"><h2>Share this page</h2><p>Copy the page link or download an image to share. Each image includes a source credit.</p><ShareTools key={feature.slug} feature={feature} /><a className="press-preview" href={featureCard(feature)} target="_blank" rel="noopener noreferrer"><img src={featureCard(feature)} alt={`Social preview for ${feature.publisher}: ${feature.cardTitle}`} loading="lazy" width="1200" height="630" /><span>Preview post image ↗</span></a></div>
    </aside><ImageGallery key={feature.slug} images={feature.images} /></div>
    <nav className="press-next" aria-label="More press entries"><Link to="/press/">← Back to the collection</Link><Link to={featurePath(next)}><small>Up next · {next.publisher}</small><strong>{next.cardTitle} <span aria-hidden="true">→</span></strong></Link></nav>
  </article>;
}
