# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A cute, colorful **art & 3D-modeling portfolio + blog** — a static **Astro 6** site deployed to **GitHub Pages** as a **user site** (`https://ch4art.github.io/`). It shows many interactive (pan / zoom / rotate) **React Three Fiber** 3D models and supports Markdown / MDX blogging. Visual direction: **Sanrio-cute × Memphis × cartoon**.

## Commands

- `npm run dev` — dev server at `http://localhost:4321/`
- `npm run build` — `astro check` (type-check, heap-bumped) **then** `astro build` → `dist/`
- `npm run check` — type-check only (`cross-env NODE_OPTIONS=--max-old-space-size=8192 astro check`)
- `npm run preview` — serve the built `dist/` locally
- `npm run optimize` — batch-optimize `raw-models/*.glb` → `public/models/*.glb`

> `astro check` needs the bumped Node heap: three.js' huge type defs OOM the default ~4 GB V8 heap. The `check` script handles it via `cross-env`; CI runs `npm run build` so it inherits the bump.

## Non-negotiables (these break silently if ignored)

- **3D islands use `client:only="react"`** (literal `"react"` required). Every `<ModelViewer>` must be hydrated this way. `client:load` / `client:visible` server-render first and three.js crashes on browser-API access (`document is not defined`). The in-view deferral is handled *inside* `ModelViewer` (IntersectionObserver), not via the directive.
- **Runtime URLs go through the base helpers.** `public/` asset paths, hand-written links, and drei loader URLs (models / textures / Draco) must use `withBase()` / `modelUrl()` / `dracoPath()` (`src/lib/`). On this user page `BASE_URL` is `/`, but the helpers keep the site portable. **Never** wrap ESM-imported assets or `astro:assets` `<Image>` — those are already prefixed (would become `/art/art/…`).
- **`astro check` must stay green.** `tsconfig.json` excludes `public/` (the Draco decoder JS) and `raw-models/`. `src/env.d.ts` declares `@fontsource-variable/*` (no bundled types).

## Architecture

- **`src/components/three/ModelViewer.tsx`** — THE reusable 3D viewer: `<Canvas frameloop="demand">` + `<Stage>` lighting + `<Suspense>` + `useGLTF(src, dracoPath())` + `<OrbitControls>` (pan/zoom/rotate). Clones + auto-normalizes each model (scale to ~2 units, recenter) so any-scale `.glb` frames nicely. In-view gate avoids creating WebGL contexts for off-screen canvases (browsers cap ~8–16).
- **Blog** — content collection in **`src/content.config.ts`** (root `src` level; Content Layer `glob()` loader + Zod). Posts in `src/content/blog/*.{md,mdx}`. Detail route `src/pages/blog/[...id].astro` uses `entry.id` + standalone `render()`. To add a post: drop a `.md` (or `.mdx` to embed a model) with frontmatter, commit, push.
- **Design system** — Tailwind v4, tokens in a single `@theme` block in `src/styles/global.css` (pastel + Memphis "pop" colors → both CSS vars and utilities). `BaseLayout.astro` wires fonts (`@fontsource-variable/*`) + `<ClientRouter />` + the Memphis decorative background.
- **3D pipeline** — drop raw `.glb` in `raw-models/` (gitignored) → `npm run optimize` (Draco + WebP + resize) → `public/models/`. Keep each model a few MB; **no Git LFS**. Self-hosted Draco decoder in `public/draco-gltf/`.

## Deploy

GitHub repo **must be named `ch4art.github.io`** (user page). Push to `main` → `.github/workflows/deploy.yml` (`withastro/action@v6` + `actions/deploy-pages@v5`) builds & deploys. One-time: GitHub **Settings → Pages → Source = "GitHub Actions"**.

## Version lockstep

React 19 ↔ @react-three/fiber 9 ↔ @react-three/drei 10 ↔ three 0.184; Astro 6 + Tailwind v4 (CSS-first, no `tailwind.config.js`). Avoid R3F v10 / drei v11 alphas and the deprecated `@astrojs/tailwind` / `ViewTransitions` (now `ClientRouter`).
