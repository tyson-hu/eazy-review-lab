# Eazy Review Lab Handoff

> Prepared: 2026-07-26  
> M1 completed: 2026-07-26  
> Workspace: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab`  
> Detailed plan: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab/PLAN.md`  
> State: **M1 complete — stop for review before M2**

## Start Here

Read `PLAN.md` completely before taking action.

**M1 is done.** Do not begin M2 (evidence collection, derived data, charts, or
the flagship report) or M3 (feeds, GitHub Actions, Workers Builds, custom
domain, personal-blog integration) unless the user explicitly authorizes the
next milestone.

## Preview (unindexed)

- Worker: `eazy-review-lab`
- URL: https://eazy-review-lab.tyson-ec2.workers.dev
- Version ID: `24470fd0-f694-45ea-9e99-0e6aceb83593`
- Indexing: `noindex, nofollow` meta + `robots.txt` `Disallow: /`
- Canonical metadata still points to `https://lab.tianzhe.me` (not attached)
- Keep this URL unshared except with reviewers

## M1.1 Preflight (recorded)

| Check | Result |
| --- | --- |
| Lab contents before scaffold | `PLAN.md`, `docs/notes/handoff.md`, `.DS_Store` only |
| Lab Git | Not a repository (initialized during M1) |
| Adjacent top-level | `/Users/tysonhu/Documents/EazyCopProjects/eazy-review` |
| Adjacent origin | `https://github.com/tyson-hu/Eazy-Review.git` |
| Frozen commits present | `6c86dc7…`, `68a2911…`, `9eb485c…` as commit objects |
| Adjacent HEAD / branch | `9eb485cd9b6207b52ff4408ee89647f32faae436` on `master`, clean |
| GitHub `tyson-hu/eazy-review-lab` | Does not exist |
| Toolchain | Node `v26.5.0`, pnpm `11.17.0`, Git `2.50.1` |
| Implementation authority | Explicit M1-only authorization in session |

No stop conditions.

## Scaffold decisions

Live CLI help (`npx @cloudflare/create-nimbus-docs@latest --help`):

```text
Usage: create-nimbus-docs [dir] [flags]
  --deploy <target>      cloudflare | other (default: cloudflare)
  --content <mode>       starter | empty   (default: starter)
  --yes, -y
  --skip-install
  --package-manager <pm> npm | pnpm | yarn | bun
  --no-git
```

Exact command used:

```bash
NPM_CONFIG_CACHE=/tmp/eazy-review-lab-npm-cache \
XDG_CACHE_HOME=/tmp/eazy-review-lab-xdg-cache \
npx --yes @cloudflare/create-nimbus-docs@latest _nimbus_scaffold \
  --content empty \
  --deploy cloudflare \
  --package-manager pnpm \
  --skip-install \
  --no-git
```

Notes:

- `.` as the target directory is rejected by the live CLI (“Choose a new
  subdirectory name”). Scaffolded into `_nimbus_scaffold`, then moved to the
  lab root while preserving `PLAN.md` and `docs/notes/handoff.md`.
- Docs say “full/empty”; CLI flag is `--content starter | empty`.
- Untouched scaffold passed `typecheck`, `lint:docs`, and `build` before
  customization (duplicate-root warning present while both
  `src/pages/index.astro` and `src/content/docs/index.mdx` existed).

### Homepage routing decision

Current Nimbus maps `src/content/docs/index.mdx` → `/index`, not `/`.
M1 therefore keeps a custom editorial homepage at `src/pages/index.astro` (`/`)
and does **not** keep a content `index.mdx` (avoids `/index` and the duplicate
warning). Section pages remain content-driven under `src/content/docs/`.

## Installed versions (lockfile)

