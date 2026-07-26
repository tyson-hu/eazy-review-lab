# Eazy Review Lab Handoff

> Prepared: 2026-07-26  
> M1 completed: 2026-07-26  
> M2 completed: 2026-07-26  
> M3 status: **implementation complete except Workers Builds connect**  
> Workspace: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab`  
> Detailed plan: `/Users/tysonhu/Documents/EazyCopProjects/eazy-review-lab/PLAN.md`

## Start Here

Read `PLAN.md` completely before taking action.

**M3 code, GitHub remote, custom domain, and production indexing are done.**
Workers Builds Git connect was reported complete on 2026-07-26; this revision
triggers the first connected build for M3.7 verification.

## Production (indexable)

- Worker: `eazy-review-lab`
- Custom domain: https://lab.tianzhe.me
- Version ID: `a4916303-3036-4845-bae6-c561a17f36d3`
- Feeds: https://lab.tianzhe.me/feed.json · https://lab.tianzhe.me/feed.xml
- Report: https://lab.tianzhe.me/reports/pr-14-project-health/
- HTML: no `noindex` meta on publishable pages
- `robots.txt` origin section: `Allow: /` + `Sitemap: https://lab.tianzhe.me/sitemap-index.xml`
  (Cloudflare zone Managed Content Signals prefix still appears above the origin
  section on the custom domain)
- TLS: OK (certificate covers `lab.tianzhe.me` / `*.tianzhe.me`)
- Desktop `1440×900` and mobile `393×852` smoke via Playwright: homepage + report OK

## Preview (`workers.dev`, must remain denied)

- URL: https://eazy-review-lab.tyson-ec2.workers.dev
- Edge host guard (`workers/host-indexing.js`) forces
  `noindex, nofollow` + `Disallow: /` on non-`lab.tianzhe.me` hosts
- Confirmed after indexable production deploy

## GitHub

- Public repository: https://github.com/tyson-hu/eazy-review-lab
- HEAD: `072c286` (`chore(m3): attach lab.tianzhe.me as Worker custom domain`)
- M3 commits since M2 `eaf8d9b`:
  - `57cdbff` feat(m3): feeds, host-aware noindex, stable feed tests
  - `c9260a1` chore(m3): GitHub quality controls + blog feed contract
  - `072c286` chore(m3): attach lab.tianzhe.me custom domain
- Actions (success):
  - https://github.com/tyson-hu/eazy-review-lab/actions/runs/30222694303
  - https://github.com/tyson-hu/eazy-review-lab/actions/runs/30223352857

## Workers Builds (remaining)

- Worker tag: `5247c67273e54070b39cb2b516c65731`
- Builds listed: **0** (Git repository not connected)
- Wrangler OAuth lacks Workers Builds Configuration Edit; dashboard login required
- Exact settings: `docs/notes/workers-builds.md`

Required one-time action:

1. Cloudflare dashboard → Worker `eazy-review-lab` → Settings → Builds → Connect
2. Authorize Cloudflare Workers & Pages GitHub App for `tyson-hu/eazy-review-lab`
3. Set:
   - production branch `main`
   - build `pnpm run check`
   - deploy `pnpm exec wrangler deploy`
   - non-production deploy `pnpm exec wrangler versions upload`
   - production env `SITE_INDEXABLE=true`
4. Trigger a build and confirm success

## M2 evidence (unchanged)

- Revision `github-prs-14-20.v1` / `generatedAt` `2026-07-26T21:39:21.807Z`
- Not refreshed or rewritten during M3

## Adjacent application repository

Still read-only and clean at `9eb485cd9b6207b52ff4408ee89647f32faae436`.

## Documentation impact

- Personal-blog contract: `docs/notes/personal-blog-feed-contract.md` (lab-owned only; blog repo untouched)
- Workers Builds notes: `docs/notes/workers-builds.md`
- Dual robots-meta resolved in `BaseLayout` (single robots owner)
- Host-aware preview noindex via Worker even when production build is indexable

## Validation commands used

```bash
pnpm install --frozen-lockfile
pnpm run check
git diff --check
pnpm run deploy          # phase 1: domain attach, indexing off
pnpm run deploy:indexable # phase 2: SITE_INDEXABLE=true
```

## M3.7 checklist

| Criterion | Status |
| --- | --- |
| Feeds + stable public-behavior tests | Pass |
| GitHub Actions from clean install | Pass |
| Workers Builds from clean install | **Blocked — connect repo** |
| Draft/unapproved absent from production surfaces | Pass |
| App repository unchanged | Pass |
| TLS + canonical at `lab.tianzhe.me` | Pass |
| Production indexable | Pass |
| Preview/workers.dev noindexed | Pass |
| Personal-blog feed contract documented | Pass |
