import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import './Interstitial.css';

/**
 * Cinematic scene divider — a giant outline word that drifts horizontally
 * on scroll, with a mono note. Turns accent on hover.
 */
export default function Interstitial({ word, note, align = 'left' }) {
  const root = useRef(null);
  const text = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        text.current,
        { xPercent: align === 'right' ? 12 : -12 },
        {
          xPercent: align === 'right' ? -8 : 8,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    }, root);
    return () => ctx.revert();
  }, [align]);

  return (
    <div ref={root} className={`interstitial interstitial--${align}`} aria-hidden="true">
      <span ref={text} className="interstitial__word display" data-cursor>{word}</span>
      {note && <span className="interstitial__note mono">{note}</span>}
    </div>
  );
}
