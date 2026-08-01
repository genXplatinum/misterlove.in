import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import ScrollProgress from './components/ScrollProgress';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';

const Writing = lazy(() => import('./pages/Writing'));
const Topic = lazy(() => import('./pages/Topic'));
const Article = lazy(() => import('./pages/Article'));

function NotFound() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Page not found | Lovepreet Singh';
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <section className="not-found">
      <p className="archive-label">404 · Page not found</p>
      <h1>This page could not be found.</h1>
      <p>The address may have changed, or the page may never have existed.</p>
      <div>
        <Link to="/" className="btn">Return home</Link>
        <Link to="/writing" className="link">Browse the writing →</Link>
      </div>
    </section>
  );
}

function AppFrame({ isHome, resetKey }) {
  return (
    <>
      <ScrollProgress />
      <div className="surface-noise" aria-hidden="true" />
      <a href="#main" className="skip-link">Skip to content</a>
      <Nav />

      <main id="main" tabIndex="-1" className={isHome ? 'main--home' : 'main--reading'}>
        <ErrorBoundary
          resetKey={resetKey}
          fallback={
            <div className="route-fallback">
              <p>This page could not be opened.</p>
              <div>
                <button type="button" className="btn" onClick={() => window.location.reload()}>
                  Reload page
                </button>
                <Link to="/" className="link">Return home →</Link>
              </div>
            </div>
          }
        >
          <Suspense fallback={<div className="route-fallback" role="status" aria-live="polite">Opening…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/writing" element={<Writing />} />
              <Route path="/writing/:slug" element={<Topic />} />
              <Route path="/hi/writing/:slug" element={<Topic />} />
              <Route path="/writing/:slug/:part" element={<Article />} />
              <Route path="/hi/writing/:slug/:part" element={<Article />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const isHome = location.pathname === '/';

  useEffect(() => {
    document.body.classList.toggle('is-home', isHome);
    return () => document.body.classList.remove('is-home');
  }, [isHome]);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    if (!location.state?.scrollTo) window.scrollTo(0, 0);
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }));
  }, [location.pathname, location.state]);

  return <AppFrame isHome={isHome} resetKey={location.key} />;
}
