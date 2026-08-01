import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import { applyTheme, readStoredTheme, ThemeProvider } from './components/ThemeProvider';

// Vite sets BASE_URL from `base` in vite.config. Strip the trailing slash so React
// Router gets e.g. "/lovepreet-singh" (or undefined → root) as its basename, which
// keeps routing correct when served from a GitHub Pages subfolder.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;
const initialTheme = readStoredTheme();
applyTheme(initialTheme);

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
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
