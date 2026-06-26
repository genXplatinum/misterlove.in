import { useEffect, useRef } from 'react';
import './Reveal.css';

/**
 * Lightweight scroll-reveal wrapper (IntersectionObserver based).
 * variant: 'up' | 'fade' | 'mask' | 'right'
 */
export default function Reveal({
  as: Tag = 'div',
  children,
  className = '',
  variant = 'up',
  delay = 0,
  y = 28,
  once = true,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-in');
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove('is-in');
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={`reveal reveal--${variant} ${className}`}
      style={{ '--reveal-delay': `${delay}ms`, '--reveal-y': `${y}px` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
