import { useState } from 'react';
import Reveal from '../components/Reveal';
import Scramble from '../components/Scramble';
import SectionHead from '../components/SectionHead';
import { identity, profile } from '../data/site';
import './Identity.css';

function Portrait() {
  const [ok, setOk] = useState(true);
  return (
    <div className="portrait" data-cursor>
      <div className="portrait__frame">
        {ok ? (
          <img
            src={profile.photo}
            alt={profile.name}
            className="portrait__img"
            loading="lazy"
            onError={() => setOk(false)}
          />
        ) : (
          <span className="portrait__mono-fallback">LS</span>
        )}
        <span className="portrait__scan" aria-hidden="true" />
        <span className="portrait__corner portrait__corner--tl" />
        <span className="portrait__corner portrait__corner--tr" />
        <span className="portrait__corner portrait__corner--bl" />
        <span className="portrait__corner portrait__corner--br" />
        <span className="portrait__tag mono">SUBJECT // VERIFIED</span>
      </div>
      <dl className="portrait__spec">
        <div><dt className="mono">Name</dt><dd>{profile.name}</dd></div>
        <div><dt className="mono">Role</dt><dd>{profile.roleLine}</dd></div>
        <div><dt className="mono">Base</dt><dd>{profile.locations.join(' · ')}</dd></div>
      </dl>
    </div>
  );
}

export default function Identity() {
  return (
    <section id="identity" className="section identity" data-theme="dark">
      <div className="container">
        <SectionHead index={identity.index} label={identity.label} />

        <Reveal as="h2" variant="up" className="identity__big">
          {identity.statement[0].text}
          <span className="accent"><Scramble text={identity.statement[1].text} speed={1.3} /></span>
        </Reveal>

        <div className="identity__body">
          <Reveal className="identity__portrait-wrap" variant="fade" delay={80}>
            <Portrait />
          </Reveal>

          <div className="identity__text">
            {identity.body.map((p, i) => (
              <Reveal as="p" key={i} className="identity__para" delay={i * 90}>{p}</Reveal>
            ))}
            <Reveal className="identity__sign" delay={200}>
              <span className="identity__signature">{identity.signature}</span>
              <span className="mono dim">— in his own words</span>
            </Reveal>
            <Reveal className="identity__meta" delay={260}>
              {identity.meta.map((m) => (
                <span key={m} className="identity__chip mono">{m}</span>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
