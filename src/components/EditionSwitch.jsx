import { useLocation } from 'react-router-dom';
import { useExperience } from './ExperienceProvider';
import './EditionSwitch.css';

export default function EditionSwitch({ onChange }) {
  const { white } = useExperience();
  const { pathname, search, hash } = useLocation();
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const isAbout = pathname.replace(/\/$/, '') === '/about';
  const original = `${base}${isAbout ? '/' : pathname}${search}${isAbout ? '#about' : hash}`;
  const originalAbout = !white && pathname === '/' && hash === '#about';
  const whiteUrl = `${base}/white${originalAbout ? '/about/' : pathname}${search}${originalAbout ? '' : hash}`;
  return <nav className="edition-switch" aria-label="Site edition">
    <a href={original} aria-current={!white ? 'true' : undefined} onClick={onChange}>Original</a>
    <a href={whiteUrl} aria-current={white ? 'true' : undefined} onClick={onChange}>White</a>
  </nav>;
}
