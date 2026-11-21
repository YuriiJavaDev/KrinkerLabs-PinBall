import { Table, Flipper, FIELD_W } from './core';

/** World 1, table 1: "Fairy forest" — a first, simple table. */
export function forestTable(): Table {
  const t = new Table();
  const W = FIELD_W;
  const wall = (ax: number, ay: number, bx: number, by: number, e = 0.4, kick = 0) =>
    t.walls.push({ ax, ay, bx, by, e, kick });

  // top arc (centre 450,450, radius 410) from the left wall over to the right wall
  const cx = 450, cy = 450, R = 410, N = 28;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI + (Math.PI * i) / N, a1 = Math.PI + (Math.PI * (i + 1)) / N;
    wall(cx + R * Math.cos(a0), cy + R * Math.sin(a0), cx + R * Math.cos(a1), cy + R * Math.sin(a1), 0.45);
  }
  wall(40, 450, 40, 1250);                 // left wall, then one smooth funnel down to the left flipper
  wall(40, 1250, 300, 1432, 0.3);
  wall(775, 1250, 618, 1432, 0.3);         // right funnel, joined to the plunger-lane wall
  wall(860, 450, 860, 1540);               // outer wall of the plunger lane
  wall(775, 560, 775, 1540);               // inner wall of the plunger lane
  wall(775, 1540, 860, 1540, 0.1);         // lane floor
  // upper right: guide that sends the launched ball into the arc, not back down
  wall(775, 560, 800, 470, 0.3);
  // upper deflectors: turn the fast ball coming down the side walls back into the playfield
  wall(40, 780, 140, 860, 0.55); wall(775, 780, 690, 855, 0.55);
  // top rollover lanes (dividers start below the launch path along the arc)
  for (const x of [300, 400, 500, 600]) wall(x, 135, x, 235, 0.3);
  // slingshots
  wall(150, 1040, 150, 1190, 0.9, 380); wall(150, 1190, 250, 1260, 0.9, 380); wall(150, 1040, 250, 1260, 0.9, 380);
  wall(665, 1040, 665, 1190, 0.9, 380); wall(665, 1190, 565, 1260, 0.9, 380); wall(665, 1040, 565, 1260, 0.9, 380);

  const rest = 0.45, up = -0.5, omega = 24;
  t.flippers.push(new Flipper(305, 1432, 125, 14, rest, up, omega));
  t.flippers.push(new Flipper(610, 1432, 125, 14, Math.PI - rest, Math.PI - up, omega));

  t.bumpers.push({ x: 340, y: 520, r: 52, kick: 420, points: 100, flash: 0, kind: 'pop' });
  t.bumpers.push({ x: 560, y: 500, r: 52, kick: 420, points: 100, flash: 0, kind: 'pop' });
  t.bumpers.push({ x: 450, y: 650, r: 52, kick: 420, points: 150, flash: 0, kind: 'pop' });
  t.bumpers.push({ x: 150, y: 640, r: 38, kick: 0, points: 10, flash: 0, kind: 'stone' });
  t.bumpers.push({ x: 710, y: 640, r: 38, kick: 0, points: 10, flash: 0, kind: 'stone' });

  for (const x of [350, 450, 550]) t.sensors.push({ x, y: 185, r: 30, kind: 'lane', lit: false, angle: 0, omega: 0, flash: 0, spinAcc: 0, awarded: 0 });
  t.sensors.push({ x: 722, y: 960, r: 42, kind: 'spinner', lit: false, angle: 0, omega: 0, flash: 0, spinAcc: 0, awarded: 0 });
  for (const y of [830, 890, 950]) t.targets.push({ ax: 235, ay: y - 26, bx: 235, by: y + 26, thick: 7, kind: 'drop', down: false, flash: 0, bank: 0 });
  for (const [x, y0] of [[752, 560], [752, 690], [68, 540]]) t.targets.push({ ax: x, ay: y0, bx: x, by: y0 + 60, thick: 7, kind: 'stand', down: false, flash: 0, bank: -1 });
  t.saucers.push({ x: 470, y: 930, r: 30, hold: 0, count: 0, glow: 0 });
  void W;
  return t;
}
