import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { myBooks, myBooksMeta } from '../data/myBooks';
import './MyBooks.css';

function Arrow({ diagonal = false }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function BookCard({ book, index }) {
  const available = book.status === 'available' && Boolean(book.storeUrl);
  return <article className={`author-book author-book--${book.color}`} id={book.id} aria-labelledby={`${book.id}-title`}>
    <div className="author-book__stage">
      <span className="author-book__number" aria-hidden="true">0{index + 1}</span>
      <img className="author-book__cover" src={book.cover} alt={`${book.title} — approved paperback cover`} width="600" height="900" loading="lazy" decoding="async" />
      <span className={`author-book__status${available ? '' : ' author-book__status--soon'}`}><i aria-hidden="true" />{available ? 'Available on Pothi' : 'Paperback coming soon'}</span>
    </div>
    <div className="author-book__copy">
      <p className="author-book__subject">{book.subject}</p>
      <h3 id={`${book.id}-title`}>{book.title}</h3>
      <p className="author-book__subtitle">{book.subtitle}</p>
      <p className="author-book__question">{book.question}</p>
      <p className="author-book__description">{book.description}</p>
      <p className="author-book__details">English <span aria-hidden="true">/</span> Paperback <span aria-hidden="true">/</span> {book.pages} pages</p>
      <div className="author-book__actions">
        {available ? <a className="bookshop-buy" href={book.storeUrl} target="_blank" rel="noopener noreferrer" aria-label={`Buy ${book.title} on Pothi (opens in a new tab)`}><span>Buy Now <small>on Pothi</small></span><Arrow diagonal /></a>
          : <span className="bookshop-pending">Coming soon <span>Pothi review pending</span></span>}
        {book.previewUrl && <a className="bookshop-preview" href={book.previewUrl} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${book.title} on Pothi (opens in a new tab)`}>Read a preview <Arrow diagonal /></a>}
        {book.readingPath && <Link className="bookshop-preview" to={book.readingPath}>Read the complete book <Arrow /></Link>}
      </div>
    </div>
  </article>;
}

export default function MyBooks() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = myBooksMeta.title;
    const canonical = `https://misterlove.in${myBooksMeta.path}`;
    const image = `https://misterlove.in${myBooksMeta.image}`;
    const edits = [
      ['meta[name="description"]', 'content', myBooksMeta.description],
      ['link[rel="canonical"]', 'href', canonical],
      ['meta[property="og:type"]', 'content', 'website'],
      ['meta[property="og:url"]', 'content', canonical],
      ['meta[property="og:title"]', 'content', myBooksMeta.title],
      ['meta[property="og:description"]', 'content', myBooksMeta.description],
      ['meta[property="og:image"]', 'content', image],
      ['meta[property="og:image:secure_url"]', 'content', image],
      ['meta[property="og:image:alt"]', 'content', myBooksMeta.imageAlt],
      ['meta[name="twitter:title"]', 'content', myBooksMeta.title],
      ['meta[name="twitter:description"]', 'content', myBooksMeta.description],
      ['meta[name="twitter:image"]', 'content', image],
      ['meta[name="twitter:image:alt"]', 'content', myBooksMeta.imageAlt],
    ].map(([selector, attr, value]) => {
      const element = document.head.querySelector(selector);
      if (!element) return () => {};
      const previous = element.getAttribute(attr);
      element.setAttribute(attr, value);
      return () => previous === null ? element.removeAttribute(attr) : element.setAttribute(attr, previous);
    });
    return () => { document.title = previousTitle; edits.forEach(restore => restore()); };
  }, []);

  return <div className="bookshop">
    <header className="bookshop__hero bookshop__shell">
      <div className="bookshop__intro">
        <p className="bookshop__eyebrow"><span /> Books by Lovepreet Singh</p>
        <h1 className="bookshop__title">Belief, put to<br /><em>the test.</em></h1>
        <p className="bookshop__lead">For the questions you were told not to ask. Three books on belief and evidence, with the reasoning explained and the sources open to scrutiny.</p>
        <a className="bookshop__browse" href="#the-books">Explore the books <Arrow /></a>
      </div>
      <div className="bookshop__exhibit" aria-hidden="true">
        <span className="bookshop__halo" />
        <div className="bookshop__volumes">
          <img className="bookshop__volume bookshop__volume--left" src={myBooks[1].cover} alt="" width="600" height="900" decoding="async" />
          <img className="bookshop__volume bookshop__volume--middle" src={myBooks[0].cover} alt="" width="600" height="900" fetchPriority="high" decoding="async" />
          <img className="bookshop__volume bookshop__volume--right" src={myBooks[2].cover} alt="" width="600" height="900" decoding="async" />
        </div>
        <span className="bookshop__exhibit-caption">Independent thought. In print.</span>
      </div>
    </header>
    <div className="bookshop__strip"><div className="bookshop__shell"><span>03 books</span><span>Plain English</span><span>Sources you can check</span><span>By Lovepreet Singh</span></div></div>
    <section className="bookshop__catalog bookshop__shell" id="the-books" aria-labelledby="bookshop-catalog-title">
      <div className="bookshop__catalog-heading"><div><p className="bookshop__eyebrow">The author’s shelf</p><h2 id="bookshop-catalog-title">Choose your next question.</h2></div><p>Available paperbacks are printed to order.<br />Buy directly from the Pothi store.</p></div>
      <div className="bookshop__grid">{myBooks.map((book, index) => <BookCard key={book.id} book={book} index={index} />)}</div>
      <p className="bookshop__order-note">Buy Now opens the book’s Pothi store page in a new tab. Pothi shows the current price, shipping availability and delivery estimate before you order.</p>
    </section>
    <section className="bookshop__closing bookshop__shell" aria-labelledby="bookshop-closing-title">
      <div><p className="bookshop__eyebrow">Keep asking</p><h2 id="bookshop-closing-title">The conversation<br />continues on the page.</h2></div>
      <div><p>Explore the research behind the books, read the arguments online, and follow the sources for yourself.</p><Link to="/writing" className="bookshop__archive">Enter the writing archive <Arrow /></Link></div>
    </section>
  </div>;
}
