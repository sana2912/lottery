# Production Data Ops

This document is the runbook for bootstrapping, refreshing, and verifying lottery data in local and production-like environments.

## Scope

Use this runbook when you need to:

- initialize an empty database
- import or refresh historical draw data
- recompute analytics snapshots
- verify database state after a data operation

## Local Bootstrap

Run these commands in order against `.env.development`:

```bash
bun run db:migrate
bun run db:generate
bun run db:seed lottory-histoty
bun run db:compute-stats
bun run db:audit
bun run dev
```

Expected outcome:

- Prisma schema is applied.
- Generated Prisma client matches the current schema.
- Historical draw data is present.
- Materialized analytics snapshots are present.
- `db:audit` prints a non-zero draw count, prize count, and snapshot counts.

## Local Refresh After Data Import

If you rerun the historical import or add new CSV data, refresh the derived layers after import:

```bash
bun run db:seed lottory-histoty
bun run db:compute-stats
bun run db:audit
```

If you know the affected date range and only want to refresh canonical contexts touched by that import:

```bash
bun run db:compute-stats -- --startDate=2026-04-01 --endDate=2026-04-30
bun run db:audit
```

If you need to refresh one canonical analytics context only:

```bash
bun run db:compute-stats -- --prizeType=TWO_DIGIT --windowSize=120
bun run db:audit
```

## What `db:audit` Verifies

`bun run db:audit` prints:

- draw row count
- prize row count
- latest draw date and source status
- draw source-status distribution
- prediction run count
- backtest run count
- digit snapshot row count and latest `computedAt`
- number snapshot row count and latest `computedAt`

Use it after every seed/import or stats recompute step. If counts are unexpectedly zero or the latest draw date is stale, stop and inspect the import or compute step before continuing.

## Production Sequence

Production should use platform-managed environment variables, especially `DATABASE_URL`. Do not commit `.env.production` to the repository.

Recommended sequence:

1. Apply database migrations.
2. Generate the Prisma client in the build or release environment.
3. Import draw data through a trusted operator task or one-off job.
4. Recompute materialized stats.
5. Run `db:audit`.
6. Serve the application.

## Production Command Notes

This repo already includes:

```bash
bun run db:migrate:prod
bun run db:push:prod
bun run db:studio:prod
```

These commands rely on `scripts/run-with-env.ts`. Use that helper only with a secure env file outside version control, or run equivalent commands in an environment where `DATABASE_URL` is already injected by the platform.

For production data refresh in a shell where `DATABASE_URL` is already injected, the practical command sequence is:

```bash
bun run db:migrate:prod
bun scripts/compute-stats.ts
bun scripts/db-audit.ts
```

If you need to use a secure env file outside version control, use `scripts/run-with-env.ts` instead of committing `.env.production`:

```bash
bun run scripts/run-with-env.ts <secure-env-file> -- bun scripts/compute-stats.ts
bun run scripts/run-with-env.ts <secure-env-file> -- bun scripts/db-audit.ts
```

## Failure Handling

If `db:seed` fails:

- inspect the validation error
- fix the importer or source data issue
- rerun seed
- rerun `db:audit`

If `db:compute-stats` fails:

- rerun with a single context or incremental date range to isolate the problem
- confirm snapshot counts with `db:audit`

If `db:audit` reports stale or zero counts:

- check that the correct `DATABASE_URL` is in use
- confirm migrations were applied to the same database
- confirm seed/import completed against the same database
