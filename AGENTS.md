# Project Agent Guide

This file is the operating guide for AI/code agents working in this repository.

## Product

Lottery Intelligence Dashboard is a user-facing lottery statistics and prediction MVP. The current scope is scaffold-first: keep architecture modular, preserve boundaries, and avoid implementing feature behavior unless explicitly requested.

## Runtime And Package Manager

- Runtime/package manager: Bun `1.3.13`
- Version pin: `.bun-version`
- Package metadata: `packageManager: bun@1.3.13`

Use Bun commands:

```bash
bun install
bun run dev
bun run lint
bun run check
bun run typecheck
bun run db:generate
bun run db:push
```

Do not introduce npm, pnpm, or yarn lockfiles unless the user explicitly asks.

## Security And Environment

Environment management uses dotenvx.

- Package: `@dotenvx/dotenvx`
- Development env file: `.env.development`
- Production env file: `.env.production`
- Private dotenvx key file: `.env.keys`
- `.env.keys` is ignored by git and must not be committed.

Available commands:

```bash
bun run env:encrypt:dev
bun run env:encrypt:prod
bun run env:decrypt:dev
bun run env:decrypt:prod
```

Runtime scripts inject encrypted values in memory with dotenvx and must not rewrite env files to plaintext:

```bash
bun run dev
bun run build
bun run start
```

Use `env:decrypt:*` only when a developer explicitly needs a local plaintext env file for inspection or editing. Re-encrypt before sharing changes.

Do not add real secrets to documentation, examples, final responses, or committed files. If adding new required env vars, update `.env.development`, `.env.production`, and `.env.example` with safe placeholders.

## Code Quality And Git Hooks

Pre-commit quality checks use Husky and lint-staged.

- Hook file: `.husky/pre-commit`
- Hook command: `bunx --bun lint-staged`
- Biome config: `biome.json`
- lint-staged config: `package.json`

Run project checks with:

```bash
bun run check
```

Do not bypass the pre-commit hook unless the user explicitly asks.

## Required UI Workflow

Before making any UI change or UI feature implementation, read the root `design.md` file first.

This includes changes to:

- `src/frontend/pages`
- `src/frontend/components`
- `src/frontend/primitives`
- `src/frontend/chart-primitives`
- `src/frontend/styles`
- Any route/page layout that affects user-facing UI

The visual direction currently follows `design.md`. If a requested UI conflicts with it, call out the conflict briefly and choose the most product-consistent path.

## Architecture

Keep code modular and respect these boundaries:

- `src/app`: Next.js route entry points only.
- `src/frontend/pages`: Route-level page modules.
- `src/frontend/components`: Composed product UI components.
- `src/frontend/components/animate-ui`: Generated Animate UI registry components.
- `src/frontend/primitives`: Local low-level UI primitives.
- `src/frontend/chart-primitives`: D3-based reusable chart foundations.
- `src/frontend/hooks`: Frontend hooks.
- `src/api/router`: Elysia routers.
- `src/api/model/dto`: API DTOs.
- `src/api/service`: Business logic services.
- `src/lib/api`: API/runtime shared helpers.
- `src/lib/app`: App/frontend shared helpers.
- `src/util/api`: Small API utilities.
- `src/util/app`: Small app utilities.
- `src/schema/api`: API TypeScript interfaces.
- `src/schema/app`: App Zod schemas and inferred TypeScript types.
- `prisma`: Prisma config and schema.

## API

The API uses Elysia mounted through the Next.js App Router:

- Next route entry: `src/app/api/[[...route]]/route.ts`
- Elysia app: `src/api/index.ts`
- Router composition: `src/api/router/index.ts`

Current API routes are scaffold placeholders:

- `/api/draws`
- `/api/analytics`
- `/api/predictions`
- `/api/watchlist`

Keep route definitions in `src/api/router`, business logic in `src/api/service`, and DTOs in `src/api/model/dto`.

## Database

Database stack:

- Prisma ORM `^7.7.0`
- MongoDB provider
- Prisma config file: `prisma.config.ts`
- Schema: `prisma/schema.prisma`
- Generated client output: `src/generated/prisma`
- Prisma Client generator runtime: `bun`

All generated model IDs should use UUID v7:

```prisma
id String @id @default(uuid(7)) @map("_id")
```

Do not put `url = env("DATABASE_URL")` back into `schema.prisma`; this project uses `prisma.config.ts` for the datasource URL.

## UI System

Use the local UI layers intentionally:

- Use `src/frontend/primitives` for project-owned basic UI wrappers.
- Use `src/frontend/components` for composed product UI.
- Use Animate UI for animated UI components when appropriate.
- Use D3 under `src/frontend/chart-primitives` for chart foundations.
- Use lucide-react icons for UI controls when an icon exists.

Shared class helper:

```ts
import { cn } from "@/lib/app/cn";
```

## Animate UI And shadcn

Animate UI is consumed through the shadcn registry workflow.

Project config:

- `components.json`
- Registry namespace: `@animate-ui`
- Registry URL: `https://animate-ui.com/r/{name}.json`
- Project-local MCP config for compatible clients: `.mcp.json`
- Codex MCP example: `docs/codex-mcp.example.toml`
- Animate UI notes: `docs/animate-ui.md`

Common commands:

```bash
bunx --bun shadcn@latest add @animate-ui/primitives-texts-sliding-number
bunx --bun shadcn@latest add button
```

Prefer installing registry components instead of hand-copying large component source manually.

## MCP Notes

For shadcn/Animate UI MCP access:

- `components.json` must exist and include the `@animate-ui` registry.
- Dependencies must be installed for local workflows.
- Codex does not automatically read project `.mcp.json` in all environments.
- For Codex, add the shadcn MCP server manually to `~/.codex/config.toml`, then restart Codex.

Recommended Codex config:

```toml
[mcp_servers.shadcn]
command = "bunx"
args = ["--bun", "shadcn@latest", "mcp"]
```

Official shadcn docs use:

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```

## Implementation Rules

- Keep feature logic out of page files where practical.
- Do not add admin/content-management features yet.
- Do not implement prediction algorithms unless explicitly requested.
- Keep scaffold placeholders lightweight until the user asks for actual UI/feature work.
- Preserve existing user changes; do not revert unrelated work.
- Use TypeScript types and Zod schemas at module boundaries.
- Keep API-facing interfaces in `src/schema/api`.
- Keep app-facing validation schemas in `src/schema/app`.

## Verification

When Bun is available, prefer:

```bash
bun run check
bun run typecheck
bun run lint
```

For Prisma schema changes:

```bash
bun run db:generate
```

If verification cannot be run because the environment lacks Bun, say so clearly in the final response.
