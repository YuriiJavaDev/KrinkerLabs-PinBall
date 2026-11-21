// @ts-nocheck
// A cosy rock-bar around the table: warm brick, dark wood, velvet curtains, a leather armchair with a floor lamp,
// a bar counter with stools and bottles, neon signs and a chrome cruiser motorcycle. All generated in code.
// 1 world unit is about 8 cm. The motorcycle is a generic cruiser: no brand marks.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const FLOOR = -9;
const HALF_X = 22, BACK_Z = -22, FRONT_Z = 26, CEIL = 24;

function mk(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c: HTMLCanvasElement, rx = 1, ry = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function rnd(seed: number) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rb = (w: number, h: number, d: number, r = 0.1) => new RoundedBoxGeometry(w, h, d, 4, r);
const chrome = () => new THREE.MeshStandardMaterial({ color: 0xe6ebf0, metalness: 1, roughness: 0.08 });
const brass = () => new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 1, roughness: 0.28 });

// ---------- textures ----------
function brickTex() {
  const W = 1024, c = mk(W, W), g = c.getContext('2d'), R = rnd(33);
  g.fillStyle = '#3a1d14'; g.fillRect(0, 0, W, W);
  const bh = 52, bw = 128;
  for (let row = 0; row * bh < W; row++) for (let col = -1; col * bw < W; col++) {
    const x = col * bw + (row % 2 ? bw / 2 : 0), y = row * bh, v = R();
    g.fillStyle = `rgb(${150 + v * 50},${66 + v * 30},${44 + v * 20})`; g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
    g.fillStyle = `rgba(0,0,0,${0.08 + R() * 0.2})`; g.fillRect(x + 3, y + bh - 12, bw - 6, 9);
    g.fillStyle = `rgba(255,220,180,${R() * 0.12})`; g.fillRect(x + 6, y + 5, bw - 14, 6);
  }
  return c;
}
function paneling() {
  const c = mk(512, 512), g = c.getContext('2d'), R = rnd(8);
  for (let i = 0; i < 4; i++) {
    const gr = g.createLinearGradient(i * 128, 0, i * 128 + 128, 0); gr.addColorStop(0, '#4a2a16'); gr.addColorStop(0.5, '#5a3520'); gr.addColorStop(1, '#3f2312'); g.fillStyle = gr; g.fillRect(i * 128, 0, 128, 512);
    for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(${R() < 0.5 ? '20,8,0' : '255,190,130'},${0.05 + R() * 0.1})`; g.lineWidth = 1 + R() * 2; const x = i * 128 + 8 + R() * 112; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, 170, x - 6, 340, x + 2, 512); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(i * 128, 0, 3, 512);
  }
  return c;
}
function floorTex() {
  const c = mk(512, 512), g = c.getContext('2d'), R = rnd(55), pw = 64;
  for (let i = 0; i < 8; i++) {
    const v = R(); g.fillStyle = `rgb(${96 + v * 30},${58 + v * 22},${34 + v * 14})`; g.fillRect(i * pw, 0, pw, 512);
    for (let k = 0; k < 22; k++) { g.strokeStyle = `rgba(${R() < 0.5 ? '20,8,0' : '255,200,140'},${0.05 + R() * 0.1})`; g.lineWidth = 1 + R() * 2; const x = i * pw + R() * pw; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, 170, x - 6, 340, x + 3, 512); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(i * pw, 0, 2, 512);
  }
  return c;
}
function nightCityTex() {
  const c = mk(512, 768), g = c.getContext('2d'), R = rnd(9);
  const sky = g.createLinearGradient(0, 0, 0, 768); sky.addColorStop(0, '#0b1030'); sky.addColorStop(0.55, '#2a1f55'); sky.addColorStop(0.85, '#8a3f6a'); sky.addColorStop(1, '#e08a5a'); g.fillStyle = sky; g.fillRect(0, 0, 512, 768);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + R() * 0.7})`; g.beginPath(); g.arc(R() * 512, R() * 330, R() * 1.4 + 0.3, 0, 7); g.fill(); }
  const moon = g.createRadialGradient(390, 120, 4, 390, 120, 90); moon.addColorStop(0, '#fffbe0'); moon.addColorStop(0.2, '#fff1b8'); moon.addColorStop(0.21, 'rgba(255,240,180,0.25)'); moon.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = moon; g.fillRect(0, 0, 512, 768);
  for (let layer = 0; layer < 2; layer++) {
    let x = 0; while (x < 512) {
      const w = 34 + R() * 50, h = 150 + R() * 260 - layer * 60, y = 768 - h; g.fillStyle = layer ? '#150f2a' : '#0b0818'; g.fillRect(x, y, w, h);
      for (let wy = y + 12; wy < 760; wy += 20) for (let wx = x + 8; wx < x + w - 8; wx += 14) if (R() < 0.45) { g.fillStyle = R() < 0.8 ? '#ffd47a' : '#8fd8ff'; g.fillRect(wx, wy, 6, 9); }
      x += w + 4 + R() * 10;
    }
  }
  for (let i = 0; i < 26; i++) { const x = R() * 512, y = 560 + R() * 190, rg = g.createRadialGradient(x, y, 0, x, y, 18); const col = ['255,90,90', '255,200,90', '120,200,255'][i % 3]; rg.addColorStop(0, `rgba(${col},0.8)`); rg.addColorStop(1, `rgba(${col},0)`); g.fillStyle = rg; g.fillRect(x - 18, y - 18, 36, 36); }
  return c;
}
function velvetTex() {
  const c = mk(128, 256), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, '#5a0f1c'); gr.addColorStop(0.5, '#7a1a2a'); gr.addColorStop(1, '#4e0c18'); g.fillStyle = gr; g.fillRect(0, 0, 128, 256);
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; for (let x = 8; x < 128; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  return c;
}
function leatherTex() {
  const c = mk(256, 256), g = c.getContext('2d'), R = rnd(21);
  g.fillStyle = '#5a2f18'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '20,8,0' : '200,120,70'},${R() * 0.12})`; g.fillRect(R() * 256, R() * 256, 2 + R() * 3, 2 + R() * 3); }
  return c;
}
function rugTex() {
  const c = mk(512, 512), g = c.getContext('2d');
  g.fillStyle = '#5a0f1c'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#d9b25a'; g.lineWidth = 12; g.strokeRect(26, 26, 460, 460); g.lineWidth = 4; g.strokeRect(54, 54, 404, 404);
  g.strokeStyle = '#1b3a5a'; g.lineWidth = 10; g.strokeRect(70, 70, 372, 372);
  g.save(); g.translate(256, 256); g.fillStyle = '#d9b25a';
  for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.beginPath(); g.ellipse(0, -90, 28, 70, 0, 0, 7); g.fillStyle = i % 2 ? '#d9b25a' : '#1b3a5a'; g.fill(); }
  g.beginPath(); g.arc(0, 0, 42, 0, 7); g.fillStyle = '#7a1a2a'; g.fill(); g.strokeStyle = '#d9b25a'; g.lineWidth = 6; g.stroke(); g.restore();
  return c;
}
function neonTex(text: string, col: string, w = 512, h = 192, font = 120) {
  const c = mk(w, h), g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${font}px "Trebuchet MS", Impact, Arial, sans-serif`;
  g.shadowColor = col; g.shadowBlur = 30; g.strokeStyle = col; g.lineWidth = 10; g.strokeText(text, w / 2, h / 2);
  g.shadowBlur = 12; g.fillStyle = '#fff'; g.fillText(text, w / 2, h / 2); g.strokeStyle = col; g.lineWidth = 3; g.strokeText(text, w / 2, h / 2);
  return c;
}
function posterTex(seed: number) {
  const c = mk(256, 340), g = c.getContext('2d'), R = rnd(seed);
  const bg = g.createLinearGradient(0, 0, 0, 340); bg.addColorStop(0, ['#1b1b2b', '#2b1010', '#102030'][seed % 3]); bg.addColorStop(1, '#000'); g.fillStyle = bg; g.fillRect(0, 0, 256, 340);
  g.strokeStyle = ['#ffb000', '#ff5a3a', '#4fd8ff'][seed % 3]; g.lineWidth = 8; g.beginPath(); g.moveTo(150, 30); g.lineTo(90, 150); g.lineTo(140, 150); g.lineTo(100, 290); g.lineTo(190, 130); g.lineTo(140, 130); g.lineTo(180, 30); g.closePath(); g.stroke();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 30px Impact, Arial'; g.fillText(['ROCK', 'LIVE', 'PINBALL'][seed % 3], 128, 318); g.font = '14px Arial'; g.fillStyle = '#ffb000'; g.fillText('★ ★ ★', 128, 20);
  return c;
}

