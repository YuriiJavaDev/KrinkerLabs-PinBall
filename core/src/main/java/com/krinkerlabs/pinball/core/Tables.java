package com.krinkerlabs.pinball.core;

/** Hand-built base tables. Later: loaded from JSON level files. */
public final class Tables {
    private Tables() {}

    /** Two flippers, funnel walls, outer walls and no bumpers. */
    public static Table basic() {
        Table t = new Table();
        double W = Table.WIDTH, H = Table.HEIGHT;
        t.walls.add(new Segment(0, 0, 0, H, 0.4));
        t.walls.add(new Segment(W, 0, W, H, 0.4));
        t.walls.add(new Segment(0, 0, W, 0, 0.4));
        // funnel to the flippers
        t.walls.add(new Segment(0, 1280, 300, 1440, 0.3));
        t.walls.add(new Segment(W, 1280, W - 300, 1440, 0.3));
        double rest = 0.5, up = -0.5, omega = 22;
        t.flippers.add(new Flipper(300, 1440, 120, 12, rest, up, omega));
        // mirrored right flipper: tip points left; angles mirrored through PI
        t.flippers.add(new Flipper(W - 300, 1440, 120, 12, Math.PI - rest, Math.PI - up, omega));
        return t;
    }
}
