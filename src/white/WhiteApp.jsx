import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { PlainReadingProvider } from '../components/ExperienceProvider';
import EditionSwitch from '../components/EditionSwitch';
import { Wordmark } from '../components/Logo';
import { home, profile } from '../data/site';
import { pieces, livePartsOf, isInProgress } from '../data/writing';
import { books, booksMeta, liveStudiesOf } from '../data/books';
import ReadingRoom from './ReadingRoom';
import PublicationCover from './PublicationCover';
import ReaderCovers from './ReaderCovers';
import './White.css';
import './WhitePremium.css';

const Topic = lazy(() => import('../pages/Topic'));
const Article = lazy(() => import('../pages/Article'));
const Book = lazy(() => import('../pages/Book'));
const Study = lazy(() => import('../pages/Study'));
const MyBooks = lazy(() => import('../pages/MyBooks'));
const Press = lazy(() => import('../pages/Press'));
const PressFeature = lazy(() => import('../pages/Press').then(module => ({ default: module.PressFeature })));

const Arrow = ({ diagonal = false }) => <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" /></svg>;
const primary = [{ to: '/writing', label: 'Writing' }, { to: '/my-books/', label: 'My Books' }, { to: '/books', label: 'Books' }, { to: '/about', label: 'About' }, { to: '/press', label: 'Press' }];

function PageMeta({ title, description }) {
  const { pathname } = useLocation();
  const currentPath = pathname.replace(/\/$/, '') || '/';
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | Lovepreet Singh`;
    const canonical = `https://misterlove.in${currentPath === '/' ? '/white/' : currentPath === '/about' ? '/' : `${currentPath}/`}`;
    const image = `https://misterlove.in/og/${currentPath === '/writing' ? 'writing' : currentPath === '/books' ? 'books' : 'white-edition'}.png`;
    const changes = [
      ['meta[name="description"]', 'content', description],
      ['link[rel="canonical"]', 'href', canonical],
      ['meta[property="og:url"]', 'content', canonical],
      ['meta[property="og:title"]', 'content', title],
      ['meta[property="og:description"]', 'content', description],
      ['meta[property="og:image"]', 'content', image],
      ['meta[property="og:image:secure_url"]', 'content', image],
      ['meta[property="og:image:type"]', 'content', 'image/png'],
      ['meta[property="og:image:alt"]', 'content', title],
      ['meta[name="twitter:title"]', 'content', title],
      ['meta[name="twitter:description"]', 'content', description],
      ['meta[name="twitter:image"]', 'content', image],
      ['meta[name="twitter:image:alt"]', 'content', title],
    ].map(([selector, attribute, value]) => {
      const element = document.head.querySelector(selector);
      if (!element) return () => {};
      const old = element.getAttribute(attribute);
      element.setAttribute(attribute, value);
      return () => old === null ? element.removeAttribute(attribute) : element.setAttribute(attribute, old);
    });
    return () => { document.title = previous; changes.forEach(restore => restore()); };
  }, [title, description, currentPath]);
  return null;
}

function WhiteNav() {
  const { pathname } = useLocation();
  const menu = useRef(null);
  const closeMenu = () => { if (menu.current) menu.current.open = false; };
  useEffect(() => { if (menu.current) menu.current.open = false; }, [pathname]);
  useEffect(() => {
    const details = menu.current;
    const desktop = window.matchMedia('(min-width: 701px)');
    const dismissOutside = event => {
      if (!details.contains(event.target)) details.open = false;
    };
    const closeOnDesktop = event => { if (event.matches) details.open = false; };
    document.addEventListener('pointerdown', dismissOutside);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, []);
  return <header className="white-header">
    <Link className="white-wordmark" to="/" aria-label="MisterLove home"><Wordmark /></Link>
    <nav className="white-desktop-nav" aria-label="Primary navigation">
      {primary.map(item => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
    </nav>
    <a className="white-header-contact" href={`mailto:${profile.email}`}>Get in touch <Arrow diagonal /></a>
    <details ref={menu} className="white-mobile-menu"
      onKeyDown={event => {
        if (event.key === 'Escape' && menu.current?.open) {
          event.preventDefault();
          closeMenu();
          menu.current.querySelector('summary')?.focus();
        }
      }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) closeMenu(); }}>
      <summary>Menu <span aria-hidden="true">+</span></summary>
      <div className="white-menu-panel">
        <nav className="white-menu-links" aria-label="Mobile navigation">{primary.map(item => <NavLink key={item.to} to={item.to} onClick={closeMenu}>{item.label}</NavLink>)}<a href={`mailto:${profile.email}`} onClick={closeMenu}>Get in touch</a></nav>
        <div className="white-menu-edition"><span>Your edition</span><EditionSwitch onChange={closeMenu} /></div>
      </div>
    </details>
  </header>;
}

function WhiteFooter() {
  const base = import.meta.env.BASE_URL;
  return <footer className="white-footer" id="contact">
    <div className="white-contact">
      <div><p>Send me a question, correction or idea.</p><h2>Write to me.</h2></div>
      <a className="white-contact-email" href={`mailto:${profile.email}`}>{profile.email}<Arrow diagonal /></a>
    </div>
    <div className="white-footer-grid">
      <div><Link to="/" className="white-wordmark" aria-label="MisterLove home"><Wordmark /></Link><p>Independent research and writing.<br />Lovepreet Singh, Punjab, India.</p></div>
      <nav aria-label="Footer navigation">{primary.map(item => <Link key={item.to} to={item.to}>{item.label}</Link>)}<a href={`${base}feed.xml`}>RSS feed</a></nav>
      <div className="white-footer-social">{profile.social.map(item => <a key={item.label} href={item.href} target="_blank" rel="noreferrer">{item.label}<Arrow diagonal /></a>)}</div>
    </div>
    <div className="white-footer-base"><span>© {new Date().getFullYear()} Lovepreet Singh</span>
      <EditionSwitch />
      <a href="#main" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); document.getElementById('main')?.focus({ preventScroll: true }); }}>Back to top ↑</a>
    </div>
  </footer>;
}

