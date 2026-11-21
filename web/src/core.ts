// Pure game core. No DOM, no rendering, no clocks, no randomness: deterministic, testable, bot-friendly.
// Field coordinates: x right, y DOWN, virtual field 900 x 1600.

export const FIELD_W = 900;
export const FIELD_H = 1600;
export const DT = 1 / 240;
const SUBSTEPS = 4;
const MAX_SPEED = 3200;

export interface Segment { ax: number; ay: number; bx: number; by: number; e: number; kick?: number }
export interface Bumper { x: number; y: number; r: number; kick: number; points: number; flash: number; kind: 'pop' | 'stone' }
/** Touch-only trigger: rollover lane or spinner. The ball passes through. */
export interface Sensor { x: number; y: number; r: number; kind: 'lane' | 'spinner'; lit: boolean; angle: number; omega: number; flash: number; spinAcc: number; awarded: number }
/** Standing target (always there, scores) or drop target (goes down when hit, the bank resets when all are down). */
export interface Target { ax: number; ay: number; bx: number; by: number; thick: number; kind: 'drop' | 'stand'; down: boolean; flash: number; bank: number }
/** A hole that catches the ball for a moment and kicks it back into play. */
export interface Saucer { x: number; y: number; r: number; hold: number; count: number; glow: number }
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
  sensors: Sensor[] = [];
  targets: Target[] = [];
  saucers: Saucer[] = [];
  flippers: Flipper[] = [];
  gravity = 1500;
  ballRadius = 22;
  spawnX = 817; spawnY = 1488;
  drainY = FIELD_H + 60;
}

export class Ball {
  x: number; y: number; vx = 0; vy = 0; alive = true; held = false;
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
  onTarget?(t: Target): void;
  onBank?(): void;
  onLane?(allDone: boolean): void;
  onSpin?(): void;
  onSaucer?(eject: boolean): void;
  onSave?(): void;
}

