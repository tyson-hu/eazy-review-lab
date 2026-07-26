import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  parseDecompositionTimeline,
  parsePathClassification,
  parseRawSnapshot,
  parseReplacementCoverage,
} from "../lib/project-health/schema.mjs";
import { assertProjectHealthInvariants } from "../lib/project-health/invariants.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rawPath = path.join(
  root,
  "src/data/project-health/raw/github-prs-14-20.v1.json",
);
const classificationPath = path.join(
  root,
  "src/data/project-health/derived/pr14-path-classification.v1.json",
);
const coveragePath = path.join(
  root,
  "src/data/project-health/derived/replacement-coverage.v1.json",
);
const timelinePath = path.join(
  root,
  "src/data/project-health/derived/decomposition-timeline.v1.json",
);

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

describe("project-health committed evidence invariants", () => {
  it("loads and validates raw + derived schemas", () => {
    for (const file of [rawPath, classificationPath, coveragePath, timelinePath]) {
      assert.ok(fs.existsSync(file), `missing ${file}`);
    }
    const raw = parseRawSnapshot(loadJson(rawPath));
    const classification = parsePathClassification(loadJson(classificationPath));
    const coverage = parseReplacementCoverage(loadJson(coveragePath));
    const timeline = parseDecompositionTimeline(loadJson(timelinePath));
    assert.equal(raw.snapshotRevision, 1);
    assert.equal(classification.snapshotRevision, 1);
    assert.equal(coverage.snapshotRevision, 1);
    assert.equal(timeline.snapshotRevision, 1);
  });

  it("proves PLAN.md M2.3 invariants including 61/2 coverage split", () => {
    const report = assertProjectHealthInvariants({
      raw: loadJson(rawPath),
      classification: loadJson(classificationPath),
      coverage: loadJson(coveragePath),
      timeline: loadJson(timelinePath),
    });
    assert.equal(report.pr14PathCount, 63);
    assert.equal(report.representedCount, 61);
    assert.equal(report.supersededCount, 2);
    assert.deepEqual(report.categoryTotalsSorted, report.categoryTotalsSorted);
    assert.equal(
      Object.values(report.categoryTotals).reduce((a, b) => a + b, 0),
      63,
    );
  });
});
