/// <reference types="astro/client" />

// @fontsource-variable/* packages are CSS side-effect imports with no bundled
// type declarations. Declare them so `astro check` / tsc accept the imports.
declare module '@fontsource-variable/*';
