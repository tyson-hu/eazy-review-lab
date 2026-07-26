import {
  parseDecompositionTimeline,
  parsePathClassification,
  parseRawSnapshot,
  parseReplacementCoverage,
} from "./schema.mjs";

function fail(message) {
  throw new Error(message);
}

/**
 * Deterministic invariant checks for PLAN.md M2.3.
 */
export function assertProjectHealthInvariants({
  raw: rawInput,
  classification: classificationInput,
  coverage: coverageInput,
  timeline: timelineInput,
}) {
  const raw = parseRawSnapshot(rawInput);
  const classification = parsePathClassification(classificationInput);
  const coverage = parseReplacementCoverage(coverageInput);
  const timeline = parseDecompositionTimeline(timelineInput);

  if (classification.snapshotRevision !== raw.snapshotRevision) {
    fail(
      `classification snapshotRevision ${classification.snapshotRevision} does not match raw ${raw.snapshotRevision}`,
    );
  }
  if (coverage.snapshotRevision !== raw.snapshotRevision) {
    fail(
      `coverage snapshotRevision ${coverage.snapshotRevision} does not match raw ${raw.snapshotRevision}`,
    );
  }
  if (timeline.snapshotRevision !== raw.snapshotRevision) {
    fail(
      `timeline snapshotRevision ${timeline.snapshotRevision} does not match raw ${raw.snapshotRevision}`,
    );
  }

  for (const derived of [classification, coverage, timeline]) {
    if (!derived.sourceSnapshot.includes(`github-prs-14-20.v${raw.snapshotRevision}.json`)) {
      fail(
        `derived sourceSnapshot ${derived.sourceSnapshot} does not declare raw revision v${raw.snapshotRevision}`,
      );
    }
    if (derived.repository !== raw.repository) {
      fail(`derived repository mismatch: ${derived.repository}`);
    }
  }

  if (classification.sourceCommit !== raw.frozenRefs.pr14Head) {
    fail(
      `classification sourceCommit must be PR #14 head ${raw.frozenRefs.pr14Head}`,
    );
  }

  const pr14 = raw.pullRequests.find((p) => p.number === 14);
  if (!pr14) fail("raw snapshot missing PR #14");
  const rawPaths = pr14.files.map((f) => f.path);
  if (rawPaths.length !== 63) fail(`expected 63 PR #14 paths, got ${rawPaths.length}`);
  if (pr14.changedFiles !== 63) fail(`PR #14 changedFiles expected 63, got ${pr14.changedFiles}`);
  if (pr14.additions !== 4665 || pr14.deletions !== 912) {
    fail(
      `PR #14 diff expected +4665/-912, got +${pr14.additions}/-${pr14.deletions}`,
    );
  }
  if (pr14.state !== "CLOSED" || pr14.merged !== false) {
    fail("PR #14 must be closed without merge in raw snapshot");
  }

  const rawSet = new Set(rawPaths);
  if (rawSet.size !== rawPaths.length) fail("duplicate paths in raw PR #14 files");

  const classPaths = classification.paths.map((p) => p.path);
  const classSet = new Set(classPaths);
  if (classPaths.length !== 63) fail(`classification expected 63 paths, got ${classPaths.length}`);
  if (classSet.size !== 63) fail("duplicate classification paths");
  for (const p of classPaths) {
    if (!rawSet.has(p)) fail(`classified path absent from raw snapshot: ${p}`);
  }
  for (const p of rawPaths) {
    if (!classSet.has(p)) fail(`raw path missing from classification: ${p}`);
  }

  const categoryTotals = Object.create(null);
  for (const entry of classification.paths) {
    categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + 1;
  }
  const categorySum = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  if (categorySum !== 63) fail(`category totals ${categorySum} != 63`);

  const coveragePaths = coverage.paths.map((p) => p.path);
  const coverageSet = new Set(coveragePaths);
  if (coveragePaths.length !== 63) fail(`coverage expected 63 paths, got ${coveragePaths.length}`);
  if (coverageSet.size !== 63) fail("duplicate coverage paths");
  for (const p of coveragePaths) {
    if (!rawSet.has(p)) fail(`coverage path absent from raw snapshot: ${p}`);
  }
  for (const p of rawPaths) {
    if (!coverageSet.has(p)) fail(`raw path missing from coverage: ${p}`);
  }

  const represented = coverage.paths.filter((p) => p.status === "represented");
  const superseded = coverage.paths.filter((p) => p.status === "superseded");
  if (represented.length !== 61) {
    fail(`expected 61 represented paths, got ${represented.length}`);
  }
  if (superseded.length !== 2) {
    fail(`expected 2 superseded paths, got ${superseded.length}`);
  }

  const rawPrNumbers = new Set(raw.pullRequests.map((p) => p.number));
  for (const entry of coverage.paths) {
    if (entry.status === "superseded" && !entry.notes.trim()) {
      fail(`superseded path missing rationale: ${entry.path}`);
    }
    if (entry.status === "represented" && entry.replacementPrs.length === 0) {
      fail(`represented path missing replacement PRs: ${entry.path}`);
    }
    for (const n of entry.replacementPrs) {
      if (!rawPrNumbers.has(n)) {
        fail(`coverage references missing replacement PR #${n} for ${entry.path}`);
      }
      if (n === 14) fail(`coverage must not list PR #14 as replacement for ${entry.path}`);
    }
  }

  const prByNumber = new Map(raw.pullRequests.map((p) => [p.number, p]));
  for (const event of timeline.events) {
    const pr = prByNumber.get(event.pullRequest);
    if (!pr) fail(`timeline event ${event.id} references missing PR #${event.pullRequest}`);
    if (!event.rawRef.includes(`pullRequests[number=${event.pullRequest}]`)) {
      fail(`timeline event ${event.id} rawRef must identify PR #${event.pullRequest}`);
    }
    if (event.kind === "pr_closed" && pr.closedAt !== event.at) {
      fail(`timeline event ${event.id} timestamp ${event.at} != raw closedAt ${pr.closedAt}`);
    }
    if (event.kind === "pr_merged" && pr.mergedAt !== event.at) {
      fail(`timeline event ${event.id} timestamp ${event.at} != raw mergedAt ${pr.mergedAt}`);
    }
    if (event.kind === "pr_created" && pr.createdAt !== event.at) {
      fail(`timeline event ${event.id} timestamp ${event.at} != raw createdAt ${pr.createdAt}`);
    }
  }

  // Charts must read derived records; expose totals computed from those records only.
  return {
    pr14PathCount: rawPaths.length,
    representedCount: represented.length,
    supersededCount: superseded.length,
    categoryTotals,
    categoryTotalsSorted: Object.fromEntries(
      Object.entries(categoryTotals).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    ),
  };
}
