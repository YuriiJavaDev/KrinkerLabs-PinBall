package com.krinkerlabs.pinball.core;

/** The ball. Field coordinates: x to the right, y DOWN, virtual field 900x1600. */
public final class Ball {
    public double x, y, vx, vy;
    public final double r;
    public boolean alive = true;

    public Ball(double x, double y, double r) { this.x = x; this.y = y; this.r = r; }
    public double speed() { return Math.hypot(vx, vy); }
}
