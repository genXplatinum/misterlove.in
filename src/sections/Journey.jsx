import Reveal from '../components/Reveal';
import SectionHead from '../components/SectionHead';
import { journey } from '../data/site';
import './Journey.css';

export default function Journey() {
  const last = journey.milestones.length - 1;
  return (
    <section id="journey" className="section journey" data-theme="light">
      <div className="container">
        <SectionHead index={journey.index} label={journey.label} />

        <Reveal as="h2" className="journey__title" variant="up">{journey.title}</Reveal>

        <ol className="timeline">
          {journey.milestones.map((m, i) => (
            <Reveal as="li" key={m.what} className={`tl ${i === last ? 'tl--last' : ''}`} delay={(i % 2) * 60}>
              <span className="tl__when mono">{m.when}</span>
              <div className="tl__content">
                <h3 className="tl__what">{m.what}</h3>
                <p className="tl__detail muted">{m.detail}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
