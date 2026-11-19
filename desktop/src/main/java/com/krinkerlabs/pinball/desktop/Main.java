package com.krinkerlabs.pinball.desktop;

import com.krinkerlabs.pinball.core.*;
import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.awt.image.BufferedImage;
import java.io.File;

/** Desktop launcher. Keys: Z or Left = left flipper, / or Right = right flipper,
 *  Shift+Left/Right = nudge, Space = new ball, Esc = quit. */
public final class Main {
    static Sim sim = new Sim(Tables.demo(), TiltConfig.MEDIUM);

    public static void main(String[] args) throws Exception {
        if (args.length == 2 && args[0].equals("--shot")) { shot(args[1]); return; }
        JPanel panel = new JPanel() {
            @Override protected void paintComponent(Graphics g) {
                Renderer.draw((Graphics2D) g, sim, getWidth(), getHeight());
            }
        };
        panel.setPreferredSize(new Dimension(540, 960));
        panel.setFocusable(true);
        panel.addKeyListener(new KeyAdapter() {
            @Override public void keyPressed(KeyEvent e) {
                int k = e.getKeyCode();
                if (k == KeyEvent.VK_ESCAPE) System.exit(0);
                if (k == KeyEvent.VK_SPACE) { restartBall(); return; }
                if (e.isShiftDown() && k == KeyEvent.VK_LEFT) { sim.nudge(-1); return; }
                if (e.isShiftDown() && k == KeyEvent.VK_RIGHT) { sim.nudge(1); return; }
                if (k == KeyEvent.VK_Z || k == KeyEvent.VK_LEFT) sim.setFlipper(0, true);
                if (k == KeyEvent.VK_SLASH || k == KeyEvent.VK_RIGHT) sim.setFlipper(1, true);
            }
            @Override public void keyReleased(KeyEvent e) {
                int k = e.getKeyCode();
                if (k == KeyEvent.VK_Z || k == KeyEvent.VK_LEFT) sim.setFlipper(0, false);
                if (k == KeyEvent.VK_SLASH || k == KeyEvent.VK_RIGHT) sim.setFlipper(1, false);
            }
        });
        JFrame f = new JFrame("KrinkerLabs Pinball");
        f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        f.add(panel); f.pack(); f.setLocationRelativeTo(null); f.setVisible(true);
        panel.requestFocusInWindow();
        long last = System.nanoTime(); double acc = 0;
        while (true) {
            long now = System.nanoTime();
            acc += Math.min(0.1, (now - last) / 1e9); last = now;
            while (acc >= Sim.DT) { sim.step(); acc -= Sim.DT; }
            panel.repaint();
            Thread.sleep(2);
        }
    }

    static void restartBall() {
        Sim n = new Sim(Tables.demo(), TiltConfig.MEDIUM);
        n.ball.vx = 90; n.score = sim.score; n.ballsLost = sim.ballsLost;
        sim = n;
    }

    /** Render a frame to a PNG without any window (works headless). */
    static void shot(String path) throws Exception {
        Sim s = new Sim(Tables.demo(), TiltConfig.MEDIUM);
        s.ball.vx = 90;
        for (int i = 0; i < 700; i++) { s.setFlipper(0, i % 300 > 200); s.step(); }
        BufferedImage img = new BufferedImage(540, 960, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics(); Renderer.draw(g, s, 540, 960); g.dispose();
        javax.imageio.ImageIO.write(img, "png", new File(path));
    }
}