function WorkRow({ piece }) {
  return <li className="white-work-row"><Link to={`/writing/${piece.slug}`}>
    <span className="white-archive-cover" aria-hidden="true"><PublicationCover piece={piece} compact /></span>
    <span className="white-work-copy"><span className="white-work-category">{piece.topic.split('·')[0].trim()}</span><h3>{piece.title}</h3><p>{piece.standfirst}</p></span>
    <span className="white-work-format">{livePartsOf(piece)} {piece.unit === 'volume' ? 'volumes' : 'parts'}<span>{isInProgress(piece) ? 'In progress' : 'Complete'}</span></span>
    <Arrow />
  </Link></li>;
}

function WhiteHome() {
  return <><PageMeta title="MisterLove: leave no question unasked" description="Research by Lovepreet Singh on belief, science and society. Read the arguments and check the sources." /><ReadingRoom /></>;
}

function WhiteWriting() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const subject = params.get('subject') ?? 'all';
  const setFilter = (key, value) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (!value || (key === 'subject' && value === 'all')) next.delete(key); else next.set(key, value);
    return next;
  }, { replace: true, preventScrollReset: true });
  const topics = useMemo(() => [...new Set(pieces.flatMap(piece => piece.topic.split('·').map(token => token.trim())))].sort(), []);
  const results = useMemo(() => pieces.filter(piece => {
    const matchSubject = subject === 'all' || piece.topic.split('·').map(token => token.trim()).includes(subject);
    const text = `${piece.title} ${piece.subtitle} ${piece.standfirst} ${piece.topic} ${(piece.keywords ?? []).join(' ')}`.toLowerCase();
    return matchSubject && text.includes(query.toLowerCase().trim());
  }), [query, subject]);
  return <section className="white-archive white-shell"><PageMeta title="Writing | MisterLove" description="Search the MisterLove research archive by Lovepreet Singh. Find a collection by title or subject." /><header className="white-page-heading"><p>The research archive</p><h1>Find something to read.</h1><p>My investigations bring competing arguments together with the evidence and sources you need to check them.</p></header><form className="white-search" role="search" aria-label="Search the writing" onSubmit={event => event.preventDefault()}><div><label htmlFor="white-search">Search the archive</label><input id="white-search" type="search" placeholder="Search titles, questions or subjects" value={query} onChange={event => setFilter('q', event.target.value)} /></div><div><label htmlFor="white-subject">Subject</label><select id="white-subject" value={subject} onChange={event => setFilter('subject', event.target.value)}><option value="all">All subjects</option>{topics.map(topic => <option key={topic}>{topic}</option>)}</select></div></form><div className="white-result-count" aria-live="polite">{results.length} {results.length === 1 ? 'collection' : 'collections'}{query || subject !== 'all' ? <button type="button" onClick={() => { setParams({}, { replace: true }); }}>Clear filters</button> : <span>Newest first</span>}</div>{results.length ? <ul className="white-work-list">{results.map(piece => <WorkRow key={piece.slug} piece={piece} />)}</ul> : <div className="white-empty"><h2>No matching collections.</h2><p>Try another search or clear the filters to see the full archive.</p></div>}</section>;
}

