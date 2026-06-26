import { useEffect, useRef } from 'react';

const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEF§$%&';

/**
 * "Decrypt" text effect — characters resolve out of random glyphs.
 * Fires when the element scrolls into view (or on mount). Respects
 * reduced-motion (renders final text immediately).
 */
export default function Scramble({
  text,
  as: Tag = 'span',
  className = '',
  speed = 1,
  trigger = 'view',
  delay = 0,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      el.textContent = text;
      return;
    }

    let raf;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const total = text.length;
      const queue = [];
      for (let i = 0; i < total; i++) {
        const start = Math.floor(Math.random() * 18 * (1 / speed));
        const end = start + Math.floor(Math.random() * 24 * (1 / speed)) + 8;
        queue.push({ char: text[i], start, end });
      }
      let frame = 0;
      const tick = () => {
        let out = '';
        let done = 0;
        for (let i = 0; i < queue.length; i++) {
          const q = queue[i];
          if (frame >= q.end) {
            done++;
            out += q.char;
          } else if (frame >= q.start) {
            if (!q.r || Math.random() < 0.28) q.r = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            out += `<span class="scramble__g">${q.r}</span>`;
          } else {
            out += q.char === ' ' ? ' ' : '';
          }
        }
        el.innerHTML = out;
        frame++;
        if (done < queue.length) raf = requestAnimationFrame(tick);
        else el.textContent = text;
      };
      tick();
    };

    let io;
    const timer = setTimeout(() => {
      if (trigger === 'mount') run();
      else {
        io = new IntersectionObserver(
          (entries) => entries.forEach((e) => e.isIntersecting && run()),
          { threshold: 0.4 }
        );
        io.observe(el);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [text, speed, trigger, delay]);

  return <Tag ref={ref} className={className} {...rest}>{text}</Tag>;
}
