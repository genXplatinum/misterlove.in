import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import Loader from './components/Loader';
import Cursor from './components/Cursor';
import Nav from './components/Nav';
import Footer from './components/Footer';
import StatusBar from './components/StatusBar';
import ScrollProgress from './components/ScrollProgress';
import Home from './pages/Home';
import { ScrollTrigger } from './lib/gsap';

const Scene = lazy(() => import('./components/three/Scene'));

export default function App() {
  const [ready, setReady] = useState(false);
  const canvasRef = useRef(null);

  const handleReady = () => {
    setReady(true);
    document.body.classList.add('is-ready');
    ScrollTrigger.refresh();
  };

  // Fade the dark 3D canvas out as the light (business) act begins,
  // and bring it back for the dark contact bookend.
  useEffect(() => {
    if (!ready) return;
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
  }, [ready]);

  return (
    <>
      <Loader onComplete={handleReady} />
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <ScrollProgress />
      <a href="#main" className="skip-link">Skip to content</a>

      <div ref={canvasRef} className="canvas-layer" aria-hidden="true">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>

      <Nav />
      <main id="main">
        <Home />
      </main>
      <Footer />
      <StatusBar />
    </>
  );
}
