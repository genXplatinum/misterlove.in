import { useEffect, useRef } from 'react';

/**
 * Thin "scan line" at the very top of the viewport — its width tracks
 * scroll progress through the document.
 */
export default function ScrollProgress() {
  const bar = useRef(null);

  useEffect(() => {
    let raf;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? window.scrollY / h : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
      raf = null;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="scrollprog" aria-hidden="true">
      <span ref={bar} className="scrollprog__bar" />
    </div>
  );
}
