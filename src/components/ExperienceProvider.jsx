import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ExperienceContext = createContext(null);
const STORAGE_KEY = 'misterlove:experience';

export function readExperience() {
  if (typeof window === 'undefined') return 'classic';
  if (window.location.pathname.replace(/\/$/, '') === '/observatory') return 'immersive';
  try { return localStorage.getItem(STORAGE_KEY) === 'immersive' ? 'immersive' : 'classic'; }
  catch { return 'classic'; }
}

export function applyExperience(experience) {
  document.documentElement.dataset.experience = experience;
  const dark = document.documentElement.dataset.theme === 'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', experience === 'immersive' ? (dark ? '#0c1b24' : '#f3f3ef') : (dark ? '#171512' : '#F3EFE6'));
  try { localStorage.setItem(STORAGE_KEY, experience); } catch { /* Works without storage. */ }
}

export function ExperienceProvider({ children, initialExperience }) {
  const [experience, setExperience] = useState(initialExperience);
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    if (pathname.replace(/\/$/, '') === '/observatory') setExperience('immersive');
    if (pathname === '/') setExperience('classic');
  }, [pathname]);
  useLayoutEffect(() => { applyExperience(experience); }, [experience]);
  const value = useMemo(() => ({
    experience,
    immersive: experience === 'immersive',
    homePath: experience === 'immersive' ? '/observatory' : '/',
    chooseExperience: (next) => { applyExperience(next); setExperience(next); },
  }), [experience]);
  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) throw new Error('useExperience requires ExperienceProvider');
  return context;
}
