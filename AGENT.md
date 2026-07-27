# Eazy Review Lab

Astro-based public lab for Eazy Review. The `nimbus-docs` package handles content
schemas, sidebar/TOC, MDX→markdown, build hooks, and the `nimbus` CLI.
Everything in `src/` is yours to edit.

## Milestone boundaries

| Milestone | Own | Do not absorb |
| --- | --- | --- |
| **M1** | Site foundation, navigation, schema, styling, unindexed `workers.dev` preview | Evidence pipeline, flagship report |
| **M2** | Frozen GitHub evidence, derived classifications, flagship report, charts | Feeds, CI/CD, custom domain |
| **M3** | RSS/JSON feeds, GitHub Actions, Workers Builds, `lab.tianzhe.me`, blog contract | Silent rewrites of published M2 evidence |
| **M4** | Editorial runbook, first post-launch journal cycle, stale section copy, journal public-behavior tests, publication record | App or personal-blog changes, M2 evidence refresh, automatic publishing, deferred features |

Stop at each milestone for review. Do not merge milestones into one change.
M4 also stops at its human editorial gate: a draft may be prepared and tested,
but only Tyson Hu can approve its final text and actual review/publication
timestamp.

## Read-only application repository

Treat `/Users/tysonhu/Documents/EazyCopProjects/eazy-review` (GitHub:
`tyson-hu/Eazy-Review`) as **read-only**. Inspect it for evidence and product
language, but do not edit it, import it at runtime, symlink it, or bind this
lab to it as a workspace.

Preserve these product terms exactly: **Eazy Score**, **Community Score**,
**My Rating**.

## Evidence-offline build contract

Normal `build`, `check`, CI, and deploy must:

- read only repository files and installed dependencies;
- never call GitHub, DNS, HTTP, or Cloudflare APIs to prove evidence exists;
- validate URL syntax, HTTPS, allowlists, identifiers, and internal consistency.

Remote evidence refresh is an explicit manual command (M2+) and never runs as
part of normal build.

## Raw vs derived evidence

- `src/data/project-health/raw/` — immutable observed GitHub facts.
- `src/data/project-health/derived/` — editorial classifications with explicit
  lineage to a raw snapshot revision.

Do not mix interpretation into raw snapshots. Do not silently refresh evidence
used by an already published report.

## Validation commands

```bash
pnpm install --frozen-lockfile
pnpm run check
```

`pnpm run check` runs:

1. `astro check`
2. offline publication validation (`scripts/validate-publication.mjs`)
3. offline project-health validation (`scripts/validate-project-health.mjs`)
4. project-health unit/invariant tests (`scripts/tests/*.test.mjs`)
5. generated-asset freshness (`scripts/check-generated-assets.mjs`)
6. `astro build`
7. `nimbus-docs lint` (after build — `internal-link` needs `.nimbus/routes.json`)
8. stable public-behavior tests (`scripts/test-public-behavior.mjs`)

Manual evidence refresh (networked, never part of `check`):

```bash
pnpm evidence:refresh
```

Preview deploy (unindexed):

```bash
pnpm run deploy
```

Indexing is enabled for verified production builds with
`SITE_INDEXABLE=true` (Workers Builds production env). Preview / `workers.dev`
hosts remain noindexed via `workers/host-indexing.js` even when the production
build is indexable.

## Homepage routing

Use `src/pages/index.astro` for `/`. Current Nimbus maps
`src/content/docs/index.mdx` to `/index`, so do not reintroduce a content
index at the docs root unless that upstream behavior changes.

## File layout

```
astro.config.ts
nimbus.json
src/
├── components.ts
├── components/
├── content/docs/
├── content.config.ts
├── layouts/
├── pages/
└── styles/
scripts/
├── validate-publication.mjs
└── test-public-behavior.mjs
templates/
```

## Writing docs

Frontmatter validates against the extended docs schema. Required: `title`.

Lab fields include `kind`, `project`, `publishedAt`, `tags`, `featured`,
`aiGenerated`, `humanReviewedAt`, `reviewedBy`, `sourceRefs`, and pinned-source
overview fields (`sourceRepository`, `sourceCommit`, `sourcePath`,
`lastVerifiedAt`).

Publishable rule:

```text
publishable =
  draft is false
  AND (
    aiGenerated is false
    OR (humanReviewedAt exists AND reviewedBy exists)
  )
```

AI-assisted published articles must include:
`Drafted with AI, reviewed by Tyson Hu.`

## M4 editorial loop

Follow `docs/notes/editorial-publishing-loop.md` for topic selection, sourcing,
drafting, review, publication, correction, validation, and rollback.

- Keep new articles at `draft: true` until Tyson Hu approves the final text.
- Do not add `publishedAt`, `humanReviewedAt`, or `reviewedBy` in anticipation of
  approval.
- Drafts must remain absent from HTML, Markdown alternates, search, feeds,
  sitemap, and agent surfaces.
- Material corrections require `lastUpdated` and a visible correction note.
- Record repository HEAD and the deployed Workers Builds source separately.

## Don't

- Cross a milestone or editorial gate without its required authorization.
- Edit the Eazy Review app repository from this project.
- Silently refresh published evidence.
- Run `pnpm evidence:refresh` as part of editorial publishing.
- Deploy an indexable preview before M3 domain verification.
- Hand-add registry UI under `src/components/ui/` — use `nimbus-docs add`.
- Remove `<AgentDirective />` unless asked.

## Project home

- Lab plan: `PLAN.md`
- Handoff: `docs/notes/handoff.md`
- Editorial runbook: `docs/notes/editorial-publishing-loop.md`
- Nimbus: https://nimbus-docs.com
