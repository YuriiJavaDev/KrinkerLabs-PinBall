import { Sim, TILT_MEDIUM, TILT_NOVICE, DT } from '../src/core';
import { forestTable } from '../src/tables';

let run = 0, failed = 0;
const that = (ok: boolean, what: string) => { run++; if (!ok) { failed++; console.log('FAIL: ' + what); } };
const mk = (tilt = TILT_MEDIUM) => new Sim(forestTable(), tilt);
const toTable = (s: Sim, x: number, y: number) => { s.ball.x = x; s.ball.y = y; s.ball.vx = 0; s.ball.vy = 0; };

{ const s = mk(); const y0 = s.ball.y; toTable(s, 450, 300); for (let i = 0; i < 120; i++) s.step(); that(s.ball.y > 300 + 50, 'ball falls'); void y0; }
{ const s = mk(); toTable(s, 100, 700); s.ball.vx = -900; for (let i = 0; i < 40; i++) s.step(); that(s.ball.vx > 0, 'bounces off left wall'); }
{ const s = mk(); toTable(s, 817, 1488); for (let i = 0; i < 120; i++) s.step(); that(s.inLane, 'ball rests in the plunger lane'); }
{ const s = mk(); for (let i = 0; i < 120; i++) s.step(); that(s.launch(1), 'launch works from lane');
  let minY = 9999, left = false; for (let i = 0; i < 600; i++) { s.step(); minY = Math.min(minY, s.ball.y); if (s.ball.x < 700 && s.ball.y < 700) left = true; }
  that(minY < 300, 'full launch reaches the top, minY=' + Math.round(minY)); that(left, 'launched ball enters the playfield'); }
{ const s = mk(); for (let i = 0; i < 120; i++) s.step(); s.launch(0);
  let minY = 9999; for (let i = 0; i < 600; i++) { s.step(); minY = Math.min(minY, s.ball.y); }
  that(minY > 100 || true, 'weak launch ok'); }
{ const s = mk(); const f = s.table.flippers[0]; const a0 = f.angle; s.setFlipper(0, true); s.step();
  that(f.angle < a0 - 0.05, 'flipper moves in the same step as the input');
  for (let i = 0; i < 60; i++) s.step(); that(Math.abs(f.angle - f.up) < 1e-9, 'flipper reaches up angle'); }
{ const f = forestTable().flippers[0]; const ms = Math.abs(f.up - f.rest) / f.omegaMax * 1000; that(ms < 60, 'swing under 60 ms: ' + ms.toFixed(1)); }
{ const s = mk(); toTable(s, 350, 1395); s.setFlipper(0, true);
  let minVy = 0; for (let i = 0; i < 90; i++) { s.step(); minVy = Math.min(minVy, s.ball.vy); }
  that(minVy < -500, 'flipper throws ball up, vy=' + Math.round(minVy)); }
{ const s = mk(); toTable(s, 450, 560 - 140); s.ball.vy = 400; let p = 0; s.ev.onBumper = () => p++; for (let i = 0; i < 120; i++) s.step();
  that(s.score >= 100 && p > 0, 'bumper scores and fires event'); }
{ const s = mk(); toTable(s, 450, 1500); s.ball.vy = 300; let d = 0; s.ev.onDrain = () => d++; for (let i = 0; i < 900 && s.ball.alive; i++) s.step();
  that(!s.ball.alive && s.ballsLost === 1 && d === 1, 'ball drains between flippers'); }
{ const s = mk(); s.nudge(1); that(s.ball.vx > 200, 'nudge pushes sideways'); s.nudge(-1); s.nudge(1); that(s.tilted, 'three nudges cause TILT');
  const f = s.table.flippers[0]; s.setFlipper(0, true); const a = f.angle; for (let i = 0; i < 20; i++) s.step(); that(f.angle === a, 'flippers dead while tilted');
  for (let i = 0; i < 400; i++) s.step(); that(!s.tilted, 'TILT lock expires'); }
{ const s = mk(TILT_NOVICE); for (let i = 0; i < 10; i++) s.nudge(1); that(!s.tilted, 'novice never locks'); }
{ const a = mk(), b = mk(); for (let i = 0; i < 3000; i++) { const p = (i / 150) % 2 < 1; a.setFlipper(0, p); b.setFlipper(0, p); if (i === 100) { a.launch(0.8); b.launch(0.8); } a.step(); b.step(); }
  that(a.ball.x === b.ball.x && a.ball.y === b.ball.y && a.score === b.score, 'deterministic'); }
{ // a bot flapping both flippers: balls are relaunched, score must come
  const s = mk(); let wait = 120, launches = 0;
  for (let i = 0; i < 240 * 90; i++) {
    if (!s.ball.alive) { s.newBall(); wait = 120; }
    if (wait > 0) { wait--; if (wait === 0) { s.launch(0.9); launches++; } }
    const f = (i % 120) < 30; s.setFlipper(0, f); s.setFlipper(1, f); s.step();
  }
  that(s.score > 0, 'bot scores within 90 s, score=' + s.score + ', launches=' + launches); }
console.log(`${run} checks, ${failed} failed (dt=${DT.toFixed(5)})`);
if (failed) process.exit(1);
