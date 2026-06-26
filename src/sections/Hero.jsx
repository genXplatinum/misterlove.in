import { useEffect, useState } from 'react';
import Scramble from '../components/Scramble';
import Magnetic from '../components/Magnetic';
import { hero, profile } from '../data/site';
import './Hero.css';

function go(e, id) {
  e.preventDefault();
  const el = document.querySelector(id);
  if (!el) return;
  if (window.lenis) window.lenis.scrollTo(el, { offset: -10, duration: 1.3 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

function RotatingLine() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % hero.lines.length), 3600);
    return () => clearInterval(id);
  }, []);
  return <Scramble key={i} text={hero.lines[i]} className="hero__role-text" trigger="mount" speed={1.5} />;
}

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__grid bg-grid" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="hero__top">
          <span className="eyebrow">{hero.kicker}</span>
          <span className="mono hide-sm">{profile.locations.join('  /  ')}</span>
        </div>

        <div className="hero__main">
          <h1 className="hero__title display">
            <span className="line"><span>{profile.first}</span></span>
            <span className="line"><span>{profile.last}</span></span>
          </h1>
          <div className="hero__role">
            <span className="hero__role-bracket mono">[</span>
            <RotatingLine />
            <span className="hero__role-bracket mono">]</span>
          </div>
        </div>

        <div className="hero__bottom">
          <p className="hero__lead lead">{hero.lead}</p>
          <div className="hero__cta">
            {hero.ctas.map((c) =>
              c.primary ? (
                <Magnetic key={c.label}>
                  <a href={c.to} className="btn" onClick={(e) => go(e, c.to)}>
                    {c.label} <span className="btn__dot" />
                  </a>
                </Magnetic>
              ) : (
                <a key={c.label} href={c.to} className="link" onClick={(e) => go(e, c.to)}>
                  {c.label} <span className="link__arrow">↘</span>
                </a>
              )
            )}
          </div>
        </div>
      </div>

      <a href="#identity" className="hero__scroll mono" onClick={(e) => go(e, '#identity')}>
        <span>Scroll to decrypt</span>
        <span className="hero__scroll-line" />
      </a>
    </section>
  );
}
