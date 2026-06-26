import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import { MathUtils } from 'three';

/**
 * The Sentinel Core — the signature object.
 *   · an obsidian distorted core (the asset being protected)
 *   · a shield-field of points wrapping it (the perimeter)
 *   · a counter-rotating wireframe lattice (the mesh defense)
 *   · orbiting sentry nodes + a vertical scan ring sweeping through
 * Tilts toward the cursor and drifts / shrinks as the hero scrolls away.
 */
export default function SentinelCore({ reduced = false }) {
  const group = useRef();
  const core = useRef();
  const mat = useRef();
  const lattice = useRef();
  const field = useRef();
  const ringA = useRef();
  const ringB = useRef();
  const scan = useRef();
  const nodes = useRef([]);
  const mouse = useRef({ x: 0, y: 0 });
  const base = useRef(1);

  const R = 2.15;

  // Shield-field points on a Fibonacci sphere
  const positions = useMemo(() => {
    const N = reduced ? 320 : 880;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      pos[i * 3] = Math.cos(phi) * r * R;
      pos[i * 3 + 1] = y * R;
      pos[i * 3 + 2] = Math.sin(phi) * r * R;
    }
    return pos;
  }, [reduced]);

  // Orbiting sentry nodes
  const sentries = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        radius: 2.5 + (i % 3) * 0.32,
        speed: 0.18 + i * 0.05,
        phase: (i / 5) * Math.PI * 2,
        tilt: (i - 2) * 0.5,
        size: 0.045 + (i % 2) * 0.02,
      })),
    []
  );

  useEffect(() => {
    const setBase = () => {
      const w = window.innerWidth;
      base.current = w < 600 ? 0.62 : w < 1024 ? 0.82 : 1;
    };
    setBase();
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('resize', setBase);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', setBase);
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const p = Math.min(scrollY / (window.innerHeight * 1.1), 1); // hero scroll progress

    if (group.current) {
      // tilt toward cursor + drift/shrink on scroll
      const tx = mouse.current.y * 0.18 + p * 0.5;
      const ty = mouse.current.x * 0.26 + t * 0.06 + p * 0.6;
      group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, tx, 0.05);
      group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, ty, 0.05);

      const targetScale = base.current * MathUtils.lerp(1, 0.55, p);
      const s = MathUtils.lerp(group.current.scale.x, targetScale, 0.06);
      group.current.scale.setScalar(s);

      group.current.position.x = MathUtils.lerp(group.current.position.x, 1.7 + p * 1.4, 0.05);
      group.current.position.y = MathUtils.lerp(group.current.position.y, 0.1 + p * 0.6, 0.05);
    }

    if (core.current) core.current.rotation.y = t * 0.1;
    if (mat.current && !reduced) mat.current.distort = 0.3 + Math.sin(t * 0.5) * 0.06;
    if (lattice.current) {
      lattice.current.rotation.y = -t * 0.08;
      lattice.current.rotation.x = t * 0.04;
    }
    if (field.current) field.current.rotation.y = t * 0.05;
    if (ringA.current) { ringA.current.rotation.x = t * 0.4; ringA.current.rotation.y = t * 0.2; }
    if (ringB.current) { ringB.current.rotation.y = -t * 0.3; ringB.current.rotation.z = t * 0.25; }

    // Vertical scan sweep — ring follows the sphere cross-section
    if (scan.current) {
      const y = Math.sin(t * 0.6) * R * 0.96;
      const rad = Math.sqrt(Math.max(0.0001, R * R - y * y));
      scan.current.position.y = y;
      scan.current.scale.setScalar(rad / R);
      scan.current.material.opacity = 0.35 + Math.cos(t * 0.6) * 0.15;
    }

    // Sentry nodes orbit
    nodes.current.forEach((n, i) => {
      if (!n) return;
      const s = sentries[i];
      const a = s.phase + t * s.speed;
      n.position.set(
        Math.cos(a) * s.radius,
        Math.sin(a * 0.8 + s.tilt) * 0.6,
        Math.sin(a) * s.radius
      );
    });
  });

  return (
    <group ref={group} position={[1.7, 0.1, 0]}>
      {/* Core — obsidian, electric reflections */}
      <mesh ref={core}>
        <icosahedronGeometry args={[1.25, 48]} />
        <MeshDistortMaterial
          ref={mat}
          color="#0b0e18"
          metalness={0.92}
          roughness={0.14}
          distort={0.3}
          speed={reduced ? 0 : 1.3}
          envMapIntensity={1.6}
        />
      </mesh>

      {/* Inner glow shell */}
      <mesh scale={1.02}>
        <icosahedronGeometry args={[1.25, 6]} />
        <meshBasicMaterial color="#4d6bff" transparent opacity={0.05} />
      </mesh>

      {/* Wireframe lattice (defense mesh) */}
      <mesh ref={lattice} scale={1.55}>
        <icosahedronGeometry args={[1.25, 2]} />
        <meshBasicMaterial color="#4d6bff" wireframe transparent opacity={0.22} />
      </mesh>

      {/* Shield field points */}
      <points ref={field}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#7d93ff"
          size={0.028}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>

      {/* Orbit rings */}
      <mesh ref={ringA}>
        <torusGeometry args={[2.45, 0.006, 8, 120]} />
        <meshBasicMaterial color="#4d6bff" transparent opacity={0.55} />
      </mesh>
      <mesh ref={ringB}>
        <torusGeometry args={[2.75, 0.005, 8, 120]} />
        <meshBasicMaterial color="#4fe3ff" transparent opacity={0.4} />
      </mesh>

      {/* Vertical scan ring */}
      <mesh ref={scan} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R, 0.012, 8, 120]} />
        <meshBasicMaterial color="#4fe3ff" transparent opacity={0.4} />
      </mesh>

      {/* Sentry nodes */}
      {sentries.map((s, i) => (
        <mesh key={i} ref={(el) => (nodes.current[i] = el)}>
          <sphereGeometry args={[s.size, 16, 16]} />
          <meshBasicMaterial color={i % 2 ? '#4fe3ff' : '#7d93ff'} />
        </mesh>
      ))}
    </group>
  );
}
