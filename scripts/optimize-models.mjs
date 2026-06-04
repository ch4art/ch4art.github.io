// Batch-optimize every raw .glb into a small, web-ready .glb.
// Usage: npm run optimize
//   raw-models/foo.glb  →  public/models/foo.glb
// Applies Draco geometry compression + WebP textures + resizes textures to
// 1024px. Self-hosted Draco decoder lives in public/draco-gltf/.
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const IN = 'raw-models';
const OUT = 'public/models';

if (!existsSync(IN)) {
  console.log(`No "${IN}/" directory — nothing to optimize. Create it and drop .glb files in.`);
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });

const files = readdirSync(IN).filter((n) => n.toLowerCase().endsWith('.glb'));
if (files.length === 0) {
  console.log(`No .glb files found in "${IN}/".`);
  process.exit(0);
}

for (const f of files) {
  const cmd =
    `npx gltf-transform optimize "${IN}/${f}" "${OUT}/${f}" ` +
    `--compress draco --texture-compress webp --texture-size 1024`;
  console.log('▶', cmd);
  execSync(cmd, { stdio: 'inherit' });
  // Print the result so you can confirm each model is comfortably small.
  execSync(`npx gltf-transform inspect "${OUT}/${f}"`, { stdio: 'inherit' });
}

console.log(`\n✅ Done. Optimized ${files.length} model(s) → ${OUT}/`);
