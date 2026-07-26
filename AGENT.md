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

Stop at each milestone for review. Do not merge milestones into one change.

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
3. `astro build`
4. `nimbus-docs lint` (after build — `internal-link` needs `.nimbus/routes.json`)
5. stable public-behavior tests (`scripts/test-public-behavior.mjs`)

Preview deploy (unindexed):

```bash
pnpm run deploy
```

Indexing stays disabled until M3 custom-domain verification. Do not set
`SITE_INDEXABLE=true` before that gate.

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

## Don't

- Begin M2/M3 work during an M1-only authorization.
- Edit the Eazy Review app repository from this project.
- Silently refresh published evidence.
- Deploy an indexable preview before M3 domain verification.
- Hand-add registry UI under `src/components/ui/` — use `nimbus-docs add`.
- Remove `<AgentDirective />` unless asked.

## Project home

- Lab plan: `PLAN.md`
- Handoff: `docs/notes/handoff.md`
- Nimbus: https://nimbus-docs.com
