import { profile } from '../data/site';

/** Mono "coordinate" header that opens each section. */
export default function SectionHead({ index, label, right }) {
  return (
    <div className="section-head">
      <span className="mono">
        <span className="section-head__id">{index}</span>&nbsp;&nbsp;/&nbsp;&nbsp;{label}
      </span>
      <span className="mono hide-sm">{right || profile.callsign}</span>
    </div>
  );
}
