import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import CoverPlate from '../components/CoverPlate';
import { home, profile } from '../data/site';
import { pieces, writingTotals, livePartsOf, isInProgress } from '../data/writing';
import './Home.css';

function SmartLink({ to, route = false, children, className = '', ...rest }) {
  if (route) {
    return <Link to={to} className={className} {...rest}>{children}</Link>;
  }
  return <a href={to} className={className} {...rest}>{children}</a>;
}

function FolioFallback() {
  return (
    <div className="folio-fallback" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} style={{ '--folio-i': i }} />
      ))}
      <i />
    </div>
  );
}

function Hero() {
  const { hero } = home;
  return (
    <section className="archive-hero" data-scene="hero">
      <div className="archive-hero__sticky">
        <div className="container archive-hero__grid">
          <div className="archive-hero__copy">
            <p className="archive-kicker">{hero.eyebrow}</p>
            <h1 className="archive-hero__name">
              <span>Lovepreet</span>
              <span>Singh</span>
            </h1>
            <p className="archive-hero__thesis">{hero.title}</p>
            <p className="archive-hero__lead">{hero.lead}</p>
            <div className="archive-actions">
              <SmartLink
                to={hero.primary.to}
                route={hero.primary.route}
                className="archive-btn archive-btn--light"
              >
                {hero.primary.label}<span aria-hidden="true">↗</span>
              </SmartLink>
              <SmartLink to={hero.secondary.to} className="archive-link archive-link--cream">
                {hero.secondary.label}<span aria-hidden="true">↓</span>
              </SmartLink>
            </div>
          </div>

          <div className="archive-hero__stage">
            <FolioFallback />
            <p className="archive-hero__stage-note">
              <span>THE LIVING ARCHIVE</span>
              Ideas gathered, opened and tested.
            </p>
          </div>

          <div className="archive-hero__foot">
            <span>Punjab, India</span>
            <span>Scroll to open the archive</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const { about } = home;
  return (
    <section id="about" className="archive-about archive-sheet" data-scene="about">
      <div className="container">
        <Reveal className="archive-section-head">
          <span className="archive-label">{about.label}</span>
          <h2>{about.title}</h2>
        </Reveal>

        <div className="archive-about__opening">
          <Reveal as="blockquote" className="archive-about__quote" variant="fade">
            “{about.statement}”
          </Reveal>
          <div className="archive-about__bio">
            {about.paragraphs.map((paragraph, i) => (
              <Reveal as="p" key={paragraph} delay={i * 70}>{paragraph}</Reveal>
            ))}
          </div>
        </div>

        <Reveal className="archive-about__photo-wrap" variant="fade">
          <figure className="archive-about__photo">
            <img src={profile.photo} alt="Lovepreet Singh speaking at SecurityVerse in Delhi" />
            <figcaption>{about.photoCaption}</figcaption>
          </figure>
        </Reveal>

        <dl className="archive-facts">
          {about.facts.map((fact, i) => (
            <Reveal as="div" key={fact.label} delay={i * 60}>
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
    <section id="practice" className="archive-practice" data-scene="practice">
      <div className="container">
        <Reveal className="archive-section-head archive-section-head--dark">
          <span className="archive-label">{practice.label}</span>
          <h2>{practice.title}</h2>
          <p>{practice.intro}</p>
        </Reveal>

        <div className="practice-stack">
          {practice.fields.map((field, i) => (
            <article className="practice-sheet" key={field.title} style={{ '--stack-i': i }}>
              <div className="practice-sheet__number">{field.n}</div>
              <div className="practice-sheet__body">
                <h3>{field.title}</h3>
                <p>{field.text}</p>
                <ul>
                  {field.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
                {field.href && (
                  <SmartLink
                    to={field.href}
                    route={field.route}
                    className="archive-link"
                    target={field.route ? undefined : '_blank'}
                    rel={field.route ? undefined : 'noopener noreferrer'}
                  >
                    {field.link}<span aria-hidden="true">↗</span>
                  </SmartLink>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Method() {
  const { method } = home;
  return (
    <section id="method" className="archive-method" data-scene="method">
      <div className="container archive-method__grid">
        <Reveal className="archive-method__intro">
          <span className="archive-label">{method.label}</span>
          <h2>{method.title}</h2>
        </Reveal>

        <ol className="method-list">
          {method.steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 65}>
              <span>{step.n}</span>
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
    <section id="research" className="archive-writing archive-sheet" data-scene="writing">
      <div className="container">
        <div className="archive-writing__head">
          <Reveal className="archive-section-head">
            <span className="archive-label">{writing.label}</span>
            <h2>{writing.title}</h2>
            <p>{writing.intro}</p>
          </Reveal>

          <Reveal className="archive-writing__totals" variant="fade">
            <div><strong>{writingTotals.pieces}</strong><span>investigations</span></div>
            <div><strong>{writingTotals.parts}</strong><span>published parts</span></div>
            <div><strong>{writingTotals.words.toLocaleString('en-IN')}</strong><span>published words</span></div>
          </Reveal>
        </div>

        <Reveal as="article" className="featured-folio" variant="fade">
          <Link to={`/writing/${featured.slug}`} className="featured-folio__link">
            <CoverPlate piece={featured} className="featured-folio__cover" />
            <span className="featured-folio__body">
              <span className="archive-label">Newest investigation</span>
              <strong>{featured.title}</strong>
              <span>{featured.standfirst}</span>
              <span className="featured-folio__meta">
                {livePartsOf(featured)} of {featured.parts} parts published
                <i aria-hidden="true" />
                {featured.words.toLocaleString('en-IN')} words
              </span>
              <span className="archive-link">
                Open the series <span aria-hidden="true">↗</span>
              </span>
            </span>
          </Link>
        </Reveal>

        <ol className="research-ledger">
          {rest.map((piece, i) => (
            <Reveal as="li" key={piece.slug} delay={i * 55}>
              <Link to={`/writing/${piece.slug}`} className="research-ledger__row">
                <span className="research-ledger__n">{String(i + 2).padStart(2, '0')}</span>
                <span className="research-ledger__title">
                  <strong>{piece.title}</strong>
                  <small>{piece.subtitle}</small>
                </span>
                <span className="research-ledger__question">{piece.standfirst}</span>
                <span className="research-ledger__meta">
                  {isInProgress(piece)
                    ? `${livePartsOf(piece)} of ${piece.parts} parts`
                    : `${piece.parts} parts · complete`}
                </span>
                <span className="research-ledger__arrow" aria-hidden="true">↗</span>
              </Link>
            </Reveal>
          ))}
        </ol>

        <Reveal className="archive-writing__all">
          <Link to="/writing" className="archive-btn">
            Browse all writing <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function Education() {
  const { education } = home;
  return (
    <section id="education" className="archive-education" data-scene="education">
      <div className="container">
        <Reveal className="archive-section-head">
          <span className="archive-label">{education.label}</span>
          <h2>{education.title}</h2>
          <p>{education.intro}</p>
        </Reveal>

        <ol className="education-ledger">
          {education.items.map((item, i) => (
            <Reveal as="li" key={item.title} delay={i * 70}>
              <span className="education-ledger__period">{item.period}</span>
              <div className="education-ledger__main">
                <h3>{item.title}</h3>
                <p className="education-ledger__place">{item.place}</p>
              </div>
              <p className="education-ledger__text">{item.text}</p>
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
    <section id="lovelace" className="archive-lovelace" data-scene="lovelace">
      <div className="container archive-lovelace__grid">
        <Reveal>
          <span className="archive-label">{lovelace.label}</span>
          <h2>{lovelace.title}</h2>
        </Reveal>
        <Reveal className="archive-lovelace__body" delay={80}>
          <p>{lovelace.text}</p>
          <a
            href={lovelace.href}
            target="_blank"
            rel="noopener noreferrer"
            className="archive-btn archive-btn--light"
          >
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
    <section id="contact" className="archive-contact" data-scene="contact">
      <div className="container archive-contact__grid">
        <Reveal>
          <span className="archive-label">{contact.label}</span>
          <h2>{contact.title}</h2>
        </Reveal>
        <Reveal className="archive-contact__body" delay={80}>
          <p>{contact.text}</p>
          <a className="archive-contact__email" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <div className="archive-contact__links">
            <a href={`mailto:${profile.email}`} className="archive-btn archive-btn--light">
              {contact.cta} <span aria-hidden="true">↗</span>
            </a>
            {profile.social.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="archive-link archive-link--cream"
              >
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
    <div className="archive-home">
      <Hero />
      <About />
      <Practice />
      <Method />
      <WritingLibrary />
      <Education />
      <Lovelace />
      <Contact />
    </div>
  );
}
