import { StrictMode } from 'react';
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
import './observatory.css';
import ErrorBoundary from './components/ErrorBoundary';
import { applyTheme, readStoredTheme, ThemeProvider } from './components/ThemeProvider';

// Vite sets BASE_URL from `base` in vite.config. Strip the trailing slash so React
// Router gets e.g. "/lovepreet-singh" (or undefined → root) as its basename, which
// keeps routing correct when served from a GitHub Pages subfolder.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;
const initialTheme = readStoredTheme();
const initialExperience = readExperience();
applyExperience(initialExperience);
applyTheme(initialTheme);
// Honor a returning visitor's preferred homepage once, before the router starts.
// Later Back/Forward navigation remains faithful to the actual home URLs.
if (window.location.pathname.replace(/\/$/, '') === (basename || '') && initialExperience === 'immersive') {
  window.history.replaceState(window.history.state, '', `${basename || ''}/observatory${window.location.search}${window.location.hash}`);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider initialTheme={initialTheme}>
      <BrowserRouter basename={basename}>
        <ErrorBoundary
          fallback={
            <div style={{ padding: '3rem', fontFamily: 'Source Sans 3, sans-serif', color: 'var(--ink)', background: 'var(--canvas)', minHeight: '100vh' }}>
              Something went wrong opening the site. Please refresh.
            </div>
          }
        >
          <ExperienceProvider initialExperience={initialExperience}><App /></ExperienceProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
