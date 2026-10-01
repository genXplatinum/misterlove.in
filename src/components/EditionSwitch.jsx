import { useLocation, useNavigate } from 'react-router-dom';
import { useExperience } from './ExperienceProvider';
import './EditionSwitch.css';

export default function EditionSwitch({ onChange }) {
  const { experience, chooseExperience } = useExperience();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const choose = (next) => {
    if (next === experience) return;
    const headerBottom = document.querySelector('.nav')?.getBoundingClientRect().bottom ?? 80;
    const passages = [...document.querySelectorAll('.article__body p, .article__body h2, .article__body h3')];
    const anchor = passages.find(el => { const box = el.getBoundingClientRect(); return box.bottom > headerBottom && box.top < innerHeight; });
    const offset = anchor?.getBoundingClientRect().top;
    chooseExperience(next);
    if (pathname === '/' || pathname.replace(/\/$/, '') === '/observatory') {
      navigate(next === 'immersive' ? '/observatory' : '/');
    } else if (anchor) {
      requestAnimationFrame(() => {
        if (anchor.isConnected) window.scrollTo({ top: window.scrollY + anchor.getBoundingClientRect().top - offset, behavior: 'instant' });
      });
    }
    onChange?.();
  };
  return <div className="edition-switch" role="group" aria-label="Site edition">
    {['classic', 'immersive'].map(edition => <button key={edition} type="button"
      aria-pressed={experience === edition} onClick={() => choose(edition)}>
      {edition === 'classic' ? 'Classic' : 'Immersive'}
    </button>)}
  </div>;
}
