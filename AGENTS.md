<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Project Overview

Foodies Finds is a webapp where users can add and update their favorite homemade recipes. It is used mostly by users on their phones, so mobile UI/UX is a priority. The theme of the site should appeal to people's appetites

## Business Logic

When a user adds a recipe, they can also create ingredients, tags, and cuisines with it. Steps and ingredients are mandatory. There are other attributes like name, but those are some of the most important.

## Tech Stack

- NextJS 16.2.4
- TypeScript 5.9.3
- TailwindCSS 4.2.4
- shadcn for UI components
- Hono + Drizzle backend (`recipe-api`) on Cloudflare Workers
- Hyperdrive for database connections and R2 for images
- Supabase for the DB

## Project Structure

```text
src/
├── app/ # App Router pages and layouts
├── components/ # Shared UI components
│ ├── ui/ # shadcn primitives
│ └── ... # your composites
├── lib/ # utilities, helpers
├── hooks/ # custom React hooks
└── types/ # shared TypeScript types
```

## Code Conventions

- App router will be used for this project.
- Use server components by default, client components only when necessary
- Prefer named exports over default exports
- Use arrow functions except when hoisting is required
- Co-locate component styles with the component (Tailwind only, no CSS files)
- Make sure to add unit tests using Vitest and React Testing Library
- Make sure to provide errors to the user during request validations. Avoid 500 errors being propagated to users
- The code should be self documenting. Don't write comments unless they are asked for
- Follow single responsibility principle throughout the code
- No `any` types unless its type is obvious

## Cross-repository API contract

- `foodies-finds` is the Next.js frontend; `recipe-api` is the Hono backend on Cloudflare Workers. Check the sibling repository when changing a shared contract.
- The frontend calls the backend on the server using `API_URL` and `API_KEY`; send the key in `X-Api-Key`. Never expose it through a `NEXT_PUBLIC_` variable. The backend accepts `USER_API_KEY` for ordinary access and requires `ADMIN_API_KEY` for deleting recipes.
- Success envelope: `{ timestamp: string, status: number, message: string, data: unknown }`. Error envelope: `{ timestamp: string, status: number, message: string, path: string }`. Frontend server-side helpers unwrap `data` and propagate useful error messages.
- PATCH leaves omitted fields unchanged. Explicit `null` clears nullable fields only; required fields must still satisfy the route's validation schema.
- Image uploads use `POST /recipes/images/presign`, then a direct PUT to R2. Submit the returned `key` as the recipe's `imageUrl`, not the public URL. Reads resolve stored keys to public URLs; legacy full URLs remain supported.

## UI/UX Rules

- Mobile-first always — primary targets are 375px (iPhone SE) and 390px (iPhone 14/15)
- Design base styles for 375px so nothing breaks on the smallest common iPhone
- Account for iOS safe area insets on any fixed bottom elements using `env(safe-area-inset-bottom)`
- Never rely on fixed viewport height for scrollable content — use scroll instead
- Assume soft keyboard will compress viewport on any form input — design forms accordingly
- shadcn components as the base, customized with Tailwind. Use the shadcn MCP that's been added and use the components where possible
- I may eventually want to add new features for taking items in a fridge and proposing recipes + tracking when things expire and sending texts as reminders. Keep that in mind when designing
  ui to be flexible for this purpose

## Development and validation

Use Node.js 24 and the pnpm version pinned in `package.json`. See README.md for environment setup.

- Install: `pnpm install --frozen-lockfile`
- Dev server: `pnpm dev`
- Tests: `pnpm test` (Vitest + React Testing Library)
- Lint: `pnpm lint`
- Format check: `pnpm format:check`; format changed files with `pnpm exec prettier --write <files>`
- Type check: `pnpm typecheck` (generates Next.js route types first)
- Production build: `pnpm build`

Run lint, formatting checks, tests, and type checking before handing off changes. Run the production build for changes affecting routing or build behavior, and report any environment-dependent failures.

## Agent configuration

`AGENTS.md` is the shared instruction source. `CLAUDE.md` imports it for Claude Code. shadcn MCP is configured in `.mcp.json` for Claude and `.codex/config.toml` for Codex; Codex must trust the project to load project-scoped configuration.
