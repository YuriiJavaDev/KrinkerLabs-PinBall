package com.krinkerlabs.pinball.core;

public final class CoreTests {
    static Sim sim() { return new Sim(Tables.basic(), TiltConfig.MEDIUM); }

    static void gravity() {
        Sim s = sim(); double y0 = s.ball.y;
        for (int i = 0; i < 120; i++) s.step();
        Check.that(s.ball.y > y0 + 50, "ball falls");
    }
    static void wallBounce() {
        Sim s = sim(); s.ball.x = 40; s.ball.y = 600; s.ball.vx = -900;
        for (int i = 0; i < 40; i++) s.step();
        Check.that(s.ball.vx > 0 && s.ball.x > s.ball.r - 0.01, "bounces off left wall");
    }
    static void noTunnelling() {
        Sim s = sim(); s.ball.x = 450; s.ball.y = 100; s.ball.vy = -3000;
        for (int i = 0; i < 200; i++) s.step();
        Check.that(s.ball.y > -1, "fast ball does not pass through top wall");
    }
    static void flipperReactsInOneStep() {
        Sim s = sim(); Flipper f = s.table.flippers.get(0);
        double a0 = f.angle; s.setFlipper(0, true); s.step();
        Check.that(f.angle < a0 - 0.05, "flipper moves in the same step as the input");
        for (int i = 0; i < 60; i++) s.step();
        Check.near(f.angle, f.upAngle, 1e-9, "flipper reaches up angle");
    }
    static void flipperLaunchesBall() {
        Sim s = sim(); Flipper f = s.table.flippers.get(0);
        s.ball.x = 380; s.ball.y = 1440 + 70 * Math.sin(f.restAngle) - 60 + 20; s.ball.vx = 0; s.ball.vy = 0;
        for (int i = 0; i < 30; i++) s.step();       // settle on the resting flipper
        s.setFlipper(0, true);
        double minVy = 0;
        for (int i = 0; i < 90; i++) { s.step(); minVy = Math.min(minVy, s.ball.vy); }
        Check.that(minVy < -600, "raised flipper throws ball upwards, vy=" + minVy);
    }
    static void flipperSpeedMs() {
        Flipper f = Tables.basic().flippers.get(0);
        double travel = Math.abs(f.upAngle - f.restAngle), ms = travel / f.omegaMax * 1000;
        Check.that(ms < 60, "full flipper swing under 60 ms, is " + ms);
    }
    static void bumperScoresAndKicks() {
        Table t = Tables.basic(); t.bumpers.add(new Bumper(450, 700, 50, 300, 100));
        Sim s = new Sim(t, TiltConfig.MEDIUM); s.ball.x = 450; s.ball.y = 560; s.ball.vy = 400;
        for (int i = 0; i < 120; i++) s.step();
        Check.that(s.score >= 100, "bumper gives points");
        Check.that(s.ball.vy < 0 || s.ball.y < 600, "bumper repels the ball");
    }
    static void drain() {
        Sim s = sim(); s.ball.x = 450; s.ball.y = 1500; s.ball.vy = 300;
        for (int i = 0; i < 600 && s.ball.alive; i++) s.step();
        Check.that(!s.ball.alive && s.ballsLost == 1, "ball drains through the gap");
    }
    static void nudgeAndTilt() {
        Sim s = new Sim(Tables.basic(), TiltConfig.MEDIUM);
        s.nudge(1);
        Check.that(s.ball.vx > 200, "nudge pushes ball sideways");
        s.nudge(-1); s.nudge(1);
        Check.that(s.tilted(), "three quick nudges trigger TILT");
        s.setFlipper(0, true); double a = s.table.flippers.get(0).angle;
        for (int i = 0; i < 20; i++) s.step();
        Check.near(s.table.flippers.get(0).angle, a, 1e-9, "flippers are dead while tilted");
        for (int i = 0; i < 400; i++) s.step();
        Check.that(!s.tilted(), "TILT lock expires");
    }
    static void noviceNeverLocks() {
        Sim s = new Sim(Tables.basic(), TiltConfig.NOVICE);
        for (int i = 0; i < 10; i++) s.nudge(1);
        Check.that(!s.tilted(), "novice tilt only warns");
    }
    static void nudgeDecays() {
        Sim s = sim(); s.nudge(1);
        for (int i = 0; i < 480; i++) s.step();
        Check.that(s.tiltMeter < 0.01, "tilt meter decays over time");
    }
    static void deterministic() {
        Sim a = sim(), b = sim();
        for (int i = 0; i < 2000; i++) {
            boolean p = (i / 150) % 2 == 0;
            a.setFlipper(0, p); b.setFlipper(0, p);
            if (i % 400 == 0) { a.nudge(1); b.nudge(1); }
            a.step(); b.step();
        }
        Check.that(a.ball.x == b.ball.x && a.ball.y == b.ball.y && a.score == b.score, "identical runs match bit for bit");
    }

    public static void main(String[] args) {
        gravity(); wallBounce(); noTunnelling(); flipperReactsInOneStep(); flipperLaunchesBall();
        flipperSpeedMs(); bumperScoresAndKicks(); drain(); nudgeAndTilt(); noviceNeverLocks();
        nudgeDecays(); deterministic();
        System.out.println(Check.run + " checks, " + Check.failed + " failed");
        if (Check.failed > 0) System.exit(1);
    }
}
