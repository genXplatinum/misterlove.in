import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';

// Vite sets BASE_URL from `base` in vite.config. Strip the trailing slash so React
// Router gets e.g. "/lovepreet-singh" (or undefined → root) as its basename, which
// keeps routing correct when served from a GitHub Pages subfolder.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ErrorBoundary
        fallback={
          <div style={{ padding: '3rem', fontFamily: 'Inter, sans-serif', color: '#F3F0E5', background: '#14170F', minHeight: '100vh' }}>
            Something went wrong opening the site. Please refresh.
          </div>
        }
      >
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);