export function buildRoom(scene: any) {
  const brick = new THREE.MeshStandardMaterial({ map: tex(brickTex(), 6, 3), roughness: 0.9 });
  const wood = new THREE.MeshStandardMaterial({ map: tex(paneling(), 12, 1.4), roughness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.5 });
  const wallH = CEIL - FLOOR, wainH = 13;

  const fl = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2, FRONT_Z - BACK_Z), new THREE.MeshStandardMaterial({ map: tex(floorTex(), 7, 7), roughness: 0.45 }));
  fl.rotation.x = -Math.PI / 2; fl.position.set(0, FLOOR, (FRONT_Z + BACK_Z) / 2); fl.receiveShadow = true; scene.add(fl);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2, FRONT_Z - BACK_Z), new THREE.MeshStandardMaterial({ map: tex(paneling(), 14, 6), roughness: 0.7, color: 0x9a8a80 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, CEIL, (FRONT_Z + BACK_Z) / 2); scene.add(ceil);
  for (let z = BACK_Z + 6; z < FRONT_Z; z += 12) { const beam = new THREE.Mesh(rb(HALF_X * 2, 1.4, 1.6, 0.2), dark); beam.position.set(0, CEIL - 0.6, z); scene.add(beam); }

  const wall = (len: number, cx: number, cz: number, ry: number) => {
    const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry;
    const up = new THREE.Mesh(new THREE.PlaneGeometry(len, wallH - wainH), brick); up.position.y = FLOOR + wainH + (wallH - wainH) / 2; g.add(up);
    const lo = new THREE.Mesh(new THREE.PlaneGeometry(len, wainH), wood); lo.position.y = FLOOR + wainH / 2; g.add(lo);
    const rail = new THREE.Mesh(rb(len, 0.6, 0.5, 0.12), dark); rail.position.set(0, FLOOR + wainH, 0.12); g.add(rail);
    const base = new THREE.Mesh(rb(len, 1.2, 0.5, 0.12), dark); base.position.set(0, FLOOR + 0.6, 0.12); g.add(base);
    scene.add(g); return g;
  };
  const back = wall(HALF_X * 2, 0, BACK_Z, 0);
  const left = wall(FRONT_Z - BACK_Z, -HALF_X, (FRONT_Z + BACK_Z) / 2, Math.PI / 2);
  const right = wall(FRONT_Z - BACK_Z, HALF_X, (FRONT_Z + BACK_Z) / 2, -Math.PI / 2);
  const front = wall(HALF_X * 2, 0, FRONT_Z, Math.PI);

  // windows onto a night city, with heavy burgundy velvet curtains, a valance and tie-backs (only back and left walls)
  const city = tex(nightCityTex()), velvet = tex(velvetTex(), 1, 1);
  const win = (parent: any, x: number) => {
    const w = 13, h = 15, g = new THREE.Group(); g.position.set(x, FLOOR + 14 + h / 2, 0.06);
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: city, emissiveMap: city, emissive: 0xffffff, emissiveIntensity: 1.0, roughness: 1 })));
    const bar = (bw: number, bh: number, bx: number, by: number) => { const m = new THREE.Mesh(rb(bw, bh, 0.5, 0.08), dark); m.position.set(bx, by, 0.15); g.add(m); };
    bar(w + 1.2, 0.8, 0, h / 2 + 0.3); bar(w + 1.6, 0.9, 0, -h / 2 - 0.3); bar(0.8, h + 1, -w / 2 - 0.3, 0); bar(0.8, h + 1, w / 2 + 0.3, 0); bar(0.4, h, 0, 0); bar(w, 0.4, 0, 1.5);
    const mat = new THREE.MeshStandardMaterial({ map: velvet, roughness: 0.95, side: THREE.DoubleSide });
    for (const side of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(5.2, h + 3.4, 60, 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 5.2) * 0.5 + 0.95);
      geo.computeVertexNormals();
      const cur = new THREE.Mesh(geo, mat); cur.position.set(side * (w / 2 + 1.0), -0.4, 0.5); g.add(cur);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.12, 8, 24), brass()); tie.position.set(side * (w / 2 + 1.0), -2.6, 0.95); tie.rotation.y = Math.PI / 2; g.add(tie);
      const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.4, 10), brass()); tassel.position.set(side * (w / 2 + 1.0), -3.8, 1.0); tassel.rotation.x = Math.PI; g.add(tassel);
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), brass()); fin.position.set(side * (w / 2 + 4.0), h / 2 + 2.9, 0.5); g.add(fin);
    }
    const geo = new THREE.PlaneGeometry(w + 6, 2.6, 80, 1), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, 1.1 + Math.abs(Math.sin(x * 1.1)) * 0.7); p.setY(i, p.getY(i) - Math.abs(Math.sin(x * 1.1)) * (p.getY(i) < 0 ? 0.9 : 0)); }
    geo.computeVertexNormals(); const val = new THREE.Mesh(geo, mat); val.position.set(0, h / 2 + 2.2, 0.4); g.add(val);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, w + 9, 12), brass()); rod.rotation.z = Math.PI / 2; rod.position.set(0, h / 2 + 3.3, 0.5); g.add(rod);
    parent.add(g);
  };
  win(back, -9); win(back, 9); win(left, -2);

  // neon signs
  const neon = (parent: any, text: string, col: string, x: number, y: number, z: number, w: number, h: number, ry = 0, font = 120, light = false) => {
    const t = tex(neonTex(text, col, 512, Math.round(512 * h / w), font)), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: new THREE.Color(1.8, 1.8, 1.8) }));
    m.position.set(x, y, z); m.rotation.y = ry; parent.add(m);
    if (light) { const l = new THREE.PointLight(new THREE.Color(col), 14, 22, 2); l.position.set(x, y, z + 2 * Math.cos(ry)); parent.add(l); }
  };
  neon(back, 'ROCK BAR', '#ff3a6a', 0, FLOOR + 31, 0.1, 16, 5, 0, 120, true);
  neon(right, 'BAR', '#ffb000', 0, FLOOR + 26.5, 0.1, 9, 4, 0, 130);
  neon(left, 'PINBALL', '#4fd8ff', 12, FLOOR + 24, 0.1, 14, 4.6, 0, 110);
  neon(front, 'OPEN', '#3aff7a', -8, FLOOR + 22, 0.1, 8, 3.2, 0, 120);
  // posters
  for (const [z, seed] of [[-15, 1], [14, 2]]) {
    const pic = new THREE.Group(); pic.position.set(0.06, FLOOR + 21, z);
    pic.add(new THREE.Mesh(rb(5.6, 7.4, 0.4, 0.12), dark)); const img = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 6.5), new THREE.MeshStandardMaterial({ map: tex(posterTex(seed)), roughness: 0.6 })); img.position.z = 0.22; pic.add(img); left.add(pic);
  }
  // entrance door in the front wall
  const door = new THREE.Group(); door.position.set(9, FLOOR + 8.5, 0.15);
  const leaf = new THREE.Mesh(rb(8, 16, 0.7, 0.12), new THREE.MeshStandardMaterial({ map: tex(paneling(), 3, 3), roughness: 0.5 })); door.add(leaf);
  const dframe = new THREE.Mesh(rb(9.4, 17.2, 0.5, 0.15), dark); dframe.position.z = -0.25; door.add(dframe);
  const dglass = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), new THREE.MeshStandardMaterial({ color: 0x223344, emissive: 0x4a6a8a, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.5 })); dglass.position.set(0, 3.2, 0.37); door.add(dglass);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.6, 12), brass()); handle.position.set(-3, -1, 0.9); door.add(handle);
  front.add(door);

  // rug
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(26, 36), new THREE.MeshStandardMaterial({ map: tex(rugTex()), roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, FLOOR + 0.03, 1.5); rug.receiveShadow = true; scene.add(rug);
  const sc = mk(256, 256), sg = sc.getContext('2d'), rg = sg.createRadialGradient(128, 128, 30, 128, 128, 128); rg.addColorStop(0, 'rgba(0,0,0,0.6)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = rg; sg.fillRect(0, 0, 256, 256);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(18, 26), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.set(0, FLOOR + 0.06, 0); scene.add(blob);

  armchair(scene, -17, -17); floorLamp(scene, -20.5, -9.5); coffeeTable(scene, 16.5, -17.5); ficus(scene, 19.8, -20.2, 0.5);
  barCounter(scene); motorcycle(scene, -15.5, 19, -0.35);

  // dim bar light: low ambient, warm bounce, a little moonlight through the windows
  scene.add(new THREE.HemisphereLight(0x8a90c0, 0x6a4a30, 0.28));
  const moon = new THREE.DirectionalLight(0x9fb4ff, 0.25); moon.position.set(-6, 14, -16); scene.add(moon);
  scene.fog = null;
}

function armchair(scene: any, x: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, FLOOR, z); g.rotation.y = Math.PI / 4; g.scale.setScalar(2.2);
  const lt = tex(leatherTex(), 2, 2), leather = new THREE.MeshPhysicalMaterial({ map: lt, roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.4 }), wood = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.5 });
  const add = (geo: any, mat: any, px: number, py: number, pz: number, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.rotation.x = rx; m.castShadow = true; g.add(m); return m; };
  add(rb(4.4, 1.2, 4.0, 0.35), leather, 0, 1.5, 0); add(rb(3.5, 0.75, 3.2, 0.3), leather, 0, 2.3, 0.2);
  add(rb(4.4, 3.9, 1.1, 0.45), leather, 0, 3.7, -1.7, -0.18);
  for (const sx of [-2.3, 2.3]) add(rb(0.95, 2.5, 3.9, 0.4), leather, sx, 2.4, 0);
  const btn = brass();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), btn); b.position.set(-1.5 + c * 1.0, 3.0 + r * 0.8, -1.12 + (3.0 + r * 0.8 - 3.7) * -0.18 * 0 ); b.position.z = -1.12 + 0.0; b.position.y = 3.0 + r * 0.75; b.position.z = -1.7 + 0.58 + (b.position.y - 3.7) * -0.18; g.add(b); }
  for (const sx of [-1.8, 1.8]) for (const sz of [-1.6, 1.6]) add(new THREE.CylinderGeometry(0.15, 0.1, 1.0, 12), wood, sx, 0.5, sz);
  scene.add(g);
}

