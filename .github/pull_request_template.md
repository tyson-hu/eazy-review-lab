## Summary

<!-- What changed and why. -->

## Source / evidence changes

- [ ] No evidence changes
- [ ] New raw snapshot revision (path + revision id)
- [ ] New/updated derived classification (path + source snapshot)
- [ ] Published report methodology / freeze note updated

## Screenshots

<!-- Desktop and mobile when UI or layout changed. -->

## Validation

```bash
pnpm install --frozen-lockfile
pnpm run check
git diff --check
```

- [ ] Clean install + `pnpm run check` passed locally
- [ ] `git diff --check` clean

## Documentation impact

- [ ] `PLAN.md` / `docs/notes/handoff.md` updated (or N/A with reason)
- [ ] Content frontmatter / publication metadata reviewed
- [ ] Personal-blog contract unchanged (or documented)

## Publication metadata

- [ ] Draft remains draft, **or**
- [ ] Published content satisfies:
  - `draft: false`
  - if `aiGenerated: true`, then `humanReviewedAt` + `reviewedBy` are set
  - AI disclosure present when required
