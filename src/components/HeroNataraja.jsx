import { useEffect, useRef, useState } from 'react';

// A living bronze relief, grounded on the photographed stone pedestal.
export default function HeroNataraja({ paused }) {
  const host = useRef(null);
  const canvasHost = useRef(null);
  const pausedRef = useRef(paused);
  const [rendered, setRendered] = useState(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const element = host.current;
    const layout = () => {
      const { width, height } = element.getBoundingClientRect();
      const imageWidth = Math.max(width, height * 1660 / 948);
      const imageHeight = imageWidth * 948 / 1660;
      element.style.setProperty('--plate-width', `${imageWidth}px`);
      element.style.setProperty('--plate-height', `${imageHeight}px`);
      element.style.setProperty('--plate-left', `${(width - imageWidth) * (width <= 650 ? .94 : .58)}px`);
      element.style.setProperty('--plate-top', `${(height - imageHeight) * (width <= 650 ? .6 : .5)}px`);
    };
    const observer = new ResizeObserver(layout);
    observer.observe(element); layout();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = canvasHost.current;
    let cancelled = false, renderer, environment, texture, scene, frame = 0;
    let resizeObserver, visibilityObserver, onContextLost;
    const dispose = () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect(); visibilityObserver?.disconnect();
      renderer?.domElement.removeEventListener('webglcontextlost', onContextLost);
      const geometries = new Set(), materials = new Set();
      scene?.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) materials.add(object.material);
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      texture?.dispose(); environment?.dispose();
      renderer?.dispose(); renderer?.domElement.remove();
    };
    (async () => {
      try {
        const [T, { RoomEnvironment }] = await Promise.all([
          import('three'), import('three/addons/environments/RoomEnvironment.js'),
        ]);
        if (cancelled) return;
        renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = .84;
        element.appendChild(renderer.domElement);
        scene = new T.Scene();
        const camera = new T.OrthographicCamera(-2.6, 2.6, 2.6, -2.6, .1, 30);
        camera.position.set(0, 0, 9);
        const room = new RoomEnvironment(), pmrem = new T.PMREMGenerator(renderer);
        environment = pmrem.fromScene(room, .06);
        scene.environment = environment.texture; scene.environmentIntensity = .5;
        room.dispose(); pmrem.dispose();
        const brass = new T.MeshStandardMaterial({ color: 0x9e8150, metalness: .88, roughness: .48 });
        const bright = new T.MeshStandardMaterial({ color: 0xb29862, metalness: .86, roughness: .38 });
        const halo = new T.Group(); halo.position.z = -.17; scene.add(halo);
        for (const radius of [2.045, 2.105]) halo.add(new T.Mesh(new T.TorusGeometry(radius, .018, 10, 160), bright));
        halo.add(new T.Mesh(new T.RingGeometry(2.045, 2.105, 160), brass));
        halo.add(new T.Mesh(new T.TorusGeometry(1.98, .009, 8, 160), brass));
        const flameShape = new T.Shape();
        flameShape.moveTo(-.037, 0);
        flameShape.bezierCurveTo(-.075, .075, -.015, .12, .045, .21);
        flameShape.bezierCurveTo(.01, .105, .085, .09, .037, 0);
        flameShape.quadraticCurveTo(0, -.02, -.037, 0);
        const flameGeometry = new T.ExtrudeGeometry(flameShape, { depth: .015, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .004, bevelThickness: .004, curveSegments: 12 });
        const flames = [];
        for (let i = 0; i < 32; i++) {
          const angle = i * Math.PI / 16;
          if (Math.cos(angle) > -.86) {
            const flameMaterial = new T.MeshStandardMaterial({ color: 0xac854b, metalness: .84, roughness: .44, emissive: 0x774015, emissiveIntensity: .11 });
            const flame = new T.Mesh(flameGeometry, flameMaterial);
            flame.position.set(Math.sin(angle) * 2.13, Math.cos(angle) * 2.13, 0);
            flame.rotation.z = -angle; halo.add(flame); flames.push(flame);
          }
          const bead = new T.Mesh(new T.SphereGeometry(.022, 10, 8), bright);
          bead.position.set(Math.sin(angle) * 2.075, Math.cos(angle) * 2.075, .018); halo.add(bead);
        }
        const key = new T.DirectionalLight(0xffdfaa, 3.1); key.position.set(-3, 5, 5); scene.add(key);
        const fill = new T.DirectionalLight(0x6e8b9a, .8); fill.position.set(3, 0, 4); scene.add(fill);
        texture = await new T.TextureLoader().loadAsync('/nataraja-apasmara.webp');
        if (cancelled) { texture.dispose(); return; }
        texture.colorSpace = T.SRGBColorSpace;
        const material = new T.ShaderMaterial({
          uniforms: { portrait: { value: texture }, danceTime: { value: 0 } },
          transparent: true,
          vertexShader: `
            uniform float danceTime;
            varying vec2 vUv;
            void main() {
              vUv = uv;
              vec3 p = position;
              float anchored = smoothstep(0.065, 0.23, uv.y);
              float lean = sin(danceTime * 0.72) * 0.029 * anchored;
              vec2 pivot = vec2(0.02, -1.80);
              mat2 rotation = mat2(cos(lean), sin(lean), -sin(lean), cos(lean));
              p.xy = rotation * (p.xy - pivot) + pivot;
              float arms = smoothstep(0.13, 0.32, abs(uv.x - 0.5)) * smoothstep(0.47, 0.61, uv.y) * (1.0 - smoothstep(0.9, 1.0, uv.y));
              p.y += sin(danceTime * 0.95 + uv.x * 4.0) * 0.075 * arms;
              p.x += cos(danceTime * 0.72 + uv.y * 5.0) * 0.035 * arms;
              float foot = smoothstep(0.11, 0.31, abs(uv.x - 0.5)) * smoothstep(0.2, 0.34, uv.y) * (1.0 - smoothstep(0.44, 0.55, uv.y));
              p.y += sin(danceTime * 0.72 + 0.8) * 0.06 * foot;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }`,
          fragmentShader: `
            uniform sampler2D portrait;
            varying vec2 vUv;
            void main() {
              vec4 pixel = texture2D(portrait, vUv);
              if(pixel.a < 0.02) discard;
              gl_FragColor = pixel;
              #include <colorspace_fragment>
            }`,
          toneMapped: false,
        });
        const figure = new T.Mesh(new T.PlaneGeometry(2.533, 3.8, 120, 160), material);
        // Transparent margins must not make the sculpture float above its base.
        const sample = document.createElement('canvas');
        sample.width = texture.image.width; sample.height = texture.image.height;
        const sampleContext = sample.getContext('2d');
        sampleContext.drawImage(texture.image, 0, 0);
        const rgba = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
        let bottom = sample.height - 1;
        outer: for (; bottom >= 0; bottom--) {
          for (let x = 0; x < sample.width; x++) if (rgba[(bottom * sample.width + x) * 4 + 3] > 100) break outer;
        }
        figure.position.set(-.02, -2.085 - (.5 - bottom / sample.height) * 3.8, .12);
        scene.add(figure);
        const resize = () => {
          const { width, height } = element.getBoundingClientRect();
          if (width && height) { renderer.setSize(width, height, false); renderer.render(scene, camera); }
        };
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element); resize();
        let visible = true, last = 0, time = 0, wasPaused = null;
        visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
        visibilityObserver.observe(host.current);
        const render = now => {
          frame = requestAnimationFrame(render);
          if (now - last < 32) return;
          const dt = Math.min((now - last) / 1000, .05); last = now;
          if (!visible || document.hidden) return;
          const stopped = pausedRef.current;
          if (stopped && wasPaused === true) return;
          if (!stopped) time += dt;
          material.uniforms.danceTime.value = time;
          flames.forEach((flame, index) => {
            flame.material.emissiveIntensity = .09 + .075 * (1 + Math.sin(time * 1.8 + index * 1.2));
            flame.scale.y = 1 + Math.sin(time * 2.2 + index * 1.7) * .055;
          });
          renderer.render(scene, camera); wasPaused = stopped;
        };
        onContextLost = event => { event.preventDefault(); cancelAnimationFrame(frame); setRendered(false); };
        renderer.domElement.addEventListener('webglcontextlost', onContextLost);
        frame = requestAnimationFrame(render); setRendered(true);
      } catch {
        dispose();
        if (!cancelled) setRendered(false);
      }
    })();
    return () => { cancelled = true; dispose(); };
  }, []);

  return <div ref={host} className="hero-art" aria-hidden="true">
    <div className="hero-art__scene">
      <img className="hero-art__plate" src="/observatory-empty-arch.webp" alt="" fetchPriority="high" />
      <div className={`hero-nataraja ${rendered ? 'has-webgl' : ''}`}>
        <div className="hero-nataraja__glow" />
        <div className="hero-nataraja__fallback"><div className="hero-nataraja__halo" /><img src="/nataraja-apasmara.webp" alt="" /></div>
        <div ref={canvasHost} className="hero-nataraja__canvas" />
      </div>
    </div>
  </div>;
}
