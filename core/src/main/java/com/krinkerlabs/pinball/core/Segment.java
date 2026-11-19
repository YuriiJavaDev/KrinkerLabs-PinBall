package com.krinkerlabs.pinball.core;

/** Static wall segment. */
public final class Segment {
    public final double ax, ay, bx, by, restitution;
    public Segment(double ax, double ay, double bx, double by, double restitution) {
        this.ax = ax; this.ay = ay; this.bx = bx; this.by = by; this.restitution = restitution;
    }
}
