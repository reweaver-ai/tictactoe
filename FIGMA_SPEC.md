# Figma Spec

This document is the bridge between `design-tokens.json` / `styles.css` and an
actual Figma file. It exists so that:

1. Anyone can recreate this app's design in Figma from scratch, starting the
   roundtrip at the "Design" end.
2. ReWeaver (or anyone) can compare Figma variables against the values below
   to check whether the two are still in sync — that comparison **is** the
   drift check.

There's no single canonical Figma file checked into this repo (Figma files
aren't diffable/text-based, and we want the repo itself to stay the neutral,
tool-agnostic source of truth). Build the file below once, publish a
"Get Figma file" community link if you like, and reference it from your fork's
README.

## File structure

```
Page: Tic-Tac-Toe
└─ Frame: "TicTacToe / App"        392 x 620, background = Board/BgGradient
   ├─ Frame: "Header"               auto-layout, vertical, gap 4
   │  ├─ Text: "Title"              "Tic · Tac · Toe"
   │  └─ Text: "Subtitle"           "a ReWeaver roundtrip demo"
   │
   ├─ Frame: "Scoreboard"           auto-layout, horizontal, gap 10
   │  ├─ Component instance: "Score Chip" (variant=X)
   │  ├─ Component instance: "Score Chip" (variant=Draw)
   │  └─ Component instance: "Score Chip" (variant=O)
   │
   ├─ Text: "Status"                "X's turn"
   │
   ├─ Frame: "Board"                3x3 auto-layout grid, gap 8,
   │  │                             fill = Color/GridLine, corner = Radius/Board
   │  └─ Component instance x9: "Cell" (variant=Empty | X | O | Winning)
   │
   └─ Frame: "Controls"             auto-layout, horizontal, gap 10
      ├─ Component instance: "Button" (variant=Primary, label="New Round")
      └─ Component instance: "Button" (variant=Ghost, label="Reset Score")
```

## Components & variants

**`Cell`** — the only component that really matters for drift testing.

| Variant   | Fill               | Content                                    |
|-----------|---------------------|---------------------------------------------|
| Empty     | Color/Board          | —                                             |
| X         | Color/Board          | Vector "X" stroke, Color/X, weight = Shape/MarkStrokeWidth |
| O         | Color/Board          | Vector ellipse, Color/O, weight = Shape/MarkStrokeWidth |
| Winning   | mix(Color/Board, Color/WinHighlight) | inherits X or O content, add glow effect |

Corner radius on every variant is bound to **`Shape/CellRadius`**.

**`Score Chip`** — variant prop `player` = `X | O | Draw`. Background:
`rgba(255,255,255,0.16)`, text color bound to `Color/X` / `Color/O` /
`Color/Text` respectively.

**`Button`** — variant prop `style` = `Primary | Ghost`.

## Figma variables ↔ design-tokens.json

Create a single Figma variable collection named **`ReWeaver/TicTacToe`** with
one mode ("Default"). Bind every variable below to the matching layer
property; do not hardcode any color, radius, or duration on a layer.

| Figma variable                 | Type   | `design-tokens.json` key | Used on                          |
|--------------------------------|--------|---------------------------|-----------------------------------|
| `Color/BgStart`                | Color  | `color-bg-start`           | App frame fill (gradient stop 1)  |
| `Color/BgEnd`                  | Color  | `color-bg-end`             | App frame fill (gradient stop 2)  |
| `Color/Board`                  | Color  | `color-board`               | Cell fill                          |
| `Color/GridLine`               | Color  | `color-grid-line`           | Board frame fill                   |
| `Color/X`                      | Color  | `color-x`                   | X stroke, X score chip text        |
| `Color/O`                      | Color  | `color-o`                   | O stroke, O score chip text        |
| `Color/WinHighlight`           | Color  | `color-win-highlight`       | Winning cell glow / fill mix       |
| `Color/Text`                   | Color  | `color-text`                | Button label text                  |
| `Color/TextMuted`               | Color  | `color-text-muted`          | Subtitle text                      |
| `Shape/BoardRadius`            | Number | `board-radius`               | Board frame corner radius          |
| `Shape/CellRadius`             | Number | `cell-radius`                 | Cell corner radius                 |
| `Shape/MarkStrokeWidth`        | Number | `mark-stroke-width`           | X/O vector stroke weight           |
| `Typography/FontFamily`        | String | `font-family`                 | All text layers                    |
| `Motion/DurationPlace`         | Number (ms) | `duration-place`         | Smart animate on Cell state change |
| `Motion/DurationWin`           | Number (ms) | `duration-win`           | Smart animate on Winning variant   |
| `Motion/Easing`                | String | `easing`                      | Note in layer description (Figma smart-animate easing curve, set manually) |

`mark-linecap` and `pattern-opacity` are CSS-specific rendering details
(stroke cap style, background dot opacity) with no direct Figma variable
equivalent — call them out as **expected, allowed drift** in any comparison
report rather than treating them as a mismatch.

## Suggested roundtrip test

1. In Figma, change `Color/X` to a new value and publish the variable.
2. Run ReWeaver's design → code sync; confirm `--color-x` updates in
   `styles.css` (or in `design-tokens.json` if that's the sync target).
3. Separately, hand-edit `--cell-radius` in `styles.css` directly (simulating
   a developer bypassing Figma).
4. Run ReWeaver's code → design sync and confirm it either updates
   `Shape/CellRadius` in Figma or flags the mismatch as drift.
5. Repeat with a value that has no Figma mapping (e.g. `mark-linecap`) and
   confirm ReWeaver handles the "no equivalent" case sensibly instead of
   erroring or silently dropping it.
