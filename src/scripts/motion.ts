// 全站 GSAP 動效(vanilla,data-* 屬性驅動,一個檔案服務所有頁面)。
//
// 生命週期(× ClientRouter 的鐵則):
//   astro:page-load  → init():建立 matchMedia context + 所有 trigger
//   astro:before-swap → cleanup():revert + killAll,否則死 trigger 會
//                       隨 SPA 換頁無限堆疊(最常見的 GSAP × Astro 坑)
//
// 無障礙:全部包在 gsap.matchMedia 的 prefers-reduced-motion 分支;
// reduce 時什麼都不做 —— CSS 的預設(靜止)就是最終狀態。
import { gsap, ScrollTrigger } from '../lib/gsap';

let mm: gsap.MatchMedia | null = null;

/* ---------- 首頁 hero:主時間軸(標題 → 副標 → 模型 squash → 徽章 → 泡泡) ---------- */
function heroIntro(): void {
  const title = document.querySelector('[data-hero-title]');
  if (!title) return;
  const tl = gsap.timeline({ defaults: { ease: 'back.out(1.6)' } });
  // 標題不動 opacity:它是 LCP 元素,藏起來會把 LCP 推遲到 JS 跑完
  tl.from(title, { scale: 0.6, y: 36, duration: 0.65 })
    .from('[data-hero-sub]', { autoAlpha: 0, y: 22, duration: 0.45, ease: 'power2.out' }, '-=0.25')
    .fromTo(
      '[data-hero-model]',
      // ⚠️ 模型欄是 3D canvas 的祖先 —— 只能位移+淡入,不可 scale/rotate:
      // R3F 用 getBoundingClientRect 量 canvas 尺寸,若 canvas 在縮放
      // 進行中掛載會量到壓扁的尺寸且永遠不更正(老鼠偏左上的 bug)。
      // 用 fromTo 寫死終點:就算有殘留的隱藏值也保證回到可見。
      { autoAlpha: 0, y: 36 },
      { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      '-=0.3',
    )
    .from('[data-hero-badge]', { autoAlpha: 0, scale: 0, rotation: -120, duration: 0.5 }, '-=0.25')
    .from('[data-hero-bubble]', { autoAlpha: 0, scale: 0, rotation: 8, duration: 0.4, ease: 'back.out(2.2)' }, '-=0.2')
    // 保險:進場全部結束後叫 R3F 重新量一次(吃掉任何殘存的量測競態)
    .call(() => window.dispatchEvent(new Event('resize')));
}

/* ---------- 通用:區塊標題/卡片進場(batch,一次性) ---------- */
function batchPops(): void {
  const items = gsap.utils.toArray<HTMLElement>('[data-anim="pop"]');
  if (!items.length) return;
  // 標題用純 opacity(非 autoAlpha):visibility:hidden 會把 h2 從
  // 無障礙樹拿掉,axe 的 heading-order 變成 h1→h3 跳號
  gsap.set(items, { opacity: 0, y: 24, scale: 0.94 });
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)', stagger: 0.08 }),
  });
}

/* ---------- 首頁雙門廊:拍立得扇形「散開」(scrub,不 pin) ---------- */
function doorFan(desktop: boolean): void {
  const door = document.querySelector('[data-door="2d"]');
  if (!door || !desktop) return;
  const items = door.querySelectorAll('.fan-item');
  if (items.length < 2) return;
  gsap.from(items, {
    // 由中央堆疊散開成扇形(i=中間者不動)
    x: (i) => (1 - i) * 80,
    rotation: (i) => (1 - i) * 8,
    ease: 'none',
    scrollTrigger: {
      trigger: door,
      start: 'top 85%',
      end: 'center 55%',
      scrub: 0.6,
    },
  });
}

/* ---------- gallery-2d:貼紙牆 stagger 進場 ---------- */
function wallItems(): void {
  const items = gsap.utils.toArray<HTMLElement>('[data-anim="wall-item"]');
  if (!items.length) return;
  gsap.set(items, { autoAlpha: 0, y: 30 });
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 }),
  });
}

/* ---------- gallery-3d:玩具櫃交錯列滑入 ---------- */
function shelfRows(desktop: boolean): void {
  const rows = gsap.utils.toArray<HTMLElement>('[data-anim="shelf-row"]');
  rows.forEach((row, i) => {
    gsap.from(row, {
      autoAlpha: 0,
      x: desktop ? (i % 2 === 0 ? -48 : 48) : 0,
      y: desktop ? 0 : 32,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: row, start: 'top 85%', once: true },
    });
  });
}

