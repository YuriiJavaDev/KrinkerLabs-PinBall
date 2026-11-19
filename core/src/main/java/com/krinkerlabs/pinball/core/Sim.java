package com.krinkerlabs.pinball.core;

/**
 * Deterministic fixed-step simulation. No rendering, no clocks, no randomness,
 * so tests and a bot can drive it directly.
 */
public final class Sim {
    public static final double DT = 1.0 / 240.0;
    private static final int SUBSTEPS = 4;
    private static final double MAX_SPEED = 3200;

    public final Table table;
    public final Ball ball;
    public final TiltConfig tilt;
    public long score;
    public int ballsLost;
    public double tiltMeter;
    public double lockLeft;
    public boolean warned;       // set when meter crosses 75%
    public long steps;

    public Sim(Table table, TiltConfig tilt) {
        this.table = table; this.tilt = tilt;
        this.ball = new Ball(table.spawnX, table.spawnY, table.ballRadius);
    }

    public boolean tilted() { return lockLeft > 0; }

    public void setFlipper(int index, boolean pressed) { table.flippers.get(index).pressed = pressed; }

    /** Shake the table sideways: dir -1 left, +1 right. */
    public void nudge(int dir) {
        if (tilted()) return;
        ball.vx += Math.signum(dir) * tilt.nudgeImpulse;
        tiltMeter += tilt.perNudge;
        if (tiltMeter >= tilt.limit) {
            lockLeft = tilt.lockSeconds;
            tiltMeter = 0;
        } else if (tiltMeter >= tilt.limit * 0.75) {
            warned = true;
        }
    }

    public void step() {
        steps++;
        boolean enabled = !tilted();
        for (Flipper f : table.flippers) f.step(DT, enabled);
        if (lockLeft > 0) lockLeft = Math.max(0, lockLeft - DT);
        tiltMeter = Math.max(0, tiltMeter - tilt.decayPerSec * DT);
        for (Bumper b : table.bumpers) b.flash = Math.max(0, b.flash - DT);

        if (!ball.alive) return;
        double h = DT / SUBSTEPS;
        for (int i = 0; i < SUBSTEPS; i++) {
            ball.vy += table.gravity * h;
            ball.x += ball.vx * h;
            ball.y += ball.vy * h;
            collide();
            double s = ball.speed();
            if (s > MAX_SPEED) { ball.vx *= MAX_SPEED / s; ball.vy *= MAX_SPEED / s; }
        }
        if (ball.y > table.drainY) { ball.alive = false; ballsLost++; }
    }

    private void collide() {
        for (Segment w : table.walls) hitCapsule(w.ax, w.ay, w.bx, w.by, 0, w.restitution, 0, 0, null);
        for (Flipper f : table.flippers)
            hitCapsule(f.px, f.py, f.tipX(), f.tipY(), f.thickness, 0.35, f.omega, f.power, f);
        for (Bumper b : table.bumpers) {
            double dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy), min = ball.r + b.r;
            if (d < min && d > 1e-9) {
                double nx = dx / d, ny = dy / d;
                ball.x = b.x + nx * min; ball.y = b.y + ny * min;
                double vn = ball.vx * nx + ball.vy * ny;
                if (vn < 0) { ball.vx -= 2 * vn * nx; ball.vy -= 2 * vn * ny; }
                ball.vx += nx * b.kick; ball.vy += ny * b.kick;
                score += b.points; b.flash = 0.15;
            }
        }
    }

    /** Collide with the capsule a-b of the given half-thickness; rotating about a when omega != 0. */
    private void hitCapsule(double ax, double ay, double bx, double by, double thick,
                            double e, double omega, double power, Flipper flip) {
        double abx = bx - ax, aby = by - ay, len2 = abx * abx + aby * aby;
        double t = len2 == 0 ? 0 : ((ball.x - ax) * abx + (ball.y - ay) * aby) / len2;
        t = Math.max(0, Math.min(1, t));
        double cx = ax + abx * t, cy = ay + aby * t;
        double dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy), min = ball.r + thick;
        if (d >= min || d < 1e-9) return;
        double nx = dx / d, ny = dy / d;
        ball.x = cx + nx * min; ball.y = cy + ny * min;
        // surface velocity at contact point: omega x r (y down, positive omega = clockwise on screen)
        double rx = cx - ax, ry = cy - ay;
        double svx = -omega * ry * power, svy = omega * rx * power;
        double rvn = (ball.vx - svx) * nx + (ball.vy - svy) * ny;
        if (rvn < 0) {
            double k = (flip != null && flip.sticky) ? 0.0 : e;
            ball.vx -= (1 + k) * rvn * nx;
            ball.vy -= (1 + k) * rvn * ny;
            if (flip != null && flip.sticky) { ball.vx *= 0.8; ball.vy *= 0.8; }
        }
    }
}
