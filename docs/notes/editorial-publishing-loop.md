# Editorial Publishing Loop

> Audience: Eazy Review Lab contributors
> Status: private contributor runbook
> First adopted: M4, 2026-07-26

This runbook turns the lab's existing publication metadata and generated
surfaces into a repeatable human-reviewed editorial practice:

```text
select → source → draft → review → publish → validate → correct
```

It does not create a CMS or automatic publisher. Git history, reviewed content
metadata, CI, and Workers Builds remain the publishing system.

## 1. Select a topic

A topic is suitable when it:

- gives readers a concrete development, product-reasoning, experiment, or
  engineering-evidence takeaway;
- fits one existing content kind: `journal`, `report`, `decision`, or
  `experiment`;
- can be supported by committed evidence or exact public sources;
- does not invent or replace an authoritative Eazy Review product requirement;
  and
- can be reviewed as one focused editorial change.

Stop and request separate authorization if the topic requires changes to the
Eazy Review application, a personal-blog repository, Cloudflare configuration,
dependencies, schemas, or a deferred feature.

Choose the section and slug before drafting. Keep slugs descriptive and stable;
renaming a published route is a migration, not a copy edit.

For a detailed implementation journal entry, also define the implementation
stage and environment boundary. A series may name future stages, but prose must
not present planned code, staging acceptance, or production promotion as
completed fact. Keep the voice narrative and reflective rather than turning
the entry into a click-by-click tutorial or course worksheet.

## 2. Freeze and classify sources

Create the source list before writing historical or causal claims.

Prefer, in order:

1. exact full-SHA GitHub commit URLs;
2. immutable committed lab evidence and its declared revision;
3. exact pull-request or issue URLs; and
4. authoritative app documents pinned to a full commit.

Do not use moving `main` or `master` links for historical claims. A normal
editorial cycle never runs `pnpm evidence:refresh` and never rewrites files
under `src/data/project-health/` or `public/media/project-health/`.

In the draft, distinguish:

- **Recorded fact** — directly stated by the committed source.
- **Derived result** — calculated by an existing, reproducible artifact.
- **Editorial interpretation** — a bounded explanation that does not claim more
  than the sources support.

Link to the existing M2 report when referring to its conclusions. Do not
reproduce or reinterpret its frozen numerical findings in a journal entry.
When product vocabulary appears, preserve **Eazy Score**, **Community Score**,
and **My Rating** exactly.

## 3. Prepare a private draft

Start from the relevant file in `templates/`, then remove every author
instruction and placeholder. A new AI-assisted journal draft begins with:

```yaml
draft: true
kind: journal
project: eazy-review
tags: []
featured: false
aiGenerated: true
sourceRefs: []
```

Start detailed Lab entries from `templates/journal.mdx` and use
`kind: journal`. Explain unfamiliar terms in context, separate general
platform concepts from Eazy Review-specific choices, and trace important claims
through task → implementation → test → environment. A personal-blog article
may later summarize the journey for a general audience, but it does not replace
the complete Lab journal or share its publication record automatically.

While review is pending:

- omit `publishedAt`;
- omit `humanReviewedAt`;
- omit `reviewedBy`;
- do not anticipate or backdate approval;
- keep each `sourceRefs` URL stable, HTTPS, and exact; and
- state clearly in the prose that human editorial review is pending.

A draft may pass `pnpm run check`, but it must remain absent from:

- generated HTML and MDX/Markdown alternates;
- Pagefind search;
- JSON and RSS feeds;
- sitemap files;
- `/llms.txt` and `/llms-full.txt`; and
- the applicable section `llms.txt`.

## 4. Human editorial review

Tyson Hu reviews the rendered draft, not only its frontmatter. The review
covers:

- topic, title, slug, description, and `featured` choice;
- every historical and causal statement;
- exact source links and clear source labels;
- separation of facts, derived results, and interpretation;
- product vocabulary;
- reading flow, heading order, descriptive link text, and disclosure;
- keyboard navigation and visible focus;
- light and dark themes, reduced motion, and reflow at `393×852` and
  `1440×900`; and
