import Reveal from '../components/Reveal';
import Scramble from '../components/Scramble';
import SectionHead from '../components/SectionHead';
import { record, stats } from '../data/site';
import './Record.css';

export default function Record() {
  return (
    <section id="record" className="section record" data-theme="dark">
      <div className="container">
        <SectionHead index={record.index} label={record.label} />

        {/* Stats band */}
        <div className="record__stats">
          {stats.map((s, i) => (
            <Reveal key={i} className="record__stat" delay={i * 70}>
              <Scramble as="span" className="record__stat-value" text={s.value} speed={1.1} />
              <span className="record__stat-label">{s.label}</span>
            </Reveal>
          ))}
        </div>

        <div className="record__head">
          <Reveal as="h2" className="record__title" variant="up">{record.title}</Reveal>
          <Reveal as="p" className="record__intro muted" delay={100}>{record.intro}</Reveal>
        </div>

        {/* Case files */}
        <div className="record__files">
          {record.files.map((f, i) => (
            <Reveal key={f.id} className="file" delay={(i % 2) * 90} data-cursor>
              <header className="file__head">
                <span className="mono file__id">{f.id}</span>
                <span className="mono file__tag">{f.tag}</span>
              </header>
              <h3 className="file__title">{f.title}</h3>
              <p className="file__body">
                <span className="file__redact" aria-hidden="true" />
                {f.body}
              </p>
              <footer className="file__foot">
                <span className="mono file__stamp">{f.status}</span>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