function WhiteAbout() {
  return <section className="white-about-page white-shell"><PageMeta title="About | MisterLove" description="About Lovepreet Singh, the researcher and writer behind MisterLove and founder of Lovelace. His work, education and research method." /><header className="white-page-heading"><p>About Lovepreet Singh</p><h1>About<br />my work.</h1><p>I’m a researcher and writer, and I founded Lovelace. I’m still learning.</p></header><div className="white-biography"><figure><img src={profile.photo} alt="Lovepreet Singh" width="560" height="650" /><figcaption>Punjab, India.</figcaption></figure><div>{home.about.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></div><section className="white-about-detail" aria-labelledby="white-practice-title"><h2 id="white-practice-title">What I work on</h2>{home.practice.fields.map(field => <div key={field.title}><h3>{field.title}</h3><p>{field.text}</p>{field.href && (field.route ? <Link className="white-text-link" to={field.href}>{field.link}<Arrow /></Link> : <a className="white-text-link" href={field.href} target="_blank" rel="noreferrer">{field.link}<Arrow diagonal /></a>)}</div>)}</section><section className="white-about-detail" aria-labelledby="white-education-title"><h2 id="white-education-title">Education & learning</h2>{home.education.items.map(item => <div key={item.title}><span>{item.period}</span><h3>{item.title}</h3><p>{item.place}</p><p>{item.text}</p></div>)}</section></section>;
}

function WhiteBooks() {
  return <section className="white-archive white-shell"><PageMeta title="Books, read closely | MisterLove" description="Close readings of Chesterton, Horace and Harari by Lovepreet Singh, examining what each book claims and how its arguments hold up." /><header className="white-page-heading"><p>The reading shelf</p><h1>Books, read closely.</h1><p>I look at what each book claims and make the strongest case for its argument before checking the assumptions and evidence.</p></header><div className="white-reading-list">{books.map(book => <article key={book.slug}><Link to={`/books/${book.slug}`}><div className="white-reading-credit"><span>{book.author}</span><span>{book.bookYear}</span></div><h2>{book.title}</h2><p className="white-reading-subtitle">{book.subtitle}</p><p>{book.standfirst}</p><div className="white-reading-bottom"><span>{liveStudiesOf(book)} {liveStudiesOf(book) === 1 ? 'published study' : 'published studies'}</span><span>Read the studies <Arrow /></span></div></Link></article>)}</div><details className="white-book-method"><summary>How I read these books <span aria-hidden="true">+</span></summary><div>{booksMeta.method.map(step => <section key={step.n}><h3>{step.t}</h3><p>{step.d}</p></section>)}</div></details></section>;
}

function WhiteNotFound() {
  return <section className="white-shell white-empty"><PageMeta title="Page not found | MisterLove" description="This page could not be found." /><h1>Page not found.</h1><p>The address may have changed.</p><Link to="/writing" className="white-button">Browse the writing <Arrow /></Link></section>;
}

function WhiteFrame() {
  const location = useLocation();
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('white-edition');
    const robots = document.querySelector('meta[name="robots"]') ?? document.head.appendChild(document.createElement('meta'));
    robots.name = 'robots'; robots.content = 'noindex, follow';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
    return () => root.classList.remove('white-edition');
  }, []);
  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [location.pathname, location.hash]);
  return <div className="white-site"><a className="white-skip" href="#main">Skip to content</a><WhiteNav /><main id="main" tabIndex="-1"><Suspense fallback={<div className="white-shell white-loading" role="status">Loading the page…</div>}><Routes><Route path="/" element={<WhiteHome />} /><Route path="/about" element={<WhiteAbout />} /><Route path="/writing" element={<WhiteWriting />} /><Route path="/writing/:slug" element={<Topic />} /><Route path="/hi/writing/:slug" element={<Topic />} /><Route path="/pa/writing/:slug" element={<Topic />} /><Route path="/writing/:slug/:part" element={<Article />} /><Route path="/hi/writing/:slug/:part" element={<Article />} /><Route path="/pa/writing/:slug/:part" element={<Article />} /><Route path="/my-books" element={<MyBooks />} /><Route path="/books" element={<WhiteBooks />} /><Route path="/books/:book" element={<Book />} /><Route path="/books/:book/:study" element={<Study />} /><Route path="/hi/books/:book/:study" element={<Study />} /><Route path="/press" element={<Press />} /><Route path="/press/:slug" element={<PressFeature />} /><Route path="*" element={<WhiteNotFound />} /></Routes></Suspense></main><WhiteFooter /><ReaderCovers /></div>;
}

export default function WhiteApp() {
  return <PlainReadingProvider><WhiteFrame /></PlainReadingProvider>;
}
