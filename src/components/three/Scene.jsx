import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import SentinelCore from './SentinelCore';

/**
 * Fixed background canvas for the hero. Dark "operations" lighting built from
 * local Lightformers (no external HDR fetch) with electric-blue + cyan
 * reflections. Rendered with a TRANSPARENT background (alpha) so the page
 * shows through — no post-processing composer (which would force an opaque
 * black buffer over the page).
 */
export default function Scene() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 5]} intensity={2.2} color="#cdd8ff" />
        <directionalLight position={[-6, -2, 2]} intensity={1.1} color="#4fe3ff" />
        <pointLight position={[0, 0, 3]} intensity={7} color="#4d6bff" distance={9} />

        <SentinelCore reduced={reduced} />

        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={0.5} position={[0, 0, 6]} scale={[16, 16, 1]} color="#0a0e1c" />
          <Lightformer form="rect" intensity={3} position={[3, 4, 3]} scale={[6, 8, 1]} color="#4d6bff" />
          <Lightformer form="rect" intensity={2.2} position={[-5, -1, 2]} scale={[5, 9, 1]} color="#2740c8" />
          <Lightformer form="ring" intensity={3} position={[-3, 3, -2]} scale={3} color="#4fe3ff" />
          <Lightformer form="rect" intensity={1.4} position={[0, -5, 1]} scale={[10, 4, 1]} color="#10162e" />
        </Environment>
      </Suspense>
    </Canvas>
  );
}
