// THE reusable 3D viewer: model CENTERED, viewed HEAD-ON, scaled up to ~fill
// the frame. Uses drei <Center> + <Resize> (normalize any model to ~1 unit and
// center it) + a fixed front-facing camera. No hand-rolled math, no 3/4 angle.
//
// Deps: react@19, @react-three/fiber@9, @react-three/drei@10, three@0.184
// ALWAYS hydrate at the call site with client:only="react".
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Resize, Environment, useGLTF, Html } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { dracoPath } from '../../lib/model';

const DRACO = dracoPath(); // self-hosted decoder dir, e.g. /draco-gltf/

type EnvPreset =
  | 'apartment'
  | 'city'
  | 'dawn'
  | 'forest'
  | 'lobby'
  | 'night'
  | 'park'
  | 'studio'
  | 'sunset'
  | 'warehouse';

type ModelViewerProps = {
  /** Already base-prefixed model URL, e.g. modelUrl('cat.glb'). */
  src: string;
  environment?: EnvPreset;
  background?: string;
  height?: number | string;
};

function Model({ src }: { src: string }) {
  const { scene } = useGLTF(src, DRACO);
  // SkeletonUtils.clone keeps skinned meshes intact when a cached model is reused
  // (a plain scene.clone() renders rigged models invisible).
  const object = useMemo(() => skeletonClone(scene), [scene]);
  return <primitive object={object} />;
}

function Loader() {
  return (
    <Html center>
      <span
        style={{
          color: '#F76FAE',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        Loading 3D…
      </span>
    </Html>
  );
}

export default function ModelViewer({
  src,
  environment = 'city',
  background = '#FFF0F6',
  height = 420,
}: ModelViewerProps) {
  // In-view gate: only mount the WebGL canvas once scrolled near the viewport.
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height,
        background,
        borderRadius: 24,
        overflow: 'hidden',
        touchAction: 'none', // let OrbitControls own touch gestures
      }}
    >
      {inView ? (
        <Canvas
          frameloop="demand" // idle canvases cost ~0 GPU; controls auto-invalidate
          dpr={[1, 2]}
          // Fixed straight-on camera. Resize makes every model ~1 unit, so this
          // distance frames any model the same way: centered + nearly full.
          camera={{ position: [0, 0, 1.9], fov: 35 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 6, 5]} intensity={1.3} />
          <Suspense fallback={<Loader />}>
            <Environment preset={environment} />
            {/* Normalize to ~1 unit (Resize) and center it (Center). */}
            <Center precise>
              <Resize precise>
                <Model src={src} />
              </Resize>
            </Center>
          </Suspense>
          <OrbitControls
            makeDefault
            enablePan
            enableZoom
            enableRotate
            enableDamping
            dampingFactor={0.08}
            minDistance={0.8}
            maxDistance={6}
          />
        </Canvas>
      ) : (
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            height: '100%',
            color: '#FF9FCB',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 700,
          }}
        >
          Loading 3D…
        </div>
      )}
    </div>
  );
}
