package com.krinkerlabs.pinball.core;

/** Minimal assertion helper (no external test libraries). */
final class Check {
    static int run, failed;
    static void that(boolean ok, String what) {
        run++;
        if (!ok) { failed++; System.out.println("FAIL: " + what); }
    }
    static void near(double a, double b, double eps, String what) {
        that(Math.abs(a - b) <= eps, what + " (got " + a + ", want " + b + ")");
    }
}
