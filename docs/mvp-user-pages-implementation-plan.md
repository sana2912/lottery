# MVP User Pages Implementation Plan

This document is the main product and implementation reference for the user-facing MVP of the Lottery Intelligence Dashboard.

Use this file as the source of truth for:
- MVP page scope
- page-level data requirements
- shared read models and API contracts
- implementation status by phase
- deferred work after the current MVP

Read this together with:
- `AGENTS.md` for repository rules and architectural boundaries
- `design.md` for the UI system and visual direction

## Current Project Status

The project is no longer scaffold-only. Core MVP phases for the user-facing dashboard have already been implemented across frontend pages, API routes, DTO mapping, and PostgreSQL-backed persistence.

Current runtime and stack:
- Bun `1.3.13`
- Next.js App Router
- Elysia API mounted through `src/app/api/[[...route]]/route.ts`
- Prisma `^7.8.0`
- PostgreSQL via `@prisma/adapter-pg`
- Prisma generated client output in `src/generated/prisma`

Current API surface:
- `/api/draws`
- `/api/analytics`
- `/api/predictions`
- `/api/watchlist`
- `/api/backtests`
- `/api/compare`
- `/api/calendar`

Current user-facing routes:
- `/`
- `/dashboard`
- `/results`
- `/analytics`
- `/patterns`
- `/prediction-lab`
- `/backtest`
- `/watchlist`
- `/compare`
- `/calendar`
- `/methodology`

## Architecture Boundaries

The MVP must continue to respect these boundaries:

- `src/app`: route entrypoints only
- `src/frontend/pages`: route-level page composition
- `src/frontend/components`: reusable composed product UI
- `src/frontend/primitives`: low-level UI primitives
- `src/frontend/chart-primitives`: reusable chart foundations
- `src/api/router`: API route definitions and request wiring
- `src/api/service`: business logic and persistence orchestration
- `src/api/model/dto`: backend-only response mapping and serialization
- `src/schema/api`: public TypeScript API contracts
- `src/schema/app`: Zod validation and inferred app types
- `src/lib/api`: frontend API client helpers only
- `src/util/api`: backend/API route helpers only

Important rules:
- Frontend code must not import `src/api/*` or `src/util/api/*`
- API/service/DTO code must not import `src/frontend/*`
- DTOs must not become the shared schema source
- Page files should stay thin and avoid feature-heavy business logic

## Product Direction

Lottery Intelligence Dashboard is a data-driven analytics product, not a gambling-style site.

Language and UX should emphasize:
- analysis
- signal
- score
- historical tendency
- trend
- uncertainty
- explanation

Language and UX must avoid:
- guaranteed win claims
- hype/casino styling
- opaque prediction claims without explanation

Prediction and backtest features must remain explainable. Every score-bearing result should preserve:
- `score`
- `scoreBreakdown`
- `reasons`

## Shared MVP Principles

1. Results are the source-of-truth foundation.
The rest of the product depends on historical draw and prize data being accessible, searchable, and serializable in stable contracts.

2. Analytics derive from raw data, not page-local calculations.
Hot/cold, overdue, trend, pattern, and ranking signals should be computed in service logic and returned as read models.

3. Prediction remains responsible and explainable.
The product can rank and score candidates, but must not imply certainty.

4. Backtests must avoid data leakage.
Walk-forward evaluation must use only data available before the target draw.

5. Read models should stay page-oriented.
Pages should consume stable API/read-model shapes instead of mixing persistence logic into the view layer.

## Shared Data Concepts

Core domain entities:
- `LotteryDraw`
- `LotteryPrize`
- `UserWatchlistItem`
- `PredictionRun`
- `PredictionResult`
- `BacktestRun`
- `BacktestResult`

Shared analytical concepts:
- draw
- prize
- digit event
- digit stats
- number stats
- pattern summary
- prediction score
- score breakdown
- walk-forward backtest result
- monthly calendar insight

Important data rules:
- preserve lottery numbers as strings
- preserve leading zeroes
- separate raw records from computed statistics
- always scope statistics by `lotteryType`, `prizeType`, and a date/window context

## Page And Feature Scope

### Dashboard

Purpose:
- provide a product overview
- summarize latest draw coverage
- surface example signals and prediction summaries

Expected data:
- latest draw summary
- high-level metrics
- signal cards
- compact prediction summary
- read-model contract references

Status:
- implemented with route-level page module
- currently uses structured read-model driven UI

### Results

Purpose:
- act as the historical source of truth
- support browsing, filtering, and draw detail lookup

Expected data:
- paginated draw list
- draw detail
- prize breakdown per draw
- filter state for lottery/prize/date/query

Status:
- `/api/draws` and `/api/draws/:id` implemented
- Results list and detail pages connected

### Analytics

Purpose:
- expose reusable number and digit statistics
- feed other pages that depend on ranked or summarized number behavior

Expected data:
- digit stats
- number stats
- pattern summaries
- summary metadata

Status:
- analytics engine implemented
- `/api/analytics`, `/digits`, `/numbers` implemented
- Analytics page connected

### Patterns

