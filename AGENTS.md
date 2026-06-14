# Project Agent Guide

Operating guide for AI/code agents in this repository.

## Agent workflow

**Do not run verification or database commands yourself.** Ask the person prompting to run them and report results.

| They run                                         | When                                                            |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `bun run check`                                  | After non-trivial code changes                                  |
| `bun test` or targeted `bun test <path>`         | When behavior or tests changed                                  |
| `bun run db:generate` / `db:migrate` / `db:push` | After `prisma/schema.prisma` changes                            |
| `bun run db:compute-analysis`                    | After analytics engine or snapshot payload changes              |
| `bun run db:audit`                               | After seed, import, or compute                                  |
| `bun run db:audit:calc`                          | Deep audits: draw-prizes + normalization + compute scope matrix |
| `bun run db:audit:scope`                         | Compute/snapshot scope: v8 matrix (`11 + 11×12` = 143 contexts) |

Agents may edit code, read files, and explain failures from user-provided output. Do not bypass Husky pre-commit unless the user asks.

## Product

**Lottery Intelligence Dashboard** — production user-facing lottery statistics, analytics, and prediction research. Modular boundaries are required; shallow or half-finished delivery is not.

**Banned framing (do not write in code, docs, commits, or comments):** `MVP`, `scaffold-only`, `placeholder until later`, `unless explicitly requested` as an excuse to skip depth. This project ships **complete, auditable features**, not demos.

## Delivery standard (required)

When you touch a feature, page, API, or data pipeline, finish it **end-to-end** in that same effort unless the user explicitly narrows scope in the current message.

**Definition of done for a feature unit:**

1. **Data** — correct scope/window/prize semantics; snapshots recomputed when analytics change (`db:compute-analysis`).
2. **API** — router + service + DTO + `src/schema/api` / `src/schema/app` aligned; no `501` stubs left for routes that are in use.
3. **UI** — page wiring, filters, empty/error states, mobile behavior.
4. **Tests** — behavior that changed must have targeted tests; ask the user to run `bun test`.
5. **Audit** — analytics/metrics changes: user runs `db:audit:calc` (or at least `db:audit:scope` when only snapshot scope changed).
6. **No drive-by** — do not start a second feature while the first is incomplete; do not leave TODO stubs, mock-only paths, or partial refactors.

**One task, one completion.** If scope is too large, propose a split with a clear done checklist per slice — do not jump to a new feature and leave the prior slice half-wired.

### Analysis pipeline guardrails

When changing analytics sample, snapshot, calendar heatmap, or audit scripts:

1. **Parity** — extend `tests/analysis/analysis-pipeline-parity.test.ts` or `tests/analysis/compute-scope-audit.test.ts` so snapshot, on-demand, and `eligible-sample` replay agree for the touched context.
2. **Audit** — `scripts/lib/compute-scope-audit.ts` must import eligibility from `eligible-sample.ts` (aligned with `sample-resolver.ts` SQL).
3. **Terminology** — `windowSize` in analysis = stored `sampleDrawCount`; prediction `windowSize` = training draw count (different domain).
4. **Close the loop** — ask the human to run `db:compute-analysis` + `db:audit:scope` after snapshot payload changes; fix sample/snapshot before UI patches.

## Runtime

- Bun `1.3.13` (see `.bun-version`, `packageManager` in `package.json`)
- Use Bun only; do not add npm/pnpm/yarn lockfiles unless asked
- Env: `.env.development` (local), `.env.example` (safe example values); production via platform env vars
- Never commit real secrets

## Requirements

- UI must stay data-oriented and must not imply guaranteed lottery winnings.

## Module boundaries

| Layer     | Path                                                        | Role                                                                                             |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Routes    | `src/app`                                                   | Thin Next.js entry only                                                                          |
| Pages     | `src/frontend/pages`                                        | Route composition (`index.tsx`, `*.content.ts`, `*.data.ts`, `*.mappers.ts`, `*.components.tsx`) |
| UI        | `src/frontend/components`, `primitives`, `chart-primitives` | Reusable product UI                                                                              |
| API       | `src/api/router`, `service`, `model/dto`                    | Elysia routes, logic, serialization                                                              |
| Contracts | `src/schema/api` (TS transport), `src/schema/app` (Zod)     | Public shapes and validation                                                                     |
| Clients   | `src/lib/api`, `src/lib/app`                                | Frontend fetch/helpers                                                                           |
| Utils     | `src/util/api`, `src/util/app`                              | Small helpers by consumer                                                                        |
| DB        | `prisma/`                                                   | Schema only (agents do not edit `prisma/migrations/`)                                            |

**Import rules:** frontend must not import `src/api/*` or `src/util/api/*`; backend must not import `src/frontend/*`. DTOs are backend-only; frontend uses `src/schema/app` + `src/lib/api`.

## API

Elysia via `src/app/api/[[...route]]/route.ts` → `src/api/index.ts`. Routes: `/api/draws`, `/analytics`, `/predictions`, `/watchlist`, `/compare`, `/calendar`.

## Database (agents)

- Edit `prisma/schema.prisma` only; tell the user to run `db:generate`, `db:migrate`, or `db:push`
- Do not run migrations or `db:push` unless the user explicitly asks in the current turn
- IDs: UUID v7 (`@default(uuid(7))`); datasource URL in `prisma.config.ts`, not `schema.prisma`

## UI essentials

- Square UI: `rounded-none`; semantic tokens from `globals.css` (no raw `text-sky-*` / hex)
- Charts: `src/frontend/chart-primitives` (D3)
- Icons: `lucide-react`; `cn` from `@/lib/app/cn`
- Animate UI / shadcn: see `docs/animate-ui.md`, `components.json`

## Implementation

- Preserve unrelated user changes
- Types at boundaries; no cross-layer logic in route files
- State: URL params for filters; TanStack Query / Zustand / RHF only when needed
- Read-heavy data in API services; filters in query params
- Admin CMS and bulk import UIs are out of product scope unless the user requests them in the current turn

## Human-run commands (reference)

```bash
bun install
bun run dev
bun run check          # biome + eslint + typecheck
bun test
bun run db:seed
bun run db:compute-analysis
bun run db:audit
bun run db:audit:calc  # draw-prizes + analysis + scope → reports/audit/
```

Data ops runbook: `docs/production-data-ops.md`.
