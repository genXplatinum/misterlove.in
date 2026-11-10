import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { ExperienceProvider, readExperience, applyExperience } from './components/ExperienceProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { applyTheme, readStoredTheme, ThemeProvider } from './components/ThemeProvider';

// Vite sets BASE_URL from `base` in vite.config. Strip the trailing slash so React
// Router gets e.g. "/lovepreet-singh" (or undefined → root) as its basename, which
// keeps routing correct when served from a GitHub Pages subfolder.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;
const originalPath = `${basename || ''}/original`;
const isOriginal = window.location.pathname === originalPath || window.location.pathname.startsWith(`${originalPath}/`);
// Keep the already-rendered page visible while its edition's code arrives.
// Original homepage code is no longer downloaded by White or article pages.
// Separate statements keep Vite from merging both branches' preload lists.
let EditionApp;
if (!isOriginal) {
  ({ default: EditionApp } = await import('./white/WhiteApp.jsx'));
} else {
  ({ default: EditionApp } = await import('./App.jsx'));
}
const initialTheme = readStoredTheme();
const initialExperience = readExperience();
if (!isOriginal) {
  document.documentElement.classList.add('white-edition');
  document.documentElement.dataset.experience = 'classic';
} else applyExperience(initialExperience);
applyTheme(initialTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider initialTheme={initialTheme}>
      <BrowserRouter basename={isOriginal ? originalPath : basename}>
        <ErrorBoundary
          fallback={
            <div style={{ padding: '3rem', fontFamily: 'Source Sans 3, sans-serif', color: 'var(--ink)', background: 'var(--canvas)', minHeight: '100vh' }}>
              Something went wrong opening the site. Please refresh.
            </div>
          }
        >
          {isOriginal
            ? <ExperienceProvider initialExperience={initialExperience}><EditionApp /></ExperienceProvider>
            : <EditionApp />}
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
