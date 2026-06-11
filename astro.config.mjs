// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ch4art.github.io', // USER page → served at root
  // No `base`: a user page (ch4art.github.io) is served from '/'.
  // import.meta.env.BASE_URL is therefore '/'.
  // (If you ever switch to a project page, add base: '/art'.)
  integrations: [react(), mdx(), sitemap()],

  // 舊站路由 → v2 路由(SSG meta-refresh)。art-editor 的成功 URL 與
  // 既有外部連結都還指向 /portfolio,不可 404。
  redirects: {
    '/portfolio': '/gallery-3d',
    '/portfolio/[id]': '/gallery-3d/[id]',
    '/contact': '/about',
  },

  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // three / R3F are browser-only. client:only already keeps them out of
      // SSR; this is belt-and-suspenders for any transitive import.
      noExternal: ['three', '@react-three/fiber', '@react-three/drei'],
    },
  },
});
