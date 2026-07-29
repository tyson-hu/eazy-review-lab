# Personal-blog feed contract

> Lab-owned contract only. Do **not** edit the personal-blog repository as part
> of Eazy Review Lab milestones. Implement blog-side consumption when that
> repository is separately authorized.

## Endpoints

- JSON Feed (preferred): `https://lab.tianzhe.me/feed.json`
- RSS 2.0: `https://lab.tianzhe.me/feed.xml`

## Editorial roles

- Eazy Review Lab owns the fully detailed implementation journal, including
  exact migrations, security decisions, failures, tests, and environment
  evidence.
- The personal blog may publish a separate, more general account of how
  Supabase was implemented from the start.
- The general blog post should link to the applicable Lab journal subsection
  for the complete technical record. It is a companion narrative, not a copy or
  replacement.
- Blog drafting, review metadata, publication, and rollout remain separate work
  in the personal-blog repository and require separate authorization.

## Consumer rules (version 1)

1. Fetch `https://lab.tianzhe.me/feed.json`.
2. Prefer items where `featured: true`.
3. Show at most three items.
4. Link each item to its canonical lab article URL (`item.url`).
5. Fall back gracefully if the feed cannot be fetched (hide the section or keep
   last-good curated links).

## Item fields the blog may rely on

| Field | Notes |
| --- | --- |
| `id` / `url` | Canonical absolute `https://lab.tianzhe.me/...` permalink |
| `title` | Article title |
| `summary` | Short description |
| `date_published` | ISO 8601 |
| `tags` | String array |
| `kind` | `journal` \| `report` \| `experiment` |
| `project` | Currently `eazy-review` |
| `featured` | Boolean preference signal |
| `image` | Optional absolute social image URL |

## Curated companion links

When the personal blog is updated under a separate authorization, add:

- **Read the case study** → flagship report URL
- **Explore the development lab** → `https://lab.tianzhe.me/`
- **View the source code** → `https://github.com/tyson-hu/Eazy-Review`

## Non-goals

- No full-article duplication on the personal blog
- No automatic cross-repository source synchronization
- No CMS or auth bridge in version 1
