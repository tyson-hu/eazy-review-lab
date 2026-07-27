# Eazy Review Lab Handoff

> Prepared: 2026-07-26  
> M1 completed: 2026-07-26  
> M2 completed: 2026-07-26  
> M3 completed: 2026-07-26  
> Workspace: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab`  
> Detailed plan: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab/PLAN.md`  
> State: **M3 complete — production live at lab.tianzhe.me**

## Start Here

Read `PLAN.md` completely before taking action.

**M3 is done.** Do not begin deferred work (R2, analytics, comments, auth, CMS,
automatic article generation, cross-repo sync, personal-blog implementation)
unless separately authorized.

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
- HEAD: `5f6bf50`
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

## M2 evidence (unchanged)

- Revision `github-prs-14-20.v1` / `generatedAt` `2026-07-26T21:39:21.807Z`

## Adjacent application repository

Still read-only and clean at `9eb485cd9b6207b52ff4408ee89647f32faae436`.

## Documentation impact

- Personal-blog contract: `docs/notes/personal-blog-feed-contract.md`
- Workers Builds notes: `docs/notes/workers-builds.md`
- Dual robots-meta resolved; host-aware preview noindex retained

## Validation

```bash
pnpm install --frozen-lockfile
pnpm run check
git diff --check
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
