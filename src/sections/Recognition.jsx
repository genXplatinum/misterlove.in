import Reveal from '../components/Reveal';
import SectionHead from '../components/SectionHead';
import { Mark } from '../components/Logo';
import { recognition } from '../data/site';
import './Recognition.css';

export default function Recognition() {
  return (
    <section id="recognition" className="section recognition" data-theme="light">
      <div className="container">
        <SectionHead index={recognition.index} label={recognition.label} />

        <Reveal as="h2" className="recognition__title" variant="up">{recognition.title}</Reveal>

        <ul className="recognition__list">
          {recognition.awards.map((a, i) => (
            <Reveal as="li" key={a.name} className="award" delay={(i % 2) * 70} data-cursor>
              <span className="award__mark"><Mark size={20} /></span>
              <span className="award__name">{a.name}</span>
              <span className="award__note mono">{a.note}</span>
              <span className="award__idx mono">{String(i + 1).padStart(2, '0')}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
