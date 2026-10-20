import { useState } from 'react';
import { Link } from 'react-router-dom';
import { home, profile } from '../data/site';
import { pieces, livePartsOf } from '../data/writing';
import { books } from '../data/books';

const Arrow = () => <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.4" /></svg>;
const collection = slug => pieces.find(piece => piece.slug === slug);
const questions = [
  { slug: 'why-i-dont-believe', subject: 'Belief', question: 'What makes a belief true?', short: ['Why I Don’t', 'Believe'], description: 'God, religion and the evidence. An investigation that begins with a simple question: how do we know?', motif: 'belief', tone: 'ink' },
  { slug: 'architecture-of-money', subject: 'Power', question: 'Who gives money its power?', short: ['The Architecture', 'of Money'], description: 'Follow money from its beginnings to the dollar system, and the power hidden inside everyday transactions.', motif: 'money', tone: 'moss' },
  { slug: 'origin-of-species', subject: 'Origins', question: 'How did life become this varied?', short: ['On the Origin', 'of Species'], description: 'A close reading of Darwin’s first edition. What he argued, how he reasoned, and where the evidence leads.', motif: 'origins', tone: 'stone' },
];

// Code-native illustrations belong to the reading interface, not a physical
// book product. The nested forms echo inquiry, exchange and branching descent.
function InquiryMark({ kind }) {
  return <svg className={`room-mark room-mark--${kind}`} viewBox="0 0 320 250" fill="none" aria-hidden="true">
    {kind === 'belief' ? <>
      {Array.from({ length: 11 }, (_, i) => <ellipse key={i} cx="160" cy="125" rx={30 + i * 10} ry={93 - i * 3} transform={`rotate(${i * 8} 160 125)`} />)}
      <circle cx="160" cy="125" r="7" fill="currentColor" stroke="none" />
    </> : kind === 'money' ? <>
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${28 + i * 9} 200V${35 + i * 5}H${203 + i * 9}V${200 - i * 5}Z`} />)}
      <path d="M40 207 280 25M210 25h70v70" />
    </> : <>
      {Array.from({ length: 8 }, (_, i) => <g key={i}><path d={`M160 225V${185 - i * 21}L${140 - i * 17} ${170 - i * 21}M160 ${185 - i * 21}L${180 + i * 17} ${170 - i * 21}`} /><circle cx={140 - i * 17} cy={170 - i * 21} r="3" /><circle cx={180 + i * 17} cy={170 - i * 21} r="3" /></g>)}
    </>}
  </svg>;
}

function ResearchObject({ entry, piece }) {
  return <div className={`room-object-stage room-tone--${entry.tone}`} aria-hidden="true">
    <div className="room-object-shadow" />
    <div className="room-object" key={entry.slug}>
      <div className="room-object-spine">MisterLove <span>Collected research</span></div>
      <div className="room-object-pages" />
      <div className="room-object-cover">
        <div className="room-object-top"><span>Independent inquiry</span><span>{String(livePartsOf(piece)).padStart(2, '0')} parts</span></div>
        <div className="room-object-title">{entry.short.map(line => <span key={line}>{line}</span>)}</div>
        <InquiryMark kind={entry.motif} />
        <div className="room-object-bottom"><span>Lovepreet Singh</span><span>misterlove.</span></div>
      </div>
    </div>
    <span className="room-object-note">An open invitation to think for yourself.</span>
  </div>;
}

export default function ReadingRoom() {
  const [active, setActive] = useState(0);
  const entry = questions[active];
  const piece = collection(entry.slug);
  const money = collection('architecture-of-money');
  const women = collection('rules-about-women');
  const india = collection('india-before-and-after-2014');
  const punjab = collection('punjab-history');
  return <>
    <section className="white-hero white-shell room-hero" aria-labelledby="room-title">
      <div className="room-hero-top"><p>Independent thought. In plain language.</p><span>By Lovepreet Singh <span className="room-dot">·</span> Punjab, India</span></div>
      <div className="room-hero-grid">
        <div className="room-hero-copy">
          <h1 id="room-title">Leave no<br />question<br />unasked.</h1>
          <p>Look beneath the familiar. Follow the evidence.<br className="room-desktop-break" /> Find something worth changing your mind about.</p>
          <Link to="/writing" className="white-button room-primary">Enter the reading room <Arrow /></Link>
          <a className="room-below" href="#selected">Or take a look around <span aria-hidden="true">↓</span></a>
        </div>
        <div className="room-hero-exhibit">
          <ResearchObject entry={entry} piece={piece} />
          <div className="room-object-caption"><span>From the collection</span><span>{active + 1} / {questions.length}</span></div>
        </div>
      </div>
      <div className="room-question-bar">
        <div className="room-question-picker"><p>Where does your curiosity go?</p><div role="group" aria-label="Choose a question">{questions.map((item, i) => <button type="button" key={item.slug} aria-pressed={i === active} aria-controls="room-question-detail" onClick={() => setActive(i)}>{item.subject}<span aria-hidden="true">{i === active ? '↗' : '+'}</span></button>)}</div></div>
        <div className="room-question-detail" id="room-question-detail" aria-live="polite" aria-atomic="true"><div><h2>{entry.question}</h2><p>{entry.description}</p></div><Link to={`/writing/${entry.slug}`} aria-label={`Explore ${piece.title}`}><Arrow /></Link></div>
      </div>
    </section>

    <section className="room-selection white-shell" id="selected" aria-labelledby="room-selected-title">
      <header className="room-section-heading"><div><p>A few places to begin</p><h2 id="room-selected-title">Different subjects.<br />The same curiosity.</h2></div><Link className="white-text-link" to="/writing">All {pieces.length} collections <Arrow /></Link></header>
      <div className="room-feature-grid">
        <article className="room-feature room-feature--money">
          <Link to={`/writing/${money.slug}`} className="room-feature-art" aria-label={`Read ${money.title}`}><div className="room-money-print" aria-hidden="true"><span>Money.<br />Power.<br />Who decides?</span><InquiryMark kind="money" /><small>An inquiry into the systems we live inside.</small></div><span className="room-art-open"><Arrow /></span></Link>
          <div className="room-feature-meta"><span>Economics & power</span><span>{livePartsOf(money)} parts</span></div><h3><Link to={`/writing/${money.slug}`}>{money.title}</Link></h3><p>How a shared invention became the world’s accounting system.</p>
        </article>
        <article className="room-feature room-feature--women">
          <Link to={`/writing/${women.slug}`} className="room-feature-art" aria-label={`Read ${women.title}`}><div className="room-women-print" aria-hidden="true"><span>Who wrote<br />the rules?</span><div className="room-rule-lines">{['Reputation', 'Respectability', 'Freedom', 'Evidence'].map(word => <span key={word}>{word}<span>{word === 'Evidence' ? '↗' : '—'}</span></span>)}</div><small>The Rules About Women</small></div><span className="room-art-open"><Arrow /></span></Link>
          <div className="room-feature-meta"><span>Society & ethics</span><span>{livePartsOf(women)} parts</span></div><h3><Link to={`/writing/${women.slug}`}>{women.title}</Link></h3><p>The claims about gender, reputation and protection, tested against the record.</p>
        </article>
      </div>
      <div className="room-more">{[{ piece: india, label: 'The political record', text: 'What changed in India after 2014?' }, { piece: punjab, label: 'History & belonging', text: 'How did Punjab become Punjab?' }].map(item => <Link key={item.piece.slug} to={`/writing/${item.piece.slug}`}><span>{item.label}</span><h3>{item.text}</h3><span>{livePartsOf(item.piece)} parts <Arrow /></span></Link>)}</div>
    </section>

    <section className="room-short-read" aria-labelledby="room-short-title"><div className="white-shell room-short-grid"><div className="room-short-label"><span className="room-mini-mark" aria-hidden="true">↳</span><p>One idea.<br />Ten minutes.</p><span>A close reading of<br />G. K. Chesterton’s <i>The Thing</i></span></div><div><h2 id="room-short-title">Before you pull it down,<br />ask why it was built.</h2><p>A fence across a road. A reformer who wants it gone. A deceptively simple argument about change, tradition and what we might be missing.</p><Link to="/books/the-thing/before-you-pull-it-down" className="white-text-link">Read “Before You Pull It Down” <Arrow /></Link></div></div></section>

    <section className="room-desk white-shell" aria-labelledby="room-desk-title"><header className="room-section-heading"><div><p>In conversation with other minds</p><h2 id="room-desk-title">On the reading desk.</h2></div><Link to="/books" className="white-text-link">The close readings <Arrow /></Link></header><div className="room-desk-books">{books.map((book, i) => <Link key={book.slug} to={`/books/${book.slug}`} className={`room-desk-book room-desk-book--${i}`}><div className="room-desk-cover"><span>{book.author}</span><h3>{book.title}</h3><div className="room-desk-symbol" aria-hidden="true">{i === 0 ? <><span /><span /></> : i === 1 ? 'Aa' : <><span /><span /><span /></>}</div><span>{book.bookYear}<Arrow /></span></div><p>Notes & close readings by Lovepreet Singh</p></Link>)}</div></section>

    <section className="room-author white-shell" aria-labelledby="room-author-title"><figure><img src={profile.photo} alt="Lovepreet Singh seated in a black shirt" width="1200" height="1500" loading="lazy" /><figcaption>Lovepreet Singh · Researcher, writer, founder.</figcaption></figure><div><p>The person behind the questions</p><h2 id="room-author-title">“I want to write the kind of argument that gets stronger the more you fact-check it, not weaker.”</h2><p>My work moves between philosophy, science, public life and technology. I read across disagreement, go back to the record, and try to make difficult ideas clear.</p><Link to="/about" className="white-text-link">A little about me <Arrow /></Link></div></section>

    <section className="room-method white-shell" aria-labelledby="room-method-title"><header className="room-section-heading"><div><p>The work behind the words</p><h2 id="room-method-title">An argument should<br />show its workings.</h2></div><p>You should be able to follow the reasoning,<br className="room-desktop-break" /> check the sources, and disagree.</p></header><div className="room-method-grid">{home.method.steps.map(step => <article key={step.n}><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
  </>;
}