function floorLamp(scene: any, x: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, FLOOR, z);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.3, 32), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 })); base.position.y = 0.15; g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 17, 14), brass()); pole.position.y = 8.8; g.add(pole);
  const shade = new THREE.Mesh(new THREE.LatheGeometry([[2.0, 0], [3.2, 3.6], [3.0, 3.8], [1.8, 0.2]].map(([a, b]) => new THREE.Vector2(a, b)), 32), new THREE.MeshStandardMaterial({ color: 0xffd9a0, roughness: 0.8, emissive: 0xff9a40, emissiveIntensity: 0.55, side: THREE.DoubleSide })); shade.position.y = 15.2; g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2, 1) })); bulb.position.y = 16.5; g.add(bulb);
  const light = new THREE.PointLight(0xffa050, 16, 26, 1.8); light.position.y = 16.6; g.add(light);
  scene.add(g);
}

function coffeeTable(scene: any, x: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, FLOOR, z);
  const wood = new THREE.MeshPhysicalMaterial({ color: 0x4a2a16, roughness: 0.35, clearcoat: 0.6 }), dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.45, 48), wood); top.position.y = 5.4; top.castShadow = top.receiveShadow = true; g.add(top);
  const shelf = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.2, 40), wood); shelf.position.y = 1.8; g.add(shelf);
  for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.14, 5.2, 12), dark); leg.position.set(Math.cos(a) * 2.5, 2.7, Math.sin(a) * 2.5); leg.castShadow = true; g.add(leg); }
  const prof = [[0, 0], [0.7, 0], [1.0, 0.6], [1.15, 1.5], [0.8, 2.3], [0.45, 2.7], [0.55, 3.0], [0.62, 3.1]].map(([a, b]) => new THREE.Vector2(a, b));
  const vase = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), new THREE.MeshPhysicalMaterial({ color: 0x1b5a8a, roughness: 0.15, clearcoat: 1 })); vase.position.y = 5.62; vase.castShadow = true; g.add(vase);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f9a4a, roughness: 0.8 });
  [0xff3a4a, 0xffd34d, 0xffffff, 0xff8a5a, 0xc08aff, 0xff3a4a, 0xffd34d].forEach((c, i) => {
    const a = i * 0.9, tilt = 0.25 + (i % 3) * 0.12, len = 3.4 + (i % 3) * 0.6, y0 = 7.5;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 6), stemMat); stem.position.set(Math.cos(a) * Math.sin(tilt) * len / 2, y0 + Math.cos(tilt) * len / 2, Math.sin(a) * Math.sin(tilt) * len / 2); stem.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt); g.add(stem);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })); f.position.set(Math.cos(a) * Math.sin(tilt) * len, y0 + Math.cos(tilt) * len, Math.sin(a) * Math.sin(tilt) * len); f.castShadow = true; g.add(f);
  });
  scene.add(g);
}

