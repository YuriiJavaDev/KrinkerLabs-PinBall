// Pure game core. No DOM, no rendering, no clocks, no randomness: deterministic, testable, bot-friendly.
// Field coordinates: x right, y DOWN, virtual field 900 x 1600.

export const FIELD_W = 900;
export const FIELD_H = 1600;
export const DT = 1 / 240;
const SUBSTEPS = 4;
const MAX_SPEED = 3200;

export interface Segment { ax: number; ay: number; bx: number; by: number; e: number; kick?: number }
export interface Bumper { x: number; y: number; r: number; kick: number; points: number; flash: number; kind: 'pop' | 'stone' }
export interface TiltConfig { nudge: number; perNudge: number; limit: number; decay: number; lock: number }

export const TILT_NOVICE: TiltConfig = { nudge: 260, perNudge: 0.25, limit: 1, decay: 0.35, lock: 0 };
export const TILT_MEDIUM: TiltConfig = { nudge: 260, perNudge: 0.34, limit: 1, decay: 0.30, lock: 1.2 };
export const TILT_GURU: TiltConfig = { nudge: 240, perNudge: 0.45, limit: 1, decay: 0.25, lock: 2.5 };

export class Flipper {
  angle: number; omega = 0; pressed = false; power = 1; sticky = false;
  constructor(public px: number, public py: number, public length: number, public thickness: number,
              public rest: number, public up: number, public omegaMax: number) { this.angle = rest; }
  get tipX() { return this.px + Math.cos(this.angle) * this.length; }
  get tipY() { return this.py + Math.sin(this.angle) * this.length; }
  step(dt: number, enabled: boolean) {
    const target = this.pressed && enabled ? this.up : this.rest;
    const diff = target - this.angle, maxMove = this.omegaMax * dt;
    const move = Math.abs(diff) <= maxMove ? diff : Math.sign(diff) * maxMove;
    this.angle += move; this.omega = move / dt;
  }
}

export class Table {
  walls: Segment[] = [];
  bumpers: Bumper[] = [];
  flippers: Flipper[] = [];
  gravity = 1500;
  ballRadius = 22;
  spawnX = 817; spawnY = 1488;
  drainY = FIELD_H + 60;
}

export class Ball {
  x: number; y: number; vx = 0; vy = 0; alive = true;
  constructor(x: number, y: number, public r: number) { this.x = x; this.y = y; }
  get speed() { return Math.hypot(this.vx, this.vy); }
}

export interface SimEvents {
  onBumper?(b: Bumper, speed: number): void;
  onWall?(speed: number): void;
  onFlipper?(i: number, speed: number): void;
  onSling?(speed: number): void;
  onDrain?(): void;
  onTilt?(): void;
  onLaunch?(power: number): void;
}

export class Sim {
  ball: Ball;
  score = 0; ballsLost = 0; tiltMeter = 0; lockLeft = 0; warned = false; steps = 0;
  ev: SimEvents = {};
  constructor(public table: Table, public tilt: TiltConfig) {
    this.ball = new Ball(table.spawnX, table.spawnY, table.ballRadius);
  }
  get tilted() { return this.lockLeft > 0; }
  setFlipper(i: number, pressed: boolean) { this.table.flippers[i].pressed = pressed; }

  /** Is the ball resting in the plunger lane, ready to be launched? */
  get inLane() { return this.ball.alive && this.ball.x > 780 && this.ball.y > 1380 && this.ball.speed < 60; }
  /** charge 0..1 */
  launch(charge: number) {
    if (!this.inLane) return false;
    this.ball.vy = -(1500 + 900 * Math.max(0, Math.min(1, charge)));
    this.ev.onLaunch?.(charge);
    return true;
  }
  /** Start a new game on this table. */
  reset() { this.score = 0; this.ballsLost = 0; this.tiltMeter = 0; this.lockLeft = 0; this.warned = false; this.newBall(); }
  /** Put a fresh ball in the plunger lane. */
  newBall() {
    const t = this.table;
    this.ball = new Ball(t.spawnX, t.spawnY, t.ballRadius);
  }

