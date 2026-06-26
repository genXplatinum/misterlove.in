import { useState } from 'react';
import Reveal from '../components/Reveal';
import SectionHead from '../components/SectionHead';
import { arsenal } from '../data/site';
import './Arsenal.css';

export default function Arsenal() {
  const [active, setActive] = useState(0);
  const cur = arsenal.modules[active];

  return (
    <section id="arsenal" className="section arsenal" data-theme="dark">
      <div className="container">
        <SectionHead index={arsenal.index} label={arsenal.label} />

        <Reveal as="h2" className="arsenal__title-h" variant="up">
          {arsenal.title}
        </Reveal>

        <div className="arsenal__layout">
          <ul className="arsenal__list">
            {arsenal.modules.map((m, i) => (
              <li
                key={m.code}
                className={`arsenal__row ${active === i ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                data-cursor
              >
                <span className="arsenal__code mono">{m.code}</span>
                <span className="arsenal__name">{m.title}</span>
                <span className="arsenal__plus" aria-hidden="true" />

                {/* Inline detail for mobile / no-hover */}
                <div className="arsenal__detail-m">
                  <p className="muted">{m.desc}</p>
                  <div className="arsenal__skills">
                    {m.skills.map((s) => <span key={s} className="arsenal__skill mono">{s}</span>)}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="arsenal__panel" key={active}>
            <span className="arsenal__panel-num">{String(active + 1).padStart(2, '0')}</span>
            <span className="arsenal__panel-code mono mono--signal">{cur.code}</span>
            <h3 className="arsenal__panel-title">{cur.title}</h3>
            <p className="arsenal__panel-desc">{cur.desc}</p>
            <div className="arsenal__skills">
              {cur.skills.map((s) => (
                <span key={s} className="arsenal__skill mono">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