function ficus(scene: any, x: number, z: number, sc: number) {
  const g = new THREE.Group(); g.position.set(x, FLOOR, z);
  const pot = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [1.4, 0], [1.9, 0.2], [2.3, 3.4], [2.45, 3.7], [2.1, 3.7]].map(([a, b]) => new THREE.Vector2(a, b)), 32), new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.5, metalness: 0.3 })); pot.castShadow = true; g.add(pot);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24), new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.position.y = 3.5; g.add(soil);
  const bark = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 11, 10), bark); t.position.set((i - 1) * 0.6, 9, (i % 2 - 0.5) * 0.5); t.rotation.z = (i - 1) * 0.09; g.add(t); }
  const R = rnd(77), leaf = new THREE.SphereGeometry(1, 10, 8); leaf.scale(0.85, 0.12, 1.7);
  const N = 190, inst = new THREE.InstancedMesh(leaf, new THREE.MeshStandardMaterial({ roughness: 0.55 }), N), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const a = R() * 6.283, h = R(), rad = 1.2 + Math.sin(h * Math.PI) * 4.8 * (0.5 + R() * 0.5), y = 9 + h * 12;
    e.set((R() - 0.5) * 1.4 + 0.5, a, (R() - 0.5) * 1.0); q.setFromEuler(e);
    m.compose(new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad), q, new THREE.Vector3(1, 1, 1).multiplyScalar(0.8 + R() * 0.7)); inst.setMatrixAt(i, m);
    col.setHSL(0.27 + R() * 0.06, 0.55 + R() * 0.2, 0.2 + R() * 0.14); inst.setColorAt(i, col);
  }
  inst.castShadow = true; g.add(inst); g.scale.setScalar(1 + sc); scene.add(g);
}

