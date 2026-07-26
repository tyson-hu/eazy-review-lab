# Eazy Review Lab Handoff

> Prepared: 2026-07-26  
> Revision basis: Final architecture review — substantially approved with targeted edits  
> Revision date: 2026-07-26  
> Workspace: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab`  
> Detailed plan: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab/PLAN.md`  
> State: Revised planning files only; implementation not started

## Start Here

Read `PLAN.md` completely before taking action.

This handoff records an approved design, including the final targeted review
edits, for a separate Nimbus-based Eazy Review development lab. It does
**not**, by itself, authorize implementation. In the new session, confirm that
the user's current request explicitly asks to begin implementation.

If the user only asks to review or restate the plan, do not scaffold, install,
initialize Git, create a remote, deploy, or change external services.

## Revision Summary

An architecture review approved the direction but required the implementation
packet to be narrowed. The revised plan incorporates all twelve changes:

1. Delivery is split into M1 foundation, M2 flagship report, and M3 publishing
   integration.
2. Normal builds validate committed sources offline; remote source existence is
   checked only by an explicit manual refresh.
3. Raw GitHub evidence and derived editorial classification use separate
   versioned files.
4. Report headings and claims avoid unsupported causal conclusions.
5. The project overview is short and pinned to an exact Bluebook commit/path.
6. The live Nimbus CLI help is checked before using scaffold flags, and route
   removal is conditional on an actual duplicate.
7. AI approval is derived from `draft`, `aiGenerated`, `humanReviewedAt`, and
   `reviewedBy`; there is no manually maintained review-status enum.
8. Published evidence follows an immutable source-freeze contract.
9. Tests assert stable public behavior rather than Nimbus internal filenames or
   directory layouts.
10. Drafts pass branch CI; publication validation applies when content claims
    to be published.
11. A read-only local/repository/commit/remote preflight precedes scaffolding.
12. Every `workers.dev` or non-production preview remains noindexed.

The final review added these precision requirements:

1. Nimbus content collections and schema extensions use
   `src/content.config.ts`.
2. `replacement-coverage.v1.json` independently reproduces the 61 represented
   and two intentionally superseded PR #14 paths.
3. The raw snapshot uses explicit frozen base, head, and integrated-result refs
   rather than a misleading singular `sourceCommit`.
4. `publishedAt` is an ISO 8601 date-time with timezone.
5. The scaffolded root `AGENT.md` is retained and customized.
6. M2 sharing is private reviewer sharing; public indexed launch belongs to M3.
7. M3 deploys noindexed production first, verifies the custom domain, then
   rebuilds and redeploys with production indexing enabled.

## Requested Outcome

Build Option B:

- an independent `eazy-review-lab` repository;
- Nimbus/Astro content and navigation;
- Cloudflare Workers static-asset deployment;
- `lab.tianzhe.me` as the production custom domain;
- curated links plus RSS/JSON integration for the personal blog;
- templates for journals, reports, decisions, and experiments; and
- one flagship PR #14 project-health report with deterministic, accessible
  charts.

The work is delivered in three separate review units.

| Milestone | Scope | Completion gate |
|---|---|---|
| M1 | Site foundation and unindexed preview | Usable, placeholder-free site |
| M2 | Frozen evidence and human-approved flagship report | Accurate, reproducible report |
| M3 | Feeds, CI/CD, custom domain, blog contract | Healthy production site at `lab.tianzhe.me` |

## State at Handoff

The lab folder began completely empty. The only intended files at this handoff
are:

- `PLAN.md`; and
- `docs/notes/handoff.md`.

No Nimbus scaffold, dependency installation, Git initialization, GitHub remote,
Cloudflare authentication, Worker deployment, DNS change, app edit, or personal
blog edit has occurred.

At handoff time, the lab folder was not a Git repository.

## Adjacent Source Repository

Path:

`/Users/tysonhu/Documents/EazyCopProjects/eazy-review`

Verified state on 2026-07-26:

- branch: `master`;
- tracking: `origin/master`;
- working tree: clean;
- HEAD: `9eb485cd9b6207b52ff4408ee89647f32faae436`;
- remote: `https://github.com/tyson-hu/Eazy-Review.git`.

Treat that repository as read-only for this project. Its documents and Git
history may supply evidence, but do not modify it or bind the lab to it at
runtime.

Important source rules:

