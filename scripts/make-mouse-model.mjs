// 程序化生成網站吉祥物的 3D 版:薰衣草色「麻糬鼠」。
// 依角色表:淡紫蛋形軟身體(無頭身分離)、頂上大粉圓耳、閉眼快樂線條眼、
// 黑色縫線式鬍鬚、粉腮紅、小粉手腳、粉胖尾巴、肚子上有個小 x。
// 純 three.js 幾何,無貼圖 → GLTFExporter 可在 Node 直接輸出。
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

/* ---------- 角色表配色 ---------- */
const BODY = new THREE.MeshStandardMaterial({ color: 0xcec1e6, roughness: 0.75, metalness: 0 }); // 薰衣草紫
const PINK = new THREE.MeshStandardMaterial({ color: 0xf5b9ce, roughness: 0.7, metalness: 0 }); // 耳/手腳/尾
const PINK_DEEP = new THREE.MeshStandardMaterial({ color: 0xee9cb9, roughness: 0.7, metalness: 0 }); // 內耳
const BLUSH = new THREE.MeshStandardMaterial({ color: 0xf49ec0, roughness: 0.8, metalness: 0 }); // 腮紅
const MARK = new THREE.MeshStandardMaterial({ color: 0x2f2937, roughness: 0.5, metalness: 0 }); // 線條五官

const root = new THREE.Group();
root.name = 'mochi-mouse';

const add = (mesh, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) => {
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  mesh.scale.set(...scale);
  root.add(mesh);
  return mesh;
};

/** 蛋形身體在世界座標 (x, y) 的表面 z(五官全部「貼」在這上面) */
function surfZ(x, y) {
  const local = y - 0.95;
  const sin = local > 0 ? Math.min(local / 1.18, 0.999) : Math.max(local / 0.92, -0.999);
  const cos = Math.sqrt(1 - sin * sin);
  const squeeze = sin > 0 ? 1 - 0.24 * sin : 1;
  const r = cos * squeeze;
  return Math.sqrt(Math.max(r * r - x * x, 0.0001));
}

const ball = (mat, r, pos, scale = [1, 1, 1], rot = [0, 0, 0], seg = 48) =>
  add(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(16, seg / 2)), mat), pos, rot, scale);

/** 圓頭短棒(線條五官用的「筆畫」) */
const stroke = (len, r, pos, rot) =>
  add(new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), MARK), pos, rot);

/* ---------- 蛋形軟身體(Lathe:下圓潤、上收尖的麻糬曲線) ---------- */
{
  const pts = [];
  const STEPS = 42;
  for (let i = 0; i <= STEPS; i++) {
    const phi = -Math.PI / 2 + (i / STEPS) * Math.PI; // -90° → +90°
    const s = Math.sin(phi);
    // 上半收窄(蛋形),下半微扁(坐得穩)
    const squeeze = s > 0 ? 1 - 0.24 * s : 1;
    const x = Math.cos(phi) * squeeze;
    const y = s > 0 ? s * 1.18 : s * 0.92;
    pts.push(new THREE.Vector2(Math.max(0.0001, x), y));
  }
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), BODY);
  add(body, [0, 0.95, 0]);
}

/* ---------- 頂上大粉圓耳(+ 深粉內耳) ---------- */
for (const s of [-1, 1]) {
  ball(PINK, 0.36, [s * 0.5, 1.92, 0.02], [1, 1, 0.42], [0.1, 0, s * -0.28]);
  ball(PINK_DEEP, 0.26, [s * 0.52, 1.92, 0.1], [1, 1, 0.3], [0.1, 0, s * -0.28]);
}

/* ---------- 閉眼快樂線條眼(短橫筆畫,外端微微上揚) ---------- */
for (const s of [-1, 1]) {
  const ex = s * 0.27;
  const ey = 1.44;
  stroke(0.2, 0.04, [ex, ey, surfZ(ex, ey) + 0.015], [0, s * 0.34, Math.PI / 2 + s * 0.14]);
}

/* ---------- 縫線式鬍鬚(招牌!主斜線 + 兩短橫線,左右各一組) ---------- */
for (const s of [-1, 1]) {
  const cx = s * 0.5;
  const cy = 1.12;
  const face = s * 0.58; // 跟著曲率往側面轉
  const tilt = s * 0.6; // 主線斜角
  // 主線
  stroke(0.34, 0.03, [cx, cy, surfZ(cx, cy) + 0.015], [0, face, Math.PI / 2 + tilt]);
  // 兩條短交叉線(沿主線分佈、垂直於主線)
  for (const d of [-0.1, 0.1]) {
    const px = cx + Math.cos(tilt) * d * s;
    const py = cy + Math.sin(tilt) * d;
    stroke(0.09, 0.026, [px, py, surfZ(px, py) + 0.02], [0, face, tilt]);
  }
}

/* ---------- 腮紅(角色表正面沒有獨立的嘴,臉就是眼+縫線+腮紅) ---------- */
for (const s of [-1, 1]) {
  const bx = s * 0.52;
  const by = 1.3;
  ball(BLUSH, 0.13, [bx, by, surfZ(bx, by) + 0.01], [1, 0.72, 0.28], [0, s * 0.6, 0]);
}

/* ---------- 肚子上的小 x(角色表的祕密記號) ---------- */
for (const s of [-1, 1]) {
  stroke(0.1, 0.024, [0.16, 0.52, surfZ(0.16, 0.52) + 0.012], [0, 0.18, Math.PI / 4 + (s * Math.PI) / 2]);
}

/* ---------- 小粉手手(身側小肉球)+ 前腳 ---------- */
for (const s of [-1, 1]) {
  ball(PINK, 0.12, [s * 0.74, 0.98, 0.3], [1.1, 0.85, 1]); // 側邊小手
  ball(PINK, 0.14, [s * 0.3, 0.1, 0.6], [1, 0.55, 1.25]); // 前腳
}

/* ---------- 粉胖尾巴(往後翹的小蘿蔔) ---------- */
{
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.4, -0.8),
    new THREE.Vector3(0, 0.26, -1.12),
    new THREE.Vector3(0.24, 0.2, -1.32),
    new THREE.Vector3(0.5, 0.3, -1.28),
  ]);
  add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.085, 12, false), PINK));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), PINK);
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
