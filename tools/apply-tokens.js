#!/usr/bin/env node
/**
 * apply-tokens.js
 * ---------------------------------------------------------------------
 * Regenerates BOTH token blocks in styles.css from the JSON token files:
 *
 *   TOKENS:START/END   <- design-tokens.json, written into :root
 *                         (the default mode)
 *   THEMES:START/END   <- one scoped rule per themes/*.json, each a
 *                         redefinition of the same token names
 *
 * This is a stand-in for whatever sync step a real design-to-code tool
 * (like ReWeaver) performs when a Figma design is exported: tokens go
 * in, CSS custom properties come out, and none of the surrounding
 * markup/logic files are touched.
 *
 * Every theme coexists in the stylesheet, so picking one is an attribute
 * flip (`<html data-theme="retro">`) or a class flip (`<html class="dark">`)
 * — not a re-run of this script. That is also why it takes no arguments.
 *
 * The selectors follow the convention design tooling reads back:
 * `.dark` / `.light` for those two names, `[data-theme="x"]` for the rest.
 *
 * Usage:
 *   node tools/apply-tokens.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CSS_PATH = path.join(ROOT, "styles.css");
const TOKENS_PATH = path.join(ROOT, "design-tokens.json");
const THEMES_DIR = path.join(ROOT, "themes");

const TOKENS_START = "/* TOKENS:START */";
const TOKENS_END = "/* TOKENS:END */";
const THEMES_START = "/* THEMES:START */";
const THEMES_END = "/* THEMES:END */";

function main() {
  // No arguments. Applying a single theme file into :root is what this
  // script used to do; it is superseded by emitting every theme as its
  // own scoped block. Accepting an argument silently would write a theme
  // into the default mode and quietly destroy the distinction.
  if (process.argv.length > 2) {
    fail(
      `apply-tokens.js takes no arguments (got: ${process.argv.slice(2).join(" ")}).\n` +
      `  Every theme in themes/ is emitted as its own scoped block; switch with\n` +
      `  <html data-theme="pastel"> or <html class="dark">, not by re-running this.`
    );
  }

  const tokens = readTokenFile(TOKENS_PATH);
  const themes = readThemes();

  let css = fs.readFileSync(CSS_PATH, "utf8");
  css = replaceBlock(css, TOKENS_START, TOKENS_END, renderTokens(tokens), "  ");
  css = replaceBlock(css, THEMES_START, THEMES_END, renderThemes(themes), "");
  fs.writeFileSync(CSS_PATH, css, "utf8");

  const themeSummary = themes.map((t) => `${t.name} (${t.selector})`).join(", ");
  console.log(
    `Applied ${Object.keys(tokens).length} tokens -> :root, ` +
    `${themes.length} themes -> ${themeSummary || "(none)"}`
  );
}

/** Replace the text between two markers, keeping the markers themselves. */
function replaceBlock(css, startMarker, endMarker, body, endIndent) {
  const startIdx = css.indexOf(startMarker);
  const endIdx = css.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    fail(
      `Could not find ${startMarker} / ${endMarker} in styles.css.\n` +
      `  Both marker pairs must be present — TOKENS inside :root, THEMES just below it.`
    );
  }
  const before = css.slice(0, startIdx + startMarker.length);
  const after = css.slice(endIdx);
  return `${before}\n${body}\n${endIndent}${after}`;
}

/** `:root` custom properties, one per token. */
function renderTokens(tokens) {
  return Object.entries(tokens)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");
}

/** One scoped rule per theme, each redefining the same token names. */
function renderThemes(themes) {
  return themes
    .map((theme) => {
      const body = Object.entries(theme.tokens)
        .map(([key, value]) => `  --${key}: ${value};`)
        .join("\n");
      return `${theme.selector} {\n${body}\n}`;
    })
    .join("\n\n");
}

/**
 * The selectors a design tool reads back as named modes.
 *
 * `dark`/`light` also get their conventional class form, because that is
 * what stylesheets in the wild use — but the `[data-theme]` attribute is
 * emitted for every theme without exception, so switching is one uniform
 * gesture no matter which theme you pick.
 */
function selectorFor(themeName) {
  const attribute = `[data-theme="${themeName}"]`;
  if (themeName === "dark" || themeName === "light") {
    return `.${themeName}, ${attribute}`;
  }
  return attribute;
}

/** Every themes/*.json, named for its file — sorted so output is stable. */
function readThemes() {
  if (!fs.existsSync(THEMES_DIR)) return [];
  return fs
    .readdirSync(THEMES_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const themeName = name.replace(/\.json$/, "");
      return {
        name: themeName,
        selector: selectorFor(themeName),
        tokens: readTokenFile(path.join(THEMES_DIR, name)),
      };
    });
}

/** Read a flat token JSON. `_`-prefixed keys are documentation, not tokens. */
function readTokenFile(tokenPath) {
  if (!fs.existsSync(tokenPath)) {
    fail(`Token file not found: ${tokenPath}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  } catch (err) {
    fail(`Could not parse ${tokenPath}: ${err.message}`);
  }
  const tokens = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (key.startsWith("_")) continue;
    tokens[key] = value;
  }
  if (Object.keys(tokens).length === 0) {
    fail(`No tokens in ${path.relative(ROOT, tokenPath)} — every key was documentation.`);
  }
  return tokens;
}

function fail(message) {
  console.error(`apply-tokens: ${message}`);
  process.exit(1);
}

main();
