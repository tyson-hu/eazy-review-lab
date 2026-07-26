#!/usr/bin/env node
/**
 * Offline freshness check: committed SVG assets must match derived inputs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProjectHealthVisuals } from "./build-project-health-visuals.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

const expected = buildProjectHealthVisuals();
for (const asset of [expected.filesByArea, expected.timeline]) {
  const full = path.join(root, asset.rel);
  if (!fs.existsSync(full)) {
    errors.push(`missing generated asset: ${asset.rel}`);
    continue;
  }
  const actual = fs.readFileSync(full, "utf8");
  if (actual !== asset.contents) {
    errors.push(
      `stale generated asset: ${asset.rel} does not match derived inputs (run pnpm visuals:project-health)`,
    );
  }
}

if (errors.length) {
  console.error("Generated-asset freshness check failed:\n");
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log("Generated-asset freshness check passed.");
