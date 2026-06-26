import { createContext, useContext, useEffect, useState } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../lib/gsap';

const LenisContext = createContext(null);
export const useLenis = () => useContext(LenisContext);

/**
 * Smooth-scroll provider. Drives Lenis from GSAP's ticker and keeps
 * ScrollTrigger in sync. Exposes the Lenis instance via context so nav
 * links can scroll programmatically to anchors.
 */
export default function SmoothScroll({ children }) {
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const instance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduced,
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    });

    setLenis(instance);
    if (typeof window !== 'undefined') window.lenis = instance;
    instance.on('scroll', ScrollTrigger.update);

    const raf = (time) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
