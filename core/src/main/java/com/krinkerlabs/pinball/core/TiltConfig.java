package com.krinkerlabs.pinball.core;

/** How strict the nudge/TILT rules are; differs per world. */
public final class TiltConfig {
    public final double nudgeImpulse;   // velocity change per nudge, units/s
    public final double perNudge;       // tilt meter added per nudge
    public final double limit;          // meter value that triggers TILT
    public final double decayPerSec;    // meter decay
    public final double lockSeconds;    // flippers disabled after TILT

    public TiltConfig(double nudgeImpulse, double perNudge, double limit,
                      double decayPerSec, double lockSeconds) {
        this.nudgeImpulse = nudgeImpulse; this.perNudge = perNudge; this.limit = limit;
        this.decayPerSec = decayPerSec; this.lockSeconds = lockSeconds;
    }

    /** World 1: forgiving, only warns (no lock). */
    public static final TiltConfig NOVICE = new TiltConfig(260, 0.25, 1.0, 0.35, 0.0);
    public static final TiltConfig MEDIUM = new TiltConfig(260, 0.34, 1.0, 0.30, 1.2);
    public static final TiltConfig GURU   = new TiltConfig(240, 0.45, 1.0, 0.25, 2.5);
}
