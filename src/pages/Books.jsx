import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import BookPlate from '../components/BookPlate';
import useBooksRoom from '../components/BooksRoom';
import { books, booksMeta, booksTotals, liveStudiesOf, isOpen, axiomWord } from '../data/books';
import { profile } from '../data/site';
import './Writing.css';
import './Books.css';

function ShelfCard({ book, i }) {
  const live = liveStudiesOf(book);

  return (
    <Reveal as="li" className="topic shelfbook" delay={i * 70}>
      <Link to={`/books/${book.slug}`} className="topic__link">
        <BookPlate book={book} live={live} className="topic__cover" />

        <span className="topic__body">
          <span className="mono topic__topic">{book.topic}</span>
          <span className="topic__title">
            {book.title}
            <span className="shelfbook__by"> — {book.author}</span>
          </span>
          <span className="topic__stand">{book.standfirst}</span>

          <span className="topic__meta">
            <span>
              <b>{isOpen(book) ? `${live} of ${book.studies}` : book.studies}</b>{' '}
              {book.studies === 1 ? 'study' : 'studies'}
            </span>
            <span><b>{book.axioms}</b> axioms {axiomWord(book)}</span>
            <span><b>~{Math.round((book.minutes / 60) * 10) / 10}</b> hrs</span>
            <span className="topic__date">{book.displayDate}</span>
          </span>

          <span className="link topic__cta">
            Open the diagnosis <span className="link__arrow">→</span>
          </span>
        </span>
      </Link>
    </Reveal>
  );
}

/** The shelf: every book that has been taken apart here. */
export default function Books() {
  useBooksRoom();

  useEffect(() => {
    const prev = document.title;
    document.title = `Books, taken apart — close readings by ${profile.name}`;

    const image = 'https://misterlove.in/og/books.png';
    const cards = [
      ['meta[property="og:image"]', image],
      ['meta[property="og:image:secure_url"]', image],
      ['meta[property="og:image:width"]', '1200'],
      ['meta[property="og:image:height"]', '630'],
      ['meta[name="twitter:image"]', image],
    ];
    const tags = cards
      .map(([sel, content]) => {
        const el = document.head.querySelector(sel);
        if (!el) return null;
        const was = el.getAttribute('content');
        el.setAttribute('content', content);
        return () => el.setAttribute('content', was);
      })
      .filter(Boolean);

    return () => {
      document.title = prev;
      tags.forEach((restore) => restore());
    };
  }, []);

  return (
    <div className="writingpage bookspage">
      <header className="writingpage__head">
        <div className="container">
          <Reveal>
            <span className="eyebrow">{booksMeta.index} — {booksMeta.label}</span>
            <h1 className="writingpage__title">{booksMeta.title}</h1>
            <p className="writingpage__lead lead muted">{booksMeta.lead}</p>

            <dl className="writingpage__totals">
              <div><dt className="mono">Books</dt><dd>{booksTotals.books}</dd></div>
              <div><dt className="mono">Studies</dt><dd>{booksTotals.studies}</dd></div>
              <div><dt className="mono">Axioms dug out</dt><dd>{booksTotals.axioms}</dd></div>
            </dl>
          </Reveal>
        </div>
      </header>

      <div className="container">
        <Reveal className="shelfmethod">
          <span className="mono shelfmethod__title">How a book gets taken apart</span>
          <ol className="shelfmethod__steps">
            {booksMeta.method.map((step) => (
              <li key={step.n}>
                <span className="mono shelfmethod__n">{step.n}</span>
                <span className="shelfmethod__t">{step.t}</span>
                <span className="shelfmethod__d">{step.d}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="section-head">
          <span className="mono">
            <span className="section-head__id">THE SHELF</span>&nbsp;&nbsp;/&nbsp;&nbsp;
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </span>
          <span className="mono hide-sm">ONE SENTENCE AT A TIME</span>
        </div>

        <ul className="topics">
          {books.map((book, i) => <ShelfCard key={book.slug} book={book} i={i} />)}
        </ul>

        <p className="shelfnote">
          The shelf grows one book at a time, and only where the quoting has run ahead of the
          checking. If a book you keep hearing quoted belongs here,{' '}
          <a className="link" href={`mailto:${profile.email}`}>tell me which sentence</a>.
        </p>
      </div>
    </div>
  );
}
