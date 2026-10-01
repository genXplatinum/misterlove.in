import { useEffect, useState } from 'react';

const chapters = [['question', 'The question'], ['research', 'The archive'], ['method', 'The method'], ['about', 'The author'], ['contact', 'Correspondence']];

export default function ObservatoryMotion({ paused }) {
  const [active, setActive] = useState('');
  useEffect(() => {
    const sections = chapters.map(([id]) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-15% 0px -45% 0px' });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (paused) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scene-enter');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    document.querySelectorAll('.observatory-home [data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [paused]);
  return <nav className="observatory-chapters" aria-label="Homepage chapters">
    {chapters.map(([id, label]) => <a key={id} href={`#${id}`} aria-label={label} aria-current={active === id ? 'location' : undefined}><span>{label}</span><i aria-hidden="true" /></a>)}
  </nav>;
}
