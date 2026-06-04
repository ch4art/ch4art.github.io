// Join import.meta.env.BASE_URL with a path, normalizing slashes.
// On this user-page site BASE_URL is '/', so it returns root-relative paths.
// Kept so links/assets stay correct if the site ever moves to a sub-path
// (e.g. a project page with base: '/art').
//
// Use for RUNTIME STRING URLs only: public/ files, hand-written <a>/<img>,
// and drei loader URLs (useGLTF / useTexture / Draco path).
// Do NOT wrap ESM-imported assets or astro:assets <Image> — those are
// already base-prefixed and would become '/art/art/…'.
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, ''); // strip trailing slash(es)
  const clean = path.replace(/^\/+/, ''); // strip leading slash(es)
  return clean ? `${base}/${clean}` : `${base}/`;
}
