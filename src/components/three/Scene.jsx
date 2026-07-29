import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import ArchiveObject from './ArchiveObject';

function canUseWebGL() {
  if (typeof window === 'undefined') return false;
  if (navigator.connection?.saveData) return false;
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return false;

  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function FramePolicy({ reduced }) {
  const { setFrameloop, invalidate } = useThree();

  useEffect(() => {
    const apply = () => {
      if (document.hidden) setFrameloop('never');
      else if (reduced) {
        setFrameloop('demand');
        invalidate();
      } else {
        setFrameloop('always');
      }
    };

    apply();
    document.addEventListener('visibilitychange', apply);
    return () => document.removeEventListener('visibilitychange', apply);
  }, [invalidate, reduced, setFrameloop]);

  return null;
}

function SceneLifecycle({ onReady, onUnavailable }) {
  const { gl, invalidate } = useThree();
  const waitingForFrame = useRef(true);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event) => {
      event.preventDefault();
      waitingForFrame.current = true;
      onUnavailable?.();
    };
    const handleRestored = () => {
      waitingForFrame.current = true;
      invalidate();
    };

    canvas.addEventListener('webglcontextlost', handleLost);
    canvas.addEventListener('webglcontextrestored', handleRestored);
    invalidate();

    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
      onUnavailable?.();
    };
  }, [gl, invalidate, onUnavailable]);

  useFrame(() => {
    if (!waitingForFrame.current) return;
    waitingForFrame.current = false;
    onReady?.();
  });

  return null;
}

export default function Scene({ onReady, onUnavailable }) {
  const [mobile, setMobile] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 820 : false
  ));
  const [reduced, setReduced] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ));
  const supported = useMemo(canUseWebGL, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const resize = () => setMobile(window.innerWidth < 820);
    const changeMotion = () => setReduced(motion.matches);

    window.addEventListener('resize', resize, { passive: true });
    motion.addEventListener?.('change', changeMotion);
    return () => {
      window.removeEventListener('resize', resize);
      motion.removeEventListener?.('change', changeMotion);
    };
  }, []);

  if (!supported || reduced) return null;

  return (
    <Canvas
      className="scene-canvas"
      dpr={mobile ? [1, 1.25] : [1, 1.5]}
      camera={{ position: mobile ? [0, 0.2, 9] : [0, 0, 7], fov: mobile ? 42 : 34 }}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      <FramePolicy reduced={reduced} />
      <Suspense fallback={null}>
        <ambientLight intensity={0.62} color="#6B713F" />
        <directionalLight position={[5, 7, 4]} intensity={3.2} color="#F1E9D8" />
        <directionalLight position={[-4, 2, 2]} intensity={1.6} color="#B9C78B" />
        <pointLight position={[0, -3, 4]} intensity={1.1} color="#B58B48" distance={10} />

        <ArchiveObject reduced={reduced} mobile={mobile} />

        <Environment resolution={128} frames={1}>
          <Lightformer
            form="rect"
            intensity={1.5}
            position={[0, 1, 6]}
            scale={[12, 12, 1]}
            color="#252C1C"
          />
          <Lightformer
            form="rect"
            intensity={3}
            position={[4, 5, 3]}
            scale={[5, 8, 1]}
            color="#F1E9D8"
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            position={[-5, 1, 2]}
            scale={[4, 7, 1]}
            color="#B9C78B"
          />
          <Lightformer
            form="ring"
            intensity={1.1}
            position={[0, -4, 1]}
            scale={4}
            color="#B58B48"
          />
        </Environment>
        <SceneLifecycle onReady={onReady} onUnavailable={onUnavailable} />
      </Suspense>
    </Canvas>
  );
}
