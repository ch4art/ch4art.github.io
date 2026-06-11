// THE reusable 3D viewer: model CENTERED, viewed HEAD-ON, scaled up to ~fill
// the frame. Uses drei <Center> + <Resize> (normalize any model to ~1 unit and
// center it) + a fixed front-facing camera. No hand-rolled math, no 3/4 angle.
//
// Deps: react@19, @react-three/fiber@9, @react-three/drei@10, three@0.184
// ALWAYS hydrate at the call site with client:only="react".
//
// ⚠️ 契約凍結:檔案路徑(components/three/ModelViewer.tsx)與
// props `src` / `environment` / `height` 被 MDX 文章(hello-3d.mdx)和
// art-editor 的 JSX 解析依賴 —— 不可改名。v2 新增的 props 全部 optional。
import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Center,
  Resize,
  Environment,
  useGLTF,
  Html,
  useProgress,
} from '@react-three/drei';
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
  /** v2:進視野前的佔位圖 URL(GIF 縮圖或 webp poster) */
  poster?: string;
  /** v2:慢轉盤 —— 只在「視野內 + 分頁可見 + 還沒被玩過」時持續渲染 */
  turntable?: boolean;
};

function Model({ src }: { src: string }) {
  const { scene } = useGLTF(src, DRACO);
  // SkeletonUtils.clone keeps skinned meshes intact when a cached model is reused
  // (a plain scene.clone() renders rigged models invisible).
  const object = useMemo(() => skeletonClone(scene), [scene]);
  return <primitive object={object} />;
}

function Loader() {
  // Real download progress for the cute "carrying the model" pill.
  const { progress } = useProgress();
  return (
    <Html center>
      <span className="model-loader">🐭 努力搬運中… {Math.round(progress)}%</span>
    </Html>
  );
}

// 壞掉的 .glb 以前會讓整個 island 白屏 —— 接住,給一張可愛的道歉卡。
class ViewerBoundary extends Component<
  { src: string; children: ReactNode },
  { broken: boolean }
> {
  state = { broken: false };
  static getDerivedStateFromError() {
    return { broken: true };
  }
  render() {
    if (this.state.broken) {
      return (
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            height: '100%',
            textAlign: 'center',
            fontFamily: 'var(--font-display, sans-serif)',
            color: 'var(--color-ink, #4A3A55)',
            fontWeight: 700,
            padding: 16,
          }}
        >
          <div>
            <div style={{ fontSize: '2.2rem' }}>🐭💦</div>
            <p>模型搬到一半摔壞了…</p>
            <a
              href={this.props.src}
              download
              style={{ textDecoration: 'underline', fontSize: '0.9rem' }}
            >
              直接下載 .glb 檔
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ModelViewer({
  src,
  environment = 'city',
  background = '#FFF0F6',
  height = 420,
  poster,
  turntable = false,
}: ModelViewerProps) {
  const ref = useRef<HTMLDivElement>(null);
  // mounted:進過視野就掛 canvas(單向);inView:持續追蹤(轉盤節流用)
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!turntable) return;
    const onVis = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [turntable]);

  const spinning = turntable && inView && pageVisible && !interacted;

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
      {mounted ? (
        <ViewerBoundary src={src}>
          <Canvas
            // demand:閒置 canvas ~0 GPU;轉盤啟動時才連續渲染
            frameloop={spinning ? 'always' : 'demand'}
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
              autoRotate={spinning}
              autoRotateSpeed={1.6}
              onStart={() => setInteracted(true)}
            />
          </Canvas>
        </ViewerBoundary>
      ) : poster ? (
        // 還沒進視野:poster 佔位(外層高度固定 → CLS 0)
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: 0.9,
          }}
        />
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