function barCounter(scene: any) {
  const g = new THREE.Group(); g.position.set(0, FLOOR, 0);
  const wood = new THREE.MeshPhysicalMaterial({ map: tex(paneling(), 6, 2), roughness: 0.4, clearcoat: 0.5 }), top = new THREE.MeshPhysicalMaterial({ color: 0x5a3018, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12 });
  const add = (geo: any, mat: any, x: number, y: number, z: number) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  add(rb(4, 12, 23, 0.3), wood, 19.4, 6, 3); add(rb(5.4, 0.9, 24, 0.35), top, 19.0, 12.4, 3);
  const rail = add(new THREE.CylinderGeometry(0.22, 0.22, 22, 14), chrome(), 16.9, 2.0, 3); rail.rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const z = -4 + i * 4.6, sx = 14.2;
    add(new THREE.CylinderGeometry(1.7, 1.7, 0.9, 28), new THREE.MeshPhysicalMaterial({ color: 0x8a1420, roughness: 0.35, clearcoat: 0.6 }), sx, 8.6, z);
    add(new THREE.CylinderGeometry(0.2, 0.2, 7.6, 12), chrome(), sx, 4.4, z); add(new THREE.CylinderGeometry(1.4, 1.5, 0.2, 24), chrome(), sx, 0.1, z);
    const ring = add(new THREE.TorusGeometry(1.0, 0.1, 8, 24), chrome(), sx, 2.4, z); ring.rotation.x = Math.PI / 2;
  }
  // back wall: mirror, two shelves with bottles, warm light strips
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(22, 12), new THREE.MeshStandardMaterial({ color: 0xdfe8f0, metalness: 1, roughness: 0.04 })); mirror.rotation.y = -Math.PI / 2; mirror.position.set(21.85, 9, 3); g.add(mirror);
  const frame = new THREE.Mesh(rb(0.5, 13, 23.2, 0.15), wood); frame.position.set(21.7, 9, 3); g.add(frame);
  const R = rnd(4), cols = [0x2a7a3a, 0x7a3a1a, 0x1a4a8a, 0xb07a1a, 0x5a1a4a, 0x9a1a1a];
  for (const [y, n] of [[7.2, 17], [12.2, 17]]) {
    add(rb(1.8, 0.4, 22, 0.12), wood, 20.8, y, 3);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 21), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.6, 1.2), toneMapped: false })); strip.position.set(20.1, y - 0.28, 3); g.add(strip);
    for (let i = 0; i < n; i++) {
      const col = cols[Math.floor(R() * cols.length)], h = 2.0 + R() * 1.4, r = 0.4 + R() * 0.15, z = -7 + i * 1.28;
      const bot = new THREE.Group(); bot.position.set(20.9, y + 0.2, z);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h * 0.62, 14), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.1, clearcoat: 1, transmission: 0 })); body.position.y = h * 0.31; bot.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.55, h * 0.38, 12), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.1, clearcoat: 1 })); neck.position.y = h * 0.81; bot.add(neck);
      g.add(bot);
    }
  }
  const warm = new THREE.PointLight(0xffa860, 22, 24, 2); warm.position.set(18, 8, 3); g.add(warm);
  scene.add(g);
}

