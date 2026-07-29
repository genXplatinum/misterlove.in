import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { MathUtils } from 'three';

const CHAPTERS = ['hero', 'about', 'practice', 'method', 'writing', 'education', 'lovelace', 'contact'];
const CHAPTER_OPACITY = [1, 0.08, 0.16, 0.16, 0.08, 0.08, 0.16, 0.18];

const smooth = (value) => value * value * (3 - 2 * value);
const mix = (a, b, t) => MathUtils.lerp(a, b, t);

function slabState(chapter, i) {
  const d = i - 3;

  switch (chapter) {
    case 1: // The archive opens.
      return {
        p: [d * 0.08, d * 0.12 + (i < 2 ? 0.34 : 0), d * 0.18],
        r: [i < 2 ? -0.34 - i * 0.08 : d * 0.016, i < 2 ? d * 0.09 : d * 0.015, d * 0.025],
        s: 1,
      };
    case 2: { // Three fields of practice.
      const column = (i % 3) - 1;
      const row = Math.floor(i / 3) - 1;
      return {
        p: [column * 0.88, row * 0.38, d * 0.1],
        r: [0.04 * row, -0.11 * column, 0.025 * column],
        s: 0.72,
      };
    }
    case 3: // Method: a measured sequence.
      return {
        p: [d * 0.2, d * 0.3, d * 0.06],
        r: [d * 0.02, -0.08, d * -0.018],
        s: 0.84,
      };
    case 4: // Writing: folios fan out.
      return {
        p: [d * 0.54, -Math.abs(d) * 0.13, Math.abs(d) * -0.05],
        r: [0.05, d * -0.08, d * -0.085],
        s: 0.62,
      };
    case 5: // Education: pages become a rising column.
      return {
        p: [(i % 2 ? 0.28 : -0.28), d * 0.42, d * 0.08],
        r: [0.02, d * 0.025, i % 2 ? 0.055 : -0.055],
        s: 0.7,
      };
    case 6: // Lovelace: one deliberate fan.
      return {
        p: [d * 0.32, Math.sin(i * 0.8) * 0.2, d * 0.12],
        r: [d * 0.018, d * -0.055, d * -0.045],
        s: 0.77,
      };
    case 7: // Closure.
      return {
        p: [d * 0.025, d * 0.065 - 0.34, d * 0.14],
        r: [-0.05, -0.12, d * 0.012],
        s: 0.9,
      };
    default: // Hero: a quiet closed archive.
      return {
        p: [d * 0.025, d * 0.065, d * 0.14],
        r: [-0.07, -0.16, d * 0.012],
        s: 0.9,
      };
  }
}

function interpolateState(a, b, t) {
  return {
    p: a.p.map((value, index) => mix(value, b.p[index], t)),
    r: a.r.map((value, index) => mix(value, b.r[index], t)),
    s: mix(a.s, b.s, t),
  };
}

