# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

v2 of a cute, colorful **art & 3D-modeling portfolio + blog** — a static **Astro 6** site deployed to **GitHub Pages** as a **user site** (`https://ch4art.github.io/`). 2D drawings live on a masonry sticker wall (`/gallery-2d`), interactive **React Three Fiber** 3D models in a toy-shelf showcase (`/gallery-3d`), plus Markdown / MDX blogging with GSAP motion throughout. Visual direction: **Sanrio-cute × Memphis × cartoon**. Mascot: 可愛老鼠 🐭 (`src/components/decor/Mascot.astro`).

## Commands

- `npm run dev` — dev server at `http://localhost:4321/`
- `npm run build` — `astro check` (type-check, heap-bumped) **then** `astro build` → `dist/`
- `npm run check` — type-check only (`cross-env NODE_OPTIONS=--max-old-space-size=8192 astro check`)
- `npm run preview` — serve the built `dist/` locally
- `npm run optimize` — batch-optimize `raw-models/*.glb` → `public/models/*.glb`

> `astro check` needs the bumped Node heap: three.js' huge type defs OOM the default ~4 GB V8 heap. The `check` script handles it via `cross-env`; CI runs `npm run build` so it inherits the bump.

## Non-negotiables (these break silently if ignored)

- **art-editor contract is FROZEN.** The Electron companion app (`MF/art-editor`) publishes directly to this repo and hardcodes: collections `blog` + `works` (dirs, field names), `public/models/*.glb`, `public/works/*.gif`, `public/private/*.bin`, and the exact `<ModelViewer client:only="react" src environment height>` JSX in MDX. Schema changes to `blog`/`works` must be **additive-only** (`.optional()`/`.default()`); never rename/move `src/components/three/ModelViewer.tsx` or its `src`/`environment`/`height` props. `/blog/hello-3d` is the canary: its embedded viewer must render after every change.
- **3D islands use `client:only="react"`** (literal `"react"`). `client:load`/`client:visible` server-render first and three.js crashes (`document is not defined`). In-view deferral is handled *inside* ModelViewer (IntersectionObserver).
- **Wrap every `client:only` island in a fixed-height container.** The island is EMPTY until hydration; without reserved height the page shifts (this was a CLS 0.16 bug). See `index.astro` hero.
- **Runtime URLs go through the base helpers** `withBase()` / `modelUrl()` / `dracoPath()` (`src/lib/`). **Never** wrap ESM-imported assets or `astro:assets` `<Image>` (already prefixed).
- **`astro check` must stay green.** `tsconfig.json` excludes `public/` + `raw-models/`; `src/env.d.ts` declares `@fontsource-variable/*`.
- **Huninn font loads via `@fontsource/huninn/400.css` ONLY** (111 unicode-range slices; browser fetches just the glyphs used). `chinese-traditional-400.css` is a 1.3 MB monolith — importing it was v1's biggest mobile-perf mistake.
- **GIF thumbs use plain `<img>` + `withBase`** (`astro:assets` kills GIF animation). On the home page use the tiny webp poster instead of the 450 KB GIF.
- **Max 1 live WebGL canvas per page** (browser context cap ~8-16). Galleries show GIF/webp thumbs; the interactive viewer lives on detail pages (+1 hero viewer on `/` and `/gallery-3d`).
- **GSAP lifecycle:** all page motion lives in `src/scripts/motion.ts`, driven by `data-anim` attributes; **init on `astro:page-load`, `mm.revert()` + `ScrollTrigger` killAll on `astro:before-swap`** — without this, dead triggers stack across ClientRouter navigations. Import gsap ONLY from `src/lib/gsap.ts` (core + ScrollTrigger registered once; no `gsap/all`). Everything sits inside `gsap.matchMedia()` — the reduced-motion branch does nothing (CSS static state is final). Heading entrances animate `opacity`, **not `autoAlpha`** (visibility:hidden removes h2s from the a11y tree → axe heading-order fails).

## Architecture

