// 程序化生成網站吉祥物的 3D 版:站立的可愛白鼠(寫實玩具質感)。
// 依參考三視圖:梨形白身、頭吻分明、超大粉內耳在頭側、黑亮圓眼、
// 尖吻小粉鼻、長鬍鬚、胸前小粉手、往前伸的粉腳掌、細長粉尾。
// 純 three.js 幾何(球/膠囊/管),無貼圖 → GLTFExporter 可在 Node 直接輸出。
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

/* ---------- 參考圖配色 ---------- */
const FUR = new THREE.MeshStandardMaterial({ color: 0xfbf8f5, roughness: 0.82, metalness: 0 }); // 暖白毛
const SKIN = new THREE.MeshStandardMaterial({ color: 0xeb9579, roughness: 0.6, metalness: 0 }); // 內耳/手腳/尾(蜜桃粉)
const SKIN_LIGHT = new THREE.MeshStandardMaterial({ color: 0xf6c3b2, roughness: 0.62, metalness: 0 }); // 耳緣過渡
const NOSE = new THREE.MeshStandardMaterial({ color: 0xefa0a8, roughness: 0.45, metalness: 0 }); // 鼻頭
const EYE = new THREE.MeshStandardMaterial({ color: 0x161114, roughness: 0.12, metalness: 0 }); // 黑亮圓眼
const SHINE = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0 }); // 眼神光
const WHISKER = new THREE.MeshStandardMaterial({ color: 0xb8b0b4, roughness: 0.5, metalness: 0 }); // 鬍鬚(淺灰)

const root = new THREE.Group();
root.name = 'standing-mouse';

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

/* ---------- 身體:單體梨形 lathe(臀寬肩窄、無接縫)+ 頭球 ---------- */
{
  const profile = [
    [0.0001, 0], [0.45, 0.02], [0.78, 0.13], [0.91, 0.45], [0.93, 0.78],
    [0.85, 1.12], [0.7, 1.45], [0.56, 1.7], [0.46, 1.92], [0.3, 2.08], [0.0001, 2.16],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), FUR);
  add(body, [0, 0, 0], [0, 0, 0], [1, 1, 0.92]); // 前後稍扁
}
ball(FUR, 0.55, [0, 2.24, 0.18], [0.95, 0.97, 1]); // 頭

/* ---------- 尖吻 + 小粉鼻(側視略朝下前方) ---------- */
ball(FUR, 0.34, [0, 2.14, 0.6], [0.62, 0.52, 1.1], [-0.2, 0, 0]); // 吻部
ball(NOSE, 0.068, [0, 2.06, 0.99]); // 鼻頭

/* ---------- 超大耳(白毛外圈 + 蜜桃粉內耳),長在頭頂兩側 ---------- */
for (const s of [-1, 1]) {
  const rotE = [0.08, s * 0.32, s * -0.2];
  ball(FUR, 0.5, [s * 0.56, 2.76, 0.04], [1, 1.06, 0.18], rotE);
  ball(SKIN_LIGHT, 0.44, [s * 0.585, 2.76, 0.12], [1, 1.06, 0.13], rotE);
  ball(SKIN, 0.4, [s * 0.6, 2.76, 0.17], [1, 1.05, 0.11], rotE);
}

/* ---------- 黑亮圓眼 + 眼神光 ---------- */
for (const s of [-1, 1]) {
  ball(EYE, 0.135, [s * 0.27, 2.38, 0.58], [1, 1, 0.8]);
  ball(SHINE, 0.04, [s * 0.22, 2.44, 0.67]);
}

/* ---------- 長鬍鬚(左右各 3 根,微微下垂) ---------- */
for (const s of [-1, 1]) {
  for (const [i, droop] of [-0.3, -0.08, 0.16].entries()) {
    capsule(
      WHISKER,
      0.008,
      0.85,
      [s * 0.58, 2.0 + i * 0.06, 0.74],
      [0.12, s * -0.3, s * (Math.PI / 2 + droop)],
    );
  }
}

/* ---------- 胸前小手(白手臂 + 粉手掌,捧在胸口) ---------- */
for (const s of [-1, 1]) {
  capsule(FUR, 0.09, 0.22, [s * 0.3, 1.7, 0.45], [0.9, 0, s * 0.5]); // 手臂
  ball(SKIN, 0.095, [s * 0.17, 1.52, 0.6], [1, 0.9, 1.15]); // 手掌
  // 小指頭(每手三根小球)
  for (const f of [-1, 0, 1]) {
    ball(SKIN, 0.032, [s * (0.17 + f * 0.045), 1.45, 0.68]);
  }
}

/* ---------- 粉腳掌(往前伸,帶小腳趾) ---------- */
for (const s of [-1, 1]) {
  ball(SKIN, 0.26, [s * 0.36, 0.12, 0.58], [0.55, 0.3, 1.3]);
  for (const f of [-1, 0, 1]) {
    ball(SKIN, 0.05, [s * (0.36 + f * 0.09), 0.1, 0.92]);
  }
}

/* ---------- 細長粉尾(漸細三段 + 圓尖) ---------- */
{
  const pts = [
    new THREE.Vector3(0, 0.42, -0.78),
    new THREE.Vector3(0.05, 0.14, -1.25),
    new THREE.Vector3(0.55, 0.07, -1.45),
    new THREE.Vector3(1.1, 0.1, -1.1),
    new THREE.Vector3(1.35, 0.22, -0.6),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  // 漸細:分三段各自半徑
  const radii = [0.07, 0.052, 0.036];
  for (let seg = 0; seg < 3; seg++) {
    const sub = new THREE.CatmullRomCurve3(
      Array.from({ length: 12 }, (_, i) => curve.getPoint((seg + i / 11) / 3)),
    );
    add(new THREE.Mesh(new THREE.TubeGeometry(sub, 24, radii[seg], 10, false), SKIN));
  }
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), SKIN);
  tip.position.copy(curve.getPoint(1));
  root.add(tip);
}

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
