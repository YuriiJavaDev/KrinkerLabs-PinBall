package com.krinkerlabs.pinball.core;

/**
 * A flipper ("лопатка"): a capsule rotating about a pivot.
 * Angles in radians, y down, so a positive angle turns the tip downwards.
 * Input is applied at the start of the very next physics step, with no smoothing.
 */
public final class Flipper {
    public final double px, py;
    public double length;
    public final double thickness;
    public final double restAngle, upAngle;
    /** Maximum angular speed, rad/s. */
    public double omegaMax;
    /** Extra hit strength multiplier on the surface velocity (modes). */
    public double power = 1.0;
    /** Sticky mode: the ball is slowed down on contact so it can be held. */
    public boolean sticky;

    public double angle;
    public double omega;
    public boolean pressed;

    public Flipper(double px, double py, double length, double thickness,
                   double restAngle, double upAngle, double omegaMax) {
        this.px = px; this.py = py; this.length = length; this.thickness = thickness;
        this.restAngle = restAngle; this.upAngle = upAngle; this.omegaMax = omegaMax;
        this.angle = restAngle;
    }

    public double tipX() { return px + Math.cos(angle) * length; }
    public double tipY() { return py + Math.sin(angle) * length; }

    /** Advance the angle towards the target; sets omega for contact velocity. */
    void step(double dt, boolean enabled) {
        double target = (pressed && enabled) ? upAngle : restAngle;
        double diff = target - angle;
        double maxMove = omegaMax * dt;
        double move = Math.abs(diff) <= maxMove ? diff : Math.copySign(maxMove, diff);
        angle += move;
        omega = move / dt;
    }
}
