// THE reusable 3D viewer. One component = Canvas + studio lighting + Suspense
// + auto-framing + pan/zoom/rotate + self-hosted Draco + an in-view gate so
// off-screen canvases never create a WebGL context (browsers cap ~8-16).
//
// Deps: react@19, @react-three/fiber@9, @react-three/drei@10, three@0.184
// ALWAYS hydrate this at the Astro/MDX call site with client:only="react":
//   <ModelViewer client:only="react" src={modelUrl('cat.glb')} />
// client:load / client:visible would server-render first and crash on
// three.js' browser-API access (`document is not defined`). client:only skips
// SSR, which is correct for a WebGL canvas.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Html } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { dracoPath } from '../../lib/model';

const DRACO = dracoPath(); // self-hosted decoder dir, e.g. /draco-gltf/

// Matches drei's Stage environment presets (PresetsType).
type StagePreset =
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
  environment?: StagePreset;
  background?: string;
  height?: number | string;
};

function Model({ src }: { src: string }) {
  // 2nd arg = path to the self-hosted Draco decoder (string enables Draco).
  const { scene } = useGLTF(src, DRACO);

  // Clone so the same cached model can render in multiple canvases safely.
  // SkeletonUtils.clone properly rebinds skeletons — a plain scene.clone()
  // breaks SkinnedMesh (bones aren't rebound → the model renders invisible).
  const object = useMemo(() => {
    const o = skeletonClone(scene);
    o.updateMatrixWorld(true);
    return o;
  }, [scene]);

  // Normalize: scale to ~2 units max dimension and center at the origin, so
  // ANY model frames consistently — tiny (a 5 cm avocado), huge, or rigged.
  // `precise` (2nd arg true) applies bone transforms, giving a correct box for
  // skinned/animated meshes; a non-precise box mis-centers them off-screen.
  const [scale, position] = useMemo(() => {
    const box = new Box3().setFromObject(object, true);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 2 / maxDim;
    const pos: [number, number, number] = [-center.x * s, -center.y * s, -center.z * s];
    return [s, pos] as const;
  }, [object]);

  return <primitive object={object} scale={scale} position={position} />;
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
          shadows
          frameloop="demand" // idle canvases cost ~0 GPU; controls auto-invalidate
          dpr={[1, 2]}
          // Pleasing 3/4 elevated "product shot" angle. Stage fits the model
          // ALONG this direction, so any model fills the frame from a nice angle
          // (instead of a flat head-on view that shows a quadruped's legs).
          camera={{ fov: 40, position: [3.5, 2.2, 5.5] }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={<Loader />}>
            {/* adjustCamera < 1 fills the frame a bit tighter. */}
            <Stage adjustCamera={0.9} intensity={0.6} shadows="contact" environment={environment}>
              <Model src={src} />
            </Stage>
          </Suspense>
          <OrbitControls
            makeDefault
            enablePan
            enableZoom
            enableRotate
            enableDamping
            dampingFactor={0.08}
            minDistance={2}
            maxDistance={20}
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

// Warm the cache for ABOVE-THE-FOLD hero models only (call at module scope in a
// page that imports this), e.g.:
//   import { modelUrl } from '../lib/model';
//   useGLTF.preload(modelUrl('cat.glb'), dracoPath());
