// @ts-nocheck
// All artwork is drawn in code (Canvas 2D). No image files, nothing to license.
import { FIELD_W, FIELD_H } from './core';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const mk = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/** Value-noise fbm rendered to a small canvas, used for mottling and grain. */
function noiseCanvas(w: number, h: number, cell: number, seed: number, octaves = 4) {
  const r = rng(seed), G = 256, grid = new Float32Array(G * G);
  for (let i = 0; i < grid.length; i++) grid[i] = r();
  const at = (x: number, y: number) => grid[((y & 255) << 8) | (x & 255)];
  const sm = (t: number) => t * t * (3 - 2 * t);
  const val = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  const c = mk(w, h), g = c.getContext('2d'), img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0, amp = 0.5, f = 1 / cell, tot = 0;
    for (let o = 0; o < octaves; o++) { v += amp * val(x * f, y * f); tot += amp; amp *= 0.5; f *= 2; }
    const p = (y * w + x) * 4, n = Math.max(0, Math.min(255, (v / tot) * 255 * 1.15 - 20));
    img.data[p] = img.data[p + 1] = img.data[p + 2] = n; img.data[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function playfieldTexture(table: any, W = 2048) {
  const H = Math.round(W * FIELD_H / FIELD_W), k = W / FIELD_W;
  const c = mk(W, H), g = c.getContext('2d'), R = rng(7);
  const X = (v: number) => v * k;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';

  // ground: deep forest green with mossy mottling at three scales
  let grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0e4440'); grad.addColorStop(0.45, '#1a6a3c'); grad.addColorStop(1, '#0c3a40');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = 0.8; g.drawImage(noiseCanvas(256, 456, 40, 3), 0, 0, W, H);
  g.globalAlpha = 0.45; g.drawImage(noiseCanvas(512, 910, 12, 11, 4), 0, 0, W, H);
  g.globalAlpha = 0.25; g.drawImage(noiseCanvas(512, 910, 4, 17, 3), 0, 0, W, H);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;

  for (const [x, y, rad, col] of [[200, 300, 280, '80,255,170'], [650, 700, 320, '80,200,255'], [300, 1000, 300, '255,230,120'], [640, 1180, 260, '180,120,255']]) {
    const rg = g.createRadialGradient(X(x), X(y), 0, X(x), X(y), X(rad)); rg.addColorStop(0, `rgba(${col},0.2)`); rg.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
  }

  // the stream with banks of pebbles
  const path = () => { g.beginPath(); g.moveTo(X(690), X(120)); g.bezierCurveTo(X(640), X(380), X(330), X(380), X(400), X(760)); g.bezierCurveTo(X(450), X(1000), X(330), X(1120), X(450), X(1640)); };
  const stream = (lw: number, col: string, blur: number) => { g.save(); g.filter = `blur(${blur * k}px)`; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col; g.lineWidth = X(lw); path(); g.stroke(); g.restore(); };
  stream(170, 'rgba(8,40,60,0.6)', 14); stream(118, 'rgba(24,120,180,0.7)', 7); stream(60, 'rgba(120,225,255,0.5)', 6); stream(14, 'rgba(255,255,255,0.35)', 2);
  // pebbles along the banks: sample the bezier by hand
  const bz = (t: number) => {
    const seg = t < 0.5, u = seg ? t * 2 : (t - 0.5) * 2, P = seg ? [[690, 120], [640, 380], [330, 380], [400, 760]] : [[400, 760], [450, 1000], [330, 1120], [450, 1640]];
    const m = 1 - u; return [m * m * m * P[0][0] + 3 * m * m * u * P[1][0] + 3 * m * u * u * P[2][0] + u * u * u * P[3][0], m * m * m * P[0][1] + 3 * m * m * u * P[1][1] + 3 * m * u * u * P[2][1] + u * u * u * P[3][1]];
  };
  for (let i = 0; i < 200; i++) {
    const [x, y] = bz(R()), side = R() < 0.5 ? -1 : 1, off = 52 + R() * 26, r = 2.5 + R() * 5;
    const px = x + side * off, py = y + (R() - 0.5) * 10, v = 90 + R() * 80;
    g.fillStyle = `rgb(${v},${v * 0.95},${v * 0.9})`; g.beginPath(); g.ellipse(X(px), X(py), X(r), X(r * 0.7), R() * 3, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(X(px + 2), X(py + 3), X(r), X(r * 0.6), 0, 0, 7); g.fill();
  }
  // lily pads and water flowers
  for (let i = 0; i < 26; i++) {
    const [x, y] = bz(0.08 + R() * 0.84), px = X(x + (R() - 0.5) * 70), py = X(y), r = X(10 + R() * 10), a = R() * 6;
    g.fillStyle = '#2f9a4a'; g.beginPath(); g.moveTo(px, py); g.arc(px, py, r, a, a + 5.6); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,60,20,0.5)'; g.lineWidth = X(1.5); g.stroke();
    if (R() < 0.4) { g.fillStyle = '#ffb6d9'; g.beginPath(); g.arc(px, py, r * 0.38, 0, 7); g.fill(); g.fillStyle = '#fff1a8'; g.beginPath(); g.arc(px, py, r * 0.15, 0, 7); g.fill(); }
  }

  // pond around the saucer
  for (const u of table.saucers) {
    const rg = g.createRadialGradient(X(u.x), X(u.y), X(10), X(u.x), X(u.y), X(86));
    rg.addColorStop(0, '#02060d'); rg.addColorStop(0.45, '#0a2a4a'); rg.addColorStop(0.8, '#2a8ab0'); rg.addColorStop(1, 'rgba(120,230,255,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(X(u.x), X(u.y), X(86), 0, 7); g.fill();
    g.strokeStyle = 'rgba(180,240,255,0.4)'; g.lineWidth = X(2); for (const rr of [46, 62, 78]) { g.beginPath(); g.arc(X(u.x), X(u.y), X(rr), 0, 7); g.stroke(); }
    g.strokeStyle = '#ffd34d'; g.lineWidth = X(4); g.setLineDash([X(5), X(12)]); g.beginPath(); g.arc(X(u.x), X(u.y), X(98), 0, 7); g.stroke(); g.setLineDash([]);
  }

  // ferns, grass, flowers
  const fern = (x: number, y: number, s: number, a0: number) => {
    g.save(); g.translate(X(x), X(y)); g.rotate(a0); g.strokeStyle = 'rgba(70,200,110,0.55)'; g.lineWidth = X(1.6);
    for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.225, l = X(s) * (1 - Math.abs(i - 4) * 0.08); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.sin(a) * l * 0.5, -Math.cos(a) * l * 0.6, Math.sin(a) * l, -Math.cos(a) * l); g.stroke(); }
    g.restore();
  };
  for (let i = 0; i < 70; i++) { const side = R() < 0.5; fern(side ? 50 + R() * 90 : 680 + R() * 90, 300 + R() * 1000, 30 + R() * 30, (side ? 0.6 : -0.6) + (R() - 0.5)); }
  g.strokeStyle = 'rgba(160,255,160,0.2)'; g.lineWidth = X(1.2);
  for (let i = 0; i < 4200; i++) { const x = R() * W, y = R() * H, l = X(4 + R() * 12), a = -Math.PI / 2 + (R() - 0.5) * 0.9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 520; i++) { const x = R() * W, y = R() * H, s = X(1 + R() * 2.6), t = R(); g.globalAlpha = 0.25 + R() * 0.5; g.fillStyle = t < 0.3 ? '#ffe9a0' : t < 0.55 ? '#ff9ad0' : t < 0.8 ? '#bff7ff' : '#a6ff9c'; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
  g.globalAlpha = 1;

  // painted mushrooms seen from above, clustered near the walls
  const mush = (x: number, y: number, r: number, col: string) => {
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(X(x + r * 0.2), X(y + r * 0.3), X(r * 1.05), X(r * 0.95), 0, 0, 7); g.fill();
    const rg = g.createRadialGradient(X(x - r * 0.3), X(y - r * 0.3), X(r * 0.1), X(x), X(y), X(r)); rg.addColorStop(0, '#fff'); rg.addColorStop(0.25, col); rg.addColorStop(1, '#3a1050');
    g.fillStyle = rg; g.beginPath(); g.arc(X(x), X(y), X(r), 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 6; i++) { const a = R() * 6.28, d = R() * r * 0.65; g.beginPath(); g.arc(X(x + Math.cos(a) * d), X(y + Math.sin(a) * d), X(r * (0.07 + R() * 0.08)), 0, 7); g.fill(); }
  };
  for (const [x, y, r, col] of [[96, 330, 26, '#ff5fa8'], [128, 372, 15, '#ffb14a'], [72, 400, 12, '#ff5fa8'], [742, 330, 22, '#ffb14a'], [712, 360, 14, '#ff5fa8'],
    [92, 1000, 20, '#7affc6'], [118, 1040, 11, '#ff5fa8'], [738, 1010, 18, '#ff5fa8'], [86, 700, 16, '#ffb14a'], [740, 720, 15, '#7affc6'], [370, 1330, 17, '#ffb14a'], [560, 1340, 15, '#ff5fa8']]) mush(x, y, r, col);

  // shadows: soft dark halo along every wall and under every object, taken from the real table data
  g.save(); g.filter = `blur(${X(9)}px)`; g.lineCap = 'round'; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = X(34);
  for (const w of table.walls) { g.beginPath(); g.moveTo(X(w.ax + 6), X(w.ay + 8)); g.lineTo(X(w.bx + 6), X(w.by + 8)); g.stroke(); }
  g.restore();
  for (const b of table.bumpers) { const rg = g.createRadialGradient(X(b.x), X(b.y), X(b.r * 0.5), X(b.x), X(b.y), X(b.r * 1.9)); rg.addColorStop(0, 'rgba(0,0,0,0.55)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.beginPath(); g.arc(X(b.x), X(b.y), X(b.r * 1.9), 0, 7); g.fill(); }
  for (const b of table.bumpers) if (b.kind === 'pop') { g.strokeStyle = 'rgba(255,95,168,0.6)'; g.lineWidth = X(5); g.beginPath(); g.arc(X(b.x), X(b.y), X(b.r + 26), 0, 7); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.45)'; for (const t of table.targets) { g.beginPath(); g.ellipse(X((t.ax + t.bx) / 2 + 10), X((t.ay + t.by) / 2), X(16), X(Math.hypot(t.bx - t.ax, t.by - t.ay) / 2 + 8), 0, 0, 7); g.fill(); }

  // sockets for the 3D insert lights (the lit part is a real mesh)
  const socket = (x: number, y: number, r: number) => { g.fillStyle = '#04080c'; g.strokeStyle = '#c9a24a'; g.lineWidth = X(3); g.beginPath(); g.arc(X(x), X(y), X(r), 0, 7); g.fill(); g.stroke(); };
  for (const n of table.sensors) if (n.kind === 'lane') socket(n.x, n.y, 25);
  for (let i = 0; i < 5; i++) socket(230 + i * 105, 1010 + (i % 2 ? 36 : 0), 35);
  // lane labels and arrows
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = `700 ${X(26)}px "Trebuchet MS", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  ['A', 'B', 'C'].forEach((ch, i) => g.fillText(ch, X(350 + i * 100), X(262)));
  g.font = `700 ${X(22)}px "Trebuchet MS", Arial, sans-serif`; g.fillStyle = 'rgba(255,220,120,0.8)';
  g.save(); g.translate(X(205), X(890)); g.rotate(-Math.PI / 2); g.fillText('D R O P   B A N K', 0, 0); g.restore();
  g.save(); g.translate(X(735), X(1010)); g.rotate(Math.PI / 2); g.fillText('S P I N N E R', 0, 0); g.restore();
  g.fillText('POND  ·  1000', X(470), X(1018));
  g.strokeStyle = '#ffd34d'; g.lineWidth = X(9); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [x] of [[130], [770]]) for (let i = 0; i < 3; i++) { const y = 1090 + i * 38; g.globalAlpha = 0.9 - i * 0.22; g.beginPath(); g.moveTo(X(x - 22), X(y)); g.lineTo(X(x), X(y + 20)); g.lineTo(X(x + 22), X(y)); g.stroke(); }
  g.globalAlpha = 1;

  // brand
  g.save(); g.translate(X(450), X(1140)); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${X(40)}px "Trebuchet MS", "Segoe UI", Arial, sans-serif`;
  const gold = g.createLinearGradient(0, X(-30), 0, X(30)); gold.addColorStop(0, '#fff3c4'); gold.addColorStop(0.5, '#ffd05a'); gold.addColorStop(1, '#b8791a');
  g.shadowColor = '#ffcf5a'; g.shadowBlur = X(20); g.fillStyle = gold; g.fillText('KRINKER LABS', 0, 0);
  g.shadowBlur = 0; g.font = `600 ${X(18)}px "Trebuchet MS", Arial, sans-serif`; g.fillStyle = '#bff7ff'; g.fillText('·  FAIRY FOREST  ·', 0, X(34)); g.restore();

  // outside of the top arc: dark lacquered wood with a golden line; the plunger lane: brushed steel
  g.save(); g.beginPath(); g.rect(0, 0, W, X(450)); g.clip(); g.fillStyle = '#120c08'; g.beginPath(); g.rect(0, 0, W, X(450)); g.arc(X(450), X(450), X(410), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore();
  g.strokeStyle = '#d9aa3f'; g.lineWidth = X(4); g.beginPath(); g.arc(X(450), X(450), X(392), Math.PI, 0); g.stroke();
  g.fillStyle = '#10161b'; g.fillRect(0, X(1560), W, H);
  const lane = g.createLinearGradient(X(775), 0, X(860), 0); lane.addColorStop(0, '#46525c'); lane.addColorStop(0.5, '#9aa7b1'); lane.addColorStop(1, '#46525c');
  g.fillStyle = lane; g.fillRect(X(775), X(450), X(85), H);
  g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 1; for (let y = X(450); y < H; y += 4) { g.beginPath(); g.moveTo(X(775), y); g.lineTo(X(860), y); g.stroke(); }
  g.fillStyle = '#e03a3a'; g.beginPath(); g.moveTo(X(817), X(1330)); g.lineTo(X(840), X(1370)); g.lineTo(X(794), X(1370)); g.fill();

  const v = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

export function woodTexture() {
  const W = 512, c = mk(W, W), g = c.getContext('2d'), R = rng(21);
  const bg = g.createLinearGradient(0, 0, 0, W); bg.addColorStop(0, '#6b3f22'); bg.addColorStop(1, '#4a2a16');
  g.fillStyle = bg; g.fillRect(0, 0, W, W);
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.5; g.drawImage(noiseCanvas(128, 128, 6, 5, 3), 0, 0, W, W); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 260; i++) {
    const y = R() * W, a = 0.05 + R() * 0.16; g.strokeStyle = R() < 0.5 ? `rgba(20,8,0,${a})` : `rgba(255,190,120,${a * 0.6})`; g.lineWidth = 0.6 + R() * 1.8;
    g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x / 70 + i) * 2.5); g.stroke();
  }
  return c;
}

export function backglassTexture() {
  const W = 1024, H = 640, c = mk(W, H), g = c.getContext('2d'), R = rng(5);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#070b24'); sky.addColorStop(0.5, '#2b1f66'); sky.addColorStop(0.8, '#1d6a78'); sky.addColorStop(1, '#0a3a3a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + R() * 0.7})`; g.beginPath(); g.arc(R() * W, R() * H * 0.55, R() * 1.6 + 0.3, 0, 7); g.fill(); }
  const mg = g.createRadialGradient(780, 150, 10, 780, 150, 220); mg.addColorStop(0, '#fff7d6'); mg.addColorStop(0.25, '#ffe9a0'); mg.addColorStop(0.26, 'rgba(255,233,160,0.25)'); mg.addColorStop(1, 'rgba(255,233,160,0)');
  g.fillStyle = mg; g.fillRect(0, 0, W, H);
  const hills = (base: number, amp: number, col: string, seed: number) => {
    const r = rng(seed); g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x / 110 + seed)) - r() * amp * 0.4);
    g.lineTo(W, H); g.fill();
  };
  hills(430, 70, '#173c4a', 1); hills(500, 60, '#0e2a33', 2);
  const tree = (x: number, base: number, h: number, col: string) => {
    g.fillStyle = col; for (let i = 0; i < 4; i++) { const w = h * (0.34 - i * 0.06), y = base - h * (0.18 + i * 0.22); g.beginPath(); g.moveTo(x - w, y + h * 0.2); g.lineTo(x, y - h * 0.18); g.lineTo(x + w, y + h * 0.2); g.fill(); }
    g.fillRect(x - 5, base - h * 0.1, 10, h * 0.12);
  };
  for (let i = 0; i < 14; i++) tree(30 + i * 75 + R() * 30, 520, 120 + R() * 110, i % 2 ? '#081c22' : '#0b2630');
  const mush = (x: number, y: number, s: number, col: string) => {
    g.fillStyle = '#e9dcc8'; g.fillRect(x - 7 * s, y, 14 * s, 55 * s);
    const rg = g.createRadialGradient(x, y - 10 * s, 5, x, y, 55 * s); rg.addColorStop(0, col); rg.addColorStop(1, '#4a1a58');
    g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, 60 * s, 38 * s, 0, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)'; for (const [dx, dy] of [[-25, -14], [10, -24], [32, -10], [-5, -8]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, 6 * s, 0, 7); g.fill(); }
  };
  mush(150, 470, 1.5, '#ff5fa8'); mush(870, 480, 1.2, '#ffb14a'); mush(60, 520, 0.8, '#7affc6');
  for (let i = 0; i < 70; i++) { const x = R() * W, y = 250 + R() * 300, rg = g.createRadialGradient(x, y, 0, x, y, 12); rg.addColorStop(0, 'rgba(255,245,150,1)'); rg.addColorStop(1, 'rgba(255,245,150,0)'); g.fillStyle = rg; g.fillRect(x - 12, y - 12, 24, 24); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 150px "Trebuchet MS", "Segoe UI", Arial, sans-serif'; g.shadowColor = '#ffb347'; g.shadowBlur = 40; g.fillStyle = '#fff1c4'; g.fillText('KRINKER', W / 2, 215);
  g.shadowColor = '#5fd8ff'; g.fillStyle = '#d8f6ff'; g.font = '800 92px "Trebuchet MS", Arial, sans-serif'; g.fillText('PINBALL', W / 2, 335);
  return c;
}