export default function ArchiveObject({ reduced = false, mobile = false }) {
  const root = useRef(null);
  const slabs = useRef([]);
  const brass = useRef(null);
  const chapterOffsets = useRef([]);
  const pointer = useRef({ x: 0, y: 0 });
  const scroll = useRef({ chapter: 0, next: 0, progress: 0 });

  const materials = useMemo(
    () => [
      '#4B562F',
      '#D8D0B9',
      '#333B25',
      '#EEE7D4',
      '#59643A',
      '#C8BEA4',
      '#2B321F',
    ],
    []
  );

  useEffect(() => {
    let active = true;
    const measure = () => {
      chapterOffsets.current = CHAPTERS.map((name) => {
        const element = document.querySelector(`[data-scene="${name}"]`);
        return element ? element.offsetTop : 0;
      });
    };

    const onPointer = (event) => {
      if (mobile || reduced) return;
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    measure();
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    const resizeObserver = 'ResizeObserver' in window
      ? new ResizeObserver(measure)
      : null;
    document.querySelectorAll('[data-scene]').forEach((element) => {
      resizeObserver?.observe(element);
    });
    document.fonts?.ready.then(() => {
      if (active) measure();
    });
    const lateMeasure = window.setTimeout(measure, 300);

    return () => {
      active = false;
      window.clearTimeout(lateMeasure);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pointermove', onPointer);
      resizeObserver?.disconnect();
    };
  }, [mobile, reduced]);

  useFrame((state, delta) => {
    if (!root.current || reduced || document.hidden) return;

    const offsets = chapterOffsets.current;
    const marker = window.scrollY + window.innerHeight * 0.52;
    let chapter = 0;

    for (let i = 0; i < offsets.length; i += 1) {
      if (marker >= offsets[i]) chapter = i;
    }

    const next = Math.min(chapter + 1, offsets.length - 1);
    const start = offsets[chapter] ?? 0;
    const end = offsets[next] ?? start + window.innerHeight;
    const raw = end > start ? MathUtils.clamp((marker - start) / (end - start), 0, 1) : 0;
    scroll.current.chapter = chapter;
    scroll.current.next = next;
    scroll.current.progress = smooth(raw);
    const damping = 1 - Math.exp(-delta * 6.5);
    const heroFade = smooth(MathUtils.clamp((raw - 0.55) / 0.45, 0, 1));
    const targetOpacity = chapter === 0
      ? mix(CHAPTER_OPACITY[0], CHAPTER_OPACITY[next], heroFade)
      : mix(CHAPTER_OPACITY[chapter], CHAPTER_OPACITY[next], scroll.current.progress);
    const currentOpacity = Number.parseFloat(state.gl.domElement.style.opacity || '1');
    state.gl.domElement.style.opacity = mix(
      currentOpacity,
      mobile ? Math.min(targetOpacity, 0.86) : targetOpacity,
      damping
    ).toFixed(3);

    slabs.current.forEach((slab, i) => {
      if (!slab) return;
      const from = slabState(chapter, i);
      const to = slabState(next, i);
      const target = interpolateState(from, to, scroll.current.progress);
      slab.position.x = mix(slab.position.x, target.p[0], damping);
      slab.position.y = mix(slab.position.y, target.p[1], damping);
      slab.position.z = mix(slab.position.z, target.p[2], damping);
      slab.rotation.x = mix(slab.rotation.x, target.r[0], damping);
      slab.rotation.y = mix(slab.rotation.y, target.r[1], damping);
      slab.rotation.z = mix(slab.rotation.z, target.r[2], damping);
      const nextScale = mix(slab.scale.x, target.s, damping);
      slab.scale.setScalar(nextScale);
    });

    const elapsed = state.clock.elapsedTime;
    const pointerX = pointer.current.x * 0.045;
    const pointerY = pointer.current.y * 0.035;
    const targetX = mobile ? 0 : 1.72;
    const targetY = mobile ? -0.72 : 0.02;
    const targetScale = mobile ? 0.66 : 0.96;

    root.current.position.x = mix(root.current.position.x, targetX, 0.055);
    root.current.position.y = mix(root.current.position.y, targetY, 0.055);
    root.current.rotation.x = mix(root.current.rotation.x, -pointerY + Math.sin(elapsed * 0.22) * 0.018, 0.045);
    root.current.rotation.y = mix(root.current.rotation.y, pointerX + Math.sin(elapsed * 0.16) * 0.025, 0.045);
    const rootScale = mix(root.current.scale.x, targetScale, 0.055);
    root.current.scale.setScalar(rootScale);

    if (brass.current) {
      brass.current.rotation.z = Math.sin(elapsed * 0.18) * 0.025;
    }
  });

  return (
    <group
      ref={root}
      position={[mobile ? 0 : 1.72, mobile ? -0.72 : 0.02, 0]}
      scale={mobile ? 0.66 : 0.96}
      rotation={[-0.05, -0.12, 0]}
    >
      {materials.map((color, i) => {
        const initial = slabState(0, i);
        return (
          <group
            key={color + i}
            ref={(element) => { slabs.current[i] = element; }}
            position={initial.p}
            rotation={initial.r}
            scale={initial.s}
          >
            <RoundedBox args={[2.55, 3.5, 0.12]} radius={0.075} smoothness={2}>
              <meshStandardMaterial
                color={color}
                roughness={i % 2 ? 0.82 : 0.66}
                metalness={i % 2 ? 0.01 : 0.05}
              />
            </RoundedBox>
            <mesh position={[0, 0, 0.071]}>
              <planeGeometry args={[2.2, 3.12]} />
              <meshBasicMaterial
                color={i % 2 ? '#F4EDDB' : '#718050'}
                transparent
                opacity={i % 2 ? 0.035 : 0.028}
              />
            </mesh>
          </group>
        );
      })}

      <mesh ref={brass} position={[0.22, 0, 1.15]}>
        <boxGeometry args={[0.018, 4.15, 0.018]} />
        <meshStandardMaterial color="#B58B48" roughness={0.46} metalness={0.42} />
      </mesh>
    </group>
  );
}
