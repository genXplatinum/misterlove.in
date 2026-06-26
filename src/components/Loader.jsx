import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { Mark } from './Logo';
import { profile } from '../data/site';
import './Loader.css';

const BOOT = [
  'ESTABLISHING SECURE CHANNEL',
  'PERFORMING HANDSHAKE',
  'DECRYPTING IDENTITY',
  'CLEARANCE VERIFIED',
];

/**
 * Boot sequence intro: a secure-channel handshake with ticking status lines
 * and a 000→100 counter, then "ACCESS GRANTED" and the panel lifts away.
 */
export default function Loader({ onComplete }) {
  const root = useRef(null);
  const num = useRef(null);
  const cb = useRef(onComplete);
  cb.current = onComplete;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const counter = { v: 0 };

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setHidden(true);
      cb.current?.();
    };

    const tl = gsap.timeline({ onComplete: finish });

    // Failsafe: GSAP's ticker is requestAnimationFrame-driven, which browsers
    // pause in background tabs. setTimeout still fires there — so the hero is
    // never left permanently hidden if the timeline stalls.
    const failsafe = setTimeout(finish, reduced ? 1200 : 5000);

    if (reduced) {
      if (num.current) num.current.textContent = '100';
      gsap.set('.boot__line', { opacity: 1 });
      gsap.set('.boot__grant', { opacity: 1 });
      tl.to(root.current, { autoAlpha: 0, duration: 0.4 }, 0.4);
      return () => { clearTimeout(failsafe); tl.kill(); };
    }

    tl.to(counter, {
      v: 100,
      duration: 1.9,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (num.current) num.current.textContent = String(Math.round(counter.v)).padStart(3, '0');
      },
    }, 0.1);
    tl.fromTo('.boot__bar-fill', { scaleX: 0 }, { scaleX: 1, duration: 1.9, ease: 'power2.inOut' }, 0.1);
    tl.fromTo('.boot__line',
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.42, ease: 'power2.out' }, 0.15);
    tl.to('.boot__grant', { opacity: 1, duration: 0.3 }, '-=0.15');
    tl.to('.boot__console', { opacity: 0, duration: 0.4, ease: 'power2.in' }, '+=0.35');
    tl.to(root.current, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=0.1');

    return () => { clearTimeout(failsafe); tl.kill(); };
  }, []);

  if (hidden) return null;

  return (
    <div ref={root} className="loader" role="presentation">
      <div className="loader__scanline" aria-hidden="true" />
      <div className="boot__console">
        <div className="boot__head">
          <span className="boot__mark"><Mark size={20} /></span>
          <span className="mono mono--text">{profile.name.toUpperCase()} // SECURE TERMINAL</span>
        </div>

        <ul className="boot__lines">
          {BOOT.map((b) => (
            <li key={b} className="boot__line mono">
              <span className="boot__check">✓</span> {b}
            </li>
          ))}
        </ul>

        <div className="boot__bar"><span className="boot__bar-fill" /></div>

        <div className="boot__foot">
          <span className="boot__grant mono mono--scan">● ACCESS GRANTED</span>
          <span ref={num} className="boot__num mono">000</span>
        </div>
      </div>
    </div>
  );
}
