import { useRef } from 'react';

/**
 * Magnetic wrapper — the child drifts toward the cursor while hovered,
 * then springs back. Used on primary CTAs. Disabled for coarse pointers.
 */
export default function Magnetic({ children, strength = 0.4, className = '' }) {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = 'translate(0, 0)';
  };

  return (
    <span
      ref={ref}
      className={`magnetic ${className}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ display: 'inline-flex', transition: 'transform 0.5s var(--ease-out)', willChange: 'transform' }}
    >
      {children}
    </span>
  );
}
