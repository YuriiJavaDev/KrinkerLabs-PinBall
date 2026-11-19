package com.krinkerlabs.pinball.core;

/** Round bumper: reflects the ball and adds a kick. */
public final class Bumper {
    public final double x, y, r, kick;
    public final int points;
    /** Seconds left of the hit-flash (for rendering only). */
    public double flash;
    public Bumper(double x, double y, double r, double kick, int points) {
        this.x = x; this.y = y; this.r = r; this.kick = kick; this.points = points;
    }
}
