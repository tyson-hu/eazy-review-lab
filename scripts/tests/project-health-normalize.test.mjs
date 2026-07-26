import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeRawSnapshot } from "../lib/project-health/normalize.mjs";

describe("normalizeRawSnapshot", () => {
  const cases = [
    {
      name: "sorts pull requests, files, and commits deterministically",
      input: {
        schemaVersion: 1,
        snapshotRevision: 1,
        generatedAt: "2026-07-26T21:00:00.000Z",
        repository: "tyson-hu/Eazy-Review",
        frozenRefs: {
          pr14Base: "6c86dc735064734d1eda250b471ab7bea7dc2d4f",
          pr14Head: "68a2911183b4e99455a0ea71940b66ec30f41dd5",
          integratedResult: "9eb485cd9b6207b52ff4408ee89647f32faae436",
        },
        verification: {
          ok: true,
          checkedAt: "2026-07-26T21:00:00.000Z",
          results: [
            { kind: "commit", sha: "bb", ok: true, detail: "exists" },
            { kind: "commit", sha: "aa", ok: true, detail: "exists" },
            { kind: "pull_request", number: 20, ok: true, detail: "exists" },
            { kind: "pull_request", number: 14, ok: true, detail: "exists" },
          ],
        },
        pullRequests: [
          {
            number: 20,
            url: "https://github.com/tyson-hu/Eazy-Review/pull/20",
            title: "b",
            state: "MERGED",
            merged: true,
            createdAt: "2026-07-26T04:44:46Z",
            closedAt: "2026-07-26T14:04:38Z",
            mergedAt: "2026-07-26T14:04:38Z",
            baseRefOid: "0f3a47311d88c411dce0d4293585d265e17a370b",
            headRefOid: "37f0289342c1cf11a8e5547f5f09b4fbaf5f0b59",
            mergeCommitOid: "5f548ba937b612742ceb97e0771d69384b0dfca2",
            additions: 1,
            deletions: 0,
            changedFiles: 2,
            files: [
              {
                path: "z.md",
                status: "modified",
                additions: 1,
                deletions: 0,
                changes: 1,
              },
              {
                path: "a.md",
                status: "modified",
                additions: 0,
                deletions: 0,
                changes: 0,
              },
            ],
            commits: [
              {
                oid: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                committedDate: "2026-07-26T14:02:07Z",
                messageHeadline: "second",
                authors: [{ login: "tyson-hu", name: "Tyson Hu" }],
              },
              {
                oid: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                committedDate: "2026-07-26T04:44:06Z",
                messageHeadline: "first",
                authors: [{ login: "tyson-hu", name: "Tyson Hu" }],
              },
            ],
            checks: [
              {
                name: "validate",
                state: "SUCCESS",
                conclusion: "success",
                detailsUrl: "https://example.com/2",
              },
              {
                name: "lint",
                state: "SUCCESS",
                conclusion: "success",
                detailsUrl: "https://example.com/1",
              },
            ],
            issueComments: [],
            reviews: [],
          },
          {
            number: 14,
            url: "https://github.com/tyson-hu/Eazy-Review/pull/14",
            title: "a",
            state: "CLOSED",
            merged: false,
            createdAt: "2026-07-25T02:33:59Z",
            closedAt: "2026-07-26T04:03:45Z",
            mergedAt: null,
            baseRefOid: "6c86dc735064734d1eda250b471ab7bea7dc2d4f",
            headRefOid: "68a2911183b4e99455a0ea71940b66ec30f41dd5",
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
              },
            ],
            commits: [],
            checks: [],
            issueComments: [
              {
                id: 2,
                author: "tyson-hu",
                createdAt: "2026-07-26T04:03:36Z",
                body: "closing",
              },
              {
                id: 1,
                author: "cursor",
                createdAt: "2026-07-25T03:27:22Z",
                body: "bot",
              },
            ],
            reviews: [
              {
                id: 20,
                author: "bot",
                state: "COMMENTED",
                submittedAt: "2026-07-25T03:00:00Z",
                body: "later",
              },
              {
                id: 10,
                author: "bot",
                state: "COMMENTED",
                submittedAt: "2026-07-25T02:00:00Z",
                body: "earlier",
              },
            ],
          },
        ],
      },
      expectOrder: {
        prNumbers: [14, 20],
        verificationKinds: ["commit", "commit", "pull_request", "pull_request"],
        verificationKeys: ["aa", "bb", "14", "20"],
        pr14CommentIds: [1, 2],
        pr14ReviewIds: [10, 20],
        pr20FilePaths: ["a.md", "z.md"],
        pr20CommitOids: [
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        ],
        pr20CheckNames: ["lint", "validate"],
      },
    },
  ];

  for (const tc of cases) {
    it(tc.name, () => {
      const out = normalizeRawSnapshot(tc.input);
      assert.deepEqual(
        out.pullRequests.map((p) => p.number),
        tc.expectOrder.prNumbers,
      );
      assert.deepEqual(
        out.verification.results.map((r) => r.kind),
        tc.expectOrder.verificationKinds,
      );
      assert.deepEqual(
        out.verification.results.map((r) =>
          r.kind === "commit" ? r.sha : String(r.number),
        ),
        tc.expectOrder.verificationKeys,
      );
      const pr14 = out.pullRequests.find((p) => p.number === 14);
      const pr20 = out.pullRequests.find((p) => p.number === 20);
      assert.deepEqual(
        pr14.issueComments.map((c) => c.id),
        tc.expectOrder.pr14CommentIds,
      );
      assert.deepEqual(
        pr14.reviews.map((r) => r.id),
        tc.expectOrder.pr14ReviewIds,
      );
      assert.deepEqual(
        pr20.files.map((f) => f.path),
        tc.expectOrder.pr20FilePaths,
      );
      assert.deepEqual(
        pr20.commits.map((c) => c.oid),
        tc.expectOrder.pr20CommitOids,
      );
      assert.deepEqual(
        pr20.checks.map((c) => c.name),
        tc.expectOrder.pr20CheckNames,
      );
    });
  }
});
