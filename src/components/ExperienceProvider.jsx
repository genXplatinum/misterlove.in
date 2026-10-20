import { createContext, useContext, useLayoutEffect } from 'react';
import { syncThemeColor } from '../pageSurface';

const ExperienceContext = createContext(null);
const STORAGE_KEY = 'misterlove:experience';

export function readExperience() {
  return 'classic';
}

export function applyExperience() {
  document.documentElement.dataset.experience = 'classic';
  syncThemeColor();
  // Replace obsolete edition preferences so bookmarked Original pages stay Original.
  try { localStorage.setItem(STORAGE_KEY, 'classic'); } catch { /* Works without storage. */ }
}

const originalExperience = {
  experience: 'classic', white: false, homePath: '/',
};

export function ExperienceProvider({ children }) {
  useLayoutEffect(() => { applyExperience(); }, []);
  return <ExperienceContext.Provider value={originalExperience}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) throw new Error('useExperience requires ExperienceProvider');
  return context;
}

// The separate White router shares readers without changing Original URLs.
const readingExperience = {
  experience: 'white', white: true, homePath: '/',
};
export function PlainReadingProvider({ children }) {
  return <ExperienceContext.Provider value={readingExperience}>{children}</ExperienceContext.Provider>;
}
