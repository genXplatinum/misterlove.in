import { useEffect, useState } from 'react';
import { Wordmark } from './Logo';
import Magnetic from './Magnetic';
import { nav, profile } from '../data/site';
import './Nav.css';

function scrollToId(id) {
  const el = document.querySelector(id);
  if (!el) return;
  if (window.lenis) window.lenis.scrollTo(el, { offset: -10, duration: 1.3 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scrollspy — highlight the section currently in view
  useEffect(() => {
    const ids = nav.map((n) => n.to);
    const sections = ids.map((id) => document.querySelector(id)).filter(Boolean);
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive('#' + e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const go = (e, to) => {
    e.preventDefault();
    setOpen(false);
    scrollToId(to);
  };

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
        <a href="#main" className="nav__brand" onClick={(e) => go(e, '#main')} data-cursor aria-label={profile.name}>
          <Wordmark />
        </a>

        <nav className="nav__links" aria-label="Primary">
          {nav.map((n) => (
            <a
              key={n.to}
              href={n.to}
              onClick={(e) => go(e, n.to)}
              className={`nav__link ${active === n.to ? 'is-active' : ''}`}
            >
              <span className="nav__link-idx mono">{n.index}</span>
              <span className="nav__link-label">{n.label}</span>
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <Magnetic>
            <a href="#contact" onClick={(e) => go(e, '#contact')} className="btn nav__cta">
              Secure channel <span className="btn__dot" />
            </a>
          </Magnetic>
          <button
            className={`nav__burger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span /><span />
          </button>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <div className={`navmenu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="navmenu__inner">
          {nav.map((n, i) => (
            <a
              key={n.to}
              href={n.to}
              onClick={(e) => go(e, n.to)}
              className="navmenu__link"
              style={{ transitionDelay: `${0.06 * i + 0.1}s` }}
            >
              <span className="mono navmenu__idx">{n.index}</span>
              {n.label}
            </a>
          ))}
          <a href="#contact" onClick={(e) => go(e, '#contact')} className="btn navmenu__cta">
            Open a secure channel <span className="btn__dot" />
          </a>
        </div>
      </div>
    </>
  );
}
