import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wordmark } from './Logo';
import ThemeToggle from './ThemeToggle';
import { nav, profile } from '../data/site';
import './Nav.css';

function scrollToTarget(target, immediate = false) {
  const element = document.querySelector(target);
  if (!element) return false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const jump = immediate || reduceMotion;
  const navHeight = document.querySelector('.nav')?.getBoundingClientRect().height ?? 72;
  const clearance = Math.ceil(navHeight + 12);

  const top = Math.max(
    0,
    element.getBoundingClientRect().top + window.scrollY - clearance
  );
  window.scrollTo({ top, behavior: jump ? 'auto' : 'smooth' });
  return true;
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const toggleRef = useRef(null);
  const menuRef = useRef(null);
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isHome) {
      setActive('');
      return undefined;
    }

    const sections = nav
      .filter((item) => !item.route)
      .map((item) => document.querySelector(item.to))
      .filter(Boolean);

    if (!('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: '-42% 0px -50% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHome, pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1121px)');
    const closeOnDesktop = (event) => {
      if (event.matches) setOpen(false);
    };

    if (desktop.matches) setOpen(false);

    if (desktop.addEventListener) desktop.addEventListener('change', closeOnDesktop);
    else desktop.addListener(closeOnDesktop);

    return () => {
      if (desktop.removeEventListener) desktop.removeEventListener('change', closeOnDesktop);
      else desktop.removeListener(closeOnDesktop);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    if (!open) return undefined;

    const menu = menuRef.current;
    const background = [
      document.getElementById('main'),
      document.querySelector('.footer'),
    ].filter(Boolean);
    const focusable = menu?.querySelectorAll('a[href], button:not([disabled])') ?? [];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    background.forEach((element) => { element.inert = true; });
    requestAnimationFrame(() => first?.focus());

    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        requestAnimationFrame(() => toggleRef.current?.focus());
        return;
      }
      if (event.key !== 'Tab' || !first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('nav-open');
      document.removeEventListener('keydown', onKey);
      background.forEach((element) => { element.inert = false; });
    };
  }, [open]);

  useEffect(() => {
    if (!isHome || !state?.scrollTo) return undefined;
    const target = state.scrollTo;
    const frame = requestAnimationFrame(() => {
      if (target === '#main') {
        window.scrollTo(0, 0);
      } else {
        scrollToTarget(target);
      }
      navigate(pathname, { replace: true, state: null });
    });
    return () => cancelAnimationFrame(frame);
  }, [isHome, navigate, pathname, state]);

  const go = (event, target) => {
    event.preventDefault();
    setOpen(false);
    if (open) requestAnimationFrame(() => toggleRef.current?.focus());
    if (isHome) scrollToTarget(target);
    else navigate('/', { state: { scrollTo: target } });
  };

  const brand = (event) => {
    event.preventDefault();
    setOpen(false);
    if (isHome) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      navigate('/');
    }
  };

  const activeFor = (item) => (
    item.route
      ? pathname.startsWith(item.to) || (item.to === '/writing' && pathname.startsWith('/hi/writing'))
      : active === item.to
  );

  const NavItem = ({ item, mobile = false }) => {
    const current = activeFor(item);
    const className = mobile
      ? `navmenu__link ${current ? 'is-active' : ''}`
      : `nav__link ${current ? 'is-active' : ''}`;
    const ariaCurrent = current ? (item.route ? 'page' : 'location') : undefined;

    if (item.route) {
      return (
        <Link
          to={item.to}
          className={className}
          onClick={() => setOpen(false)}
          aria-current={ariaCurrent}
        >
          {item.label}
        </Link>
      );
    }

    return (
      <a
        href={item.to}
        className={className}
        onClick={(event) => go(event, item.to)}
        aria-current={ariaCurrent}
      >
        {item.label}
      </a>
    );
  };

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-menu-open' : ''}`}>
        <a href="/" className="nav__brand" onClick={brand} aria-label={`${profile.name}, home`}>
          <Wordmark />
        </a>

        <nav className="nav__links" aria-label="Primary navigation">
          {nav.map((item) => <NavItem key={item.to} item={item} />)}
        </nav>

        <div className="nav__right">
          <ThemeToggle className="nav__theme" />
          <a href="#contact" className="nav__cta" onClick={(event) => go(event, '#contact')}>
            Write to me
          </a>
          <button
            ref={toggleRef}
            type="button"
            className={`nav__burger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="site-menu"
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        ref={menuRef}
        id="site-menu"
        className={`navmenu ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
        inert={!open}
      >
        <nav className="navmenu__inner" aria-label="Mobile navigation">
          {nav.map((item) => <NavItem key={item.to} item={item} mobile />)}
          <a href="#contact" className="navmenu__contact" onClick={(event) => go(event, '#contact')}>
            Write to me <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>
    </>
  );
}
