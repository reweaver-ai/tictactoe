#!/usr/bin/env node
/**
 * apply-tokens.js
 * ---------------------------------------------------------------------
 * Writes a flat design-token JSON file into styles.css, replacing the
 * contents of the /* TOKENS:START *\/ ... /* TOKENS:END *\/ block.
 *
 * This is a stand-in for whatever sync step a real design-to-code tool
 * (like ReWeaver) performs when a Figma design is exported: tokens go
 * in, CSS custom properties come out, and none of the surrounding
 * markup/logic files are touched.
 *
 * Usage:
 *   node tools/apply-tokens.js                      # uses design-tokens.json
 *   node tools/apply-tokens.js themes/dark.json      # uses a specific theme
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CSS_PATH = path.join(ROOT, "styles.css");
const START_MARKER = "/* TOKENS:START */";
const END_MARKER = "/* TOKENS:END */";

function main() {
  const tokenFileArg = process.argv[2] || "design-tokens.json";
  const tokenPath = path.isAbsolute(tokenFileArg)
    ? tokenFileArg
    : path.join(ROOT, tokenFileArg);

  const tokens = readTokens(tokenPath);
  const css = fs.readFileSync(CSS_PATH, "utf8");

  const startIdx = css.indexOf(START_MARKER);
  const endIdx = css.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.error("Could not find TOKENS:START / TOKENS:END markers in styles.css");
    process.exit(1);
  }

  const before = css.slice(0, startIdx + START_MARKER.length);
  const after = css.slice(endIdx);

  const body = Object.entries(tokens)
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");

  const nextCss = `${before}\n${body}\n  ${after}`;
  fs.writeFileSync(CSS_PATH, nextCss, "utf8");

  console.log(`Applied ${Object.keys(tokens).filter((k) => !k.startsWith("_")).length} tokens from ${path.relative(ROOT, tokenPath)} -> styles.css`);
}

function readTokens(tokenPath) {
  if (!fs.existsSync(tokenPath)) {
    console.error(`Token file not found: ${tokenPath}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  } catch (err) {
    console.error(`Could not parse ${tokenPath}: ${err.message}`);
    process.exit(1);
  }
}

main();
