@AGENTS.md

## Project Overview

Foodies Finds is a webapp where users can add and update their favorite homemade recipes. It is used mostly by users on their phones, so mobile UI/UX is a priority. The theme of the site should appeal to people's appetites

## Business Logic

When a user adds a recipe, they can also create ingredients, tags, and cuisines with it. Steps and ingredients are mandatory. There are other attributes like name, but those are some of the most important.

## Tech Stack

- NextJS 16.2.4
- TypeScript 5.9.3
- TailwindCSS 4.2.4
- Scadcn for UI components
- Spring Boot 3.3.4 for the backend in ECS
- Supabase for the DB

## Project Structure

src/
├── app/ # App Router pages and layouts
├── components/ # Shared UI components
│ ├── ui/ # shadcn primitives
│ └── ... # your composites
├── lib/ # utilities, helpers
├── hooks/ # custom React hooks
└── types/ # shared TypeScript types

## Code Conventions

- App router will be used for this project.
- Use server components by default, client components only when necessary
- Prefer named exports over default exports
- Use arrow functions except when hoisting is required
- Co-locate component styles with the component (Tailwind only, no CSS files)
- Make sure to add unit tests using Vitest and React Testing Library
- Make sure to provide errors to the user during request validations. Avoid 500 errors being propagated to users
- The code should be self documenting. Don't write comments unless they are asked for
- No `any` types unless its type is obvious

## Backend API

The API uses x-api-key as a header. Backend base URL: process.env.API_URL.

## UI/UX Rules

- Mobile-first always — primary targets are 375px (iPhone SE) and 390px (iPhone 14/15)
- Design base styles for 375px so nothing breaks on the smallest common iPhone
- Account for iOS safe area insets on any fixed bottom elements using `env(safe-area-inset-bottom)`
- Never rely on fixed viewport height for scrollable content — use scroll instead
- Assume soft keyboard will compress viewport on any form input — design forms accordingly
- shadcn components as the base, customized with Tailwind. Use the shadcn MCP that's been added and use the components where possible
- I may eventually want to add new features for taking items in a fridge and proposing recipes + tracking when things expire and sending texts as reminders. Keep that in mind when designing
  ui to be flexible for this purpose

## Key Commands

- pnpm next dev
-
