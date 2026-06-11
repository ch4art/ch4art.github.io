// 程序化生成網站吉祥物的 3D 版:一隻圓滾滾的寵物鼠(fancy mouse)。
// 純 three.js 幾何(球/管/圓柱),無貼圖 → GLTFExporter 可在 Node 直接輸出。
// 用法:node scripts/make-mouse-model.mjs  →  raw-models/mouse.glb
//       之後跑 npm run optimize 產出 public/models/mouse.glb
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mkdirSync, writeFileSync } from 'node:fs';

// GLTFExporter 收尾用 FileReader 把 Blob 轉 ArrayBuffer —— Node 沒有,補一個。
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

/* ---------- 品牌配色(對齊 global.css tokens) ---------- */
const FUR = new THREE.MeshStandardMaterial({ color: 0xfff8f2, roughness: 0.68, metalness: 0 }); // 奶油白毛
const PINK = new THREE.MeshStandardMaterial({ color: 0xffb7ce, roughness: 0.6, metalness: 0 }); // 內耳/尾/腳
const NOSE = new THREE.MeshStandardMaterial({ color: 0xf2569e, roughness: 0.45, metalness: 0 }); // 鼻子
const EYE = new THREE.MeshStandardMaterial({ color: 0x3a2e45, roughness: 0.25, metalness: 0 }); // 眼睛(品牌 outline 色)
const SHINE = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0 }); // 眼神光
const BLUSH = new THREE.MeshStandardMaterial({ color: 0xff9fcb, roughness: 0.7, metalness: 0 }); // 腮紅

const root = new THREE.Group();
root.name = 'pet-mouse';

const ball = (mat, r, pos, scale = [1, 1, 1], rot = [0, 0, 0], seg = 48) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(16, seg / 2)), mat);
  m.position.set(...pos);
  m.scale.set(...scale);
  m.rotation.set(...rot);
  root.add(m);
  return m;
};

/* ---------- 身體:坐姿西洋梨(下圓上窄,寵物鼠蹲坐感) ---------- */
ball(FUR, 0.88, [0, 0.74, -0.05], [1, 0.95, 1.06]); // 屁屁
ball(FUR, 0.66, [0, 1.18, 0.12], [1, 0.95, 0.98]); // 胸口(墊出梨形)

/* ---------- 頭 + 吻部 ---------- */
ball(FUR, 0.6, [0, 1.72, 0.3], [1, 0.94, 0.96]);
ball(FUR, 0.32, [0, 1.56, 0.78], [1, 0.78, 0.92]); // 吻部
ball(NOSE, 0.095, [0, 1.57, 1.05]); // 粉鼻頭

/* ---------- 大圓耳(寵物鼠的招牌)+ 粉色內耳 ---------- */
for (const s of [-1, 1]) {
  ball(FUR, 0.34, [s * 0.42, 2.26, 0.14], [1, 1, 0.38], [0.12, s * 0.35, s * -0.12]);
  ball(PINK, 0.255, [s * 0.43, 2.26, 0.205], [1, 1, 0.32], [0.12, s * 0.35, s * -0.12]);
}

/* ---------- 眼睛 + 眼神光 + 腮紅 ---------- */
for (const s of [-1, 1]) {
  ball(EYE, 0.088, [s * 0.235, 1.82, 0.78]);
  ball(SHINE, 0.032, [s * 0.205, 1.85, 0.85]);
  ball(BLUSH, 0.105, [s * 0.4, 1.6, 0.66], [1, 0.62, 0.4], [0, s * 0.5, 0]);
}

/* ---------- 鬍鬚(細圓柱,左右各三根) ---------- */
const whiskerGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.46, 6);
for (const s of [-1, 1]) {
  for (const [tilt, y] of [
    [0.22, 1.62],
    [0, 1.56],
    [-0.22, 1.5],
  ]) {
    const w = new THREE.Mesh(whiskerGeo, EYE);
    w.position.set(s * 0.42, y, 0.82);
    w.rotation.set(0, 0, s * (Math.PI / 2 + tilt * 0.6));
    w.rotation.y = s * -0.25;
    root.add(w);
  }
}

/* ---------- 前手手(收在胸前)+ 後腳 ---------- */
for (const s of [-1, 1]) {
  ball(PINK, 0.13, [s * 0.24, 1.02, 0.62], [1, 0.9, 1.1]); // 前手
  ball(PINK, 0.19, [s * 0.5, 0.16, 0.42], [1, 0.5, 1.55]); // 後腳(扁長)
}

/* ---------- 粉色細尾巴(往後再側捲) ---------- */
const tailCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0.5, -0.82),
  new THREE.Vector3(0, 0.28, -1.25),
  new THREE.Vector3(0.3, 0.12, -1.55),
  new THREE.Vector3(0.66, 0.1, -1.42),
  new THREE.Vector3(0.84, 0.16, -1.05),
]);
const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 48, 0.055, 12, false), PINK);
root.add(tail);
const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), PINK);
tailTip.position.copy(tailCurve.getPoint(1));
root.add(tailTip);

/* ---------- 輸出 GLB ---------- */
const scene = new THREE.Scene();
scene.add(root);

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (result) => {
    mkdirSync('raw-models', { recursive: true });
    writeFileSync('raw-models/mouse.glb', Buffer.from(result));
    console.log(`✓ raw-models/mouse.glb (${Math.round(result.byteLength / 1024)} KB)`);
  },
  (err) => {
    console.error('GLB export failed:', err);
    process.exit(1);
  },
  { binary: true },
);
