import { lazy, Suspense, useCallback, useEffect, useRef } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import ScrollProgress from './components/ScrollProgress';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';

const Scene = lazy(() => import('./components/three/Scene'));
const SmoothScroll = lazy(() => import('./components/SmoothScroll'));
const Writing = lazy(() => import('./pages/Writing'));
const Topic = lazy(() => import('./pages/Topic'));
const Article = lazy(() => import('./pages/Article'));

function SceneFailure() {
  useEffect(() => {
    document.documentElement.classList.remove('scene-ready');
  }, []);
  return null;
}

function HomeScene() {
  const markReady = useCallback(() => {
    document.documentElement.classList.add('scene-ready');
  }, []);
  const markUnavailable = useCallback(() => {
    document.documentElement.classList.remove('scene-ready');
  }, []);

  useEffect(() => markUnavailable, [markUnavailable]);

  return (
    <div className="canvas-layer" aria-hidden="true">
      <ErrorBoundary fallback={<SceneFailure />} onError={markUnavailable}>
        <Suspense fallback={null}>
          <Scene onReady={markReady} onUnavailable={markUnavailable} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function NotFound() {
  return (
    <section className="not-found">
      <p className="archive-label">404 · Page not found</p>
      <h1>This page is not in the archive.</h1>
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
      {isHome && <HomeScene />}
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
          <Suspense fallback={<div className="route-fallback" role="status" aria-live="polite">Opening the archive…</div>}>
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
    if (!isHome) document.documentElement.classList.remove('scene-ready');
    return () => document.body.classList.remove('is-home');
  }, [isHome]);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    if (!location.state?.scrollTo) window.scrollTo(0, 0);
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }));
  }, [location.pathname, location.state]);

  const frame = <AppFrame isHome={isHome} resetKey={location.key} />;

  return (
    <>
      {isHome && (
        <Suspense fallback={null}>
          <SmoothScroll />
        </Suspense>
      )}
      {frame}
    </>
  );
}
