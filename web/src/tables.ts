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
  wall(40, 450, 40, 1700);                 // left wall; the outlane runs down to the drain
  wall(860, 450, 860, 1540);               // outer wall of the plunger lane
  wall(775, 560, 775, 1700);               // inner wall of the plunger lane
  wall(775, 1540, 860, 1540, 0.1);         // lane floor
  // upper right: guide that sends the launched ball into the arc, not back down
  wall(775, 560, 800, 470, 0.3);
  // inlane guides
  wall(110, 1130, 110, 1230, 0.3);
  wall(110, 1230, 270, 1395, 0.3);
  wall(705, 1130, 705, 1230, 0.3);
  wall(705, 1230, 645, 1395, 0.3);
  // upper deflectors: turn the fast ball coming down the side walls back into the playfield
  wall(40, 760, 150, 870, 0.55); wall(775, 760, 665, 870, 0.55);
  // slingshots (kicking walls)
  wall(150, 1040, 150, 1190, 0.9, 380); wall(150, 1190, 250, 1260, 0.9, 380); wall(150, 1040, 250, 1260, 0.9, 380);
  wall(665, 1040, 665, 1190, 0.9, 380); wall(665, 1190, 565, 1260, 0.9, 380); wall(665, 1040, 565, 1260, 0.9, 380);

  const rest = 0.45, up = -0.5, omega = 24;
  t.flippers.push(new Flipper(305, 1432, 125, 14, rest, up, omega));
  t.flippers.push(new Flipper(610, 1432, 125, 14, Math.PI - rest, Math.PI - up, omega));

  t.bumpers.push({ x: 330, y: 560, r: 52, kick: 420, points: 100, flash: 0, kind: 'pop' });
  t.bumpers.push({ x: 560, y: 520, r: 52, kick: 420, points: 100, flash: 0, kind: 'pop' });
  t.bumpers.push({ x: 450, y: 730, r: 52, kick: 420, points: 150, flash: 0, kind: 'pop' });
  t.bumpers.push({ x: 170, y: 820, r: 42, kick: 0, points: 10, flash: 0, kind: 'stone' });
  t.bumpers.push({ x: 690, y: 830, r: 42, kick: 0, points: 10, flash: 0, kind: 'stone' });
  void W;
  return t;
}