/** Generic chrome cruiser: V-twin, teardrop tank, swept handlebars. No brand marks. */
function motorcycle(scene: any, x: number, z: number, ry: number) {
  const g = new THREE.Group(); g.position.set(x, FLOOR, z); g.rotation.y = ry; g.scale.setScalar(1.05);
  const ch = chrome(), black = new THREE.MeshPhysicalMaterial({ color: 0x0c0c0e, roughness: 0.3, clearcoat: 1 }), paint = new THREE.MeshPhysicalMaterial({ color: 0xc8401a, metalness: 0.5, roughness: 0.22, clearcoat: 1 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });
  const add = (geo: any, mat: any, px: number, py: number, pz: number) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = true; g.add(m); return m; };
  const tube = (pts: number[][], r: number, mat: any) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 40, r, 10), mat); m.castShadow = true; g.add(m); };
  const wheel = (px: number, wide: number) => {
    const w = new THREE.Group(); w.position.set(px, 4.7, 0);
    w.add(new THREE.Mesh(new THREE.TorusGeometry(4.1, wide, 16, 48), tire));
    w.add(new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.14, 10, 48), ch));
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 16), ch); hub.rotation.x = Math.PI / 2; w.add(hub);
    for (let i = 0; i < 32; i++) { const a = i * Math.PI * 2 / 32, sp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.7, 4), ch); sp.position.set(Math.cos(a) * 2.05, Math.sin(a) * 2.05, (i % 2 ? 0.2 : -0.2)); sp.rotation.z = a - Math.PI / 2; w.add(sp); }
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.08, 32), ch); disc.rotation.x = Math.PI / 2; disc.position.z = 0.7; w.add(disc);
    g.add(w);
  };
  wheel(10.5, 0.62); wheel(-10.5, 0.9);
  // fork, triple tree, handlebars, headlight
  for (const s of [-0.95, 0.95]) { tube([[10.5, 4.7, s], [8.6, 9, s], [7.2, 13, s]], 0.22, ch); add(new THREE.CylinderGeometry(0.34, 0.3, 3.2, 12), ch, 8.9, 8.6, s).rotation.z = 0.36; }
  add(new THREE.CylinderGeometry(0.36, 0.36, 2.6, 12), black, 7.0, 13.2, 0).rotation.x = Math.PI / 2;
  tube([[6.8, 13.4, 3.6], [6.4, 14.6, 4.4], [7.2, 16.0, 4.2]], 0.2, ch); tube([[6.8, 13.4, -3.6], [6.4, 14.6, -4.4], [7.2, 16.0, -4.2]], 0.2, ch); tube([[6.8, 13.4, 3.6], [6.8, 13.4, -3.6]], 0.2, ch);
  for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.28, 0.28, 1.5, 10), black, 7.2, 16.2, s * 4.2).rotation.x = Math.PI / 2;
  add(new THREE.SphereGeometry(1.2, 20, 14), ch, 9.6, 12.4, 0).scale.set(0.9, 1, 1);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.85, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.6, 2.6), toneMapped: false })); lens.position.set(10.72, 12.4, 0); lens.rotation.y = Math.PI / 2; g.add(lens);
  // tank, seat, fenders, frame
  const tank = add(new THREE.SphereGeometry(1, 28, 18), paint, 2.0, 11.4, 0); tank.scale.set(4.4, 1.9, 2.0);
  const stripe = add(new THREE.SphereGeometry(1, 20, 10), ch, 2.0, 12.9, 0); stripe.scale.set(3.2, 0.12, 0.55);
  add(new THREE.SphereGeometry(1, 24, 12), black, -4.2, 10.1, 0).scale.set(3.6, 0.75, 1.7);
  add(new THREE.SphereGeometry(1, 24, 10), paint, -10.5, 9.3, 0).scale.set(4.6, 0.3, 1.55);
  add(new THREE.SphereGeometry(1, 24, 10), paint, 10.5, 9.2, 0).scale.set(3.4, 0.28, 1.2);
  for (const s of [-1, 1]) tube([[7.0, 12.6, s * 0.9], [1.0, 9.0, s * 1.0], [-4, 6.2, s * 1.0], [-10.5, 4.7, s * 1.1]], 0.22, black);
  // V-twin engine with cooling fins, exhaust pipes
  add(rb(2.8, 3.0, 2.6, 0.3), black, 0.5, 5.6, 0);
  for (const [a, px] of [[0.5, 2.3], [-0.5, -1.0]]) {
    const cyl = new THREE.Group(); cyl.position.set(px, 7.4, 0); cyl.rotation.z = a;
    const bodyc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 3.4, 20), black); bodyc.position.y = 1.4; cyl.add(bodyc);
    for (let i = 0; i < 7; i++) { const fin = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.12, 20), ch); fin.position.y = 0.2 + i * 0.4; cyl.add(fin); }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 10), ch); cap.position.y = 3.3; cap.scale.y = 0.6; cyl.add(cap);
    g.add(cyl);
  }
  for (const s of [-1, 1]) { tube([[2.6, 7.0, s * 1.5], [2.8, 3.6, s * 2.0], [-3.5, 3.0, s * 2.3], [-11.5, 3.9, s * 2.5]], 0.5, ch); add(new THREE.CylinderGeometry(0.4, 0.62, 1.2, 14), black, -12.0, 3.9, s * 2.5).rotation.z = Math.PI / 2; }
  // foot pegs and a kickstand to hold it up
  for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.25, 0.25, 1.4, 10), ch, 0.4, 3.3, s * 2.4).rotation.x = Math.PI / 2;
  scene.add(g);
}
