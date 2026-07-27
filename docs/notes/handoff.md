# Eazy Review Lab Handoff

> Prepared: 2026-07-26  
> M1 completed: 2026-07-26  
> M2 completed: 2026-07-26  
> M3 completed: 2026-07-26  
> M4 authorized: 2026-07-26
> M4 completed: 2026-07-26
> Maintenance updated: 2026-07-27
> Workspace: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab`  
> Detailed plan: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab/PLAN.md`  
> State: **M4 complete — publication and maintenance rollout verified**

## Start Here

Read `PLAN.md` completely before taking action.

**M1–M4 are complete.** The first use of
`docs/notes/editorial-publishing-loop.md` was approved, merged, deployed, and
verified. Tyson Hu's approval-message timestamp,
`2026-07-26T21:29:12.563-04:00`, is the article's review and publication
timestamp. The 2026-07-27 Journal-sidebar and rollback-contract maintenance is
also deployed and verified. There is no active implementation milestone. Do
not begin deferred work (R2, analytics, comments, auth, CMS, automatic article
generation, cross-repo sync, or personal-blog implementation) without a new
plan and authorization.

## Repository vs deployment state

- M4 review branch baseline and pre-M4 repository HEAD:
  `fe37923529d2fa2b4efb8e995b80c0fd9e4d5134`
- `origin/main` at M4 start:
  `fe37923529d2fa2b4efb8e995b80c0fd9e4d5134`
- Successful M3 content-rollout source:
  `5f6bf5070eadd98840a8ce3c284b9268dfbee4d1`
- `fe37923` is the documentation-only completion successor to deployed source
  `5f6bf50`; its own later documentation-only build deployed Worker version
  `be99cf84-cb45-4b3c-a0d3-327d0c435b1c`. Do not describe the M3 content
  rollout and its documentation successor as the same source/build record.
- M4 reviewed branch head:
  `41fa7dcea4dd5066d33335693be909149b84a4c7`
- M4 publication merge and Workers Builds source:
  `b5bfe9e8cd1f478ae79e20739125cfc603d9547a`
- Journal navigation and rollback-contract maintenance source:
  `84dea6e70519d2fb97885209dbdf9836eb9d1649`
- This handoff closeout is a documentation-only successor to maintenance source
  `84dea6e`; it does not change the verified sidebar or runtime behavior.

## Production (indexable)

- Worker: `eazy-review-lab`
- Custom domain: https://lab.tianzhe.me
- M4 publication version (Workers Builds deploy):
  `3d801e44-929f-4df5-a07d-5a3213966809`
- Journal navigation maintenance version:
  `ad2ee935-0ac6-4960-9218-c7f3feeaebbc`
- Earlier manual indexable deploy: `a4916303-3036-4845-bae6-c561a17f36d3`
- Feeds: https://lab.tianzhe.me/feed.json · https://lab.tianzhe.me/feed.xml
- Report: https://lab.tianzhe.me/reports/pr-14-project-health/
- Journal:
  https://lab.tianzhe.me/journal/launching-eazy-review-lab/
- HTML: publishable pages omit preview `noindex`
- `robots.txt` origin section: `Allow: /` + sitemap (Cloudflare Managed Content
  Signals prefix may still appear above the origin section)
- TLS: OK for `lab.tianzhe.me`

## Preview (`workers.dev`, denied)

- URL: https://eazy-review-lab.tyson-ec2.workers.dev
- Edge host guard forces `noindex, nofollow` + `Disallow: /`
- Confirmed after the 2026-07-27 maintenance deploy

## GitHub

