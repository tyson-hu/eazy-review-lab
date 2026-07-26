# Project-health evidence

Frozen GitHub evidence for the PR #14 flagship report lives here.

## Layout

| Path | Role |
| --- | --- |
| `raw/github-prs-14-20.v1.json` | Immutable observed GitHub facts for PRs #14–#20 |
| `derived/pr14-path-classification.v1.json` | Mutually exclusive path categories for PR #14 |
| `derived/replacement-coverage.v1.json` | Represented vs superseded coverage against #15–#20 |
| `derived/decomposition-timeline.v1.json` | Timeline events keyed to raw snapshot timestamps |

## Source freeze

- Repository: `tyson-hu/Eazy-Review`
- PR #14 base: `6c86dc735064734d1eda250b471ab7bea7dc2d4f`
- PR #14 head: `68a2911183b4e99455a0ea71940b66ec30f41dd5`
- Integrated result: `9eb485cd9b6207b52ff4408ee89647f32faae436`
- Raw snapshot revision: `1` (created by `pnpm evidence:refresh`)

Normal `build` / `check` / deploy remain evidence-offline. Refresh is explicit and
never overwrites a snapshot file that already exists or is pinned by a published
report.

## Classification method

Every PR #14 path is assigned exactly one category:

1. **product code** — runtime app/UI/type/util sources
2. **canonical product/data documents** — product contracts, design, tasks, and
   related durable docs (including `README.md` and `docs/notes/README.md`)
3. **decision governance** — `docs/DECISIONS.md` and `docs/decisions/**`
4. **agent/tooling** — skills, agent mirrors, Cursor rules, agent workflow docs,
   and generator/checker scripts
5. **CI/dependencies** — workflow YAML and package manifests/lockfiles

### Ambiguous choices (recorded)

- `AGENTS.md` is **agent/tooling**, not a product specification.
- `docs/DOCUMENTATION_POLICY.md` is **canonical product/data documents**
  (documentation process contract), not decision governance.
- `scripts/build-decision-index.cjs` is **agent/tooling** even though it supports
  decision governance output.
- `package-lock.json` remains **CI/dependencies** even though it is one of the
  two intentionally superseded paths.

Category totals for revision 1: product code 4; canonical product/data documents
15; decision governance 19; agent/tooling 22; CI/dependencies 3 (sum 63).

## Replacement coverage

Coverage is computed from frozen PR #14 paths against files observed in
replacement PRs #15–#20:

- **61 represented** — path appears in at least one replacement PR
- **2 superseded** — `scripts/check-skill-wrappers.cjs` and `package-lock.json`,
  replaced by PR #17’s manifest-based generator approach

Do not sum replacement-PR file counts: paths overlap across PRs. Notes on
multi-owner paths record that ownership is overlapping, not additive.

## Charts

SVG assets under `public/media/project-health/` are generated only from these
derived files via `pnpm visuals:project-health`. Freshness is checked offline by
`pnpm check:generated-assets`.
