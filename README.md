# Foodies Finds

Mobile-first recipe webapp built with Next.js App Router, React, TypeScript, Tailwind CSS,
and shadcn components. The sibling `recipe-api` repository runs the Hono/Drizzle backend
on Cloudflare Workers, using Supabase Postgres through Hyperdrive and R2 for images.

## Local development

Use Node.js 24 (`nvm use`) and pnpm 10.33.2, pinned in `package.json`.
With Corepack installed, run `corepack enable` so `pnpm` uses that version.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Start `recipe-api` separately following its README, then open <http://localhost:3000>.
The example targets the local Worker at <http://localhost:8787>. Set `API_KEY` to the
same value as the backend's `USER_API_KEY`. Both variables are server-only; never
prefix the API key with `NEXT_PUBLIC_` or commit `.env.local`.

| Variable                        | Purpose                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `API_URL`                       | Backend base URL, without a trailing slash                                       |
| `API_KEY`                       | Backend user API key, sent as `X-Api-Key`                                        |
| `VERCEL_PROJECT_PRODUCTION_URL` | Optional Vercel-provided hostname used for metadata; otherwise localhost is used |

The browser uses Next.js actions and API routes for backend requests. Image uploads
use a backend-generated presigned URL for a direct PUT to R2; the recipe stores the
returned image key. See `AGENTS.md` for the shared API conventions.

## Commands and checks

```bash
pnpm dev           # development server
pnpm lint
pnpm format:check
pnpm test          # one-shot Vitest + React Testing Library
pnpm typecheck     # generate Next.js types, then tsc --noEmit
pnpm build         # production build
pnpm start         # serve a completed production build
```

Use `pnpm test:watch` while developing and `pnpm exec prettier --write <files>` to
format changed files. Pull requests and pushes to `main` run lint, formatting,
tests, and type checks in GitHub Actions. These checks do not require production
credentials. Production builds use Google Fonts and may require network access;
pages that fetch recipe data also depend on backend configuration.

## Coding agents

`AGENTS.md` contains the shared instructions for Codex and Claude Code. `CLAUDE.md`
imports it. Preserve the generated Next.js guidance and consult the bundled docs in
`node_modules/next/dist/docs/` when changing framework code.

shadcn MCP is configured in `.mcp.json` for Claude Code and `.codex/config.toml` for
Codex. Trust the project in Codex to load its project-scoped configuration; the MCP
server's first launch may require npm network access.

The existing Claude GitHub bot reviews PRs automatically and responds to `@claude`
mentions in issues and PR comments. Local Codex support does not change those workflows.

## Deployment

The frontend is configured for Vercel. Supply server-side `API_URL` and `API_KEY`
in the deployment environment; keep local development pointed at the local Worker.
