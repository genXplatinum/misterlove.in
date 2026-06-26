import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import SentinelCore from './SentinelCore';

/**
 * Fixed background canvas for the hero. Dark "operations" lighting built from
 * local Lightformers (no external HDR fetch) with electric-blue + cyan
 * reflections, finished with bloom + a vignette for the cinematic glow.
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
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 6, 5]} intensity={1.6} color="#cdd8ff" />
        <directionalLight position={[-6, -2, 2]} intensity={0.7} color="#4fe3ff" />
        <pointLight position={[0, 0, 3]} intensity={6} color="#4d6bff" distance={9} />

        <SentinelCore reduced={reduced} />

        <Environment resolution={256} frames={1}>
          {/* dark surround so the obsidian core reads, with electric edges */}
          <Lightformer form="rect" intensity={0.5} position={[0, 0, 6]} scale={[16, 16, 1]} color="#0a0e1c" />
          <Lightformer form="rect" intensity={3} position={[3, 4, 3]} scale={[6, 8, 1]} color="#4d6bff" />
          <Lightformer form="rect" intensity={2.2} position={[-5, -1, 2]} scale={[5, 9, 1]} color="#2740c8" />
          <Lightformer form="ring" intensity={3} position={[-3, 3, -2]} scale={3} color="#4fe3ff" />
          <Lightformer form="rect" intensity={1.4} position={[0, -5, 1]} scale={[10, 4, 1]} color="#10162e" />
        </Environment>

        {!reduced && (
          <EffectComposer multisampling={4}>
            <Bloom
              intensity={0.85}
              luminanceThreshold={0.18}
              luminanceSmoothing={0.85}
              mipmapBlur
              radius={0.7}
            />
            <Vignette eskil={false} offset={0.3} darkness={0.7} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