Purpose:
- present pattern summaries derived from analytics
- keep insights descriptive rather than predictive

Expected data:
- pattern summaries
- flagged number groups
- visual pattern clustering via chart primitives

Status:
- implemented on top of analytics read model

### Prediction Lab

Purpose:
- generate explainable candidate numbers
- expose strategy-based scoring and save-to-watchlist flow

Expected data:
- prediction request contract
- ranked candidate results
- score breakdown
- reasons

Status:
- strategy registry implemented
- scoring engine implemented
- `/api/predictions` implemented
- save-to-watchlist flow connected

### Watchlist

Purpose:
- let users save and annotate candidate numbers

Expected data:
- list items
- source
- tags
- note
- global scope until auth exists

Status:
- CRUD API implemented
- current scope is global because auth/user ownership is deferred

Deferred:
- `userId` or per-account watchlist scoping

### Backtest

Purpose:
- evaluate strategies against historical draws
- provide audit-friendly performance and result history

Expected data:
- run config
- run summary
- per-draw results
- history list
- persisted backtest runs/results

Status:
- walk-forward engine implemented
- persistence implemented
- `/api/backtests` list/detail/post implemented
- reload/history flow connected

### Compare

Purpose:
- compare multiple candidate numbers under the same scoring model

Expected data:
- candidate list
- ranking
- strongest signal
- per-number score breakdown

Status:
- `/api/compare` implemented
- Compare page connected

### Calendar

Purpose:
- show draw rhythm and sample-based monthly insight

Expected data:
- next draw
- recent draws
- monthly insights
- hot/cold numbers by sampled month

Status:
- `calendarService` implemented
- `/api/calendar` implemented
- Calendar page connected

### Methodology

Purpose:
- explain score interpretation, backtest reading, caveats, and responsible use

Expected data:
- static but production-ready content
- deep links from score/stat pages

Status:
- production methodology page implemented
- cross-links added from related pages

## Phase Status

### Phase 1: Contracts And Foundations

Completed:
- expanded API and app contracts
- added DTO mappers
- added shared mock/read-model helpers
- added reusable UI components

### Phase 2: Results Foundation

Completed:
- implemented `drawService`
- implemented `/api/draws` and `/api/draws/:id`
- connected Results page to API/fallback model
- added result detail page
- added Prisma indexes

### Phase 3: Analytics And Patterns

Completed:
- implemented digit event extraction
- implemented digit stats
- implemented number stats
- implemented pattern summaries
- implemented analytics API routes
- connected Analytics and Patterns pages

### Phase 4: Prediction Lab And Watchlist

Completed:
- implemented strategy registry
- implemented scoring engine
- implemented `/api/predictions`
- implemented watchlist CRUD API
- connected save-to-watchlist flow

Deferred:
- per-user watchlist ownership

### Phase 5: Backtest And Compare

Completed:
- implemented walk-forward backtest engine
- implemented backtest persistence
- implemented `/api/backtests`
- implemented `/api/compare`
- connected Backtest and Compare pages
- added history and reload flow

### Phase 6: Calendar And Methodology

Completed:
- implemented `calendarService`
- implemented `/api/calendar`
- connected Calendar page
- implemented production Methodology page
- added methodology cross-links from relevant pages

### Phase 7: Advanced Statistical And ML Layer

Not implemented.

This phase remains future work and may include:
- Bayesian confidence
- Monte Carlo simulation
- clustering labels
- seasonal/Prophet-style insight layers
- feature tables for model-based ranking
- advanced experiment tracking models

Any future phase 7 work must preserve:
- explainability
- auditability
- non-guarantee product language

## Testing Status

Current test coverage layers in repo:
- analytics core unit tests
- utility/client helper tests
- DTO tests
- prediction and walk-forward engine tests
- service tests with fake Prisma/dependency seams
- router/API validation tests through Elysia app wiring

Current default verification command:
- `bun run check`

## Testing Follow-up

The following is intentionally deferred for now:
- integration-style tests with a real PostgreSQL test database
- seeded test data for critical end-to-end flows

When scheduled later, prioritize real-data integration coverage for:
- draws query and detail flows
- analytics aggregation
- prediction generation
- backtest persistence and reload
- watchlist CRUD
- calendar read model generation

## Technical Notes

- Use Bun commands only
- Prefer `bun run check`, `bun run typecheck`, and `bun --bun test`
- Keep number values as strings
- Do not implement opaque prediction systems in the MVP
- Keep route files thin
- Keep business logic in services
- Keep serialization in DTOs
- Keep frontend state small unless a larger state tool is justified

## Definition Of Done For Current MVP

The current MVP is considered functionally complete when:
- all navigation pages are real pages, not placeholders
- each page consumes stable data contracts
- Results supports historical read flows
- Analytics exposes reusable stats
- Patterns exposes descriptive insights
- Prediction Lab returns explainable ranked candidates
- Watchlist supports save/edit/delete
- Backtest exposes summary and per-draw results
- Compare supports candidate scoring comparison
- Calendar exposes next draw and sample-based monthly insight
- Methodology explains score meaning and limitations clearly
- loading, empty, and responsive states exist across the main flows
