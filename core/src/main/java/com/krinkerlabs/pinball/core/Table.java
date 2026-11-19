package com.krinkerlabs.pinball.core;

import java.util.ArrayList;
import java.util.List;

/** Everything static or semi-static on a table. Pure data. */
public final class Table {
    public static final double WIDTH = 900, HEIGHT = 1600;
    public final List<Segment> walls = new ArrayList<>();
    public final List<Bumper> bumpers = new ArrayList<>();
    public final List<Flipper> flippers = new ArrayList<>();
    public double gravity = 1500;       // field units / s^2 (table incline folded in)
    public double ballRadius = 22;
    public double spawnX = 450, spawnY = 200;
    /** Ball lost when its y goes beyond this. */
    public double drainY = HEIGHT + 60;
}