- read its `AGENTS.md` before inspecting it in a future session;
- preserve `Eazy Score`, `Community Score`, and `My Rating` exactly;
- use its current source-of-truth hierarchy;
- start decision research from generated `docs/DECISIONS.md`;
- keep factual evidence separate from interpretation; and
- do not claim application behavior that exists only in planning documents.

## User Choices Already Resolved

- **Repository model:** separate repository (Option B).
- **Delivery:** three milestones, with the first readable report after M2.
- **Hosting:** Cloudflare Workers with a custom production domain.
- **Blog bridge:** curated links plus RSS and JSON Feed in M3.
- **Production domain:** `lab.tianzhe.me`, unless a preflight conflict is found.

## Environment Snapshot

Verified locally on 2026-07-26:

```text
Node.js  v26.5.0
npm      11.17.0
pnpm     11.17.0
Git      2.50.1 (Apple Git-155)
```

During planning, a disposable scaffold outside the workspace was tested with:

- `@cloudflare/create-nimbus-docs` 0.6.3;
- `@cloudflare/nimbus-docs` 0.8.2;
- Astro 7.1.3;
- Wrangler 4.114.0; and
- Pagefind 1.5.2.

These are planning snapshots, not pinned requirements. In the implementation
session:

1. retrieve current Nimbus and Cloudflare documentation;
2. run `pnpm create nimbus-docs --help`;
3. use only flags confirmed by that output or use the interactive flow; and
4. inspect the generated routes before removing anything.

The planning scaffold passed:

- `pnpm run typecheck`;
- `pnpm run build`; and
- `pnpm run lint:docs`.

It produced a duplicate-root warning in that specific scaffold. The revised
plan makes the fix conditional: remove a generated home route only when the
actual implementation scaffold contains two `/` routes.

No globally installed Wrangler was available. Use the project-local dependency
through `pnpm exec`.

## M1 — Foundation Handoff

Before scaffolding, record read-only checks for:

1. current lab contents and Git state;
2. resolved `../eazy-review` top-level path;
3. normalized Eazy Review origin;
4. availability of the frozen base, head, and integrated commits;
5. clean or explicitly understood app working-tree state;
6. availability of the intended GitHub repository name; and
7. current Node, pnpm, Git, Nimbus CLI, and official docs.

M1 owns:

- Nimbus scaffold;
- site identity;
- homepage;
- Project, Journal, Reports, Decisions, and Experiments section pages;
- explicit navigation and App Source link;
- short pinned-source project overview;
- Eazy Review styling;
- minimal content/AI provenance schema;
- stable-behavior checks; and
- an unindexed `workers.dev` preview.

The preview must emit `noindex, nofollow` and a crawler-disallowing
`robots.txt`. Do not remove those guards until M3 verifies the custom domain.

## M2 — Evidence and Report Handoff

Working title:

> **Eazy Review Project Health Review: What PR #14 Revealed About Scope,
> Reviewability, and AI-Assisted Development**

Primary source:

<https://github.com/tyson-hu/Eazy-Review/pull/14>

Frozen starting facts:

```text
Title:       Plan packetized Supabase foundation and skill-wrapper validation
State:       Closed without merge
Created:     2026-07-25T02:33:59Z
Closed:      2026-07-26T04:03:45Z
Base SHA:    6c86dc735064734d1eda250b471ab7bea7dc2d4f
Head SHA:    68a2911183b4e99455a0ea71940b66ec30f41dd5
Diff:        63 changed files, +4,665/-912
App master:  9eb485cd9b6207b52ff4408ee89647f32faae436
```

Replacement PR topics:

| PR | Scope |
|---:|---|
| #15 | Browse currency display |
| #16 | Task 11–12 Supabase security foundation |
| #17 | Generated skill-discovery wrappers |
| #18 | ADR governance and generated decision index |
| #19 | Tasks 13–18 contracts |
| #20 | Agent and MCP database authority |

Do not sum replacement PR file counts; changed paths overlap. The preservation
audit result is 61 represented frozen paths and 2 intentionally superseded
paths.

The data layout must remain:

```text
src/data/project-health/
├── README.md
├── raw/
│   └── github-prs-14-20.v1.json
└── derived/
    ├── decomposition-timeline.v1.json
    ├── pr14-path-classification.v1.json
    └── replacement-coverage.v1.json
```

