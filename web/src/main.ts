import { Sim, DT, TILT_MEDIUM } from './core';
import { forestTable } from './tables';
import { View } from './scene3d';
import { Sound } from './audio';

const L = (navigator.language || 'en').toLowerCase().startsWith('ru') || /^(uk|be)/.test(navigator.language || '') ? 'ru' : 'en';
const T = {
  ru: { score: 'Очки', world: 'Мир 1 · Сказочный лес', play: 'Играть', again: 'Ещё раз', resume: 'Продолжить', over: 'Игра окончена', pause: 'Пауза',
        keys: '<kbd>Z</kbd> / <kbd>←</kbd> левая лопатка &nbsp; <kbd>/</kbd> / <kbd>→</kbd> правая<br><kbd>Пробел</kbd> удерживать и отпустить — запуск шара<br><kbd>Shift</kbd>+<kbd>←</kbd>/<kbd>→</kbd> толчок стола (не частите — будет TILT) &nbsp; <kbd>P</kbd> пауза',
        hintLane: 'Удерживайте пробел и отпустите, чтобы запустить шар', hintLaneTouch: 'Удерживайте ▲ и отпустите, чтобы запустить шар', tilt: 'TILT' },
  en: { score: 'Score', world: 'World 1 · Fairy Forest', play: 'Play', again: 'Play again', resume: 'Resume', over: 'Game over', pause: 'Paused',
        keys: '<kbd>Z</kbd> / <kbd>←</kbd> left flipper &nbsp; <kbd>/</kbd> / <kbd>→</kbd> right<br>Hold <kbd>Space</kbd>, release to launch<br><kbd>Shift</kbd>+<kbd>←</kbd>/<kbd>→</kbd> nudge the table (too often = TILT) &nbsp; <kbd>P</kbd> pause',
        hintLane: 'Hold Space and release to launch the ball', hintLaneTouch: 'Hold ▲ and release to launch the ball', tilt: 'TILT' },
}[L];