/* ---------- blog:虛線時間軸滾動描繪 + 便利貼交錯彈入 ---------- */
function blogTimeline(desktop: boolean): void {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;

  const path = timeline.querySelector('.tl-path');
  if (path) {
    gsap.fromTo(
      path,
      { clipPath: 'inset(0 0 100% 0)' },
      {
        clipPath: 'inset(0 0 0% 0)',
        ease: 'none',
        scrollTrigger: { trigger: timeline, start: 'top 75%', end: 'bottom 60%', scrub: 0.5 },
      },
    );
  }

  const notes = gsap.utils.toArray<HTMLElement>('[data-anim="note"]');
  notes.forEach((note) => {
    const right = note.className.includes('md:col-start-2');
    gsap.from(note, {
      autoAlpha: 0,
      x: desktop ? (right ? 48 : -48) : 0,
      y: desktop ? 0 : 28,
      duration: 0.55,
      ease: 'back.out(1.4)',
      scrollTrigger: { trigger: note, start: 'top 88%', once: true },
    });
  });
}

/* ---------- 文章頁:糖果條紋閱讀進度 + 文末橡皮章 ---------- */
function readProgress(): void {
  const bar = document.querySelector('[data-read-progress]');
  const article = document.querySelector('article');
  if (!bar || !article) return;
  gsap.fromTo(
    bar,
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: article, start: 'top top', end: 'bottom bottom', scrub: true },
    },
  );
}

function stamp(): void {
  const seal = document.querySelector('[data-anim="stamp"]');
  if (!seal) return;
  gsap.from(seal, {
    autoAlpha: 0,
    scale: 1.9,
    rotation: -20,
    duration: 0.45,
    ease: 'power4.in',
    scrollTrigger: { trigger: seal, start: 'top 92%', once: true },
  });
}

/* ---------- about:寄信成功 → 信封蓋上 ---------- */
function envelope(): { cleanup: () => void } | undefined {
  const flap = document.querySelector('[data-envelope-flap]');
  if (!flap) return;
  const onSent = () => {
    gsap
      .timeline()
      .to('.letter', { y: 10, scale: 0.985, duration: 0.35, ease: 'power2.inOut' })
      .to(flap, { y: -14, scaleY: 1.25, transformOrigin: '50% 100%', duration: 0.35, ease: 'back.out(1.8)' }, '<');
  };
  document.addEventListener('ch4art:letter-sent', onSent);
  return { cleanup: () => document.removeEventListener('ch4art:letter-sent', onSent) };
}

/* ---------- 生命週期 ---------- */
function init(): void {
  cleanup();
  mm = gsap.matchMedia();
  mm.add(
    {
      motionOK: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 768px)',
    },
    (ctx) => {
      const { motionOK, desktop } = ctx.conditions as { motionOK: boolean; desktop: boolean };
      if (!motionOK) return; // 減少動態:CSS 靜態預設即是最終狀態

      heroIntro();
      batchPops();
      doorFan(desktop);
      wallItems();
      shelfRows(desktop);
      blogTimeline(desktop);
      readProgress();
      stamp();
      const env = envelope();

      return () => env?.cleanup();
    },
  );
}

function cleanup(): void {
  mm?.revert();
  mm = null;
  // belt-and-suspenders:確保沒有殘留 trigger 跨頁堆疊
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

// ---------- 全域單例守衛 ----------
// dev 的模組重載(HMR/vite 重新最佳化)會讓本檔跑出第二份實例:
// 兩份各自 init,第二份的 gsap.from 把第一份留下的「隱藏起點」
// 誤當終點 → hero 永遠隱形。永遠只讓「最新實例」掌權。
type MotionGlobal = {
  __ch4artMotionInit?: () => void;
  __ch4artMotionCleanup?: () => void;
  __ch4artMotionBound?: boolean;
};
const g = globalThis as unknown as MotionGlobal;

const isReplacement = Boolean(g.__ch4artMotionCleanup);
g.__ch4artMotionCleanup?.(); // 舊實例先收乾淨(revert 殘留的 inline 樣式)
g.__ch4artMotionInit = init;
g.__ch4artMotionCleanup = cleanup;

if (!g.__ch4artMotionBound) {
  g.__ch4artMotionBound = true;
  document.addEventListener('astro:page-load', () => g.__ch4artMotionInit?.());
  document.addEventListener('astro:before-swap', () => g.__ch4artMotionCleanup?.());
}
// 模組是「熱替換」進來的(頁面早就載好,astro:page-load 不會再發)→ 立刻重建
if (isReplacement) init();
