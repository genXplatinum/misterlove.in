import Reveal from '../components/Reveal';
import Scramble from '../components/Scramble';
import Magnetic from '../components/Magnetic';
import { contact, profile } from '../data/site';
import './Contact.css';

export default function Contact() {
  return (
    <section id="contact" className="section contact" data-theme="dark">
      <div className="contact__glow" aria-hidden="true" />
      <div className="container contact__inner">
        <Reveal className="contact__avail" variant="fade">
          <span className="pill"><span className="pill__dot" /> {contact.availability}</span>
        </Reveal>

        <Reveal as="h2" className="contact__title display" variant="up">
          <Scramble text={contact.title} speed={1.4} />
        </Reveal>

        <Reveal as="p" className="contact__body lead" delay={100}>{contact.body}</Reveal>

        <Reveal className="contact__action" delay={160}>
          <a href={`mailto:${profile.email}`} className="contact__email" data-cursor>
            {profile.email}
          </a>
          <Magnetic>
            <a href={`mailto:${profile.email}`} className="btn">
              Encrypt &amp; send <span className="btn__dot" />
            </a>
          </Magnetic>
        </Reveal>

        <Reveal className="contact__socials" delay={220}>
          {profile.social.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="link" data-cursor>
              {s.label} <span className="link__arrow">↗</span>
            </a>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