export function skyTexture() {
  const c = mk(16, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#070a18'); gr.addColorStop(0.5, '#10173a'); gr.addColorStop(1, '#1a1432'); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); return c;
}

export function brickTexture() {
  const W = 1024, H = 1024, c = mk(W, H), g = c.getContext('2d'), R = rng(33);
  g.fillStyle = '#2a1712'; g.fillRect(0, 0, W, H);
  const bh = 52, bw = 128;
  for (let row = 0; row * bh < H; row++) for (let col = -1; col * bw < W; col++) {
    const x = col * bw + (row % 2 ? bw / 2 : 0), y = row * bh, v = R();
    g.fillStyle = `rgb(${110 + v * 50},${52 + v * 26},${40 + v * 18})`; g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
    g.fillStyle = `rgba(0,0,0,${0.1 + R() * 0.2})`; g.fillRect(x + 3, y + bh - 12, bw - 6, 9);
  }
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.55; g.drawImage(noiseCanvas(256, 256, 8, 41, 4), 0, 0, W, H);
  return c;
}

export function floorTexture() {
  const W = 1024, H = 1024, c = mk(W, H), g = c.getContext('2d'), R = rng(55);
  const pw = W / 8;
  for (let i = 0; i < 8; i++) {
    const v = R(); g.fillStyle = `rgb(${96 + v * 40},${58 + v * 26},${34 + v * 16})`; g.fillRect(i * pw, 0, pw, H);
    for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(${R() < 0.5 ? '20,8,0' : '255,200,140'},${0.04 + R() * 0.1})`; g.lineWidth = 1 + R() * 2; const x = i * pw + R() * pw; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 8, H * 0.3, x - 8, H * 0.6, x + 4, H); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(i * pw, 0, 3, H);
  }
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.18; g.drawImage(noiseCanvas(256, 256, 5, 61, 3), 0, 0, W, H);
  return c;
}

/** Front of the cabinet: dark lacquer, golden frame, free-play coin door, start button. */
export function frontTexture() {
  const W = 1536, H = 256, c = mk(W, H), g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#16345a'); bg.addColorStop(1, '#0a1a33'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#e8b64a'; g.lineWidth = 6; g.strokeRect(14, 14, W - 28, H - 28);
  g.strokeStyle = 'rgba(255,235,170,0.5)'; g.lineWidth = 2; g.strokeRect(26, 26, W - 52, H - 52);
  // ornamental leaves
  g.fillStyle = 'rgba(120,230,180,0.18)';
  for (let i = 0; i < 18; i++) { const x = 70 + i * 82; g.beginPath(); g.ellipse(x, 52, 14, 34, 0.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 40, H - 52, 14, 34, -0.5, 0, 7); g.fill(); }
  // coin door
  const door = (x: number) => {
    g.fillStyle = '#0a0d14'; g.fillRect(x - 70, 58, 140, 140); g.strokeStyle = '#c8cfd8'; g.lineWidth = 5; g.strokeRect(x - 70, 58, 140, 140);
    g.fillStyle = '#e03a3a'; g.fillRect(x - 22, 82, 44, 64); g.fillStyle = '#fff'; g.font = '700 14px sans-serif'; g.textAlign = 'center'; g.fillText('FREE', x, 108); g.fillText('PLAY', x, 128);
    g.fillStyle = '#222'; g.fillRect(x - 6, 150, 12, 30);
  };
  door(150); door(1386);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 84px "Trebuchet MS", Arial, sans-serif'; g.shadowColor = '#ffb347'; g.shadowBlur = 22; g.fillStyle = '#ffe9a8'; g.fillText('KRINKER LABS', W / 2, 108);
  g.shadowBlur = 0; g.font = '600 28px "Trebuchet MS", Arial, sans-serif'; g.fillStyle = '#bff7ff'; g.fillText('F R E E   P I N B A L L', W / 2, 178);
  return c;
}
