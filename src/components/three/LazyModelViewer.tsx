// 首頁專用的延遲版 viewer:閒置時才抓 three.js 那包 1MB 模組
// (TBT 優化)。期間顯示 poster。
// ⚠️ 這不是契約元件 —— MDX 文章與 art-editor 仍走 ModelViewer.tsx;
// 這個 wrapper 只給「頁面很重、模型非首要內容」的場合(目前:首頁 hero)。
import { lazy, Suspense, useEffect, useState } from 'react';
import type { ComponentProps } from 'react';

const ModelViewer = lazy(() => import('./ModelViewer'));

type Props = ComponentProps<typeof ModelViewer>;

export default function LazyModelViewer(props: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const go = () => setReady(true);
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(go, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(go, 1200);
    return () => clearTimeout(t);
  }, []);

  // 佔位全透明:poster 由「呼叫端的靜態容器 background-image」提供,
  // 在 JS 跑之前就完成首繪(LCP 提早定錨)。這裡再畫東西只會蓋掉它。
  const placeholder = <div style={{ width: '100%', height: props.height ?? 420 }} />;

  if (!ready) return placeholder;
  return (
    <Suspense fallback={placeholder}>
      <ModelViewer {...props} />
    </Suspense>
  );
}
