import { useEffect, useRef, useState } from 'react';

// Loaded only near the viewport; the archive and text never depend on WebGL.
export default function InquiryInstrument({ paused, focus = 0 }) {
  const mount = useRef(null);
  const state = useRef({ paused, focus });
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { state.current = { paused, focus }; }, [paused, focus]);
  useEffect(() => {
    const host = mount.current;
    let cancelled = false, cleanup = () => {}, started = false;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      try {
        const [T, { RoomEnvironment }] = await Promise.all([import('three'), import('three/addons/environments/RoomEnvironment.js')]);
        if (cancelled) return;
        const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
        renderer.domElement.setAttribute('aria-label', 'Brass instrument of inquiry. Drag horizontally or use arrow keys to rotate.');
        renderer.domElement.setAttribute('role', 'img');
        renderer.domElement.tabIndex = 0;
        host.appendChild(renderer.domElement);
        const scene = new T.Scene();
        const pmrem = new T.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        const environment = pmrem.fromScene(room, .05);
        scene.environment = environment.texture;
        room.dispose(); pmrem.dispose();
        const camera = new T.PerspectiveCamera(37, 1, .1, 50);
        camera.position.set(0, .15, 8.8);
        const sculpture = new T.Group();
        sculpture.rotation.set(.22, -.3, -.27);
        scene.add(sculpture);
        const brass = new T.MeshStandardMaterial({ color: 0xbfa06c, metalness: .92, roughness: .31 });
        const brightBrass = new T.MeshStandardMaterial({ color: 0xe7cf97, metalness: .83, roughness: .26 });
        const darkMetal = new T.MeshStandardMaterial({ color: 0x102b39, metalness: .78, roughness: .37 });
        const ring = (radius, thickness, material, x = 0, y = 0, z = 0, parent = sculpture) => {
          const mesh = new T.Mesh(new T.TorusGeometry(radius, thickness, 12, 160), material);
          mesh.rotation.set(x,y,z); parent.add(mesh); return mesh;
        };
        ring(2.28,.032,brass,0,0,0);
        ring(2.2,.013,brightBrass,0,0,0);
        ring(2.32,.008,brass,0,0,0);
        const inner = new T.Group(); sculpture.add(inner);
        ring(1.94,.043,brass,Math.PI/2,0,.35,inner);
        ring(1.96,.012,brightBrass,.15,Math.PI/2,.3,inner);
        ring(1.67,.022,brass,.65,.42,-.7,inner);
        ring(1.43,.012,brightBrass,1.3,-.5,.4,inner);
        const nucleus = new T.Mesh(new T.SphereGeometry(.72,64,40),darkMetal);
        inner.add(nucleus);
        for(let i=0;i<8;i++) ring(.735,.005,brass,0,i*Math.PI/8,0,inner);
        for(const y of [-.46,-.23,0,.23,.46]) {
          const latitude = ring(Math.sqrt(.735*.735-y*y),.004,brightBrass,Math.PI/2,0,0,inner);
          latitude.position.y=y;
        }
        const tickGeo = new T.BoxGeometry(.009,.055,.011);
        for(let i=0;i<120;i++) {
          const angle=i*Math.PI/60;
          const tick=new T.Mesh(tickGeo,brass);
          tick.position.set(Math.sin(angle)*2.24,Math.cos(angle)*2.24,0);
          tick.rotation.z=-angle;
          if(i%10===0) tick.scale.y=2.4;
          sculpture.add(tick);
        }
        const axis = new T.Mesh(new T.CylinderGeometry(.011,.011,4.65,12),brass);
        inner.add(axis);
        for(const y of [-2.37,2.37]) {
          const finial=new T.Mesh(new T.SphereGeometry(.065,20,14),brightBrass); finial.position.y=y;inner.add(finial);
        }
        for(let i=0;i<3;i++) {
          const orb=new T.Mesh(new T.SphereGeometry(.075+i*.027,24,16),brightBrass);
          const a=i*2.1+.4;orb.position.set(Math.cos(a)*1.94,Math.sin(a)*.8,Math.sin(a)*1.5);inner.add(orb);
        }
        const keyLight=new T.DirectionalLight(0xffdfac,3.8);keyLight.position.set(3,5,4);scene.add(keyLight);
        const fillLight=new T.DirectionalLight(0x8dbdd7,2);fillLight.position.set(-4,0,2);scene.add(fillLight);
        const rimLight=new T.DirectionalLight(0xf7b15a,3);rimLight.position.set(2,-3,-4);scene.add(rimLight);
        let frame=0, lastTime=0, visible=true, drag=false, px=0, py=0, userY=0, userX=0, turn=0, scrollTurn=0;
        const onScroll=()=>{if(state.current.paused)return;const rect=host.getBoundingClientRect();scrollTurn=Math.max(-1,Math.min(1,(window.innerHeight/2-rect.top-rect.height/2)/window.innerHeight))*.65;};
        window.addEventListener('scroll',onScroll,{passive:true});onScroll();
        const resize=()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.render(scene,camera);};
        const ro=new ResizeObserver(resize);ro.observe(host);resize();
        const visibility=new IntersectionObserver(([v])=>{visible=v.isIntersecting;},{threshold:.05});visibility.observe(host);
        const start=(event)=>{if(event.pointerType==='mouse'&&event.button!==0)return;drag=true;px=event.clientX;py=event.clientY;};
        const move=(event)=>{if(!drag)return;userY+=(event.clientX-px)*.008;userX+=(event.clientY-py)*.003;px=event.clientX;py=event.clientY;};
        const stop=()=>{drag=false;};
        const key=(event)=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();if(event.key==='ArrowLeft')userY-=.2;if(event.key==='ArrowRight')userY+=.2;if(event.key==='ArrowUp')userX-=.15;if(event.key==='ArrowDown')userX+=.15;};
        host.addEventListener('pointerdown',start);window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop);window.addEventListener('pointercancel',stop);host.addEventListener('keydown',key);
        const lost=(e)=>{e.preventDefault();setFailed(true);};renderer.domElement.addEventListener('webglcontextlost',lost);
        const render=(time)=>{
          frame=requestAnimationFrame(render);
          if(!visible||document.hidden||time-lastTime<30)return;
          const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
          if(!state.current.paused&&!drag) turn+=dt*.055;
          const targetY=userY+turn+state.current.focus*.32+(state.current.paused?0:scrollTurn);
          sculpture.rotation.y+=(targetY-sculpture.rotation.y)*.06;
          sculpture.rotation.x+=(.22+userX-sculpture.rotation.x)*.07;
          inner.rotation.z=Math.sin(turn*.7)*.16;
          renderer.render(scene,camera);
        };
        frame=requestAnimationFrame(render);setReady(true);
        cleanup=()=>{
          cancelAnimationFrame(frame);ro.disconnect();visibility.disconnect();window.removeEventListener('scroll',onScroll);
          host.removeEventListener('pointerdown',start);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);window.removeEventListener('pointercancel',stop);host.removeEventListener('keydown',key);renderer.domElement.removeEventListener('webglcontextlost',lost);
          const geometries=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());
          brass.dispose();brightBrass.dispose();darkMetal.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();
        };
      } catch { if(!cancelled)setFailed(true); }
    }, {rootMargin:'250px'});
    observer.observe(host);
    return()=>{cancelled=true;observer.disconnect();cleanup();};
  }, []);
  return <div className={`inquiry-instrument ${ready?'is-ready':''}`}>
    <div ref={mount} className="inquiry-instrument__canvas" hidden={failed} />
    {failed && <img className="inquiry-instrument__fallback" src="/observatory.webp" alt="A brass astronomical instrument within a stone observatory" />}
    <span className="instrument-title">The instrument of inquiry</span>
    <p className="instrument-caption">{failed?'Different disciplines. A shared search for understanding.':ready?'Drag to explore · Arrow keys to rotate':'An instrument for seeing things differently.'}</p>
  </div>;
}
