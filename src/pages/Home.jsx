import Hero from '../sections/Hero';
import Identity from '../sections/Identity';
import Arsenal from '../sections/Arsenal';
import Record from '../sections/Record';
import Ventures from '../sections/Ventures';
import Recognition from '../sections/Recognition';
import Journey from '../sections/Journey';
import Contact from '../sections/Contact';
import Interstitial from '../components/Interstitial';
import { marquee } from '../data/site';
import './Home.css';

function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {[...marquee, ...marquee].map((c, i) => (
          <span className="marquee__item" key={i}>
            {c}<span className="marquee__sep" />
          </span>
        ))}
      </div>
    </div>
  );
}

function ActTransition({ reverse = false, label }) {
  return (
    <div className={`act-transition ${reverse ? 'act-transition--reverse' : ''}`} aria-hidden="true">
      <span className="act-transition__line" />
      <span className="act-transition__node" />
      <span className="act-transition__label mono">{label}</span>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ---- ACT I/II — the operator (dark) ---- */}
      <Hero />
      <Marquee />
      <Identity />
      <Interstitial word="Recon." note="// I map the terrain before anyone makes a move." />
      <Arsenal />
      <Interstitial word="Proof." align="right" note="// Recognised by the industry. Trusted where it counts." />
      <Record />

      {/* ---- bridge: operator → founder ---- */}
      <ActTransition label="// CONTEXT SHIFT — THE OPERATOR BECOMES THE FOUNDER" />

      {/* ---- ACT III — the founder (light) ---- */}
      <div className="home__light" data-theme="light">
        <Ventures />
        <Interstitial word="Scale." align="right" note="// Turning a security instinct into companies." />
        <Recognition />
        <Journey />
      </div>

      {/* ---- bridge: back to the terminal ---- */}
      <ActTransition reverse label="// RE-ESTABLISHING SECURE TERMINAL" />

      {/* ---- ACT IV — secure channel (dark) ---- */}
      <Contact />
    </>
  );
}
