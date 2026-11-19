package com.krinkerlabs.pinball.desktop;

import com.krinkerlabs.pinball.core.*;
import java.awt.*;
import java.awt.geom.*;

/** Draws a Sim with Java2D. Everything is drawn in code; no image files. */
public final class Renderer {
    public static void draw(Graphics2D g, Sim s, int w, int h) {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
        g.setPaint(new GradientPaint(0, 0, new Color(10, 14, 30), 0, h, new Color(24, 20, 52)));
        g.fillRect(0, 0, w, h);
        double sc = Math.min(w / Table.WIDTH, h / Table.HEIGHT);
        g.translate((w - Table.WIDTH * sc) / 2, (h - Table.HEIGHT * sc) / 2);
        g.scale(sc, sc);
        Table t = s.table;
        g.setPaint(new GradientPaint(0, 0, new Color(18, 40, 58), 0, (float) Table.HEIGHT, new Color(10, 22, 40)));
        g.fillRect(0, 0, (int) Table.WIDTH, (int) Table.HEIGHT);

        g.setStroke(new BasicStroke(6, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g.setColor(new Color(120, 200, 255));
        for (Segment w2 : t.walls) g.draw(new Line2D.Double(w2.ax, w2.ay, w2.bx, w2.by));

        for (Bumper b : t.bumpers) {
            float f = (float) Math.min(1, b.flash / 0.15);
            Color core = blend(new Color(255, 170, 60), Color.WHITE, f);
            g.setPaint(new RadialGradientPaint((float) b.x, (float) b.y, (float) (b.r * 1.9),
                new float[]{0f, 0.5f, 1f}, new Color[]{withA(core, 150), withA(core, 60), withA(core, 0)}));
            g.fill(new Ellipse2D.Double(b.x - b.r * 1.9, b.y - b.r * 1.9, b.r * 3.8, b.r * 3.8));
            g.setPaint(new RadialGradientPaint((float) (b.x - b.r * 0.3), (float) (b.y - b.r * 0.3), (float) b.r,
                new float[]{0f, 1f}, new Color[]{blend(core, Color.WHITE, 0.5f), core.darker()}));
            g.fill(new Ellipse2D.Double(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2));
        }
        for (Flipper f : t.flippers) {
            g.setColor(new Color(255, 214, 90));
            g.setStroke(new BasicStroke((float) (f.thickness * 2), BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            g.draw(new Line2D.Double(f.px, f.py, f.tipX(), f.tipY()));
        }
        Ball b = s.ball;
        if (b.alive) {
            g.setPaint(new RadialGradientPaint((float) (b.x - b.r * 0.35), (float) (b.y - b.r * 0.35), (float) (b.r * 1.3),
                new float[]{0f, 1f}, new Color[]{Color.WHITE, new Color(110, 130, 160)}));
            g.fill(new Ellipse2D.Double(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2));
        }
        g.setStroke(new BasicStroke(1));
        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 46));
        g.setColor(Color.WHITE);
        g.drawString("Score " + s.score, 30, 70);
        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 30));
        g.drawString("Lost " + s.ballsLost, 30, 112);
        if (s.tilted()) { g.setColor(new Color(255, 90, 90)); g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 90)); g.drawString("TILT", 340, 800); }
        else if (s.tiltMeter > 0.05) {
            g.setColor(s.tiltMeter > 0.75 ? new Color(255, 140, 60) : new Color(120, 200, 255));
            g.fillRect(30, 130, (int) (200 * Math.min(1, s.tiltMeter)), 10);
        }
    }
    private static Color withA(Color c, int a) { return new Color(c.getRed(), c.getGreen(), c.getBlue(), a); }
    private static Color blend(Color a, Color b, float f) {
        return new Color((int) (a.getRed() + (b.getRed() - a.getRed()) * f), (int) (a.getGreen() + (b.getGreen() - a.getGreen()) * f), (int) (a.getBlue() + (b.getBlue() - a.getBlue()) * f));
    }
}
