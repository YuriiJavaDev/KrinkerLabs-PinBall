# KrinkerLabs Pinball

A free, open-source pinball game by KrinkerLabs. Own engine, no third-party
libraries: graphics are drawn in code, sounds are synthesised.

## Architecture

```
core/      pure Java, no dependencies: deterministic physics, tables, scoring, tilt
           (tested here with a bare JDK; a bot can play it without any screen)
desktop/   Java2D window and keyboard input (run with ./run.sh)
android/   (planned) Canvas renderer, touch input, min SDK chosen from distribution data
```

## Rules in the core

- Fixed step 1/240 s, 4 substeps per step, capsule collisions: a fast ball cannot pass a flipper.
- Flipper input is applied at the start of the next step; a full swing takes under 60 ms.
- Nudge shakes the table sideways; too many nudges cause TILT (flippers locked).
  World 1 only warns, World 2 locks briefly, World 3 locks longer.

## Build and test

```
./test.sh
```

Needs only a JDK (17+).

## Plan

Worlds 1 and 2 first (40 sub-levels each, built from themed tables with variants), then World 3.

## License

MIT, see LICENSE.

## Play it (desktop)

```
./run.sh        (Windows: run.bat)
```

Z or Left = left flipper, / or Right = right flipper, Shift+Left/Right = nudge, Space = new ball, Esc = quit.