const $ = (id: string) => document.getElementById(id)!;
let toastTimer = 0;
function toast(msg: string) { const el = $('toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastTimer); toastTimer = window.setTimeout(() => el.classList.remove('on'), 1600); }
const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (touch) document.body.classList.add('touch');
$('tScore').textContent = T.score; $('tWorld').textContent = T.world; $('play').textContent = T.play; $('again').textContent = T.again;
$('resume').textContent = T.resume; $('tOver').textContent = T.over; $('tPause').textContent = T.pause; $('keys').innerHTML = touch ? '' : T.keys;
$('banner').textContent = T.tilt;

const sim = new Sim(forestTable(), TILT_MEDIUM);
const sound = new Sound();
const view = new View($('c') as HTMLCanvasElement, sim);
type State = 'menu' | 'ready' | 'playing' | 'paused' | 'over';
let state: State = 'menu', charge = 0, charging = false;
const MAX_BALLS = 3;

sim.ev.onBumper = (b) => { const i = sim.table.bumpers.indexOf(b); if (b.kind === 'pop') sound.bumper(i); else sound.stone(sim.ball.speed); };
sim.ev.onWall = (v) => sound.wall(v);
sim.ev.onSling = () => sound.sling();
sim.ev.onFlipper = (_i, v) => { if (v > 400) sound.wall(v * 0.6); };
sim.ev.onLaunch = (p) => { sound.launch(p); state = 'playing'; };
sim.ev.onTarget = (t) => sound.target(t.kind === 'drop');
sim.ev.onBank = () => { sound.bank(); toast(L === 'ru' ? 'БОНУС: ВСЕ МИШЕНИ!' : 'DROP BANK BONUS!'); };
sim.ev.onLane = (done) => { sound.lane(done); if (done) toast(L === 'ru' ? 'МНОЖИТЕЛЬ ×' + sim.mult : 'MULTIPLIER ×' + sim.mult); };
sim.ev.onSpin = () => sound.spin();
sim.ev.onSaucer = (e) => { sound.saucer(e); if (!e) toast(L === 'ru' ? 'ПРУД +1000' : 'POND +1000'); };
sim.ev.onSave = () => { sound.save(); toast(L === 'ru' ? 'ШАР СПАСЁН!' : 'BALL SAVED!'); state = 'ready'; };
sim.ev.onTilt = () => { sound.tilt(); view.nudgeShake(0); };
sim.ev.onDrain = () => {
  sound.drain();
  if (sim.ballsLost >= MAX_BALLS) { state = 'over'; sound.over(); $('finalScore').textContent = String(sim.score).padStart(7, '0'); setTimeout(() => $('over').classList.remove('hidden'), 700); }
  else setTimeout(() => { if (state !== 'over') { sim.newBall(); state = 'ready'; } }, 900);
};

function startGame() {
  sound.unlock(); sound.start(); sim.reset(); state = 'ready';
  $('menu').classList.add('hidden'); $('over').classList.add('hidden'); $('pause').classList.add('hidden');
}
function setPause(p: boolean) {
  if (p && (state === 'playing' || state === 'ready')) { prev = state; state = 'paused'; $('pause').classList.remove('hidden'); }
  else if (!p && state === 'paused') { state = prev; $('pause').classList.add('hidden'); }
}
let prev: State = 'ready';

const flip = (i: number, on: boolean) => {
  if (state !== 'playing' && state !== 'ready') return;
  const f = sim.table.flippers[i]; if (f.pressed === on) return; sim.setFlipper(i, on); if (!sim.tilted) sound.flipper(on);
};
const nudge = (d: number) => { if (state === 'playing') { sim.nudge(d); view.nudgeShake(d); sound.wall(1500); } };
const chargeOn = (on: boolean) => {
  if (state !== 'ready') return;
  if (on) { charging = true; }
  else if (charging) { charging = false; sim.launch(charge); charge = 0; }
};

addEventListener('keydown', (e) => {
  if (e.repeat) { if (e.code === 'Space') e.preventDefault(); return; }
  const k = e.code;
  if (state === 'menu' && (k === 'Space' || k === 'Enter')) { startGame(); e.preventDefault(); return; }
  if (state === 'over' && (k === 'Space' || k === 'Enter')) { startGame(); e.preventDefault(); return; }
  if (k === 'KeyP' || k === 'Escape') { setPause(state !== 'paused'); return; }
  if (k === 'KeyM') { sound.setMuted(!sound.muted); $('bSound').style.opacity = sound.muted ? '.4' : '1'; return; }
  if (e.shiftKey && (k === 'ArrowLeft' || k === 'ArrowRight')) { nudge(k === 'ArrowLeft' ? -1 : 1); e.preventDefault(); return; }
  if (k === 'KeyZ' || k === 'ArrowLeft') flip(0, true);
  else if (k === 'Slash' || k === 'ArrowRight' || k === 'KeyM') flip(1, true);
  else if (k === 'Space') { chargeOn(true); e.preventDefault(); }
});
addEventListener('keyup', (e) => {
  const k = e.code;
  if (k === 'KeyZ' || k === 'ArrowLeft') flip(0, false);
  else if (k === 'Slash' || k === 'ArrowRight') flip(1, false);
  else if (k === 'Space') chargeOn(false);
});
const hold = (id: string, down: () => void, up: () => void) => {
  const el = $(id);
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); sound.unlock(); el.classList.add('on'); down(); });
  const end = (e: Event) => { e.preventDefault(); el.classList.remove('on'); up(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('pointerleave', end);
};
hold('pl', () => flip(0, true), () => flip(0, false));
hold('pr', () => flip(1, true), () => flip(1, false));
hold('pp', () => chargeOn(true), () => chargeOn(false));
hold('nl', () => nudge(-1), () => {}); hold('nr', () => nudge(1), () => {});
$('play').addEventListener('click', startGame); $('again').addEventListener('click', startGame);
$('resume').addEventListener('click', () => setPause(false));
$('bPause').addEventListener('click', () => setPause(state !== 'paused'));
$('bSound').addEventListener('click', () => { sound.unlock(); sound.setMuted(!sound.muted); $('bSound').style.opacity = sound.muted ? '.4' : '1'; });
addEventListener('resize', () => view.resize());
document.addEventListener('visibilitychange', () => { if (document.hidden) setPause(true); });

// automatic play for the title screen and for tests (?demo)
const demo = new URLSearchParams(location.search).has('demo');
let botT = 0, laneT = 0;
function bot() {
  botT += DT;
  if (state === 'ready' && botT > 1.2) { sim.launch(0.85 + Math.random() * 0.15); botT = 0; return; }
  if (state !== 'playing') return;
  const b = sim.ball; const f0 = sim.table.flippers[0], f1 = sim.table.flippers[1];
  sim.setFlipper(0, b.y > 1300 && b.x < 450 && b.x > f0.px - 40 && b.vy > -200);
  sim.setFlipper(1, b.y > 1300 && b.x >= 450 && b.x < f1.px + 40 && b.vy > -200);
}

// HUD
const ballsEl = $('balls'), scoreEl = $('score'), tiltEl = $('tilt').firstElementChild as HTMLElement, bannerEl = $('banner'), hintEl = $('hint'), chargeEl = $('charge'), chargeB = chargeEl.firstElementChild as HTMLElement;
ballsEl.innerHTML = '<i></i><i></i><i></i>';
let last = performance.now(), acc = 0;
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (demo || state === 'menu') { if (demo && state === 'menu') { sim.reset(); state = 'ready'; $('menu').classList.add('hidden'); } }
  if (state === 'ready' || state === 'playing') {
    if (charging) charge = Math.min(1, charge + dt / 0.9);
    acc += dt; let n = 0;
    while (acc >= DT && n++ < 40) {
      if (demo) bot(); sim.step(); acc -= DT;
      // a weak launch rolls back into the lane: the ball is ready to be launched again
      if (state === 'playing' && sim.inLane) { laneT += DT; if (laneT > 0.35) { state = 'ready'; laneT = 0; } } else laneT = 0;
    }
  } else if (state === 'menu') { /* idle; show the table behind the menu */ }
  scoreEl.textContent = String(sim.score).padStart(7, '0'); $('mult').textContent = sim.mult > 1 ? '×' + sim.mult : '';
  [...ballsEl.children].forEach((c, i) => c.classList.toggle('gone', i < sim.ballsLost));
  tiltEl.style.width = Math.min(100, sim.tiltMeter * 100) + '%';
  bannerEl.classList.toggle('on', sim.tilted);
  hintEl.textContent = state === 'ready' && !demo ? (touch ? T.hintLaneTouch : T.hintLane) : '';
  chargeEl.style.display = state === 'ready' && charge > 0 ? 'block' : 'none'; chargeB.style.height = charge * 100 + '%';
  view.render(dt, state === 'ready' ? charge : 0);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
$('loading').classList.add('hidden');
(window as any).__pb = { sim, view, startGame, advance(sec: number, withBot = true) { if (state === 'menu') { sim.reset(); state = 'ready'; $('menu').classList.add('hidden'); } for (let i = 0; i < sec / DT; i++) { if (withBot) bot(); sim.step(); } }, get state() { return state; } };
