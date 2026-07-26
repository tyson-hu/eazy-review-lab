import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProjectHealthVisuals } from "../build-project-health-visuals.mjs";

describe("project-health visuals", () => {
  it("derives bar totals from classification records rather than hard-coded summary numbers", () => {
    const assets = buildProjectHealthVisuals();
    const sum = assets.filesByArea.rows.reduce((n, row) => n + row.count, 0);
    assert.equal(sum, 63);
    assert.equal(assets.filesByArea.rows.length, 5);
    assert.match(assets.filesByArea.contents, /PR #14 changed files by area/);
    assert.match(assets.filesByArea.contents, /role="img"/);
  });

  it("embeds raw snapshot identifiers from timeline events", () => {
    const assets = buildProjectHealthVisuals();
    assert.ok(assets.timeline.events.length >= 2);
    for (const event of assets.timeline.events) {
      assert.match(event.rawRef, /pullRequests\[number=\d+\]/);
      assert.match(assets.timeline.contents, new RegExp(event.rawRef.replace(/[[\]]/g, "\\$&")));
    }
    assert.match(assets.timeline.contents, /Decomposition timeline/);
  });
});