- whether a visual or table materially improves understanding.

Only Tyson Hu can assert that this review happened. Record the actual approval
time with an explicit UTC offset; never infer it from a commit time or the
current clock.

If edits after review materially change a claim or interpretation, repeat the
review before publication.

## 5. Publish the approved article

After Tyson Hu approves the final text and actual timestamp:

```yaml
draft: false
publishedAt: "YYYY-MM-DDTHH:MM:SS-04:00"
aiGenerated: true
humanReviewedAt: "YYYY-MM-DDTHH:MM:SS-04:00"
reviewedBy: Tyson Hu
```

Use the approved values, including the correct timezone offset. Keep
`featured: false` unless Tyson Hu approves changing the feed preference.

An AI-assisted published article visibly includes:

`Drafted with AI, reviewed by Tyson Hu.`

Update stale section copy and stable public-behavior tests in the publication
commit so the public index, article, and executable contract change together.

## 6. Validate locally

Install from the frozen lockfile and run both preview and production-indexing
paths:

```bash
pnpm install --frozen-lockfile
pnpm run check
git diff --check
SITE_INDEXABLE=true pnpm run check
```

Before approval, additionally confirm the draft slug is absent from every file
and searchable body under `dist/`. After approval, confirm:

- the canonical HTML route succeeds;
- both Markdown alternates are generated where Nimbus supports them;
- Pagefind finds the exact title;
- JSON Feed and RSS contain the canonical URL and the article's exact `kind`;
- feed ordering remains deterministic and the flagship report stays
  `featured: true`;
- sitemap and the applicable section `llms.txt`, `/llms.txt`, and
  `/llms-full.txt` include the entry;
- production output is indexable; and
- preview and `workers.dev` behavior remains `noindex, nofollow` with
  `Disallow: /`.

For a detailed implementation journal entry, also verify any commands shown as
evidence cannot contact a linked remote by accident, current documentation
sources are authoritative, app claims use immutable full-SHA sources, and
every result is labeled local, staging, or production.

Compare checksums for frozen M2 evidence/media before and after the change.
Confirm the adjacent application repository is still clean at the recorded
commit.

## 7. Review rollout evidence

Use a review branch and pull request. Do not merge or deploy an unapproved
article. GitHub Actions must install from the frozen lockfile and pass the full
check. Workers Builds must use the exact approved publication commit; do not
bypass a failed build with a manual deploy.

After rollout, record separately:

- publication commit (full SHA);
- GitHub Actions run URL and result;
- Workers Builds source commit;
- Workers Builds build UUID and outcome;
- deployed Worker version;
- production article, feeds, search, sitemap, agent surfaces, canonical,
  indexing, and preview-host checks;
- unchanged M2 evidence/media and adjacent app state; and
- the known rollback point.

Repository HEAD may advance after a deployment. Never substitute a later
documentation-only HEAD for the actual Workers Builds source.

## 8. Correct or roll back

For a typo or non-material formatting correction, use a normal reviewed change.
For a material correction:

1. add `lastUpdated`;
2. add a visible correction note describing what changed and why;
3. preserve the old evidence revision;
4. repeat editorial review and public-surface validation; and
5. record the correction commit and rollout.

Never silently revise frozen evidence or conceal a material claim change.

Before merge, cancel publication by reverting the publication change as one
reviewed unit. After production rollout, prepare a coordinated revert that
restores the article state, section index, publication-specific assertions, and
rollout record together, then let the normal checked pipeline redeploy. A
frontmatter-only change to `draft: true` is not a supported rollback: Nimbus
removes the article outputs while the public index and assertions still require
them. If later closeout commits touched the same documentation, resolve those
revert conflicts explicitly rather than bypassing CI. An operational rollback
to a previous Worker version requires separate Cloudflare authorization.
