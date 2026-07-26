#!/usr/bin/env node
/**
 * Explicit networked GitHub evidence refresh for Eazy Review Lab.
 *
 * Never invoked by build, check, CI, or deploy. Writes a new immutable raw
 * snapshot revision and refuses to overwrite existing or published evidence.
 * Credentials/tokens are never written into the snapshot.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertCanWriteSnapshot,
  findPublishedEvidenceConsumers,
  resolveSnapshotOutputPath,
} from "./lib/project-health/evidence-write-guard.mjs";
import { normalizeRawSnapshot, stableStringify } from "./lib/project-health/normalize.mjs";
import { parseRawSnapshot } from "./lib/project-health/schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "tyson-hu";
const REPO = "Eazy-Review";
const REPOSITORY = `${OWNER}/${REPO}`;
const PR_NUMBERS = [14, 15, 16, 17, 18, 19, 20];
const FROZEN_REFS = {
  pr14Base: "6c86dc735064734d1eda250b471ab7bea7dc2d4f",
  pr14Head: "68a2911183b4e99455a0ea71940b66ec30f41dd5",
  integratedResult: "9eb485cd9b6207b52ff4408ee89647f32faae436",
};

function ghJson(args) {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    throw new Error(`gh ${args.join(" ")} failed: ${err || `exit ${result.status}`}`);
  }
  return JSON.parse(result.stdout);
}

function fetchPullRequest(number) {
  return ghJson([
    "api",
    `repos/${REPOSITORY}/pulls/${number}`,
  ]);
}

function fetchPullFiles(number) {
  const files = [];
  let page = 1;
  for (;;) {
    const batch = ghJson([
      "api",
      `repos/${REPOSITORY}/pulls/${number}/files?per_page=100&page=${page}`,
    ]);
    if (!Array.isArray(batch) || batch.length === 0) break;
    files.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return files;
}

function fetchPullCommits(number) {
  const commits = [];
  let page = 1;
  for (;;) {
    const batch = ghJson([
      "api",
      `repos/${REPOSITORY}/pulls/${number}/commits?per_page=100&page=${page}`,
    ]);
    if (!Array.isArray(batch) || batch.length === 0) break;
    commits.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return commits;
}

function fetchIssueComments(number) {
  return ghJson([
    "api",
    `repos/${REPOSITORY}/issues/${number}/comments?per_page=100`,
  ]);
}

function fetchReviews(number) {
  return ghJson([
    "api",
    `repos/${REPOSITORY}/pulls/${number}/reviews?per_page=100`,
  ]);
}

function fetchChecks(headSha) {
  try {
    const payload = ghJson([
      "api",
      `repos/${REPOSITORY}/commits/${headSha}/check-runs?per_page=100`,
    ]);
    return payload.check_runs ?? [];
  } catch (error) {
    // Fall back to empty observation rather than inventing check results.
    return {
      error: String(error.message || error),
      check_runs: [],
    };
  }
}

function verifyCommit(sha) {
  try {
    const commit = ghJson(["api", `repos/${REPOSITORY}/commits/${sha}`]);
    return {
      kind: "commit",
      sha,
      ok: Boolean(commit?.sha),
      detail: commit?.sha === sha ? "exists" : `resolved as ${commit?.sha ?? "unknown"}`,
    };
  } catch (error) {
    return {
      kind: "commit",
      sha,
      ok: false,
      detail: String(error.message || error),
    };
  }
}

function mapState(pr) {
  if (pr.merged_at || pr.merged) return "MERGED";
  if (pr.state === "open") return "OPEN";
  return "CLOSED";
}

function mapPullRequest(number, pr, files, commits, comments, reviews, checks) {
  const checkRuns = Array.isArray(checks) ? checks : checks.check_runs;
  return {
    number,
    url: pr.html_url,
    title: pr.title,
    state: mapState(pr),
    merged: Boolean(pr.merged_at || pr.merged),
    createdAt: pr.created_at,
    closedAt: pr.closed_at,
    mergedAt: pr.merged_at,
    baseRefOid: pr.base.sha,
    headRefOid: pr.head.sha,
    mergeCommitOid: pr.merge_commit_sha || null,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changed_files,
    files: files.map((f) => ({
      path: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
    })),
    commits: commits.map((c) => ({
      oid: c.sha,
      committedDate: c.commit?.committer?.date || c.commit?.author?.date || "",
      messageHeadline: (c.commit?.message || "").split("\n")[0] || "",
      authors: [
        {
          login: c.author?.login ?? null,
          name: c.commit?.author?.name ?? null,
        },
      ],
    })),
    checks: checkRuns.map((run) => ({
      name: run.name,
      state: run.status,
      conclusion: run.conclusion ?? null,
      detailsUrl: run.details_url ?? run.html_url ?? null,
    })),
    issueComments: comments.map((c) => ({
      id: c.id,
      author: c.user?.login ?? null,
      createdAt: c.created_at,
      body: c.body ?? "",
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      author: r.user?.login ?? null,
      state: r.state,
      submittedAt: r.submitted_at,
      body: r.body ?? null,
    })),
  };
}

function buildSnapshot(generatedAt) {
  const verificationResults = [];
  const pullRequests = [];

  for (const number of PR_NUMBERS) {
    let pr;
    try {
      pr = fetchPullRequest(number);
      verificationResults.push({
        kind: "pull_request",
        number,
        ok: true,
        detail: `exists state=${pr.state} merged=${Boolean(pr.merged_at)}`,
      });
    } catch (error) {
      verificationResults.push({
        kind: "pull_request",
        number,
        ok: false,
        detail: String(error.message || error),
      });
      continue;
    }

    const files = fetchPullFiles(number);
    const commits = fetchPullCommits(number);
    const comments = fetchIssueComments(number);
    const reviews = fetchReviews(number);
    const checks = fetchChecks(pr.head.sha);
    pullRequests.push(
      mapPullRequest(number, pr, files, commits, comments, reviews, checks),
    );
  }

  for (const sha of Object.values(FROZEN_REFS)) {
    verificationResults.push(verifyCommit(sha));
  }

  const snapshot = {
    schemaVersion: 1,
    snapshotRevision: 1,
    generatedAt,
    repository: REPOSITORY,
    frozenRefs: { ...FROZEN_REFS },
    verification: {
      ok: verificationResults.every((r) => r.ok),
      checkedAt: generatedAt,
      results: verificationResults,
    },
    pullRequests,
  };

  return snapshot;
}

function assertFrozenFacts(snapshot) {
  const pr14 = snapshot.pullRequests.find((p) => p.number === 14);
  if (!pr14) throw new Error("PR #14 missing from fetched snapshot");
  const expectations = [
    ["repository", snapshot.repository, REPOSITORY],
    ["pr14.base", pr14.baseRefOid, FROZEN_REFS.pr14Base],
    ["pr14.head", pr14.headRefOid, FROZEN_REFS.pr14Head],
    ["pr14.state", pr14.state, "CLOSED"],
    ["pr14.merged", pr14.merged, false],
    ["pr14.changedFiles", pr14.changedFiles, 63],
    ["pr14.files.length", pr14.files.length, 63],
    ["pr14.additions", pr14.additions, 4665],
    ["pr14.deletions", pr14.deletions, 912],
    [
      "integratedResult commit verified",
      snapshot.verification.results.some(
        (r) =>
          r.kind === "commit" &&
          r.sha === FROZEN_REFS.integratedResult &&
          r.ok,
      ),
      true,
    ],
  ];
  for (const [label, actual, expected] of expectations) {
    if (actual !== expected) {
      throw new Error(
        `Frozen fact mismatch for ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      );
    }
  }
  for (const n of [15, 16, 17, 18, 19, 20]) {
    if (!snapshot.pullRequests.some((p) => p.number === n)) {
      throw new Error(`Replacement PR #${n} missing from fetched snapshot`);
    }
  }
}

function main() {
  const generatedAt = new Date().toISOString();
  console.log(`Refreshing GitHub evidence for ${REPOSITORY} at ${generatedAt}`);

  const targetPath = resolveSnapshotOutputPath(root, 1);
  const relPath = path.relative(root, targetPath).replace(/\\/g, "/");
  const docsRoot = path.join(root, "src/content/docs");
  const publishedConsumers = findPublishedEvidenceConsumers(docsRoot, relPath);
  assertCanWriteSnapshot(targetPath, publishedConsumers);

  const draft = buildSnapshot(generatedAt);
  const revision = Number(
    path.basename(targetPath).match(/\.v(\d+)\.json$/)?.[1] || "1",
  );
  draft.snapshotRevision = revision;

  const normalized = normalizeRawSnapshot(draft);
  assertFrozenFacts(normalized);
  if (!normalized.verification.ok) {
    throw new Error("Remote verification failed; refusing to write snapshot");
  }
  const parsed = parseRawSnapshot(normalized);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, stableStringify(parsed));
  console.log(`Wrote immutable raw snapshot: ${relPath}`);
  console.log(
    `Verified PR #14: 63 paths, +${parsed.pullRequests.find((p) => p.number === 14).additions}/-${parsed.pullRequests.find((p) => p.number === 14).deletions}, closed without merge`,
  );
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
