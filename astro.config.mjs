// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ch4art.github.io', // USER page → served at root
  // No `base`: a user page (ch4art.github.io) is served from '/'.
  // import.meta.env.BASE_URL is therefore '/'.
  // (If you ever switch to a project page, add base: '/art'.)
  integrations: [react(), mdx()],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // three / R3F are browser-only. client:only already keeps them out of
      // SSR; this is belt-and-suspenders for any transitive import.
      noExternal: ['three', '@react-three/fiber', '@react-three/drei'],
    },
  },
});
