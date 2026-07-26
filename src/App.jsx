import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Loader from './components/Loader';
import Cursor from './components/Cursor';
import Nav from './components/Nav';
import Footer from './components/Footer';
import StatusBar from './components/StatusBar';
import ScrollProgress from './components/ScrollProgress';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import { ScrollTrigger } from './lib/gsap';

const Scene = lazy(() => import('./components/three/Scene'));
const Writing = lazy(() => import('./pages/Writing'));
const Topic = lazy(() => import('./pages/Topic'));
const Article = lazy(() => import('./pages/Article'));

/** Home-only chrome: the boot handshake and the Sentinel Core behind it. */
function HomeExperience({ onReady, canvasRef }) {
  return (
    <>
      <Loader onComplete={onReady} />
      <div ref={canvasRef} className="canvas-layer" aria-hidden="true">
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const canvasRef = useRef(null);
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  const handleReady = () => {
    setReady(true);
    document.body.classList.add('is-ready');
    ScrollTrigger.refresh();
  };

  // The reading routes never run the boot sequence, so the Hero's
  // body.is-ready gate has to be satisfied another way — otherwise a visitor
  // who lands on /writing and then navigates home meets a hidden hero.
  useEffect(() => {
    if (!isHome) document.body.classList.add('is-ready');
  }, [isHome]);

  // Fade the dark 3D canvas out as the light (business) act begins,
  // and bring it back for the dark contact bookend.
  useEffect(() => {
    if (!ready || !isHome) return;
    const layer = canvasRef.current;
    const light = document.querySelector('#ventures');
    const dark = document.querySelector('#contact');
    if (!layer) return;

    const triggers = [];
    if (light) {
      triggers.push(
        ScrollTrigger.create({
          trigger: light,
          start: 'top 85%',
          end: 'top 35%',
          scrub: true,
          onUpdate: (self) => { layer.style.opacity = String(1 - self.progress); },
        })
      );
    }
    if (dark) {
      triggers.push(
        ScrollTrigger.create({
          trigger: dark,
          start: 'top 70%',
          end: 'top 20%',
          scrub: true,
          onUpdate: (self) => { layer.style.opacity = String(self.progress); },
        })
      );
    }
    return () => triggers.forEach((t) => t.kill());
  }, [ready, isHome]);

  return (
    <>
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <ScrollProgress />
      <a href="#main" className="skip-link">Skip to content</a>

      {isHome && <HomeExperience onReady={handleReady} canvasRef={canvasRef} />}

      <Nav />
      <main id="main">
        <ErrorBoundary
          fallback={
            <div className="route-fallback">
              <p>Something went wrong loading this page.</p>
              <a href={import.meta.env.BASE_URL} className="btn btn--ghost">Back to home</a>
            </div>
          }
        >
          <Suspense fallback={<div className="route-fallback mono">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              {/* The shelf → one topic → one part of that topic. */}
              <Route path="/writing" element={<Writing />} />
              <Route path="/writing/:slug" element={<Topic />} />
              {/* Router params must span a whole segment, so the "part-N"
                  segment is matched as one param and parsed in Article. */}
              <Route path="/writing/:slug/:part" element={<Article />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      {isHome && <StatusBar />}
    </>
  );
}
