// 把 🐭 emoji 直接立體化:正面圓灰臉、高掛兩側的大耳(粉內耳)、
// 下半張白吻、粉鼻、黑亮橢圓眼、細鬍鬚 —— 一顆「3D 版 emoji」。
// 用法:node scripts/make-emoji-mouse.mjs  →  raw-models/emoji-mouse.glb
//       之後跑 npm run optimize 產出 public/models/emoji-mouse.glb
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mkdirSync, writeFileSync } from 'node:fs';

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = 'data:application/octet-stream;base64,' + Buffer.from(buf).toString('base64');
      this.onloadend?.();
    });
  }
};

/* ---------- emoji 配色 ---------- */
const GREY = new THREE.MeshStandardMaterial({ color: 0xc4c9d4, roughness: 0.72, metalness: 0 }); // 頭/耳外圈
const EAR_PINK = new THREE.MeshStandardMaterial({ color: 0xf4abba, roughness: 0.65, metalness: 0 });
const MUZZLE = new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.75, metalness: 0 });
const NOSE = new THREE.MeshStandardMaterial({ color: 0xee8fa4, roughness: 0.45, metalness: 0 });
const EYE = new THREE.MeshStandardMaterial({ color: 0x17131a, roughness: 0.14, metalness: 0 });
const SHINE = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0 });
const WHISKER = new THREE.MeshStandardMaterial({ color: 0x8d8f9a, roughness: 0.55, metalness: 0 });

const root = new THREE.Group();
root.name = 'emoji-mouse';

const add = (mesh, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) => {
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  mesh.scale.set(...scale);
  root.add(mesh);
  return mesh;
};

const ball = (mat, r, pos, scale = [1, 1, 1], rot = [0, 0, 0], seg = 48) =>
  add(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(16, seg / 2)), mat), pos, rot, scale);

const capsule = (mat, r, len, pos, rot) =>
  add(new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 16), mat), pos, rot);

/* ---------- 頭:寬寬的圓臉(emoji 比例:寬 > 高) ---------- */
ball(GREY, 1.0, [0, 0, 0], [1.18, 1.0, 0.92]);

/* ---------- 大耳朵:高掛頭頂兩側(灰外圈 + 大面積粉內耳) ---------- */
for (const s of [-1, 1]) {
  const rotE = [0, s * 0.18, s * -0.12];
  ball(GREY, 0.54, [s * 0.86, 0.88, -0.08], [1, 1, 0.34], rotE);
  ball(EAR_PINK, 0.42, [s * 0.88, 0.88, 0.04], [1, 1, 0.26], rotE);
}

/* ---------- 白吻(下半張臉的鼓包) ---------- */
ball(MUZZLE, 0.62, [0, -0.42, 0.55], [0.95, 0.72, 0.6]);

/* ---------- 粉鼻(吻的正中上方) ---------- */
ball(NOSE, 0.15, [0, -0.27, 0.98], [1.1, 0.9, 0.8]);

/* ---------- 黑亮橢圓眼 + 眼神光 ---------- */
for (const s of [-1, 1]) {
  ball(EYE, 0.14, [s * 0.44, 0.2, 0.82], [0.85, 1.2, 0.6]);
  ball(SHINE, 0.045, [s * 0.4, 0.27, 0.92]);
}

/* ---------- 小嘴(鼻子下的小弧線) ---------- */
{
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 10, 24, Math.PI * 0.8), EYE);
  add(smile, [0, -0.52, 0.92], [0.25, 0, Math.PI + Math.PI * 0.1]);
}

/* ---------- 細鬍鬚(左右各三根,從吻側扇開) ---------- */
for (const s of [-1, 1]) {
  for (const [i, droop] of [-0.22, 0, 0.22].entries()) {
    capsule(
      WHISKER,
      0.009,
      0.55,
      [s * 0.78, -0.36 + i * 0.07, 0.55],
      [0.05, s * -0.25, s * (Math.PI / 2 + droop)],
    );
  }
}

/* ---------- 輸出 GLB ---------- */
const scene = new THREE.Scene();
scene.add(root);

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (result) => {
    mkdirSync('raw-models', { recursive: true });
    writeFileSync('raw-models/emoji-mouse.glb', Buffer.from(result));
    console.log(`✓ raw-models/emoji-mouse.glb (${Math.round(result.byteLength / 1024)} KB)`);
  },
  (err) => {
    console.error('GLB export failed:', err);
    process.exit(1);
  },
  { binary: true },
);
