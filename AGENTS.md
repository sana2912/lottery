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

## Documentation Source Of Truth

Treat the two planning docs with different roles:

- `docs/mvp-user-pages-implementation-plan.md` is the main requirement document. Use it as the source of truth for product scope, feature requirements, field dictionaries, and long-term MVP direction.
- `docs/feature-implement.md` is the progress and stage document. Use it to track current implementation status, stage gates, what has already been shipped, and what is deferred.

Do not use `docs/feature-implement.md` as the primary requirements spec when it conflicts with `docs/mvp-user-pages-implementation-plan.md`. If implementation progress changes requirements, update both docs in the same change and keep the distinction above intact.

## Folder Ownership

Keep functions and logic in the folder that matches their consumer:

| Folder | What belongs here | Primary consumer |
| --- | --- | --- |
| `src/app` | Route entrypoints, thin wiring only | Next.js routing/runtime |
| `src/frontend/pages` | Route-level page composition and page-specific view logic | App routes |
| `src/frontend/components` | Reusable composed UI components | Multiple pages/components |
| `src/frontend/primitives` | Low-level UI primitives only | Composed UI and pages |
| `src/frontend/chart-primitives` | Shared chart foundations and D3 building blocks | Analytics/chart surfaces |
| `src/frontend/hooks` | Frontend hooks used by UI | Frontend components/pages |
| `src/api/router` | API route definitions and request wiring | API runtime |
| `src/api/service` | Business logic and data access orchestration | API routers and DTOs |
| `src/api/model/dto` | Backend-only response mapping/serialization | API services and routers |
| `src/schema/api` | Public API contract types | API and consumer code |
| `src/schema/app` | Zod validation schemas and inferred app types | Frontend forms/queries and API validation |
| `src/lib/api` | Frontend-facing API client helpers, fetch wrappers, and typed request helpers | Frontend API consumers |
| `src/lib/app` | Shared app/runtime helpers | Frontend app code |
| `src/util/api` | Backend/API-route utilities such as query parsing, normalization, pagination parsing, and request parameter helpers | API routes and backend request handling |
| `src/util/app` | Small app utilities | Frontend app code |
| `prisma` | Schema and database configuration only | Prisma CLI and API services |

Do not register, call, or re-export function implementations across these boundaries if doing so would move logic into the wrong layer. Keep route code thin, keep business logic in services, keep serialization in DTOs, keep validation in `src/schema/app`, and keep transport types in `src/schema/api`.

- Frontend files must not import from `src/api/*` or `src/util/api/*`.
- API/service/DTO code must not import from `src/frontend/*`.

## API Contracts, App Schemas, And DTOs

Keep shared contracts and backend serialization separate:

- `src/schema/api` is the public API contract layer. Put API response/request TypeScript interfaces and transport-facing types here.
- `src/schema/app` is the Zod validation layer. Put app-facing schemas, form/query/body validation schemas, and inferred app types here. Frontend code may import from this layer to validate URL query params, forms, and request payloads before calling API endpoints.
- `src/api/model/dto` is backend-only serialization/mapping code. Use it to map Prisma/domain/service objects into `src/schema/api` response shapes, normalize dates/enums/labels, and hide internal fields.
- `src/lib/api` is the only place for frontend-facing API client/fetch helpers. Keep client request wrappers, typed fetch helpers, and frontend response parsing helpers here.
- `src/util/api` is backend/API-route utility code only. Keep query parsing, normalization, pagination parsing, and request-parameter helpers here.

Do not import `src/api/model/dto` from frontend code or route-level page modules. Do not make DTO files the shared Zod schema source. If an API router needs request validation, reuse the relevant Zod schema from `src/schema/app`; if it needs response serialization, call a mapper in `src/api/model/dto`.

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

## Frontend Implementation Rules

Frontend work must preserve the project design system and module boundaries:

- Read `design.md` before changing any user-facing UI.
- Keep the UI square. Use `rounded-none` for surfaces, controls, badges, chart frames, menus, and placeholders. Do not introduce rounded radius tokens or rounded utility classes.
- Treat `src/frontend/primitives` as the single source of truth for low-level UI. Do not create duplicate primitive implementations in nested folders or page files.
- Build route-level composition in `src/frontend/pages`; keep reusable product UI in `src/frontend/components`; keep route entry points in `src/app` thin.
- Use semantic tokens from `src/frontend/styles/globals.css` for colors, shadows, borders, typography, and backgrounds. Avoid hardcoded Tailwind color utilities such as `text-sky-*`, `text-purple-*`, `bg-blue-*`, or raw hex colors in components.
- Use normal letter spacing. Do not add negative tracking.
- Keep Thai and English copy valid UTF-8. Do not commit mojibake or replacement characters.
- Use `lucide-react` icons for common UI controls when an icon exists.
- Make mobile behavior explicit for user-facing navigation, filters, tables, and toolbars. Prefer accessible controls with labels, `aria-expanded`, `aria-controls`, and keyboard-safe focus styles.
- For chart surfaces, use `src/frontend/chart-primitives` as reusable foundations. Do not hand-roll chart layout inside route pages when a chart primitive can own the structure.
- Keep placeholders lightweight until real feature behavior is requested. Do not add prediction algorithms, admin flows, or data mutation behavior as part of UI cleanup.

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
- Keep backend response mapping in `src/api/model/dto`, returning types from `src/schema/api`.
- Whenever adding or changing a feature, update `docs/feature-implement.md` in the same change to keep the current stage, feature plan, contracts, and deferred work aligned with the implementation. If no documentation update is needed, state the reason in the final response.

## State Management

Choose the smallest state tool that matches the state ownership:

- Server/API data -> TanStack Query when client-side cache, refetching, optimistic updates, or mutation state are actually needed. Prefer server/service read models first for simple server-rendered data.
- Global UI state -> Zustand for cross-route or cross-component UI state that cannot live in URL state or a local parent component.
- Form state -> React Hook Form for non-trivial forms with validation, dirty state, reset behavior, or nested fields.
- Shareable filter state -> URL query params for filters/search/ranges that should be bookmarkable, reload-safe, and shareable, such as `lotteryType`, `prizeType`, `windowSize`, `startDate`, `endDate`, `year`, `month`, and `q`.
- Local tiny state -> `useState` for component-local UI state such as menu open/close, dialog visibility, temporary input, and tab state that does not need to survive reloads.

Default project bias: keep read-heavy dashboard data in API/service read models, keep filters in URL query params, and avoid introducing a global client store until a real cross-route workflow requires it.

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