- **`src/components/three/ModelViewer.tsx`** — THE reusable 3D viewer (frozen API, see above): `<Canvas frameloop="demand">`, fixed head-on camera + `<Center>/<Resize>` normalization, `useGLTF` + self-hosted Draco (`public/draco-gltf/`), OrbitControls, in-view gate. v2 extras (all optional props): `poster` (placeholder img), `turntable` (autoRotate only while in-view + page visible + untouched; switches `frameloop` to `always`), error boundary (bad .glb shows a cute fallback instead of white screen), `background`. **`LazyModelViewer.tsx`** defers the 1 MB three.js chunk to `requestIdleCallback` — home-hero only, NOT for MDX/editor content; pair it with a static `background-image` poster on the container so LCP anchors early.
- **Content collections** (`src/content.config.ts`, Content Layer API): `blog` (v1-frozen + `private`/`cipher` AES-GCM posts), `works` (3D; v1 fields + additive `software`/`polycount`/`turntable`/`poster`/`accent`/`featured`/`draft`), `drawings` (NEW, 2D; folder-per-drawing `drawings/<slug>/index.md` + co-located image, `image()`-validated, required `alt`). Home pulls via `src/lib/feed.ts` (`latestDrawings`/`latestPosts`/`featuredWorks` — deliberately NO merged cross-collection feed).
- **Routes** — `/` (sticker-desk hero + two doorways + notebook), `/gallery-2d` (12-col CSS-Grid recipe masonry — `MasonryWall.astro`; native `<dialog>` lightbox — `src/scripts/lightbox.ts`, `#slug` deep links; needs `margin:auto` because Tailwind preflight zeroes dialog centering), `/gallery-3d` (+`/[id]`), `/blog` (dotted-path timeline; +`/[...id]`, `/tag/[tag]`), `/about` (absorbs old `/contact`), 404, rss.xml. **Redirects in `astro.config.mjs`**: `/portfolio[/[id]] → /gallery-3d[/[id]]`, `/contact → /about` — required for old links AND the editor's hardcoded success URLs.
- **Design system** — Tailwind v4 tokens in `src/styles/global.css` `@theme`. v1 palette kept verbatim + v2 layers: saturated `deep` colors (strawberry/sky-deep/mint-deep/sunshine/grape-deep — big surfaces only: hero, buttons, badges, marquee) and `mist` tints (5 section backgrounds; max 2 per viewport, joined by Scallop/Wave dividers). Sticker grammar: `.title-pop` two-layer titles (`data-text` attr required, emoji excluded from it), `.sticker-ring` die-cut white edge, hard offset shadows, `.bg-candy-stripe`/`.bg-ruled`. Decor components in `src/components/decor/` (Mascot, ScallopDivider, StickerBadge, PolaroidFrame, BlobFrame, DottedPath, StampSeal…). No marquees: 使用者明確不要(CP 值低、無限動畫耗效能).
- **3D pipeline** — raw `.glb` → `npm run optimize` → `public/models/` (keep ≤ ~3 MB; no Git LFS). drei `<Environment preset>` HDRs come from an external CDN (~1.4 MB each) — they load only when a canvas mounts.
- **a11y floor** — Lighthouse a11y 100 / CLS ~0 across pages; keep text on candy backgrounds at ≥ 4.5:1 (no `text-ink/60-75` on pastel fills; inactive filter chips are white-bg for this reason).

## Deploy

GitHub repo **must stay named `ch4art.github.io`** (user page). Push to `main` → `.github/workflows/deploy.yml` builds & deploys. **v2 lives on the `v2` branch**; flip = `git switch main && git tag v1-final && git merge v2 && git push origin main --tags`. Rollback = `git revert -m 1 <merge-sha>` (never force-push — it breaks the editor's trash-restore which walks commit history). Freeze art-editor publishing during the flip window. No `public/CNAME` until the `ch4.art` domain is actually configured.

## Version lockstep

React 19 ↔ @react-three/fiber 9 ↔ @react-three/drei 10 ↔ three 0.184; Astro 6 + Tailwind v4 (CSS-first) + GSAP 3.13. Avoid R3F v10 / drei v11 alphas and the deprecated `@astrojs/tailwind` / `ViewTransitions` (now `ClientRouter`). `detect-gpu` stays in `vite.ssr.noExternal` (dev-mode CJS interop; build is unaffected).
