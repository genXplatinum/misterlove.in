import { Wordmark } from './Logo';
import { profile } from '../data/site';
import './Footer.css';

const year = 2026;

function toTop(e) {
  e.preventDefault();
  if (window.lenis) window.lenis.scrollTo(0, { duration: 1.4 });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__top">
          <a href="#main" className="footer__brand" onClick={toTop} data-cursor>
            <Wordmark />
          </a>
          <a href="#main" className="footer__totop link" onClick={toTop}>
            Back to top <span className="link__arrow">↑</span>
          </a>
        </div>

        <div className="hairline" />

        <div className="footer__grid">
          <div className="footer__col">
            <span className="mono">// Direct line</span>
            <a href={`mailto:${profile.email}`} className="footer__email" data-cursor>
              {profile.email}
            </a>
          </div>
          <div className="footer__col">
            <span className="mono">// Channels</span>
            <div className="footer__socials">
              {profile.social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="link" data-cursor>
                  {s.label} <span className="link__arrow">↗</span>
                </a>
              ))}
            </div>
          </div>
          <div className="footer__col">
            <span className="mono">// Operating from</span>
            <span className="footer__loc">{profile.locations.join(' · ')}</span>
          </div>
        </div>

        <div className="footer__base">
          <span className="mono">© {year} {profile.name}. All rights reserved.</span>
          <span className="mono footer__sig">Designed &amp; engineered in-house — no templates.</span>
        </div>
      </div>
    </footer>
  );
}
