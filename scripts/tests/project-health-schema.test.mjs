import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseRawSnapshot,
  parsePathClassification,
  parseDecompositionTimeline,
  parseReplacementCoverage,
  CATEGORIES,
  COVERAGE_STATUSES,
} from "../lib/project-health/schema.mjs";

const frozenRefs = {
  pr14Base: "6c86dc735064734d1eda250b471ab7bea7dc2d4f",
  pr14Head: "68a2911183b4e99455a0ea71940b66ec30f41dd5",
  integratedResult: "9eb485cd9b6207b52ff4408ee89647f32faae436",
};

describe("raw snapshot schema", () => {
  const cases = [
    {
      name: "accepts minimal valid snapshot",
      input: {
        schemaVersion: 1,
        snapshotRevision: 1,
        generatedAt: "2026-07-26T21:00:00.000Z",
        repository: "tyson-hu/Eazy-Review",
        frozenRefs,
        verification: {
          ok: true,
          checkedAt: "2026-07-26T21:00:00.000Z",
          results: [
            {
              kind: "pull_request",
              number: 14,
              ok: true,
              detail: "exists",
            },
          ],
        },
        pullRequests: [
          {
            number: 14,
            url: "https://github.com/tyson-hu/Eazy-Review/pull/14",
            title: "Plan packetized Supabase foundation and skill-wrapper validation",
            state: "CLOSED",
            merged: false,
            createdAt: "2026-07-25T02:33:59Z",
            closedAt: "2026-07-26T04:03:45Z",
            mergedAt: null,
            baseRefOid: frozenRefs.pr14Base,
            headRefOid: frozenRefs.pr14Head,
            mergeCommitOid: null,
            additions: 4665,
            deletions: 912,
            changedFiles: 1,
            files: [
              {
                path: "README.md",
                status: "modified",
                additions: 1,
                deletions: 0,
                changes: 1,
              },
            ],
            commits: [],
            checks: [],
            issueComments: [],
            reviews: [],
          },
        ],
      },
      ok: true,
    },
    {
      name: "rejects editorial category fields on raw files",
      input: {
        schemaVersion: 1,
        snapshotRevision: 1,
        generatedAt: "2026-07-26T21:00:00.000Z",
        repository: "tyson-hu/Eazy-Review",
        frozenRefs,
        verification: { ok: true, checkedAt: "2026-07-26T21:00:00.000Z", results: [] },
        pullRequests: [
          {
            number: 14,
            url: "https://github.com/tyson-hu/Eazy-Review/pull/14",
            title: "x",
            state: "CLOSED",
            merged: false,
            createdAt: "2026-07-25T02:33:59Z",
            closedAt: "2026-07-26T04:03:45Z",
            mergedAt: null,
            baseRefOid: frozenRefs.pr14Base,
            headRefOid: frozenRefs.pr14Head,
            mergeCommitOid: null,
            additions: 1,
            deletions: 0,
            changedFiles: 1,
            files: [
              {
                path: "README.md",
                status: "modified",
                additions: 1,
                deletions: 0,
                changes: 1,
                category: "product code",
              },
            ],
            commits: [],
            checks: [],
            issueComments: [],
            reviews: [],
          },
        ],
      },
      ok: false,
    },
    {
      name: "rejects short commit SHAs",
      input: {
        schemaVersion: 1,
        snapshotRevision: 1,
        generatedAt: "2026-07-26T21:00:00.000Z",
        repository: "tyson-hu/Eazy-Review",
        frozenRefs: {
          pr14Base: "6c86dc7",
          pr14Head: frozenRefs.pr14Head,
          integratedResult: frozenRefs.integratedResult,
        },
        verification: { ok: true, checkedAt: "2026-07-26T21:00:00.000Z", results: [] },
        pullRequests: [],
      },
      ok: false,
    },
  ];

  for (const tc of cases) {
    it(tc.name, () => {
      if (tc.ok) {
        const parsed = parseRawSnapshot(tc.input);
        assert.equal(parsed.schemaVersion, 1);
        assert.equal(parsed.repository, "tyson-hu/Eazy-Review");
      } else {
        assert.throws(() => parseRawSnapshot(tc.input));
      }
    });
  }
});

describe("derived schemas", () => {
  it("accepts known classification categories only", () => {
    assert.deepEqual(
      [...CATEGORIES].sort(),
      [
        "agent/tooling",
        "canonical product/data documents",
        "CI/dependencies",
        "decision governance",
        "product code",
      ].sort(),
    );
    const parsed = parsePathClassification({
      schemaVersion: 1,
      snapshotRevision: 1,
      sourceSnapshot: "../raw/github-prs-14-20.v1.json",
      repository: "tyson-hu/Eazy-Review",
      sourceCommit: frozenRefs.pr14Head,
      classificationMethod:
        "Manual path classification with mutually exclusive categories",
      paths: [
        { path: "app/(tabs)/browse.tsx", category: "product code" },
      ],
    });
    assert.equal(parsed.paths.length, 1);
    assert.throws(() =>
      parsePathClassification({
        schemaVersion: 1,
        snapshotRevision: 1,
        sourceSnapshot: "../raw/github-prs-14-20.v1.json",
        repository: "tyson-hu/Eazy-Review",
        sourceCommit: frozenRefs.pr14Head,
        classificationMethod: "x",
        paths: [{ path: "x", category: "misc" }],
      }),
    );
  });

  it("accepts coverage statuses only", () => {
    assert.deepEqual([...COVERAGE_STATUSES].sort(), ["represented", "superseded"].sort());
    const parsed = parseReplacementCoverage({
      schemaVersion: 1,
      snapshotRevision: 1,
      sourceSnapshot: "../raw/github-prs-14-20.v1.json",
      repository: "tyson-hu/Eazy-Review",
      paths: [
        {
          path: "docs/API_CONTRACTS.md",
          status: "represented",
          replacementPrs: [16, 19],
          notes: "Overlapping ownership; not additive",
        },
        {
          path: "scripts/check-skill-wrappers.cjs",
          status: "superseded",
          replacementPrs: [17],
          notes: "Replaced by manifest-based generation",
        },
      ],
    });
    assert.equal(parsed.paths.length, 2);
  });

  it("requires timeline events to carry raw identifiers", () => {
    const parsed = parseDecompositionTimeline({
      schemaVersion: 1,
      snapshotRevision: 1,
      sourceSnapshot: "../raw/github-prs-14-20.v1.json",
      repository: "tyson-hu/Eazy-Review",
      events: [
        {
          id: "pr-14-closed",
          at: "2026-07-26T04:03:45Z",
          kind: "pr_closed",
          pullRequest: 14,
          rawRef: "pullRequests[number=14].closedAt",
          label: "PR #14 closed without merge",
        },
      ],
    });
    assert.equal(parsed.events[0].rawRef, "pullRequests[number=14].closedAt");
    assert.throws(() =>
      parseDecompositionTimeline({
        schemaVersion: 1,
        snapshotRevision: 1,
        sourceSnapshot: "../raw/github-prs-14-20.v1.json",
        repository: "tyson-hu/Eazy-Review",
        events: [
          {
            id: "x",
            at: "2026-07-26T04:03:45Z",
            kind: "pr_closed",
            pullRequest: 14,
            label: "missing rawRef",
          },
        ],
      }),
    );
  });
});
