# Workers Builds configuration (M3)

> Credentials and generated build tokens must **never** be committed to Git.

## Required settings (current Cloudflare model)

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `pnpm run check` |
| Deploy command | `pnpm exec wrangler deploy` |
| Non-production branch deploy | `pnpm exec wrangler versions upload` |
| Root directory | `/` |
| Production env | `SITE_INDEXABLE=true` (build-time) |
| Preview / non-production env | omit `SITE_INDEXABLE` (preview HTML stays noindexed; edge host guard also forces noindex on `workers.dev`) |

Official references:

- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/

## One-time prerequisites

1. Install the **Cloudflare Workers & Pages** GitHub App for `tyson-hu` and grant access to `eazy-review-lab`.
2. In the Worker **Settings → Builds → Connect**, select `tyson-hu/eazy-review-lab`.
3. Apply the table above. Cloudflare can auto-create the build/deploy API token; do not store it in the repository.
4. Push to `main` (or trigger a manual build) and confirm a green build in the dashboard and via the Builds MCP/`GET /builds/workers/{tag}/builds`.

Worker identifiers:

- Name: `eazy-review-lab`
- Tag / external_script_id: `5247c67273e54070b39cb2b516c65731`
- Account: `ec2f2c85486a7516b435bdc56073f335` (Tyson)

## API automation note

Wrangler OAuth used for deploy does **not** include Workers Builds Configuration Edit.
Programmatic setup requires a **user API token** with that permission (see Cloudflare Builds API reference). Prefer the dashboard Connect flow unless such a token is available locally and never committed.
