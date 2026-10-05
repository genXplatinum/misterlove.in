import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { home, profile } from '../data/site';
import { pieces, writingTotals } from '../data/writing';
import GodQuote from '../components/GodQuote';
import ObservatoryMotion from '../components/ObservatoryMotion';
import CoverPlate from '../components/CoverPlate';
import InquiryInstrument from '../components/InquiryInstrument';
import './Home.css';

function SelectedResearch() {
  const featured = pieces[0];
  const selections = [pieces[1], pieces[3], pieces[4]];
  return <div className="selected-research obs-wrap">
    <article className="featured-investigation">
      <Link className="featured-investigation__cover" to={`/writing/${featured.slug}`} tabIndex={-1} aria-hidden="true"><CoverPlate piece={featured} /></Link>
      <div className="featured-investigation__copy" data-reveal>
        <p className="section-note">A place to begin</p>
        <p className="research-subject">{featured.topic}</p>
        <h3><Link to={`/writing/${featured.slug}`}>{featured.title}</Link></h3>
        <p className="feature-description">{featured.standfirst}</p>
        <div className="research-details"><span>{featured.parts} parts</span><span>{featured.status}</span><span>{featured.words.toLocaleString('en-IN')} words</span></div>
        <Link to={`/writing/${featured.slug}`} className="atlas-button atlas-button--ghost">Read the investigation</Link>
      </div>
    </article>
    <div className="research-selection-head"><h3>Other paths into the archive</h3><Link to="/writing">View all {writingTotals.pieces} investigations</Link></div>
    <div className="research-selection" data-reveal>{selections.map((piece)=><article key={piece.slug}>
      <p className="research-subject">{piece.topic.split(' · ')[0]}</p>
      <h3><Link to={`/writing/${piece.slug}`}>{piece.title}</Link></h3>
      <p>{piece.subtitle}</p>
      <Link className="research-reading-link" to={`/writing/${piece.slug}`}>Read {piece.parts} parts</Link>
    </article>)}</div>
    <div className="books-invitation"><p>Reading a book is the beginning of a conversation.</p><Link to="/books">Explore the reading room</Link></div>
  </div>;
}

function ResearchMethod({paused}) {
  const [active,setActive]=useState(0);
  return <section id="method" className="research-method">
    <div className="obs-wrap method-layout">
      <div className="method-visual"><InquiryInstrument paused={paused} focus={active} /></div>
      <div className="method-copy" data-reveal><p className="section-note">A way of seeing</p><h2>An open mind.<br />A rigorous method.</h2><p className="method-intro">A clear argument should show its workings. These are the habits behind every investigation.</p>
        <div className="method-steps">{home.method.steps.map((step,i)=><div className={`method-step ${active===i?'is-active':''}`} key={step.n}>
          <h3><button type="button" aria-expanded={active===i} aria-controls={`method-panel-${i}`} onClick={()=>setActive(active===i?-1:i)}><span className="method-number">{step.n}</span><span>{step.title}</span><span className="method-expand" aria-hidden="true">{active===i?'−':'+'}</span></button></h3>
          <div id={`method-panel-${i}`} hidden={active!==i}><p>{step.text}</p></div>
        </div>)}</div>
      </div>
    </div>
  </section>;
}

function About() {
  return <section id="about" className="about-observatory"><div className="obs-wrap">
    <div className="about-opening" data-reveal><p className="section-note">The person behind the questions</p><h2>Curiosity became<br />a way of life.</h2></div>
    <div className="about-layout">
      <figure className="author-portrait"><img src={profile.photo} alt="Lovepreet Singh" loading="lazy" width="640" height="800"/><figcaption>Lovepreet Singh <span>Punjab, India</span></figcaption></figure>
      <div className="author-copy"><p className="author-intro">Researcher. Writer.<br />A student of how things work.</p><p>{home.about.paragraphs[0]}</p><p>{home.about.paragraphs[1]}</p>
        <details className="author-story"><summary>More about my thinking</summary>{home.about.paragraphs.slice(2).map(p=><p key={p.slice(0,35)}>{p}</p>)}</details>
        <blockquote>“{home.about.statement}”</blockquote>
      </div>
    </div>
    <div id="education" className="education-observatory"><h3>An unfinished education.</h3><div>{home.education.items.map(item=><details key={item.title}><summary><span>{item.period}</span><strong>{item.title}</strong><span className="education-plus" aria-hidden="true">+</span></summary><p className="education-place">{item.place}</p><p>{item.text}</p></details>)}</div></div>
  </div></section>;
}