The networked refresh command creates a new raw revision and never runs during
normal build, check, CI, or deployment. Derived data identifies its exact raw
revision. Published snapshots never silently refresh.

Required classification invariants:

- every raw PR #14 path appears exactly once;
- no unknown or duplicate path exists;
- category totals equal 63; and
- charts consume derived records, not hand-entered totals.

Required replacement-coverage invariants:

- all 63 PR #14 paths appear exactly once;
- exactly 61 are represented;
- exactly two are intentionally superseded;
- every referenced replacement PR exists in the raw snapshot; and
- every superseded path has a written rationale.

Use these report headings:

- `Recorded reasons PR #14 was closed`
- `What decomposition changed in scope and reviewability`

Do not claim decomposition eliminated bugs, made AI review more accurate, or
caused higher quality without frozen comparative evidence.

Drafts build successfully. Publish only after setting
`humanReviewedAt` and `reviewedBy` and after Tyson Hu completes factual,
editorial, visual, and accessibility review.

After M2, share the report only privately with reviewers on the unindexed
review deployment. The public, indexed launch occurs in M3.

## M3 — Publishing Handoff

M3 owns:

- RSS and JSON Feed routes;
- stable feed/search/sitemap/Markdown/`llms.txt` behavior tests;
- GitHub pull-request and Actions controls;
- Cloudflare Workers Builds;
- custom-domain and TLS verification;
- removal of preview-only `noindex` from production only; and
- the personal-blog feed contract.

Production indexing is a two-deploy transition: first deploy production with
indexing disabled, attach and verify `lab.tianzhe.me`, then rebuild and redeploy
with production indexing enabled. Every `workers.dev` and non-production
preview remains noindexed.

Tests should assert public behavior, not exact Pagefind hashes, OG filenames,
Nimbus output folders, or full build snapshots.

The personal blog is out of scope until separately authorized. Its documented
contract will fetch `https://lab.tianzhe.me/feed.json`, prefer featured items,
show at most three, link to canonical lab URLs, and tolerate feed failure.

## Offline Validation Rule

Normal builds may verify:

- URL syntax;
- HTTPS;
- approved source hosts;
- GitHub repository/PR/full-SHA structure;
- absence of localhost, private IPs, placeholders, embedded credentials, or
  suspicious secret query values; and
- consistency among committed raw, derived, content, and generated files.

Normal builds must not perform network or DNS checks. The explicit manual
evidence refresh verifies remote existence and records a new snapshot revision.

## Source Design Tokens

```text
Background       #f5f5f7
Card             #ffffff
Primary text     #1d1d1f
Secondary text   #6b6b6b
Border           #e0e0e0
Accent           #0066cc
Focus            #0071e3
Dark accent      #2997ff
Positive         #047857
Warning          #b45309
Negative         #b91c1c
Typography       Inter
```

Use these as an editorial web adaptation, not permission to change the app's
design system.

## Recommended First Actions in the New Session

After explicit implementation authorization:

1. Read this handoff and `PLAN.md`.
2. Complete M1.1 preflight and record results.
3. Read the current Cloudflare skill and official Nimbus/Workers docs.
4. Read `../eazy-review/AGENTS.md` and only the app documents required for M1.
5. Run the live Nimbus scaffold CLI help.
6. Scaffold with verified flags or the documented interactive flow.
7. Review generated files before installing dependencies or initializing Git.
8. Implement and verify M1 only.
9. Hand M1 back for review before beginning M2.

Do not jump from scaffold to evidence ingestion, feeds, CI/CD, DNS, or personal
blog work.

## Stop Conditions

Stop and ask the user when:

- the lab folder contains unexplained user work;
- existing Git history might be overwritten;
- `../eazy-review` resolves incorrectly;
- the expected Eazy Review origin is absent;
- a frozen commit is unavailable;
- the adjacent app has unexplained changes affecting evidence;
- the intended GitHub repository already exists;
- Worker `eazy-review-lab` already exists with unclear ownership;
- `lab.tianzhe.me` has a conflicting DNS record;
- current Nimbus changes invalidate a major plan decision;
- a step requires editing the app or personal blog without authorization; or
- content claims to be published without satisfying publication metadata.

## Definition of a Good Handoff Completion

A new session should be able to implement M1 independently, stop for review,
then proceed separately through M2 and M3 without relying on the prior ChatGPT
conversation or mixing the three milestones into one change.
