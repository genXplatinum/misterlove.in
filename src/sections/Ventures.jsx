import Reveal from '../components/Reveal';
import SectionHead from '../components/SectionHead';
import { ventures } from '../data/site';
import './Ventures.css';

function VentureCard({ v, featured }) {
  const Tag = v.href ? 'a' : 'div';
  const linkProps = v.href ? { href: v.href, target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <Tag className={`venture ${featured ? 'venture--featured' : ''}`} data-cursor {...linkProps}>
      <div className="venture__top">
        <span className="venture__idx mono">{v.index}</span>
        <span className="venture__kind mono">{v.kind}</span>
      </div>
      <div className="venture__main">
        <h3 className="venture__name">{v.name}</h3>
        <span className="venture__role mono mono--signal">{v.role}</span>
        <p className="venture__blurb muted">{v.blurb}</p>
      </div>
      <div className="venture__foot">
        <div className="venture__tags">
          {v.tags.map((t) => <span key={t} className="venture__tag mono">{t}</span>)}
        </div>
        {v.href && <span className="venture__visit link">Visit <span className="link__arrow">↗</span></span>}
        <span className="venture__years mono">{v.years}</span>
      </div>
    </Tag>
  );
}

export default function Ventures() {
  const [featured, ...rest] = ventures.items;
  return (
    <section id="ventures" className="section ventures" data-theme="light">
      <div className="container">
        <SectionHead index={ventures.index} label={ventures.label} />

        <div className="ventures__head">
          <Reveal as="h2" className="ventures__title" variant="up">{ventures.title}</Reveal>
          <Reveal as="p" className="ventures__intro muted" delay={100}>{ventures.intro}</Reveal>
        </div>

        <Reveal className="ventures__featured-wrap" variant="up">
          <VentureCard v={featured} featured />
        </Reveal>

        <div className="ventures__grid">
          {rest.map((v, i) => (
            <Reveal key={v.id} delay={(i % 3) * 80} variant="up">
              <VentureCard v={v} />
            </Reveal>
          ))}
        </div>

        <Reveal className="ventures__goal" variant="up">
          <span className="ventures__goal-big">{ventures.goal.big}</span>
          <span className="ventures__goal-label">{ventures.goal.label}</span>
        </Reveal>
      </div>
    </section>
  );
}
