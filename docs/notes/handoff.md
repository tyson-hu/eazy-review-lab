# Eazy Review Lab Handoff

> Prepared: 2026-07-26  
> M1 completed: 2026-07-26  
> M2 completed: 2026-07-26  
> M3 completed: 2026-07-26  
> M4 authorized: 2026-07-26
> Workspace: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab`  
> Detailed plan: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab/PLAN.md`  
> State: **M4 in progress — publication approved; rollout pending**

## Start Here

Read `PLAN.md` completely before taking action.

**M3 is done and M4 publication is approved.** Follow
`docs/notes/editorial-publishing-loop.md`. Tyson Hu approved the first M4
article and authorized the approval-message timestamp,
`2026-07-26T21:29:12.563-04:00`, for both review and publication metadata. No
push, PR, merge, or deployment is authorized. Do not begin deferred work (R2,
analytics, comments, auth, CMS, automatic article generation, cross-repo sync,
personal-blog implementation).

## Repository vs deployment state

- M4 review branch baseline and pre-M4 repository HEAD:
  `fe37923529d2fa2b4efb8e995b80c0fd9e4d5134`
- `origin/main` at M4 start:
  `fe37923529d2fa2b4efb8e995b80c0fd9e4d5134`
- Successful Workers Builds source:
  `5f6bf5070eadd98840a8ce3c284b9268dfbee4d1`
- `fe37923` is the documentation-only completion successor to deployed source
  `5f6bf50`; do not describe the two as the same state.
- M4 review-branch commits are not deployed unless a later closeout explicitly
  records a successful rollout.

## Production (indexable)

- Worker: `eazy-review-lab`
- Custom domain: https://lab.tianzhe.me
- Active version (Workers Builds deploy): `97110b2a-ec27-40ff-9e77-e9cedcfc7c7d`
- Earlier manual indexable deploy: `a4916303-3036-4845-bae6-c561a17f36d3`
- Feeds: https://lab.tianzhe.me/feed.json · https://lab.tianzhe.me/feed.xml
- Report: https://lab.tianzhe.me/reports/pr-14-project-health/
- HTML: publishable pages omit preview `noindex`
- `robots.txt` origin section: `Allow: /` + sitemap (Cloudflare Managed Content
  Signals prefix may still appear above the origin section)
- TLS: OK for `lab.tianzhe.me`

## Preview (`workers.dev`, denied)

- URL: https://eazy-review-lab.tyson-ec2.workers.dev
- Edge host guard forces `noindex, nofollow` + `Disallow: /`
- Confirmed after Workers Builds production deploy

## GitHub

- Public repository: https://github.com/tyson-hu/eazy-review-lab
- Current `main` / repository HEAD at M4 start: `fe37923`
- Successful production build source: `5f6bf50`
- M3 commits since M2 `eaf8d9b`:
  - `57cdbff` feat(m3): feeds, host-aware noindex, stable feed tests
  - `c9260a1` chore(m3): GitHub quality controls + blog feed contract
  - `072c286` chore(m3): attach lab.tianzhe.me custom domain
  - `dacb28e` docs(m3): domain launch evidence + Builds connect notes
  - `5f6bf50` docs(m3): trigger Workers Builds verification after Git connect
- Actions (success): https://github.com/tyson-hu/eazy-review-lab/actions/runs/30226395080

## Workers Builds (verified)

- Worker tag: `5247c67273e54070b39cb2b516c65731`
- Build UUID: `2e2549e2-0be4-405a-8863-6dfe5f778d04`
- Outcome: **success** on `main` @ `5f6bf50`
- Build command: `pnpm run check`
- Deploy command: `pnpm exec wrangler deploy`
- GitHub check: `Workers Builds: eazy-review-lab` → success
- Settings notes: `docs/notes/workers-builds.md`

## M4 editorial cycle

- Proposed article:
  `src/content/docs/journal/launching-eazy-review-lab.mdx`
- Proposed route: `/journal/launching-eazy-review-lab/`
- Proposed title: **Launching Eazy Review Lab: From Foundation to Publishing**
- Featured state: `false`; the flagship report remains preferred
- Editorial runbook: `docs/notes/editorial-publishing-loop.md`
- Editorial approval: `2026-07-26T21:29:12.563-04:00`
- Accessibility exception: dark muted foreground raised from
  `oklch(0.556 0 0)` to `oklch(0.563 0 0)` for WCAG AA contrast
- Current gate: local publication validation, then separate remote-action
  authorization
- Remote actions: no push, PR, merge, or production rollout authorized

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

## M3.7 checklist

| Criterion | Status |
| --- | --- |
| Feeds + stable public-behavior tests | Pass |
| GitHub Actions from clean install | Pass |
| Workers Builds from clean install | Pass |
| Draft/unapproved absent from production surfaces | Pass |
| App repository unchanged | Pass |
| TLS + canonical at `lab.tianzhe.me` | Pass |
| Production indexable | Pass |
| Preview/workers.dev noindexed | Pass |
| Personal-blog feed contract documented | Pass |
