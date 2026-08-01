import { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import CoverPlate from '../components/CoverPlate';
import { home, profile } from '../data/site';
import { indianThought } from '../data/indianThought';
import { pieces, writingTotals, livePartsOf, isInProgress } from '../data/writing';
import './Home.css';

function SmartLink({ to, route = false, children, className = '', ...rest }) {
  if (route) return <Link to={to} className={className} {...rest}>{children}</Link>;
  return <a href={to} className={className} {...rest}>{children}</a>;
}

function randomIndex(length) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % length;
  }
  return Math.floor(Math.random() * length);
}

function pickThought(excludeId) {
  const pool = indianThought.filter((item) => item.id !== excludeId);
  return pool[randomIndex(pool.length)] ?? indianThought[0];
}

function rememberThought(thought) {
  try {
    window.localStorage.setItem('misterlove:last-thought', thought.id);
  } catch {
    // The passage still rotates when browser storage is unavailable.
  }
  return thought;
}

function openingThought() {
  if (typeof window === 'undefined') return indianThought[0];
  let previous = null;
  try {
    previous = window.localStorage.getItem('misterlove:last-thought');
  } catch {
    // A random passage is still a useful fallback.
  }
  return rememberThought(pickThought(previous));
}

const firstThought = openingThought();

function Hero() {
  const { hero } = home;
  const featured = pieces[0];

  return (
    <section className="intellect-hero">
      <div className="container">
        <div className="intellect-hero__folio">
          <span>Independent research · essays · inquiry</span>
          <span>{profile.location}</span>
        </div>

        <div className="intellect-hero__grid">
          <div className="intellect-hero__copy">
            <p className="chapter-label">Researcher, writer and lifelong reader</p>
            <h1 className="intellect-hero__name">
              <span>Lovepreet</span>
              <em>Singh</em>
            </h1>
            <p className="intellect-hero__thesis">{hero.title}</p>
            <p className="intellect-hero__lead">{hero.lead}</p>
            <div className="intellect-actions">
              <SmartLink to={hero.primary.to} route={hero.primary.route} className="book-button">
                {hero.primary.label}<span aria-hidden="true">→</span>
              </SmartLink>
              <SmartLink to={hero.secondary.to} className="book-link">
                {hero.secondary.label}<span aria-hidden="true">↓</span>
              </SmartLink>
            </div>
          </div>

          <aside className="intellect-hero__docket" aria-label="The writing at a glance">
            <div className="docket__masthead">
              <span>The independent review</span>
              <span>Personal journal</span>
            </div>
            <p className="docket__edition">The writing is the centre of this site.</p>
            <div className="docket__feature">
              <span>Currently featured</span>
              <Link to={`/writing/${featured.slug}`}>{featured.title}</Link>
              <p>{featured.standfirst}</p>
            </div>
            <dl className="docket__figures">
              <div><dt>Investigations</dt><dd>{writingTotals.pieces}</dd></div>
              <div><dt>Published parts</dt><dd>{writingTotals.parts}</dd></div>
              <div><dt>Words</dt><dd>{writingTotals.words.toLocaleString('en-IN')}</dd></div>
            </dl>
            <div className="docket__bookplate">
              <span>Ex libris</span>
              <strong>Lovepreet Singh</strong>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function PhilosophyPassage() {
  const [thought, setThought] = useState(firstThought);
  const another = () => setThought((current) => rememberThought(pickThought(current.id)));

  return (
    <section className="thought-signal" aria-labelledby="thought-heading">
      <div className="container thought-signal__inner">
        <div className="thought-signal__folio">
          <h2 id="thought-heading">A passage from Indian thought</h2>
          <span>
            {String(indianThought.findIndex((item) => item.id === thought.id) + 1).padStart(2, '0')}
            {' '}/ {String(indianThought.length).padStart(2, '0')}
          </span>
        </div>

        <figure className="thought-signal__quote" aria-live="polite">
          <blockquote>“{thought.quote}”</blockquote>
          <figcaption>
            <strong>{thought.author}</strong>
            <span>{thought.life}</span>
            <a href={thought.sourceUrl} target="_blank" rel="noopener noreferrer">
              {thought.source} <span aria-hidden="true">↗</span>
            </a>
          </figcaption>
        </figure>

        <button type="button" className="thought-signal__next" onClick={another}>
          Another passage <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

function SectionHead({ number, label, title, intro }) {
  return (
    <Reveal className="intellect-section-head">
      <span className="chapter-label">Chapter {number} · {label}</span>
      <h2>{title}</h2>
      {intro && <p>{intro}</p>}
    </Reveal>
  );
}

function Epigraph({ text, emphasis }) {
  const at = emphasis ? text.indexOf(emphasis) : -1;
  if (at < 0) return <>“{text}”</>;
  return (
    <>
      “{text.slice(0, at)}<em>{emphasis}</em>{text.slice(at + emphasis.length)}”
    </>
  );
}

function About() {
  const { about } = home;
  return (
    <section id="about" className="intellect-about">
      <div className="container">
        <SectionHead
          number="III"
          label={about.label}
          title={about.title}
          intro="Biography, method and the unfinished education behind the work."
        />

        <div className="intellect-about__opening">
          <Reveal as="blockquote" className="intellect-about__epigraph" variant="fade">
            <Epigraph text={about.statement} emphasis={about.statementEmphasis} />
          </Reveal>

          <Reveal as="figure" className="intellect-about__portrait" variant="fade">
            <div className="intellect-about__portrait-frame">
              <img src={profile.photo} alt="Lovepreet Singh" />
            </div>
            <figcaption>{about.photoCaption}</figcaption>
          </Reveal>

          <div className="intellect-about__bio">
            {about.paragraphs.map((paragraph, index) => (
              <Reveal as="p" key={paragraph} delay={Math.min(index, 4) * 45}>{paragraph}</Reveal>
            ))}
          </div>
        </div>

        <dl className="intellect-facts">
          {about.facts.map((fact, index) => (
            <Reveal as="div" key={fact.label} delay={index * 40}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Practice() {
  const { practice } = home;
  return (
    <section id="practice" className="intellect-practice">
      <div className="container">
        <SectionHead number="IV" label={practice.label} title={practice.title} intro={practice.intro} />

        <div className="lens-grid">
          {practice.fields.map((field, index) => (
            <Reveal as="article" className="lens-card" key={field.title} delay={index * 55}>
              <div className="lens-card__head">
                <span>{field.n}</span>
                <span>Practice</span>
              </div>
              <h3>{field.title}</h3>
              <p>{field.text}</p>
              <ul>
                {field.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              {field.href && (
                <SmartLink
                  to={field.href}
                  route={field.route}
                  className="book-link"
                  target={field.route ? undefined : '_blank'}
                  rel={field.route ? undefined : 'noopener noreferrer'}
                >
                  {field.link}<span aria-hidden="true">→</span>
                </SmartLink>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Method() {
  const { method } = home;
  return (
    <section id="method" className="intellect-method">
      <div className="container intellect-method__grid">
        <Reveal className="intellect-method__intro">
          <span className="chapter-label">Chapter II · {method.label}</span>
          <h2>{method.title}</h2>
          <p className="intellect-method__note">Four habits that govern the work.</p>
        </Reveal>

        <ol className="protocol-list">
          {method.steps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 45}>
              <span className="protocol-list__number">{step.n}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function WritingLibrary() {
  const { writing } = home;
  const [featured, ...rest] = pieces;

  return (
    <section id="research" className="intellect-writing">
      <div className="container">
        <div className="intellect-writing__head">
          <SectionHead number="I" label={writing.label} title={writing.title} intro={writing.intro} />

          <Reveal as="dl" className="intellect-writing__totals" variant="fade">
            <div><dt>Investigations</dt><dd>{writingTotals.pieces}</dd></div>
            <div><dt>Published parts</dt><dd>{writingTotals.parts}</dd></div>
            <div><dt>Published words</dt><dd>{writingTotals.words.toLocaleString('en-IN')}</dd></div>
          </Reveal>
        </div>

        <Reveal as="article" className="featured-research" variant="fade">
          <Link to={`/writing/${featured.slug}`} className="featured-research__link">
            <div className="featured-research__visual">
              <CoverPlate piece={featured} className="featured-research__cover" />
            </div>
            <span className="featured-research__body">
              <span className="chapter-label">Featured work</span>
              <strong>{featured.title}</strong>
              <span className="featured-research__subtitle">{featured.subtitle}</span>
              <span className="featured-research__standfirst">{featured.standfirst}</span>
              <span className="featured-research__meta">
                <i>{livePartsOf(featured)} of {featured.parts}</i> parts published
                <i>{featured.words.toLocaleString('en-IN')}</i> words
              </span>
              <span className="book-link">Read the complete work <span aria-hidden="true">→</span></span>
            </span>
          </Link>
        </Reveal>

        <ol className="dossier-list">
          {rest.map((piece, index) => (
            <Reveal as="li" key={piece.slug} delay={index * 40}>
              <Link to={`/writing/${piece.slug}`} className="dossier-row">
                <span className="dossier-row__number">0{index + 2}</span>
                <span className="dossier-row__title">
                  <strong>{piece.title}</strong>
                  <small>{piece.subtitle}</small>
                </span>
                <span className="dossier-row__question">{piece.standfirst}</span>
                <span className="dossier-row__meta">
                  {isInProgress(piece)
                    ? `${livePartsOf(piece)} of ${piece.parts} parts`
                    : `${piece.parts} parts · complete`}
                </span>
                <span className="dossier-row__arrow" aria-hidden="true">→</span>
              </Link>
            </Reveal>
          ))}
        </ol>

        <Reveal className="intellect-writing__all">
          <Link to="/writing" className="book-button">
            Browse the complete library <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function Education() {
  const { education } = home;
  return (
    <section id="education" className="intellect-education">
      <div className="container">
        <SectionHead number="V" label={education.label} title={education.title} intro={education.intro} />

        <ol className="learning-ledger">
          {education.items.map((item, index) => (
            <Reveal as="li" key={item.title} delay={Math.min(index, 5) * 45}>
              <span className="learning-ledger__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="learning-ledger__period">{item.period}</span>
              <div className="learning-ledger__title">
                <h3>{item.title}</h3>
                <p>{item.place}</p>
              </div>
              <p className="learning-ledger__text">{item.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Lovelace() {
  const { lovelace } = home;
  return (
    <section id="lovelace" className="intellect-lovelace">
      <div className="container intellect-lovelace__grid">
        <Reveal className="intellect-lovelace__identity">
          <span className="chapter-label">Chapter VI · {lovelace.label}</span>
          <h2>{lovelace.title}</h2>
          <span className="intellect-lovelace__tag">A studio for considered digital work</span>
        </Reveal>
        <Reveal className="intellect-lovelace__body" delay={55}>
          <p>{lovelace.text}</p>
          <a href={lovelace.href} target="_blank" rel="noopener noreferrer" className="book-link">
            Visit lovelace.co.in <span aria-hidden="true">↗</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function Contact() {
  const { contact } = home;
  return (
    <section id="contact" className="intellect-contact">
      <div className="container intellect-contact__grid">
        <Reveal className="intellect-contact__head">
          <span className="chapter-label">Chapter VII · {contact.label}</span>
          <h2>{contact.title} <em>{contact.titleAccent}</em></h2>
          <p>{contact.text}</p>
        </Reveal>

        <Reveal className="intellect-contact__body" delay={55}>
          <span className="intellect-contact__prompt">Correspondence</span>
          <a className="intellect-contact__email" href={`mailto:${profile.email}`}>
            {profile.email}<span aria-hidden="true">↗</span>
          </a>
          <a className="book-button" href={`mailto:${profile.email}`}>
            {contact.cta} <span aria-hidden="true">→</span>
          </a>
          <dl className="intellect-contact__meta">
            <div><dt>Based in</dt><dd>{profile.location}</dd></div>
            <div><dt>Practice</dt><dd>{profile.shortDescriptor}</dd></div>
          </dl>
          <div className="intellect-contact__links">
            {profile.social.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer">
                {social.label}<span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="intellect-home">
      <Hero />
      <PhilosophyPassage />
      <WritingLibrary />
      <Method />
      <About />
      <Practice />
      <Education />
      <Lovelace />
      <Contact />
    </div>
  );
}
