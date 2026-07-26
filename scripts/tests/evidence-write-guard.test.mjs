import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import {
  findPublishedEvidenceConsumers,
  resolveSnapshotOutputPath,
  assertCanWriteSnapshot,
} from "../lib/project-health/evidence-write-guard.mjs";

describe("evidence write guard", () => {
  it("detects published reports that pin a raw snapshot path", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "erl-evidence-"));
    const report = path.join(dir, "pr-14-project-health.mdx");
    fs.writeFileSync(
      report,
      `---
title: Report
draft: false
aiGenerated: true
humanReviewedAt: 2026-07-26T12:00:00-04:00
reviewedBy: Tyson Hu
kind: report
evidenceSnapshot: src/data/project-health/raw/github-prs-14-20.v1.json
---

body
`,
    );
    const consumers = findPublishedEvidenceConsumers(
      dir,
      "src/data/project-health/raw/github-prs-14-20.v1.json",
    );
    assert.equal(consumers.length, 1);
    assert.match(consumers[0], /pr-14-project-health\.mdx$/);
  });

  it("ignores draft reports when checking published consumers", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "erl-evidence-"));
    fs.writeFileSync(
      path.join(dir, "draft.mdx"),
      `---
title: Draft
draft: true
aiGenerated: true
kind: report
evidenceSnapshot: src/data/project-health/raw/github-prs-14-20.v1.json
---

body
`,
    );
    const consumers = findPublishedEvidenceConsumers(
      dir,
      "src/data/project-health/raw/github-prs-14-20.v1.json",
    );
    assert.equal(consumers.length, 0);
  });

  it("never overwrites an existing snapshot file", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "erl-root-"));
    const rawDir = path.join(root, "src/data/project-health/raw");
    fs.mkdirSync(rawDir, { recursive: true });
    const existing = path.join(rawDir, "github-prs-14-20.v1.json");
    fs.writeFileSync(existing, "{}\n");
    const next = resolveSnapshotOutputPath(root, 1);
    assert.equal(path.basename(next), "github-prs-14-20.v2.json");
    assert.throws(
      () => assertCanWriteSnapshot(existing, []),
      /refuses to overwrite/,
    );
  });

  it("refuses writes when a published report consumes the target revision", () => {
    const target = "/tmp/fake/github-prs-14-20.v1.json";
    assert.throws(
      () =>
        assertCanWriteSnapshot(target, [
          "src/content/docs/reports/pr-14-project-health.mdx",
        ]),
      /published report/,
    );
  });
});
