#!/usr/bin/env node
/**
 * Offline project-health evidence validation (no network).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertProjectHealthInvariants } from "./lib/project-health/invariants.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function load(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

const report = assertProjectHealthInvariants({
  raw: load("src/data/project-health/raw/github-prs-14-20.v1.json"),
  classification: load(
    "src/data/project-health/derived/pr14-path-classification.v1.json",
  ),
  coverage: load("src/data/project-health/derived/replacement-coverage.v1.json"),
  timeline: load("src/data/project-health/derived/decomposition-timeline.v1.json"),
});

console.log(
  `Project-health validation passed (PR #14 paths=${report.pr14PathCount}, represented=${report.representedCount}, superseded=${report.supersededCount}).`,
);
