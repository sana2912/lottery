# Lottery Intelligence Dashboard

Production-oriented MVP scaffold for a user-facing lottery analytics dashboard.

## Runtime

- Bun v1.3.13
- Package manager metadata is pinned with `packageManager: bun@1.3.13`.
- Project scripts run through Bun, including Prisma CLI commands via `bunx --bun`.

## Scope

This scaffold intentionally contains structure only. Feature logic, data fetching, prediction models, persistence, and admin/content workflows are left as TODOs until the historical-results API and seed data are ready.

Agents working in this repo should read `AGENTS.md`. Any UI or UI feature work must read `design.md` first.

## App Routes

- `/dashboard`
- `/results`
- `/analytics`
- `/patterns`
- `/prediction-lab`
- `/watchlist`
- `/compare`
- `/calendar`
- `/methodology`

## Architecture

- `src/app`: Next.js route entry points.
- `src/frontend/pages`: Route-level page modules.
- `src/frontend/components`: Composed UI components.
- `src/frontend/primitives`: Reusable design primitives.
- `src/frontend/chart-primitives`: D3-based chart building blocks.
- `src/api`: Elysia API router, DTO model, and business services.
- `src/lib/api` and `src/lib/app`: Environment-specific shared helpers.
- `src/util/api` and `src/util/app`: Small utility functions.
- `src/schema/api`: API TypeScript interfaces.
- `src/schema/app`: App-facing Zod schemas and inferred types.

## UI System

- Local primitives stay in `src/frontend/primitives`.
- Composed UI components stay in `src/frontend/components`.
- Animate UI registry components should be added under `src/frontend/components/animate-ui`.
- `components.json` is configured for shadcn registry usage with Bun.
- Project MCP config is in `.mcp.json` for clients that support project-local MCP config.
- Codex requires manual MCP config in `~/.codex/config.toml`; see `docs/codex-mcp.example.toml`.

## Security And Environment

- Environment files are split into `.env.development` and `.env.production`.
- Private dotenvx keys belong in `.env.keys`; this file is ignored by git.
- `bun run dev`, `bun run build`, and `bun run start` decrypt the matching env file before running.
- Use `bun run env:encrypt:dev` and `bun run env:encrypt:prod` before sharing encrypted env changes.

## Code Quality

- Husky runs `lint-staged` before every commit.
- Biome handles fast format/check for TypeScript, JavaScript, JSON, Markdown, YAML, and related files.
- JavaScript files also pass through ESLint fix with zero warnings in lint-staged.
- Full local check: `bun run check`.
- Security workflow details: `docs/security.md`.

## Database

- Prisma ORM v7.7.0 scaffold.
- MongoDB provider in `prisma/schema.prisma`.
- Database URL in `prisma.config.ts` via `DATABASE_URL`.
- Generated Prisma Client output: `src/generated/prisma`.
- Prisma Client generator runtime: `bun`.
- All generated model IDs use UUID v7 and are mapped to MongoDB `_id`.

## API

The API is mounted through Next.js App Router at `src/app/api/[[...route]]/route.ts`, but request handling is delegated to Elysia via `apiApp.fetch`.

Current placeholder modules:

- `/api/draws`
- `/api/analytics`
- `/api/predictions`
- `/api/watchlist`