  nudge(dir: number) {
    if (this.tilted) return;
    this.ball.vx += Math.sign(dir) * this.tilt.nudge;
    this.tiltMeter += this.tilt.perNudge;
    if (this.tiltMeter >= this.tilt.limit) {
      this.lockLeft = this.tilt.lock; this.tiltMeter = 0; this.ev.onTilt?.();
    } else if (this.tiltMeter >= this.tilt.limit * 0.75) this.warned = true;
  }

  step() {
    this.steps++;
    const enabled = !this.tilted;
    for (const f of this.table.flippers) f.step(DT, enabled);
    if (this.lockLeft > 0) this.lockLeft = Math.max(0, this.lockLeft - DT);
    this.tiltMeter = Math.max(0, this.tiltMeter - this.tilt.decay * DT);
    for (const b of this.table.bumpers) b.flash = Math.max(0, b.flash - DT);
    const ball = this.ball;
    if (!ball.alive) return;
    const h = DT / SUBSTEPS;
    for (let i = 0; i < SUBSTEPS; i++) {
      ball.vy += this.table.gravity * h;
      ball.x += ball.vx * h; ball.y += ball.vy * h;
      this.collide();
      const s = ball.speed;
      if (s > MAX_SPEED) { ball.vx *= MAX_SPEED / s; ball.vy *= MAX_SPEED / s; }
    }
    if (ball.y > this.table.drainY) { ball.alive = false; this.ballsLost++; this.ev.onDrain?.(); }
  }

  private collide() {
    const t = this.table, ball = this.ball;
    for (const w of t.walls) this.capsule(w.ax, w.ay, w.bx, w.by, 0, w.e, 0, 1, null, w.kick ?? 0);
    t.flippers.forEach((f, i) => this.capsule(f.px, f.py, f.tipX, f.tipY, f.thickness, 0.35, f.omega, f.power, f, 0, i));
    for (const b of t.bumpers) {
      const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy), min = ball.r + b.r;
      if (d < min && d > 1e-9) {
        const nx = dx / d, ny = dy / d;
        ball.x = b.x + nx * min; ball.y = b.y + ny * min;
        const vn = ball.vx * nx + ball.vy * ny;
        if (vn < 0) { ball.vx -= 2 * vn * nx; ball.vy -= 2 * vn * ny; }
        ball.vx += nx * b.kick; ball.vy += ny * b.kick;
        this.score += b.points; b.flash = 0.18;
        this.ev.onBumper?.(b, ball.speed);
      }
    }
  }

  private capsule(ax: number, ay: number, bx: number, by: number, thick: number, e: number,
                  omega: number, power: number, flip: Flipper | null, kick: number, idx = -1) {
    const ball = this.ball;
    const abx = bx - ax, aby = by - ay, len2 = abx * abx + aby * aby;
    let t = len2 === 0 ? 0 : ((ball.x - ax) * abx + (ball.y - ay) * aby) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + abx * t, cy = ay + aby * t;
    const dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy), min = ball.r + thick;
    if (d >= min || d < 1e-9) return;
    const nx = dx / d, ny = dy / d;
    ball.x = cx + nx * min; ball.y = cy + ny * min;
    const rx = cx - ax, ry = cy - ay;
    const svx = -omega * ry * power, svy = omega * rx * power;
    const rvn = (ball.vx - svx) * nx + (ball.vy - svy) * ny;
    if (rvn < 0) {
      const sticky = flip?.sticky ?? false;
      const k = sticky ? 0 : e;
      ball.vx -= (1 + k) * rvn * nx; ball.vy -= (1 + k) * rvn * ny;
      if (sticky) { ball.vx *= 0.8; ball.vy *= 0.8; }
      if (kick) { ball.vx += nx * kick; ball.vy += ny * kick; this.score += 10; this.ev.onSling?.(-rvn); }
      else if (flip) this.ev.onFlipper?.(idx, -rvn);
      else this.ev.onWall?.(-rvn);
    }
  }
}
