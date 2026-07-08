# ReWeaver Tic-Tac-Toe

A tiny, dependency-free Tic-Tac-Toe built to demo and stress-test
**ReWeaver's Design → Code → Design roundtrip**. It's deliberately simple —
plain HTML/CSS/JS, no build step, no framework — so that any drift ReWeaver
reports is drift in the *design-to-code sync*, not noise from an unrelated
toolchain.

Play it by opening `index.html` in a browser. That's the whole install step.

## Why Tic-Tac-Toe

It's small enough to hold in your head, but it still has everything a real
design-to-code test needs: a background, a container shape, repeated
components (cells), two distinct glyphs (X / O) that need color and stroke
control, a win-state animation, and interactive states (hover/disabled).
Every visual choice is exposed as a token, so a "design change" is always a
one-line edit — which makes it easy to tell whether ReWeaver propagated it
correctly.

## Repo layout

```
index.html            structure only — should rarely need to change
styles.css            all visual rules; the :root block holds every token
script.js             game logic only — never touch this to re-theme
design-tokens.json     the single source of truth for the current theme
themes/                three ready-made alternate themes (see below)
tools/apply-tokens.js  writes a token file into styles.css
FIGMA_SPEC.md          how the Figma file maps to these same tokens
```

## Personalizing the design

Everything themeable — color, shape, background, animation — is a CSS
custom property set in the `:root` block at the top of `styles.css`, between
the `/* TOKENS:START */` and `/* TOKENS:END */` markers. You can either:

**A. Edit `styles.css` directly.** Fastest for a quick experiment.

**B. Edit `design-tokens.json` and regenerate.** Better if you're treating
tokens as the source of truth (recommended, since this is what a real
design-to-code pipeline does):

```bash
node tools/apply-tokens.js design-tokens.json
```

### What you can change

| Axis | Tokens | Notes |
|---|---|---|
| Color | `color-bg-start/end`, `color-board`, `color-grid-line`, `color-x`, `color-o`, `color-win-highlight`, `color-text*` | Any valid CSS color |
| Shape | `cell-radius`, `board-radius`, `mark-stroke-width`, `mark-linecap` | Set `cell-radius: 50%` for circular cells, `0px` for sharp squares |
| Background | `color-bg-start/end`, `pattern-opacity` | Gradient + optional dot overlay; set `data-bg-pattern="none"` on `<body>` in `index.html` to remove the overlay entirely |
| Animation | `duration-place`, `duration-win`, `duration-hover`, `easing` | Any CSS easing function or `steps()` |
| Typography | `font-family` | Any web-safe or `@font-face`d font |

### Try the built-in themes

```bash
node tools/apply-tokens.js themes/dark.json
node tools/apply-tokens.js themes/retro.json
node tools/apply-tokens.js themes/pastel.json
```

Each is a complete, working re-theme — a good starting point to see how far
you can push the tokens before something looks broken.

## Making your own variant

1. Fork this repo.
2. Copy `design-tokens.json` to `themes/<your-name>.json` and change values,
   or edit it in place.
3. Run `node tools/apply-tokens.js themes/<your-name>.json`.
4. Open `index.html` and confirm it still plays correctly (win detection,
   reset, score) — the game logic should never need to change.
5. Commit and push your fork.

## Using this with ReWeaver

This repo is meant to sit at the "Code" end of a Design ↔ Code roundtrip:

1. **Design → Code**: Build (or reuse) the Figma file described in
   `FIGMA_SPEC.md`, change a variable there, run ReWeaver, and confirm the
   matching token in `design-tokens.json` / `styles.css` updates.
2. **Code → Design**: Hand-edit a token in `styles.css` (bypassing Figma
   entirely, like a developer would under deadline), run ReWeaver's reverse
   sync, and confirm Figma picks up the change — or that ReWeaver correctly
   flags it as **drift** if the sync is one-directional.
3. **Drift detection**: Change the same value in *both* places to different
   values, then run ReWeaver and confirm it surfaces the conflict instead of
   silently picking a winner.

Because every visual property is a named token with a documented Figma
variable equivalent (`FIGMA_SPEC.md`), any mismatch ReWeaver reports should be
traceable to a specific token — which is what makes this useful as a
validation harness rather than just a toy app.

## Contributing your variant back

This repo is public so anyone can clone it, build a themed variant, and use
it to validate their own ReWeaver setup. If you build a theme you like, feel
free to open a PR adding it to `/themes`.

## License

MIT — see `LICENSE`. Do whatever you want with it.
