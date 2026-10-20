import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ExperienceProvider, readExperience, applyExperience } from './components/ExperienceProvider';
import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/source-serif-4/400.css';
import ErrorBoundary from './components/ErrorBoundary';
import { applyTheme, readStoredTheme, ThemeProvider } from './components/ThemeProvider';

// Vite sets BASE_URL from `base` in vite.config. Strip the trailing slash so React
// Router gets e.g. "/lovepreet-singh" (or undefined → root) as its basename, which
// keeps routing correct when served from a GitHub Pages subfolder.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;
const whitePath = `${basename || ''}/white`;
const isWhite = window.location.pathname === whitePath || window.location.pathname.startsWith(`${whitePath}/`);
const WhiteApp = lazy(() => import('./white/WhiteApp.jsx'));
const initialTheme = readStoredTheme();
const initialExperience = readExperience();
if (isWhite) {
  document.documentElement.classList.add('white-edition');
  document.documentElement.dataset.experience = 'classic';
} else applyExperience(initialExperience);
applyTheme(initialTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider initialTheme={initialTheme}>
      <BrowserRouter basename={isWhite ? whitePath : basename}>
        <ErrorBoundary
          fallback={
            <div style={{ padding: '3rem', fontFamily: 'Source Sans 3, sans-serif', color: 'var(--ink)', background: 'var(--canvas)', minHeight: '100vh' }}>
              Something went wrong opening the site. Please refresh.
            </div>
          }
        >
          {isWhite
            ? <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fff', color: '#121212', padding: '3rem', fontFamily: 'sans-serif' }} role="status">Opening the archive…</div>}><WhiteApp /></Suspense>
            : <ExperienceProvider initialExperience={initialExperience}><App /></ExperienceProvider>}
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
