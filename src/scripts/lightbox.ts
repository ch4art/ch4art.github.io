// gallery-2d 的燈箱:原生 <dialog>.showModal()(免費 focus trap / Esc /
// ::backdrop)+ 方向鍵前後 + #slug hash 深連結。
// 不用 React island —— 純 vanilla,gallery-2d 頁的 <script> 載入。
// GSAP Flip 開合動畫在 phase 8 由 motion.ts 接掛(這裡先 CSS scale-in)。

type CardData = {
  el: HTMLAnchorElement;
  slug: string;
  title: string;
  desc: string;
  alt: string;
  full: string;
  tools: string;
  tags: string;
};

let cards: CardData[] = [];
let current = -1;
let lastFocus: HTMLElement | null = null;

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`lightbox: #${id} missing`);
  return el;
}

function readCards(): void {
  cards = [...document.querySelectorAll<HTMLAnchorElement>('.wall-card')]
    .filter((el) => !el.hidden)
    .map((el) => ({
      el,
      slug: el.dataset.slug ?? '',
      title: el.dataset.title ?? '',
      desc: el.dataset.desc ?? '',
      alt: el.dataset.alt ?? '',
      full: el.dataset.full ?? '',
      tools: el.dataset.tools ?? '',
      tags: el.dataset.tags ?? '',
    }));
}

function render(i: number): void {
  const c = cards[i];
  if (!c) return;
  current = i;
  const img = $('lb-img') as HTMLImageElement;
  img.src = c.full;
  img.alt = c.alt;
  $('lb-title').textContent = c.title;
  $('lb-desc').textContent = c.desc;
  $('lb-desc').hidden = !c.desc;
  const tools = $('lb-tools');
  tools.textContent = c.tools ? `🖌️ ${c.tools}` : '';
  tools.hidden = !c.tools;
  history.replaceState(null, '', `#${c.slug}`);
}

function openAt(i: number): void {
  const dialog = $('lightbox') as HTMLDialogElement;
  readCards();
  if (i < 0 || i >= cards.length) return;
  lastFocus = document.activeElement as HTMLElement;
  render(i);
  if (!dialog.open) dialog.showModal();
  document.body.style.overflow = 'hidden';
}

function close(): void {
  const dialog = $('lightbox') as HTMLDialogElement;
  if (dialog.open) dialog.close();
}

function step(delta: number): void {
  if (!cards.length) return;
  render((current + delta + cards.length) % cards.length);
}

export function initLightbox(): void {
  const dialog = document.getElementById('lightbox') as HTMLDialogElement | null;
  if (!dialog || dialog.dataset.bound) return;
  dialog.dataset.bound = 'true';

  // 卡片點擊 → 開燈箱(事件委派,filter 重繪後仍有效)
  document.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLAnchorElement>('.wall-card');
    if (!card) return;
    e.preventDefault();
    readCards();
    openAt(cards.findIndex((c) => c.el === card));
  });

  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
    lastFocus?.focus();
  });

  // 點 backdrop 關閉(dialog 本體以外)
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  document.getElementById('lb-prev')?.addEventListener('click', () => step(-1));
  document.getElementById('lb-next')?.addEventListener('click', () => step(1));
  document.getElementById('lb-close')?.addEventListener('click', close);

  // #slug 深連結:直接開到那張
  if (location.hash.length > 1) {
    readCards();
    const i = cards.findIndex((c) => c.slug === decodeURIComponent(location.hash.slice(1)));
    if (i >= 0) openAt(i);
  }
}

export function initFilters(): void {
  const bar = document.querySelector<HTMLElement>('[data-filter-bar]');
  if (!bar || bar.dataset.bound) return;
  bar.dataset.bound = 'true';

  bar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-filter]');
    if (!btn) return;
    const tag = btn.dataset.filter ?? '';
    bar.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('chip-active', b === btn);
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    document.querySelectorAll<HTMLElement>('.wall-card').forEach((card) => {
      const tags = (card.dataset.tags ?? '').split(',');
      card.hidden = tag !== '' && !tags.includes(tag);
    });
  });
}
