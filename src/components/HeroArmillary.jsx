import { useEffect, useRef, useState } from 'react';

// The architecture is a still plate. Only the instrument is rendered and rotated.
export default function HeroArmillary({ paused }) {
  const host = useRef(null);
  const canvasHost = useRef(null);
  const pausedRef = useRef(paused);
  const [plateReady, setPlateReady] = useState(false);
  const [rendered, setRendered] = useState(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const element = host.current;
    const layout = () => {
      const { width, height } = element.getBoundingClientRect();
      const mobile = width <= 650;
      const ratio = 1660 / 948;
      const imageWidth = Math.max(width, height * ratio);
      const imageHeight = imageWidth / ratio;
      element.style.setProperty('--plate-width', `${imageWidth}px`);
      element.style.setProperty('--plate-height', `${imageHeight}px`);
      element.style.setProperty('--plate-left', `${(width - imageWidth) * (mobile ? .8 : width <= 1000 ? .62 : .58)}px`);
      element.style.setProperty('--plate-top', `${(height - imageHeight) * (mobile ? .6 : .5)}px`);
    };
    const observer = new ResizeObserver(layout);
    observer.observe(element);
    layout();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = canvasHost.current;
    let cancelled = false;
    let dispose = () => {};
    (async () => {
      let renderer;
      try {
        const [T, { RoomEnvironment }] = await Promise.all([
          import('three'), import('three/addons/environments/RoomEnvironment.js'),
        ]);
        if (cancelled) return;
        renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = .82;
        element.appendChild(renderer.domElement);
        const scene = new T.Scene();
        const camera = new T.OrthographicCamera(-2.6, 2.6, 2.6, -2.6, .1, 30);
        camera.position.set(0, 0, 9);
        const room = new RoomEnvironment();
        const pmrem = new T.PMREMGenerator(renderer);
        const environment = pmrem.fromScene(room, .06);
        scene.environment = environment.texture;
        scene.environmentIntensity = .65;
        room.dispose(); pmrem.dispose();

        // Deterministic patina and engraved celestial markings keep the metal
        // close to the weathered brass in the surrounding photograph.
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 1024; textureCanvas.height = 256;
        const ctx = textureCanvas.getContext('2d');
        ctx.fillStyle = '#b19b70'; ctx.fillRect(0, 0, 1024, 256);
        let seed = 17;
        const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < 9000; i++) {
          ctx.fillStyle = `rgba(30,29,20,${random() * .16})`;
          ctx.fillRect(random() * 1024, random() * 256, random() * 5 + 1, random() * 3 + 1);
        }
        const patinaCanvas = document.createElement('canvas');
        patinaCanvas.width = 1024; patinaCanvas.height = 256;
        patinaCanvas.getContext('2d').drawImage(textureCanvas, 0, 0);
        const patina = new T.CanvasTexture(patinaCanvas);
        patina.colorSpace = T.SRGBColorSpace;
        ctx.strokeStyle = '#514932'; ctx.lineWidth = 1.1;
        for (let i = 0; i < 120; i++) {
          const x = i * 1024 / 120;
          ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, i % 5 ? 42 : 76); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, 244); ctx.lineTo(x, i % 5 ? 214 : 180); ctx.stroke();
        }
        ctx.font = '24px Georgia'; ctx.fillStyle = '#4a402a'; ctx.textAlign = 'center';
        for (let i = 0; i < 12; i++) ctx.fillText(String(i * 30), (i + .5) * 1024 / 12, 139);
        const texture = new T.CanvasTexture(textureCanvas);
        texture.colorSpace = T.SRGBColorSpace;
        const brass = new T.MeshStandardMaterial({ color: 0xb9a675, metalness: .84, roughness: .48, map: texture });
        const edge = new T.MeshStandardMaterial({ color: 0x94815b, metalness: .85, roughness: .4 });
        const lightBrass = new T.MeshStandardMaterial({ color: 0xa08a5e, metalness: .86, roughness: .5, map: patina, bumpMap: patina, bumpScale: .025 });

        const sculpture = new T.Group();
        // Keep the mounting axis vertical and directly over the photographed plinth.
        sculpture.rotation.set(0, 0, 0);
        scene.add(sculpture);
        const makeBand = (radius, breadth, parent, x = 0, y = 0, z = 0) => {
          const group = new T.Group(); group.rotation.set(x, y, z); parent.add(group);
          const band = new T.Mesh(new T.CylinderGeometry(radius, radius, breadth, 128, 1, true), brass);
          band.material = brass.clone(); band.material.side = T.DoubleSide;
          group.add(band);
          for (const side of [-1, 1]) {
            const rim = new T.Mesh(new T.TorusGeometry(radius, .013, 8, 128), edge);
            rim.rotation.x = Math.PI / 2; rim.position.y = side * breadth / 2; group.add(rim);
          }
          return group;
        };
        const makeWire = (radius, parent, x, y, z, thickness = .009) => {
          const ring = new T.Mesh(new T.TorusGeometry(radius, thickness, 6, 128), edge);
          ring.rotation.set(x, y, z); parent.add(ring); return ring;
        };
        // The outside meridian remains attached to its plinth.
        const outerFrame = makeBand(2.06, .16, sculpture, Math.PI / 2, -.2, 0);
        const meridian = new T.Mesh(new T.RingGeometry(1.985, 2.135, 128), brass);
        meridian.rotation.x = -Math.PI / 2; meridian.position.y = .014;
        meridian.material = brass.clone(); meridian.material.side = T.DoubleSide;
        outerFrame.add(meridian);
        const engraving = new T.MeshStandardMaterial({ color: 0x51462e, roughness: .8, metalness: .4 });
        const tickGeometry = new T.BoxGeometry(.005, .008, .035);
        for (let i = 0; i < 120; i++) {
          const angle = i * Math.PI / 60;
          const tick = new T.Mesh(tickGeometry, engraving);
          tick.position.set(Math.sin(angle) * 2.06, .022, Math.cos(angle) * 2.06);
          tick.rotation.y = angle;
          if (i % 10 === 0) tick.scale.z = 2.4;
          outerFrame.add(tick);
        }
        const moving = new T.Group(); sculpture.add(moving);
        const equator = makeBand(1.98, .15, moving, .18, 0, -.15);
        const ecliptic = makeBand(1.84, .095, moving, .72, .16, .45);
        makeBand(1.68, .055, moving, Math.PI / 2, .72, -.35);
        makeWire(1.94, moving, .35, .8, .2);
        makeWire(1.76, moving, 1.13, -.55, .46);
        makeWire(1.44, moving, .86, .15, -.6, .007);

        const globe = new T.Group(); moving.add(globe);
        const globeBall = new T.Mesh(new T.SphereGeometry(.43, 48, 32), lightBrass);
        globe.add(globeBall);
        for (let i = 0; i < 8; i++) makeWire(.435, globe, 0, i * Math.PI / 8, 0, .0035);
        for (const y of [-.3, -.15, 0, .15, .3]) {
          const line = makeWire(Math.sqrt(.435 ** 2 - y ** 2), globe, Math.PI / 2, 0, 0, .003);
          line.position.y = y;
        }
        const spindle = new T.Mesh(new T.CylinderGeometry(.014, .014, 4.1, 10), edge);
        sculpture.add(spindle);
        for (const y of [-2.02, 2.08]) {
          const pin = new T.Mesh(new T.SphereGeometry(.055, 16, 12), lightBrass);
          pin.position.y = y; sculpture.add(pin);
        }
        for (let i = 0; i < 4; i++) {
          const satellite = new T.Mesh(new T.SphereGeometry(.055 + i * .013, 20, 16), lightBrass);
          const angle = i * 1.57 + .35;
          satellite.position.set(Math.cos(angle) * 1.91, Math.sin(angle) * .46, Math.sin(angle) * 1.86);
          moving.add(satellite);
          const rod = new T.Mesh(new T.CylinderGeometry(.006, .006, satellite.position.length(), 6), edge);
          rod.position.copy(satellite.position).multiplyScalar(.5);
          rod.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), satellite.position.clone().normalize());
          moving.add(rod);
        }
        const collar = new T.Mesh(new T.CylinderGeometry(.045, .085, .1, 20), edge);
        collar.position.y = -2.035; scene.add(collar);
        const key = new T.DirectionalLight(0xffe4b4, 3.1); key.position.set(-3, 5, 5); scene.add(key);
        const fill = new T.DirectionalLight(0x698692, .75); fill.position.set(4, 0, 3); scene.add(fill);
        const rim = new T.DirectionalLight(0xb9a17c, 1.5); rim.position.set(2, 2, -4); scene.add(rim);

        const resize = () => {
          const { width, height } = element.getBoundingClientRect();
          if (!width || !height) return;
          renderer.setSize(width, height, false);
          renderer.render(scene, camera);
        };
        const ro = new ResizeObserver(resize); ro.observe(element); resize();
        let visible = true, frame = 0, last = 0, turn = 0, wasPaused = null;
        const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
        observer.observe(element);
        const render = time => {
          frame = requestAnimationFrame(render);
          if (time - last < 32) return;
          const dt = Math.min((time - last) / 1000, .05); last = time;
          if (!visible || document.hidden) return;
          const stopped = pausedRef.current;
          if (stopped && wasPaused === true) return;
          if (!stopped) turn += dt * .12; // A full, clearly visible revolution in 52 seconds.
          moving.rotation.y = turn;
          ecliptic.rotation.z = .45 + turn * .33;
          equator.rotation.x = .18 + Math.sin(turn) * .12;
          globe.rotation.y = turn * .8;
          renderer.render(scene, camera);
          wasPaused = stopped;
        };
        const lost = event => { event.preventDefault(); cancelAnimationFrame(frame); setRendered(false); };
        renderer.domElement.addEventListener('webglcontextlost', lost);
        frame = requestAnimationFrame(render);
        setRendered(true);
        dispose = () => {
          cancelAnimationFrame(frame); ro.disconnect(); observer.disconnect();
          renderer.domElement.removeEventListener('webglcontextlost', lost);
          const geometries = new Set(), materials = new Set();
          scene.traverse(object => {
            if (object.geometry) geometries.add(object.geometry);
            if (object.material) materials.add(object.material);
          });
          geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
          brass.dispose(); texture.dispose(); patina.dispose(); environment.dispose(); renderer.dispose(); renderer.domElement.remove();
        };
      } catch {
        renderer?.dispose(); renderer?.domElement.remove();
        // The CSS instrument below also rotates, including on non-WebGL devices.
        if (!cancelled) setRendered(false);
      }
    })();
    return () => { cancelled = true; dispose(); };
  }, []);

  return <div ref={host} className={`hero-art ${plateReady ? 'has-instrument' : ''}`} aria-hidden="true">
    <img className="hero-art__original" src="/observatory.webp" alt="" fetchPriority="high" />
    <div className="hero-art__scene">
      <img className="hero-art__plate" src="/observatory-empty-arch.webp" alt="" onLoad={() => setPlateReady(true)} />
      <div className={`hero-armillary ${rendered ? 'has-webgl' : ''}`}>
        <div className="hero-armillary__css"><i /><i /><i /><i /><b /></div>
        <div ref={canvasHost} className="hero-armillary__canvas" />
      </div>
    </div>
  </div>;
}