function Practice() {
  return <section id="practice" className="practice-observatory obs-wrap"><p className="section-note">Beyond the page</p><div className="practice-heading" data-reveal><h2>Three fields.<br />One habit of mind.</h2><p>Understand the system. Find its assumptions.<br />Make the result useful to someone else.</p></div><div className="practice-fields">{home.practice.fields.map(field=><article key={field.title}><h3>{field.title}</h3><p>{field.text}</p>{field.href&&(field.route?<Link to={field.href}>{field.link}</Link>:<a href={field.href} target="_blank" rel="noreferrer">{field.link}</a>)}</article>)}</div></section>;
}

export default function Home() {
  const hero = useRef(null);
  useEffect(() => {
    const previous = document.title;
    document.title = "The Observatory · MisterLove";
    return () => { document.title = previous; };
  }, []);
  const [paused,setPaused]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreference = event => setPaused(event.matches);
    mq.addEventListener('change',onPreference);
    const onScroll = () => {
      if (!hero.current || paused) return;
      hero.current.style.setProperty('--travel', `${Math.min(window.scrollY * .16, 150)}px`);
    };
    onScroll();
    if(paused)hero.current?.style.setProperty('--travel','0px');
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {window.removeEventListener('scroll', onScroll);mq.removeEventListener('change',onPreference);};
  }, [paused]);
  return <div className={`observatory-home ${paused ? "motion-paused" : ""}`}><ObservatoryMotion paused={paused} />
    <section className="observatory-hero" ref={hero} aria-labelledby="hero-title">
      <div className="hero-art" aria-hidden="true"><img src="/observatory.webp" alt="" fetchPriority="high" /></div>
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-content">
        <p className="hero-author">The living archive of Lovepreet Singh</p>
        <h1 id="hero-title">A life spent<br />asking better<br />questions.</h1>
        <p className="hero-description">History. Philosophy. The systems we live by.<br />Independent research for a more considered world.</p>
        <Link className="atlas-button" to="/writing">Explore the archive</Link>
      </div>
      <div className="hero-foot">
        <a href="#research" className="scroll-invite"><span className="scroll-track" aria-hidden="true" />Scroll to discover</a>
        <span>Rooted in Punjab. Open to the world.</span>
        <button type="button" className="motion-toggle" onClick={()=>setPaused(v=>!v)} aria-pressed={paused}><span aria-hidden="true">{paused?'▷':'Ⅱ'}</span>{paused?'Resume motion':'Pause motion'}</button>
      </div>
    </section>
    <GodQuote paused={paused} />
    <section id="research" className="archive-intro obs-wrap">
      <p className="section-note">The living archive</p>
      <div className="archive-intro__row" data-reveal><h2>Follow a question.<br />See where it leads.</h2><p>Long-form investigations into the stories we inherit and the systems we rarely stop to question. Written from the record, in language anyone can follow.</p></div>
      <div className="archive-facts"><span><strong>{writingTotals.pieces}</strong> investigations</span><span><strong>{writingTotals.parts}</strong> published parts</span><span><strong>{(writingTotals.words/1000000).toFixed(2)}m</strong> words of inquiry</span><Link to="/writing">Enter the complete archive</Link></div>
    </section>
    <SelectedResearch />
    <ResearchMethod paused={paused} />
    <About />
    <Practice />
    <section id="contact" className="correspondence obs-wrap"><p className="section-note">Correspondence</p><div className="correspondence-layout" data-reveal><h2>A serious question is<br />a good place to begin.</h2><div><p>For research conversations, cybersecurity work,<br />or a considered digital project.</p><a className="atlas-button" href={`mailto:${profile.email}`}>Write to Lovepreet</a><a className="contact-address" href={`mailto:${profile.email}`}>{profile.email}</a></div></div></section>
  </div>;
}