export class Sim {
  ball: Ball;
  score = 0; ballsLost = 0; tiltMeter = 0; lockLeft = 0; warned = false; steps = 0;
  mult = 1; hits = 0; saverLeft = 0; bankReset = 0;
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
    this.saverLeft = 9;
    this.ev.onLaunch?.(charge);
    return true;
  }
  /** Start a new game on this table. */
  reset() { this.score = 0; this.ballsLost = 0; this.tiltMeter = 0; this.lockLeft = 0; this.warned = false; this.mult = 1; this.hits = 0; this.saverLeft = 0; this.resetObjects(); this.newBall(); }
  private resetObjects() { for (const t of this.table.targets) { t.down = false; t.flash = 0; } for (const n of this.table.sensors) { n.lit = false; n.omega = 0; n.spinAcc = 0; n.awarded = 0; } for (const u of this.table.saucers) u.hold = 0; }
  private add(points: number) { this.score += points * this.mult; }
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
    if (this.saverLeft > 0) this.saverLeft = Math.max(0, this.saverLeft - DT);
    for (const t of this.table.targets) t.flash = Math.max(0, t.flash - DT);
    for (const n of this.table.sensors) { n.flash = Math.max(0, n.flash - DT); if (n.kind === 'spinner') { n.angle += n.omega * DT; n.spinAcc += Math.abs(n.omega * DT); n.omega *= 1 - 1.6 * DT; if (Math.abs(n.omega) < 0.3) n.omega = 0; } }
    for (const u of this.table.saucers) u.glow = Math.max(0, u.glow - DT);
    if (this.bankReset > 0) { this.bankReset -= DT; if (this.bankReset <= 0) for (const t of this.table.targets) if (t.kind === 'drop') t.down = false; }
    const ball = this.ball;
    if (!ball.alive) return;
    if (ball.held) { this.holdStep(); return; }
    const h = DT / SUBSTEPS;
    for (let i = 0; i < SUBSTEPS; i++) {
      ball.vy += this.table.gravity * h;
      ball.x += ball.vx * h; ball.y += ball.vy * h;
      this.collide();
      const s = ball.speed;
      if (s > MAX_SPEED) { ball.vx *= MAX_SPEED / s; ball.vy *= MAX_SPEED / s; }
    }
    this.sensorsStep(); this.saucerStep();
    if (ball.y > this.table.drainY) {
      if (this.saverLeft > 0) { this.newBall(); this.saverLeft = 0; this.ev.onSave?.(); return; }
      ball.alive = false; this.ballsLost++; this.mult = 1; this.ev.onDrain?.();
    }
  }

  private sensorsStep() {
    const ball = this.ball;
    for (const n of this.table.sensors) {
      if (Math.hypot(ball.x - n.x, ball.y - n.y) >= n.r + ball.r * 0.5) continue;
      if (n.kind === 'lane') {
        if (!n.lit) {
          n.lit = true; n.flash = 0.4; this.add(500);
          const all = this.table.sensors.every((q) => q.kind !== 'lane' || q.lit);
          if (all) { this.mult = Math.min(5, this.mult + 1); this.add(3000); for (const q of this.table.sensors) if (q.kind === 'lane') q.lit = false; }
          this.ev.onLane?.(all);
        }
      } else {
        n.omega = Math.max(-40, Math.min(40, n.omega + Math.sign(ball.vy || 1) * ball.speed * 0.02));
        n.flash = 0.1;
      }
    }
    for (const n of this.table.sensors) if (n.kind === 'spinner') {
      const turns = Math.floor(n.spinAcc / Math.PI);
      if (turns > n.awarded) { this.add(50 * (turns - n.awarded)); n.awarded = turns; this.ev.onSpin?.(); }
    }
  }

  private saucerStep() {
    const ball = this.ball;
    for (const u of this.table.saucers) {
      if (ball.held || u.hold > 0) continue;
      if (Math.hypot(ball.x - u.x, ball.y - u.y) < u.r && ball.speed < 1100) {
        ball.held = true; ball.x = u.x; ball.y = u.y; ball.vx = ball.vy = 0; u.hold = 0.9; u.glow = 1.2; this.add(1000);
        this.ev.onSaucer?.(false);
      }
    }
  }

  private holdStep() {
    for (const u of this.table.saucers) if (u.hold > 0) {
      u.hold -= DT;
      if (u.hold <= 0) {
        const ball = this.ball; ball.held = false; u.count++;
        const side = u.count % 2 ? 1 : -1;
        ball.vx = side * (260 + 90 * (u.count % 3)); ball.vy = -1450; u.hold = 0; u.glow = 0.6;
        this.ev.onSaucer?.(true);
      }
    }
  }

  private collide() {
    const t = this.table, ball = this.ball;
    for (const w of t.walls) this.capsule(w.ax, w.ay, w.bx, w.by, 0, w.e, 0, 1, null, w.kick ?? 0);
    t.flippers.forEach((f, i) => this.capsule(f.px, f.py, f.tipX, f.tipY, f.thickness, 0.35, f.omega, f.power, f, 0, i));
    for (const tg of t.targets) {
      if (tg.down) continue;
      if (this.capsule(tg.ax, tg.ay, tg.bx, tg.by, tg.thick, 0.3, 0, 1, null, 0)) this.hitTarget(tg);
    }
    for (const b of t.bumpers) {
      const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy), min = ball.r + b.r;
      if (d < min && d > 1e-9) {
        const nx = dx / d, ny = dy / d;
        ball.x = b.x + nx * min; ball.y = b.y + ny * min;
        const vn = ball.vx * nx + ball.vy * ny;
        if (vn < 0) { ball.vx -= 2 * vn * nx; ball.vy -= 2 * vn * ny; }
        ball.vx += nx * b.kick; ball.vy += ny * b.kick;
        this.add(b.points); this.hits++; b.flash = 0.18;
        this.ev.onBumper?.(b, ball.speed);
      }
    }
  }

  private hitTarget(tg: Target) {
    tg.flash = 0.3; this.ev.onTarget?.(tg);
    if (tg.kind === 'stand') { this.add(250); this.hits++; return; }
    tg.down = true; this.add(400);
    const bank = this.table.targets.filter((x) => x.kind === 'drop' && x.bank === tg.bank);
    if (bank.every((x) => x.down)) { this.add(3000); this.bankReset = 0.9; this.ev.onBank?.(); }
  }

  private capsule(ax: number, ay: number, bx: number, by: number, thick: number, e: number,
                  omega: number, power: number, flip: Flipper | null, kick: number, idx = -1): boolean {
    const ball = this.ball;
    const abx = bx - ax, aby = by - ay, len2 = abx * abx + aby * aby;
    let t = len2 === 0 ? 0 : ((ball.x - ax) * abx + (ball.y - ay) * aby) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + abx * t, cy = ay + aby * t;
    const dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy), min = ball.r + thick;
    if (d >= min || d < 1e-9) return false;
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
      if (kick) { ball.vx += nx * kick; ball.vy += ny * kick; this.add(10); this.ev.onSling?.(-rvn); }
      else if (flip) this.ev.onFlipper?.(idx, -rvn);
      else if (!flip) this.ev.onWall?.(-rvn);
      return true;
    }
    return false;
  }
}
