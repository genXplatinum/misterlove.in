import { useEffect, useRef, useState } from 'react';
import { profile } from '../data/site';
import './StatusBar.css';

/** Live HUD bar pinned to the bottom — callsign, status, clock, location. */
export default function StatusBar() {
  const [time, setTime] = useState('--:--:--');
  const [hidden, setHidden] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      setTime(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Hide the bar once the footer comes into view (avoids overlap)
  useEffect(() => {
    const footer = document.querySelector('.footer');
    if (!footer) return;
    const io = new IntersectionObserver(
      ([e]) => setHidden(e.isIntersecting),
      { rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  return (
    <aside ref={ref} className={`statusbar ${hidden ? 'is-hidden' : ''}`} aria-hidden="true">
      <div className="statusbar__group">
        <span className="mono mono--signal">{profile.callsign}</span>
        <span className="statusbar__sep" />
        <span className="mono hide-sm">{profile.clearance}</span>
      </div>
      <div className="statusbar__group statusbar__center">
        <span className="statusbar__live">
          <span className="statusbar__dot" /> <span className="mono mono--scan">SECURE</span>
        </span>
        <span className="mono hide-sm">THREAT LEVEL — MANAGED</span>
      </div>
      <div className="statusbar__group">
        <span className="mono hide-sm">{profile.coords}</span>
        <span className="statusbar__sep hide-sm" />
        <span className="mono mono--text statusbar__clock">{time}</span>
      </div>
    </aside>
  );
}