| Package | Version |
| --- | --- |
| `@cloudflare/create-nimbus-docs` (scaffold) | `0.6.3` / `templates-v0.6.3` |
| `@cloudflare/nimbus-docs` | `0.8.2` |
| Astro | `7.1.3` |
| Wrangler | `4.114.0` |
| Pagefind | `1.5.2` |
| `packageManager` | `pnpm@11.17.0` |
| Frame registry component | `frame@0.8.2` (via `nimbus-docs add frame`) |

## What M1 delivered

- Site identity: title, description, canonical `lab.tianzhe.me`, Worker name
  `eazy-review-lab`, GitHub links, sidebar order + App Source external link
- Homepage + Project / Journal / Reports / Decisions / Experiments sections
- Published decision: `/decisions/independent-nimbus-lab/`
- Draft fixture: `journal/m1-fixture-draft` (excluded from production surfaces)
- Extended schema in `src/content.config.ts`
- Eazy Review palette in `src/styles/globals.css`
- Custom 404 with `not_found_handling: "404-page"`
- Preview indexing guards (`SITE_INDEXABLE` unset ⇒ noindex + disallow)
- Templates under `templates/`
- Customized root `AGENT.md`
- `pnpm run check` suite

### `pnpm run check` order

```text
astro check
→ validate-publication.mjs (offline)
→ astro build
→ nimbus-docs lint   # after build: internal-link needs .nimbus/routes.json
→ test-public-behavior.mjs (dist + Wrangler 404)
```

Lint is intentionally after build because `nimbus/internal-link` requires
`.nimbus/routes.json` from `astro build`.

## Validation evidence

Clean install:

```bash
rm -rf node_modules dist .astro .nimbus
pnpm install --frozen-lockfile
pnpm run check
```

Result: **passed** (typecheck hints only for deprecated Zod `.url()` /
`.datetime()` helpers; 0 errors).

Stable-behavior checks: homepage + five sections, known Markdown alternate,
Pagefind discovery, `/llms.txt` + section `decisions/llms.txt`, draft absence,
sitemap canonical URL, preview noindex/robots, Wrangler custom 404.

Preview smoke (2026-07-26):

- Sections return 200 with trailing slash (307 redirect from non-slash)
- Markdown alternate 200
- Agent surfaces present
- Custom 404 body confirmed
- Mobile `393×852` and desktop `1440×900` layouts reviewed
- Search finds “Independent Nimbus lab” via Pagefind
- Skip link, focus ring token `#0071e3`, reduced-motion CSS present
- Product terms preserved exactly
- Adjacent app repository unchanged at `9eb485c…`

## Git

- Branch: `main`
- Commit: `0ba1954` — `docs: mark PLAN.md status as M1 complete`
- Remote: **not created** (deferred to M3)
- No destructive Git operations used

## Adjacent application repository

Still read-only. HEAD remained
`9eb485cd9b6207b52ff4408ee89647f32faae436` after M1. Product terms
**Eazy Score**, **Community Score**, and **My Rating** are preserved in lab
copy.

## Limitations / follow-ups for reviewers

1. Dual robots meta on some pages (`noindex` from layout path + site-wide
   `noindex, nofollow`) — both deny indexing; can be cleaned in M3.
2. Lab GitHub header glyph and “Edit this page” are gated off until the
   M3 remote exists (`github` / `editPattern` are null).
3. Homepage is `src/pages/index.astro`, so it has no Markdown alternate twin
   (section/decision pages do).
4. `SITE_INDEXABLE=true` must remain unused until M3 custom-domain verification.
5. Before M3 indexing: one static build cannot make `lab.tianzhe.me` indexable
   while leaving the same Worker’s `workers.dev` noindexed. Prefer disabling
   `workers.dev` or using a separate staging Worker/environment.
6. Do not create the GitHub remote, attach `lab.tianzhe.me`, or start M2/M3
   without explicit authorization.

## Next milestone (not started)

**M2** — manual evidence refresh, raw/derived snapshots, flagship PR #14
report, deterministic charts, human editorial approval on the unindexed
preview.
