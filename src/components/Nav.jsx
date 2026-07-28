import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wordmark } from './Logo';
import Magnetic from './Magnetic';
import { nav, profile } from '../data/site';
import './Nav.css';

function scrollToId(id) {
  const el = document.querySelector(id);
  if (!el) return false;
  if (window.lenis) window.lenis.scrollTo(el, { offset: -10, duration: 1.3 });
  else el.scrollIntoView({ behavior: 'smooth' });
  return true;
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scrollspy — highlight the section currently in view. Only the one-pager
  // has these anchors; re-run per route so leaving and returning re-binds.
  useEffect(() => {
    if (!isHome) { setActive(''); return; }
    const sections = nav
      .filter((n) => !n.route)
      .map((n) => document.querySelector(n.to))
      .filter(Boolean);
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
  }, [isHome, pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close the mobile menu whenever the route changes under it.
  useEffect(() => { setOpen(false); }, [pathname]);

  /** Anchor links have to route home first when we're on a reading page. */
  const go = (e, to) => {
    e.preventDefault();
    setOpen(false);
    if (isHome) {
      scrollToId(to);
    } else {
      navigate('/', { state: { scrollTo: to } });
    }
  };

  // Deferred scroll for an anchor clicked from another route: wait for the
  // homepage sections to mount before asking Lenis to find them.
  useEffect(() => {
    if (!isHome || !state?.scrollTo) return;
    const target = state.scrollTo;
    const id = requestAnimationFrame(() => {
      if (target === '#main') window.scrollTo(0, 0);
      else scrollToId(target);
      window.history.replaceState({}, '');
    });
    return () => cancelAnimationFrame(id);
  }, [isHome, state]);

  const isActive = (n) => (
    n.route
      ? pathname.startsWith(n.to) || (n.to === '/writing' && pathname.startsWith('/hi/writing'))
      : active === n.to
  );

  const renderLink = (n, className, extra = {}) =>
    n.route ? (
      <Link key={n.to} to={n.to} className={className} onClick={() => setOpen(false)} {...extra}>
        <span className="nav__link-idx mono">{n.index}</span>
        <span className="nav__link-label">{n.label}</span>
      </Link>
    ) : (
      <a key={n.to} href={n.to} onClick={(e) => go(e, n.to)} className={className} {...extra}>
        <span className="nav__link-idx mono">{n.index}</span>
        <span className="nav__link-label">{n.label}</span>
      </a>
    );

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
        <a href="/" className="nav__brand" onClick={(e) => go(e, '#main')} data-cursor aria-label={profile.name}>
          <Wordmark />
        </a>

        <nav className="nav__links" aria-label="Primary">
          {nav.map((n) =>
            renderLink(n, `nav__link ${isActive(n) ? 'is-active' : ''} ${n.route ? 'nav__link--route' : ''}`)
          )}
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
          {nav.map((n, i) => {
            const style = { transitionDelay: `${0.06 * i + 0.1}s` };
            return n.route ? (
              <Link key={n.to} to={n.to} className="navmenu__link" style={style} onClick={() => setOpen(false)}>
                <span className="mono navmenu__idx">{n.index}</span>
                {n.label}
              </Link>
            ) : (
              <a key={n.to} href={n.to} onClick={(e) => go(e, n.to)} className="navmenu__link" style={style}>
                <span className="mono navmenu__idx">{n.index}</span>
                {n.label}
              </a>
            );
          })}
          <a href="#contact" onClick={(e) => go(e, '#contact')} className="btn navmenu__cta">
            Open a secure channel <span className="btn__dot" />
          </a>
        </div>
      </div>
    </>
  );
}
