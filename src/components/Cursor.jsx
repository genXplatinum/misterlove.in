import { useEffect, useRef } from 'react';

/**
 * Targeting-reticle cursor: a signal "lock" dot + a trailing crosshair ring
 * that squares up and grows over interactive elements. Fine-pointer only.
 */
export default function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;

    document.body.classList.add('has-cursor');

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pos };
    let raf;

    const onMove = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (dot.current) {
        dot.current.style.setProperty('--mx', String(pos.x));
        dot.current.style.setProperty('--my', String(pos.y));
      }
    };

    const loop = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.2;
      ringPos.y += (pos.y - ringPos.y) * 0.2;
      if (ring.current) {
        ring.current.style.setProperty('--rx', ringPos.x.toFixed(2));
        ring.current.style.setProperty('--ry', ringPos.y.toFixed(2));
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    const interactive = 'a, button, input, textarea, select, label, [data-cursor]';
    const over = (e) => {
      if (e.target.closest?.(interactive)) document.body.classList.add('cursor-hover');
    };
    const out = (e) => {
      if (e.target.closest?.(interactive)) document.body.classList.remove('cursor-hover');
    };
    const down = () => document.body.classList.add('cursor-down');
    const up = () => document.body.classList.remove('cursor-down');
    const leave = () => {
      if (dot.current) dot.current.style.opacity = '0';
      if (ring.current) ring.current.style.opacity = '0';
    };
    const enter = () => {
      if (dot.current) dot.current.style.opacity = '';
      if (ring.current) ring.current.style.opacity = '';
    };

    window.addEventListener('pointermove', onMove);
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', enter);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.removeEventListener('mouseleave', leave);
      document.removeEventListener('mouseenter', enter);
      document.body.classList.remove('has-cursor', 'cursor-hover', 'cursor-down');
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor" aria-hidden="true" />
    </>
  );
}
