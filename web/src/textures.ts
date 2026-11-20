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

export function playfieldTexture() {
  const W = 1024, H = Math.round(W * FIELD_H / FIELD_W), k = W / FIELD_W;
  const c = mk(W, H), g = c.getContext('2d'), R = rng(7);
  const X = (v: number) => v * k;

  let grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0e4440'); grad.addColorStop(0.45, '#1a6a3c'); grad.addColorStop(1, '#0c3a40');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);

  const n1 = noiseCanvas(256, 455, 40, 3), n2 = noiseCanvas(256, 455, 9, 11, 3);
  g.imageSmoothingEnabled = true;
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.75; g.drawImage(n1, 0, 0, W, H);
  g.globalAlpha = 0.35; g.drawImage(n2, 0, 0, W, H);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;

  // glowing glades
  for (const [x, y, rad, col] of [[200, 300, 260, '80,255,170'], [650, 700, 300, '80,200,255'], [300, 1000, 280, '255,230,120'], [640, 1180, 240, '180,120,255']]) {
    const rg = g.createRadialGradient(X(x), X(y), 0, X(x), X(y), X(rad));
    rg.addColorStop(0, `rgba(${col},0.22)`); rg.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
  }

  // the stream
  const stream = (lw: number, col: string, blur: number) => {
    g.save(); g.filter = `blur(${blur}px)`; g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = col; g.lineWidth = X(lw); g.beginPath();
    g.moveTo(X(690), X(120)); g.bezierCurveTo(X(640), X(380), X(330), X(380), X(400), X(760));
    g.bezierCurveTo(X(450), X(1000), X(330), X(1120), X(450), X(1640)); g.stroke(); g.restore();
  };
  stream(150, 'rgba(10,60,90,0.55)', 20); stream(105, 'rgba(30,130,190,0.65)', 10); stream(48, 'rgba(150,230,255,0.45)', 8);

  // flowers, grass, sparkles
  for (let i = 0; i < 380; i++) {
    const x = R() * W, y = R() * H, s = 1 + R() * 2.6, t = R();
    g.globalAlpha = 0.18 + R() * 0.4;
    g.fillStyle = t < 0.3 ? '#ffe9a0' : t < 0.55 ? '#ff9ad0' : t < 0.8 ? '#bff7ff' : '#a6ff9c';
    g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  g.strokeStyle = 'rgba(160,255,160,0.18)'; g.lineWidth = 1.4;
  for (let i = 0; i < 2600; i++) {
    const x = R() * W, y = R() * H, l = 5 + R() * 14, a = -Math.PI / 2 + (R() - 0.5) * 0.9;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }

  // dark shadow pools under the obstacles
  const pool = (x: number, y: number, r: number) => {
    const rg = g.createRadialGradient(X(x), X(y), X(r * 0.5), X(x), X(y), X(r * 1.9));
    rg.addColorStop(0, 'rgba(0,0,0,0.45)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(X(x), X(y), X(r * 1.9), 0, 7); g.fill();
  };
  for (const [x, y, r] of [[330, 560, 52], [560, 520, 52], [450, 730, 52], [170, 820, 42], [690, 830, 42]]) pool(x, y, r);

  // insert lights
  const insert = (x: number, y: number, r: number, col: string) => {
    const rg = g.createRadialGradient(X(x), X(y), 0, X(x), X(y), X(r * 2.4));
    rg.addColorStop(0, col + 'aa'); rg.addColorStop(1, col + '00'); g.fillStyle = rg;
    g.beginPath(); g.arc(X(x), X(y), X(r * 2.4), 0, 7); g.fill();
    g.fillStyle = col; g.strokeStyle = '#fff6'; g.lineWidth = 2;
    g.beginPath(); g.arc(X(x), X(y), X(r), 0, 7); g.fill(); g.stroke();
  };
  const star = (x: number, y: number, r: number, col: string) => {
    g.save(); g.translate(X(x), X(y)); g.fillStyle = col; g.strokeStyle = '#fff8'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? X(r) * 0.45 : X(r); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath(); g.fill(); g.stroke(); g.restore();
  };
  for (let i = 0; i < 5; i++) star(230 + i * 105, 980 + (i % 2 ? 36 : 0) - Math.abs(i - 2) * 0, 30, i % 2 ? '#ffd34d' : '#ff7ab6');
  for (const [x, y, col] of [[150, 190, '#7affc6'], [300, 120, '#ffd34d'], [450, 95, '#ff7ab6'], [600, 120, '#ffd34d'], [750, 190, '#7affc6']]) insert(x, y, 20, col);
  for (const [x, y, col] of [[330, 560, '#ff5fa8'], [560, 520, '#ff5fa8'], [450, 730, '#ffb14a']]) {
    g.strokeStyle = col; g.lineWidth = X(5); g.globalAlpha = 0.6; g.beginPath(); g.arc(X(x), X(y), X(78), 0, 7); g.stroke(); g.globalAlpha = 1;
  }
  // chevrons guiding to the inlanes
  g.strokeStyle = '#ffd34d'; g.lineWidth = X(9); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [x, dx] of [[130, 1], [770, -1]]) for (let i = 0; i < 3; i++) {
    const y = 1000 + i * 40; g.globalAlpha = 0.9 - i * 0.2;
    g.beginPath(); g.moveTo(X(x - 22), X(y)); g.lineTo(X(x), X(y + 20)); g.lineTo(X(x + 22), X(y)); g.stroke();
  }
  g.globalAlpha = 1;

  // brand
  g.save(); g.translate(X(450), X(1135)); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${X(64)}px "Trebuchet MS", "Segoe UI", Arial, sans-serif`;
  g.shadowColor = '#ffcf5a'; g.shadowBlur = X(24); g.fillStyle = '#ffe9a8'; g.fillText('KRINKER LABS', 0, 0);
  g.shadowBlur = 0; g.font = `600 ${X(26)}px "Trebuchet MS", Arial, sans-serif`; g.fillStyle = '#bff7ff';
  g.fillText('· FAIRY FOREST ·', 0, X(52)); g.restore();

  // outside of the top arc: dark lacquered wood; the plunger lane: brushed metal
  g.save(); g.beginPath(); g.rect(0, 0, W, X(450)); g.clip(); g.fillStyle = '#120c08'; g.beginPath(); g.rect(0, 0, W, X(450)); g.arc(X(450), X(450), X(410), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore();
  g.fillStyle = '#10161b'; g.fillRect(0, X(1560), W, H);
  const lane = g.createLinearGradient(X(775), 0, X(860), 0);
  lane.addColorStop(0, '#46525c'); lane.addColorStop(0.5, '#9aa7b1'); lane.addColorStop(1, '#46525c');
  g.fillStyle = lane; g.fillRect(X(775), X(450), X(85), H);
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1;
  for (let y = X(450); y < H; y += 6) { g.beginPath(); g.moveTo(X(775), y); g.lineTo(X(860), y); g.stroke(); }
  g.fillStyle = '#e03a3a'; g.beginPath(); g.moveTo(X(817), X(1330)); g.lineTo(X(840), X(1370)); g.lineTo(X(794), X(1370)); g.fill();

  // vignette
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
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
