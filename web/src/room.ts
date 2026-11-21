// @ts-nocheck
// A bright living room around the table: windows with curtains, an armchair, a coffee table with a vase and a ficus.
// Everything is generated in code. 1 world unit is about 8 cm.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const FLOOR = -9;
const HALF_X = 22, BACK_Z = -22, FRONT_Z = 26, CEIL = 24;

function mk(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c: HTMLCanvasElement, rx = 1, ry = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function rnd(seed: number) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function plasterTexture() {
  const c = mk(512, 512), g = c.getContext('2d'), R = rnd(3);
  g.fillStyle = '#f1e6d2'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '120,90,50' : '255,255,255'},${R() * 0.05})`; g.fillRect(R() * 512, R() * 512, 2 + R() * 6, 2 + R() * 6); }
  return c;
}
function wainscotTexture() {
  const c = mk(512, 512), g = c.getContext('2d');
  g.fillStyle = '#9fc7b4'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#e9f4ee'; g.lineWidth = 6; g.strokeRect(24, 24, 464, 464);
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3; g.strokeRect(32, 32, 448, 448);
  return c;
}
function skyTex() {
  const c = mk(512, 768), g = c.getContext('2d'), R = rnd(9);
  const sky = g.createLinearGradient(0, 0, 0, 768); sky.addColorStop(0, '#5fa8ee'); sky.addColorStop(0.65, '#bfe3ff'); sky.addColorStop(1, '#eaf6ff'); g.fillStyle = sky; g.fillRect(0, 0, 512, 768);
  const sun = g.createRadialGradient(380, 150, 5, 380, 150, 160); sun.addColorStop(0, 'rgba(255,250,210,1)'); sun.addColorStop(0.3, 'rgba(255,240,180,0.55)'); sun.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = sun; g.fillRect(0, 0, 512, 768);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 9; i++) { const x = R() * 512, y = 60 + R() * 340, r = 28 + R() * 40; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + k * r * 0.6, y + Math.sin(k) * 8, r * (0.6 + R() * 0.4), 0, 7); g.fill(); } }
  g.fillStyle = '#7bbd7a'; g.beginPath(); g.moveTo(0, 640); for (let x = 0; x <= 512; x += 16) g.lineTo(x, 600 + Math.sin(x / 70) * 26); g.lineTo(512, 768); g.lineTo(0, 768); g.fill();
  g.fillStyle = '#4f9a5a'; for (let i = 0; i < 9; i++) { const x = 20 + i * 60 + R() * 20, y = 650 + R() * 40; g.beginPath(); g.arc(x, y, 28 + R() * 20, 0, 7); g.fill(); }
  return c;
}
function curtainTexture() {
  const c = mk(256, 512), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, '#e8785a'); gr.addColorStop(1, '#f19a7a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = 'rgba(255,240,200,0.55)';
  for (let y = 24; y < 512; y += 64) for (let x = 24; x < 256; x += 64) { g.beginPath(); g.arc(x + ((y / 64) % 2) * 32, y, 9, 0, 7); g.fill(); }
  return c;
}
function rugTexture() {
  const c = mk(512, 512), g = c.getContext('2d');
  g.fillStyle = '#2f7f86'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#f3e6c8'; g.lineWidth = 14; g.strokeRect(30, 30, 452, 452);
  g.strokeStyle = '#e8785a'; g.lineWidth = 8; g.strokeRect(62, 62, 388, 388);
  g.fillStyle = 'rgba(243,230,200,0.75)';
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { g.save(); g.translate(112 + i * 58, 112 + j * 58); g.rotate(Math.PI / 4); g.fillRect(-12, -12, 24, 24); g.restore(); }
  return c;
}
function pictureTexture(seed: number) {
  const c = mk(256, 320), g = c.getContext('2d'), R = rnd(seed);
  const sky = g.createLinearGradient(0, 0, 0, 320); sky.addColorStop(0, ['#ffc78a', '#8fd0ff', '#d9b3ff'][seed % 3]); sky.addColorStop(1, '#fff3d6'); g.fillStyle = sky; g.fillRect(0, 0, 256, 320);
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(180, 90, 36, 0, 7); g.fill();
  for (let i = 0; i < 3; i++) { g.fillStyle = ['#3f8f6a', '#2f6f58', '#1f5040'][i]; g.beginPath(); g.moveTo(0, 320); for (let x = 0; x <= 256; x += 8) g.lineTo(x, 200 + i * 38 - Math.sin(x / 40 + i * 2 + R()) * 24); g.lineTo(256, 320); g.fill(); }
  return c;
}

const rb = (w: number, h: number, d: number, r = 0.1) => new RoundedBoxGeometry(w, h, d, 4, r);

export function buildRoom(scene: any) {
  const wallMat = new THREE.MeshStandardMaterial({ map: tex(plasterTexture(), 6, 5), roughness: 0.95 });
  const wain = new THREE.MeshStandardMaterial({ map: tex(wainscotTexture(), 8, 1), roughness: 0.6 });
  const white = new THREE.MeshStandardMaterial({ color: 0xfaf6ee, roughness: 0.5 });
  const wallH = CEIL - FLOOR, wainH = 13;

  // floor, ceiling
  const fl = tex(floorTex(), 7, 7);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2, FRONT_Z - BACK_Z), new THREE.MeshStandardMaterial({ map: fl, roughness: 0.5 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR, (FRONT_Z + BACK_Z) / 2); floor.receiveShadow = true; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2, FRONT_Z - BACK_Z), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, CEIL, (FRONT_Z + BACK_Z) / 2); scene.add(ceil);

  // walls: back, left, right, front (each: plaster above, wainscot below, white baseboard)
  const wall = (len: number, cx: number, cz: number, ry: number) => {
    const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry;
    const up = new THREE.Mesh(new THREE.PlaneGeometry(len, wallH - wainH), wallMat); up.position.y = FLOOR + wainH + (wallH - wainH) / 2; g.add(up);
    const lo = new THREE.Mesh(new THREE.PlaneGeometry(len, wainH), wain); lo.position.y = FLOOR + wainH / 2; g.add(lo);
    const rail = new THREE.Mesh(rb(len, 0.5, 0.4, 0.1), white); rail.position.set(0, FLOOR + wainH, 0.1); g.add(rail);
    const base = new THREE.Mesh(rb(len, 1.2, 0.4, 0.1), white); base.position.set(0, FLOOR + 0.6, 0.1); g.add(base);
    scene.add(g); return g;
  };
  const back = wall(HALF_X * 2, 0, BACK_Z, 0);
  const left = wall(FRONT_Z - BACK_Z, -HALF_X, (FRONT_Z + BACK_Z) / 2, Math.PI / 2);
  const right = wall(FRONT_Z - BACK_Z, HALF_X, (FRONT_Z + BACK_Z) / 2, -Math.PI / 2);
  const front = wall(HALF_X * 2, 0, FRONT_Z, Math.PI);

  // windows with curtains
  const sky = tex(skyTex(), 1, 1), curtain = tex(curtainTexture(), 1, 2);
  const window = (parent: any, x: number) => {
    const w = 13, h = 15, y0 = FLOOR + 14, g = new THREE.Group(); g.position.set(x, y0 + h / 2, 0.06);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: sky, emissiveMap: sky, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 1 })); g.add(glass);
    const bar = (bw: number, bh: number, bx: number, by: number) => { const m = new THREE.Mesh(rb(bw, bh, 0.5, 0.08), white); m.position.set(bx, by, 0.15); g.add(m); };
    bar(w + 1.2, 0.7, 0, h / 2 + 0.3); bar(w + 1.6, 0.8, 0, -h / 2 - 0.3); bar(0.7, h + 1, -w / 2 - 0.3, 0); bar(0.7, h + 1, w / 2 + 0.3, 0); bar(0.35, h, 0, 0); bar(w, 0.35, 0, 1.5);
    // curtains: pleated panels, a rod and finials
    for (const side of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(4.4, h + 3.2, 48, 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 4.2) * 0.34 + 0.75);
      geo.computeVertexNormals();
      const cur = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: curtain, roughness: 0.9, side: THREE.DoubleSide })); cur.position.set(side * (w / 2 + 1.3), -0.4, 0.5); cur.castShadow = false; g.add(cur);
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.3 })); fin.position.set(side * (w / 2 + 3.9), h / 2 + 2.6, 0.5); g.add(fin);
    }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, w + 8, 12), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.3 })); rod.rotation.z = Math.PI / 2; rod.position.set(0, h / 2 + 2.6, 0.5); g.add(rod);
    const sill = new THREE.Mesh(rb(w + 2.6, 0.8, 1.6, 0.15), white); sill.position.set(0, -h / 2 - 0.9, 0.5); g.add(sill);
    parent.add(g);
  };
  window(back, -9); window(back, 9); window(left, -4); window(right, -4); window(right, 11); window(front, -9); window(front, 9);
  // two pictures on the back wall between the windows would collide with the windows; hang them on the left wall instead
  for (const [z, seed] of [[10, 1], [-14, 2]]) {
    const pic = new THREE.Group(); pic.position.set(0.06, FLOOR + 22, z);
    const frame = new THREE.Mesh(rb(5.6, 7, 0.4, 0.12), new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.5 })); pic.add(frame);
    const img = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 6.2), new THREE.MeshStandardMaterial({ map: tex(pictureTexture(seed), 1, 1), roughness: 0.6 })); img.position.z = 0.22; pic.add(img);
    left.add(pic);
  }

  // rug under the table
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(26, 36), new THREE.MeshStandardMaterial({ map: tex(rugTexture(), 1, 1), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, FLOOR + 0.03, 1.5); rug.receiveShadow = true; scene.add(rug);

  // soft shadow of the cabinet on the rug
  const sc = mk(256, 256), sg = sc.getContext('2d'), rg = sg.createRadialGradient(128, 128, 30, 128, 128, 128); rg.addColorStop(0, 'rgba(0,0,0,0.6)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = rg; sg.fillRect(0, 0, 256, 256);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(18, 26), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.set(0, FLOOR + 0.06, 0); scene.add(blob);

  armchair(scene, -17, -17); coffeeTable(scene, 16.5, -16.5); ficus(scene, 19.5, -19.5, 0.5);
  pendantLamp(scene);

  // daylight through the windows and a warm bounce
  scene.add(new THREE.HemisphereLight(0xdcecff, 0xd9b890, 0.55));
  const day = new THREE.DirectionalLight(0xfff1d6, 0.9); day.position.set(-6, 14, -16); scene.add(day);
  scene.fog = null;
}

function floorTex() {
  const c = mk(512, 512), g = c.getContext('2d'), R = rnd(55), pw = 64;
  for (let i = 0; i < 8; i++) {
    const v = R(); g.fillStyle = `rgb(${186 + v * 30},${140 + v * 26},${92 + v * 20})`; g.fillRect(i * pw, 0, pw, 512);
    for (let k = 0; k < 24; k++) { g.strokeStyle = `rgba(${R() < 0.5 ? '90,50,20' : '255,235,200'},${0.05 + R() * 0.1})`; g.lineWidth = 1 + R() * 2; const x = i * pw + R() * pw; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, 170, x - 6, 340, x + 3, 512); g.stroke(); }
    g.fillStyle = 'rgba(60,30,10,0.45)'; g.fillRect(i * pw, 0, 2, 512);
  }
  return c;
}

function armchair(scene: any, x: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, FLOOR, z); g.rotation.y = Math.PI / 4; g.scale.setScalar(2.2);
  const fab = new THREE.MeshStandardMaterial({ color: 0x2f8f94, roughness: 0.9 }), cush = new THREE.MeshStandardMaterial({ color: 0x3fb0b4, roughness: 0.9 }), wood = new THREE.MeshStandardMaterial({ color: 0x7a4b25, roughness: 0.5 });
  const add = (geo: any, mat: any, px: number, py: number, pz: number, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.rotation.x = rx; m.castShadow = true; g.add(m); return m; };
  add(rb(4.4, 1.2, 4.0, 0.35), fab, 0, 1.5, 0);                 // seat base
  add(rb(3.5, 0.7, 3.2, 0.3), cush, 0, 2.3, 0.2);               // seat cushion
  add(rb(4.4, 3.8, 1.0, 0.4), fab, 0, 3.7, -1.7, -0.18);        // back
  add(rb(3.4, 2.4, 0.5, 0.25), cush, 0, 3.6, -1.15, -0.18);     // back cushion
  for (const sx of [-2.3, 2.3]) add(rb(0.9, 2.4, 3.9, 0.35), fab, sx, 2.4, 0.0);  // arms
  for (const sx of [-1.8, 1.8]) for (const sz of [-1.6, 1.6]) add(new THREE.CylinderGeometry(0.14, 0.1, 1.0, 12), wood, sx, 0.5, sz);
  scene.add(g);
}

function coffeeTable(scene: any, x: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, FLOOR, z);
  const wood = new THREE.MeshPhysicalMaterial({ color: 0x9a6a3a, roughness: 0.4, clearcoat: 0.5 }), dark = new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.5 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.45, 48), wood); top.position.y = 5.4; top.castShadow = top.receiveShadow = true; g.add(top);
  const shelf = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.2, 40), dark); shelf.position.y = 1.8; g.add(shelf);
  for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.14, 5.2, 12), dark); leg.position.set(Math.cos(a) * 2.5, 2.7, Math.sin(a) * 2.5); leg.castShadow = true; g.add(leg); }
  // vase with flowers
  const prof = [[0, 0], [0.7, 0], [1.0, 0.6], [1.15, 1.5], [0.8, 2.3], [0.45, 2.7], [0.55, 3.0], [0.62, 3.1]].map(([a, b]) => new THREE.Vector2(a, b));
  const vase = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), new THREE.MeshPhysicalMaterial({ color: 0x3a78c8, roughness: 0.15, clearcoat: 1 })); vase.position.y = 5.62; vase.castShadow = true; g.add(vase);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f9a4a, roughness: 0.8 });
  const cols = [0xff5fa8, 0xffd34d, 0xffffff, 0xff8a5a, 0xc08aff, 0xff5fa8, 0xffd34d];
  cols.forEach((c, i) => {
    const a = i * 0.9, tilt = 0.25 + (i % 3) * 0.12, len = 3.4 + (i % 3) * 0.6;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 6), stemMat); stem.position.set(Math.cos(a) * Math.sin(tilt) * len / 2, 8.7 + Math.cos(tilt) * len / 2 - 1.2, Math.sin(a) * Math.sin(tilt) * len / 2);
    stem.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt); g.add(stem);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })); f.position.set(Math.cos(a) * Math.sin(tilt) * len, 8.7 + Math.cos(tilt) * len - 1.2, Math.sin(a) * Math.sin(tilt) * len); f.castShadow = true; g.add(f);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffb000 })); core.position.copy(f.position).add(new THREE.Vector3(0, 0.28, 0)); g.add(core);
  });
  scene.add(g);
}

function ficus(scene: any, x: number, z: number, sc: number) {
  const g = new THREE.Group(); g.position.set(x, FLOOR, z);
  const pot = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [1.4, 0], [1.9, 0.2], [2.3, 3.4], [2.45, 3.7], [2.1, 3.7]].map(([a, b]) => new THREE.Vector2(a, b)), 32), new THREE.MeshStandardMaterial({ color: 0xc9683a, roughness: 0.8 }));
  pot.castShadow = true; g.add(pot);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24), new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.position.y = 3.5; g.add(soil);
  const bark = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 11, 10), bark); t.position.set((i - 1) * 0.6, 9, (i % 2 - 0.5) * 0.5); t.rotation.z = (i - 1) * 0.09; g.add(t); }
  const R = rnd(77), leaf = new THREE.SphereGeometry(1, 10, 8); leaf.scale(0.85, 0.12, 1.7);
  const N = 190, inst = new THREE.InstancedMesh(leaf, new THREE.MeshStandardMaterial({ roughness: 0.55 }), N), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const a = R() * 6.283, h = R(), rad = 1.2 + Math.sin(h * Math.PI) * 4.8 * (0.5 + R() * 0.5), y = 9 + h * 12;
    e.set((R() - 0.5) * 1.4 + 0.5, a, (R() - 0.5) * 1.0); q.setFromEuler(e);
    m.compose(new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad), q, new THREE.Vector3(1, 1, 1).multiplyScalar(0.8 + R() * 0.7)); inst.setMatrixAt(i, m);
    col.setHSL(0.27 + R() * 0.06, 0.55 + R() * 0.2, 0.22 + R() * 0.16); inst.setColorAt(i, col);
  }
  inst.castShadow = true; g.add(inst); g.scale.setScalar(1 + sc); scene.add(g);
}

function pendantLamp(scene: any) {
  const g = new THREE.Group(); g.position.set(0, CEIL, 2);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7, 8), new THREE.MeshStandardMaterial({ color: 0x222222 })); cord.position.y = -3.5; g.add(cord);
  const shade = new THREE.Mesh(new THREE.LatheGeometry([[0.4, 0], [3.4, -3], [3.6, -3.3], [3.3, -3.3], [0.3, -0.3]].map(([a, b]) => new THREE.Vector2(a, b)), 40), new THREE.MeshStandardMaterial({ color: 0xf6efe2, roughness: 0.6, side: THREE.DoubleSide, emissive: 0xffe2b0, emissiveIntensity: 0.55 })); shade.position.y = -7; g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4, 2.6) })); bulb.position.y = -8; g.add(bulb);
  const light = new THREE.PointLight(0xffd9a0, 160, 60, 1.6); light.position.y = -8.5; g.add(light);
  scene.add(g);
}
