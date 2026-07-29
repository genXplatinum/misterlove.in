import { Link } from 'react-router-dom';
import { Wordmark } from './Logo';
import { profile } from '../data/site';
import { pieces } from '../data/writing';
import './Footer.css';

function toTop(event) {
  event.preventDefault();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.lenis) {
    window.lenis.scrollTo(0, {
      duration: reduceMotion ? 0 : 1,
      immediate: reduceMotion,
    });
  } else {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__top">
          <a href="#main" className="footer__brand" onClick={toTop} aria-label="Back to the top">
            <Wordmark />
          </a>
          <p>Research, technology and design, brought into one considered practice.</p>
          <a href="#main" className="footer__toplink" onClick={toTop}>
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>

        <div className="footer__rule" />

        <div className="footer__grid">
          <div className="footer__column">
            <span className="footer__label">Write</span>
            <a href={`mailto:${profile.email}`} className="footer__email">
              {profile.email}
            </a>
          </div>

          <div className="footer__column">
            <span className="footer__label">Elsewhere</span>
            <div className="footer__links">
              {profile.social.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer">
                  {social.label}<span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>

          <div className="footer__column footer__column--writing">
            <span className="footer__label">Writing</span>
            <div className="footer__links">
              <Link to="/writing">All research<span aria-hidden="true">→</span></Link>
              {pieces.map((piece) => (
                <Link key={piece.slug} to={`/writing/${piece.slug}`}>
                  {piece.title}<span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="footer__base">
          <span>© {new Date().getFullYear()} Lovepreet Singh</span>
          <span>{profile.location}</span>
        </div>
      </div>
    </footer>
  );
}
