// 產生示範畫作(佔位):品牌色背景 + 老鼠吉祥物小插圖。
// 之後換成真正的畫作時,直接刪掉 src/content/drawings/demo-* 即可。
// 用法:node scripts/make-demo-drawings.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUTLINE = '#3A2E45';
const BUBBLEGUM = '#FF9FCB';
const BUBBLEGUM_DEEP = '#F2569E';

// 跟 Mascot.astro 同一隻老鼠(literal 色值版),置中 100×100 視box。
const mouse = (cx, cy, s) => `
<g transform="translate(${cx - 50 * s} ${cy - 50 * s}) scale(${s})">
  <circle cx="27" cy="24" r="15" fill="#fff" stroke="${OUTLINE}" stroke-width="4"/>
  <circle cx="73" cy="24" r="15" fill="#fff" stroke="${OUTLINE}" stroke-width="4"/>
  <circle cx="27" cy="24" r="7.5" fill="${BUBBLEGUM}"/>
  <circle cx="73" cy="24" r="7.5" fill="${BUBBLEGUM}"/>
  <ellipse cx="50" cy="60" rx="32" ry="28" fill="#fff" stroke="${OUTLINE}" stroke-width="4"/>
  <g stroke="${OUTLINE}" stroke-width="2.5" stroke-linecap="round">
    <line x1="10" y1="58" x2="22" y2="60"/><line x1="10" y1="68" x2="22" y2="67"/>
    <line x1="90" y1="58" x2="78" y2="60"/><line x1="90" y1="68" x2="78" y2="67"/>
  </g>
  <ellipse cx="30" cy="67" rx="6" ry="3.5" fill="${BUBBLEGUM}" opacity="0.65"/>
  <ellipse cx="70" cy="67" rx="6" ry="3.5" fill="${BUBBLEGUM}" opacity="0.65"/>
  <circle cx="38" cy="56" r="4" fill="${OUTLINE}"/>
  <circle cx="62" cy="56" r="4" fill="${OUTLINE}"/>
  <path d="M44 70 Q50 76 56 70" stroke="${OUTLINE}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <ellipse cx="50" cy="64" rx="4.5" ry="3.5" fill="${BUBBLEGUM_DEEP}"/>
</g>`;

const heart = (x, y, s, c) =>
  `<path transform="translate(${x} ${y}) scale(${s})" fill="${c}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"
    d="M50 88 C26 70 10 56 10 36 C10 22 21 14 32 14 C40 14 47 18 50 26 C53 18 60 14 68 14 C79 14 90 22 90 36 C90 56 74 70 50 88 Z"/>`;

const star = (x, y, s, c) =>
  `<path transform="translate(${x} ${y}) scale(${s})" fill="${c}" stroke="${OUTLINE}" stroke-width="3"
    d="M50 4 C56 38 62 44 96 50 C62 56 56 62 50 96 C44 62 38 56 4 50 C38 44 44 38 50 4 Z"/>`;

const flower = (x, y, s, c) => `
<g transform="translate(${x} ${y}) scale(${s})" stroke="${OUTLINE}" stroke-width="3">
  <circle cx="50" cy="24" r="17" fill="${c}"/><circle cx="75" cy="42" r="17" fill="${c}"/>
  <circle cx="65" cy="71" r="17" fill="${c}"/><circle cx="35" cy="71" r="17" fill="${c}"/>
  <circle cx="25" cy="42" r="17" fill="${c}"/><circle cx="50" cy="50" r="13" fill="#fff"/>
</g>`;

const cloud = (x, y, s, c) =>
  `<path transform="translate(${x} ${y}) scale(${s})" fill="${c}" stroke="${OUTLINE}" stroke-width="3"
    d="M28 56 a16 16 0 0 1 -2 -31 a22 22 0 0 1 42 -6 a17 17 0 0 1 6 37 Z"/>`;

const dots = (w, h, c) =>
  `<rect width="${w}" height="${h}" fill="url(#dots)"/>
   <defs><pattern id="dots" width="46" height="46" patternUnits="userSpaceOnUse">
     <circle cx="23" cy="23" r="3.5" fill="${c}"/>
   </pattern></defs>`;

const drawings = [
  {
    slug: 'demo-strawberry-nap',
    w: 900,
    h: 1200,
    svg: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="${w}" height="${h}" fill="#FFE9F3"/>
      ${dots(w, h, 'rgba(242,86,158,.18)')}
      ${heart(110, 130, 1.1, '#FF6FAE')}${heart(640, 90, 0.8, '#FFB59E')}
      ${heart(660, 950, 1.3, '#FF9FCB')}${star(130, 960, 0.9, '#FFE27A')}
      ${mouse(450, 560, 5.2)}
    </svg>`,
  },
  {
    slug: 'demo-sky-picnic',
    w: 1200,
    h: 900,
    svg: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="${w}" height="${h}" fill="#EAF5FF"/>
      ${dots(w, h, 'rgba(91,184,255,.20)')}
      ${cloud(90, 90, 1.6, '#fff')}${cloud(900, 130, 1.2, '#fff')}${cloud(540, 60, 0.9, '#9AD3FF')}
      ${star(1010, 640, 1.0, '#FFC83D')}${star(120, 620, 0.7, '#FFE27A')}
      ${mouse(600, 520, 4.6)}
    </svg>`,
  },
  {
    slug: 'demo-mint-garden',
    w: 1000,
    h: 1000,
    svg: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="${w}" height="${h}" fill="#EAFBF2"/>
      ${dots(w, h, 'rgba(78,217,164,.22)')}
      ${flower(70, 70, 1.2, '#FF9FCB')}${flower(740, 110, 0.9, '#FFC83D')}
      ${flower(720, 720, 1.4, '#D8C7FF')}${flower(110, 760, 0.8, '#5FE0DA')}
      ${mouse(500, 480, 4.4)}
    </svg>`,
  },
  {
    slug: 'demo-butter-stars',
    w: 850,
    h: 1150,
    svg: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="${w}" height="${h}" fill="#FFF7DC"/>
      ${dots(w, h, 'rgba(255,200,61,.25)')}
      ${star(90, 110, 1.2, '#FFC83D')}${star(600, 80, 0.8, '#FF9FCB')}
      ${star(620, 900, 1.1, '#9B6DFF')}${star(110, 920, 0.7, '#5FE0DA')}
      ${heart(620, 480, 0.7, '#FF6FAE')}
      ${mouse(420, 540, 4.8)}
    </svg>`,
  },
];

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
for (const d of drawings) {
  const dir = join(root, 'src', 'content', 'drawings', d.slug);
  mkdirSync(dir, { recursive: true });
  await sharp(Buffer.from(d.svg(d.w, d.h))).png().toFile(join(dir, 'art.png'));
  console.log(`✓ ${d.slug} (${d.w}×${d.h})`);
}