- Public repository: https://github.com/tyson-hu/eazy-review-lab
- M4 baseline: `fe37923`
- Pull request:
  [#1](https://github.com/tyson-hu/eazy-review-lab/pull/1) (merged)
- Reviewed head: `41fa7dc`
- Publication merge: `b5bfe9e`
- M3 commits since M2 `eaf8d9b`:
  - `57cdbff` feat(m3): feeds, host-aware noindex, stable feed tests
  - `c9260a1` chore(m3): GitHub quality controls + blog feed contract
  - `072c286` chore(m3): attach lab.tianzhe.me custom domain
  - `dacb28e` docs(m3): domain launch evidence + Builds connect notes
  - `5f6bf50` docs(m3): trigger Workers Builds verification after Git connect
- M4 Actions (success):
  https://github.com/tyson-hu/eazy-review-lab/actions/runs/30232163719
- Journal navigation maintenance Actions (success):
  https://github.com/tyson-hu/eazy-review-lab/actions/runs/30253648490
- Node 20 warning remediation: `actions/checkout@v7`,
  `actions/setup-node@v7`, and `pnpm/action-setup@v6`; the raw `main` job log
  contains no Node 20 deprecation notice

## Workers Builds (verified)

- Worker tag: `5247c67273e54070b39cb2b516c65731`
- Build UUID: `bd85c56f-0473-4967-a7ce-5afa76fa8978`
- Outcome: **success** on `main` @ `b5bfe9e`
- Deployed version: `3d801e44-929f-4df5-a07d-5a3213966809`
- Build command: `pnpm run check`
- Deploy command: `pnpm exec wrangler deploy`
- GitHub check: `Workers Builds: eazy-review-lab` → success
- Settings notes: `docs/notes/workers-builds.md`

## Journal navigation maintenance rollout

- Source:
  `84dea6e70519d2fb97885209dbdf9836eb9d1649`
- GitHub Actions run `30253648490`: **success**
- Workers Builds UUID:
  `8f0f86d3-2ac4-45ba-bd3e-1679511bcafe`
- Workers Builds GitHub check: **success**
- Deployed Worker version:
  `ad2ee935-0ac6-4960-9218-c7f3feeaebbc`
- Active deployment:
  `8513fc8c-4071-4b08-995c-b4b448f37f3d` at 100%
- Immediately preceding version:
  `404e9310-8b08-4f06-8c2f-465d16123360`
- Production checks: Journal group, Overview link, active article link, HTML,
  Markdown, MDX, canonical, feeds, sitemap, agent surface, Pagefind client,
  indexable HTML, and the final origin robots policy passed
- Preview checks: article HTML remains reachable for review while the host
  guard emits `noindex, nofollow` and the final robots policy disallows crawling

## M4 editorial cycle

- Published article:
  `src/content/docs/journal/launching-eazy-review-lab.mdx`
- Route: `/journal/launching-eazy-review-lab/`
- Title: **Launching Eazy Review Lab: From Foundation to Publishing**
- Featured state: `false`; the flagship report remains preferred
- Editorial runbook: `docs/notes/editorial-publishing-loop.md`
- Editorial approval: `2026-07-26T21:29:12.563-04:00`
- Accessibility exception: dark muted foreground raised from
  `oklch(0.556 0 0)` to `oklch(0.563 0 0)` for WCAG AA contrast
- Sidebar: the Journal group autogenerates its published entries and marks the
  current article
- Publication and rollout gate: complete
- Rollback: prepare a reviewed, coordinated revert of `b5bfe9e`, restoring the
  article state, Journal index, publication assertions, and rollout record
  together while reconciling later closeout-document conflicts. A
  frontmatter-only `draft: true` change is unsupported. Direct rollback to
  pre-M4 version `be99cf84-cb45-4b3c-a0d3-327d0c435b1c` requires separate
  Cloudflare authorization.

## M2 evidence (unchanged)

- Revision `github-prs-14-20.v1` / `generatedAt` `2026-07-26T21:39:21.807Z`

## Adjacent application repository

Still read-only and clean at `9eb485cd9b6207b52ff4408ee89647f32faae436`.

## Documentation impact

- Personal-blog contract: `docs/notes/personal-blog-feed-contract.md`
- Workers Builds notes: `docs/notes/workers-builds.md`
- Editorial publishing loop: `docs/notes/editorial-publishing-loop.md`
- Dual robots-meta resolved; host-aware preview noindex retained

## Validation

```bash
pnpm install --frozen-lockfile
pnpm run check
git diff --check
SITE_INDEXABLE=true pnpm run check
```

## M4.6 checklist

| Criterion | Status |
| --- | --- |
| Editorial runbook + approved timestamp | Pass |
| Article HTML, Markdown, MDX, and exact-title search | Pass |
| Journal sidebar exposes and activates the article | Pass |
| JSON/RSS feeds retain featured flagship report | Pass |
| Sitemap + root/journal/full agent surfaces | Pass |
| GitHub Actions + Workers Builds | Pass |
| Node 20 action-runtime warning absent | Pass |
| Heading order, disclosure, reflow, and console review | Pass |
| Production indexable + preview noindexed | Pass |
| M2 evidence and generated visuals unchanged | Pass |
| Adjacent app and personal-blog repositories untouched | Pass |
