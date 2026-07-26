import { z } from "zod";

const FULL_SHA = z
  .string()
  .regex(/^[a-f0-9]{40}$/, "expected full 40-character lowercase hex SHA");

const ISO_INSTANT = z.string().datetime({ offset: true });

export const CATEGORIES = Object.freeze([
  "product code",
  "canonical product/data documents",
  "decision governance",
  "agent/tooling",
  "CI/dependencies",
]);

export const COVERAGE_STATUSES = Object.freeze(["represented", "superseded"]);

const changedFileSchema = z
  .object({
    path: z.string().min(1),
    status: z.string().min(1),
    additions: z.number().int().nonnegative(),
    deletions: z.number().int().nonnegative(),
    changes: z.number().int().nonnegative(),
  })
  .strict();

const commitSchema = z
  .object({
    oid: FULL_SHA,
    committedDate: z.string().min(1),
    messageHeadline: z.string(),
    authors: z.array(
      z
        .object({
          login: z.string().nullable().optional(),
          name: z.string().nullable().optional(),
        })
        .strict(),
    ),
  })
  .strict();

const checkSchema = z
  .object({
    name: z.string().min(1),
    state: z.string().min(1),
    conclusion: z.string().nullable(),
    detailsUrl: z.string().nullable(),
  })
  .strict();

const issueCommentSchema = z
  .object({
    id: z.number().int(),
    author: z.string().nullable(),
    createdAt: z.string().min(1),
    body: z.string(),
  })
  .strict();

const reviewSchema = z
  .object({
    id: z.number().int(),
    author: z.string().nullable(),
    state: z.string().min(1),
    submittedAt: z.string().nullable(),
    body: z.string().nullable(),
  })
  .strict();

const pullRequestSchema = z
  .object({
    number: z.number().int().positive(),
    url: z.string().url(),
    title: z.string().min(1),
    state: z.enum(["OPEN", "CLOSED", "MERGED"]),
    merged: z.boolean(),
    createdAt: z.string().min(1),
    closedAt: z.string().nullable(),
    mergedAt: z.string().nullable(),
    baseRefOid: FULL_SHA,
    headRefOid: FULL_SHA,
    mergeCommitOid: FULL_SHA.nullable(),
    additions: z.number().int().nonnegative(),
    deletions: z.number().int().nonnegative(),
    changedFiles: z.number().int().nonnegative(),
    files: z.array(changedFileSchema),
    commits: z.array(commitSchema),
    checks: z.array(checkSchema),
    issueComments: z.array(issueCommentSchema),
    reviews: z.array(reviewSchema),
  })
  .strict();

const verificationResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("pull_request"),
      number: z.number().int().positive(),
      ok: z.boolean(),
      detail: z.string(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("commit"),
      sha: FULL_SHA,
      ok: z.boolean(),
      detail: z.string(),
    })
    .strict(),
]);

export const rawSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    snapshotRevision: z.number().int().positive(),
    generatedAt: ISO_INSTANT,
    repository: z.literal("tyson-hu/Eazy-Review"),
    frozenRefs: z
      .object({
        pr14Base: FULL_SHA,
        pr14Head: FULL_SHA,
        integratedResult: FULL_SHA,
      })
      .strict(),
    verification: z
      .object({
        ok: z.boolean(),
        checkedAt: ISO_INSTANT,
        results: z.array(verificationResultSchema),
      })
      .strict(),
    pullRequests: z.array(pullRequestSchema),
  })
  .strict();

export const pathClassificationSchema = z
  .object({
    schemaVersion: z.literal(1),
    snapshotRevision: z.number().int().positive(),
    sourceSnapshot: z.string().min(1),
    repository: z.literal("tyson-hu/Eazy-Review"),
    sourceCommit: FULL_SHA,
    classificationMethod: z.string().min(1),
    paths: z.array(
      z
        .object({
          path: z.string().min(1),
          category: z.enum(CATEGORIES),
        })
        .strict(),
    ),
  })
  .strict();

export const replacementCoverageSchema = z
  .object({
    schemaVersion: z.literal(1),
    snapshotRevision: z.number().int().positive(),
    sourceSnapshot: z.string().min(1),
    repository: z.literal("tyson-hu/Eazy-Review"),
    paths: z.array(
      z
        .object({
          path: z.string().min(1),
          status: z.enum(COVERAGE_STATUSES),
          replacementPrs: z.array(z.number().int().positive()),
          notes: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

export const decompositionTimelineSchema = z
  .object({
    schemaVersion: z.literal(1),
    snapshotRevision: z.number().int().positive(),
    sourceSnapshot: z.string().min(1),
    repository: z.literal("tyson-hu/Eazy-Review"),
    events: z.array(
      z
        .object({
          id: z.string().min(1),
          at: z.string().min(1),
          kind: z.enum(["pr_created", "pr_closed", "pr_merged"]),
          pullRequest: z.number().int().positive(),
          rawRef: z.string().min(1),
          label: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

function parse(schema, input, label) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`${label} schema validation failed: ${detail}`);
  }
  return result.data;
}

export function parseRawSnapshot(input) {
  return parse(rawSnapshotSchema, input, "raw snapshot");
}

export function parsePathClassification(input) {
  return parse(pathClassificationSchema, input, "path classification");
}

export function parseReplacementCoverage(input) {
  return parse(replacementCoverageSchema, input, "replacement coverage");
}

export function parseDecompositionTimeline(input) {
  return parse(decompositionTimelineSchema, input, "decomposition timeline");
}
