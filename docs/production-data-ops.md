# Production Data Ops

This document is the runbook for bootstrapping, refreshing, and verifying lottery data in local and production-like environments.

## Scope

Use this runbook when you need to:

- initialize an empty database
- import or refresh historical draw data
- recompute analytics snapshots
- verify database state after a data operation

## Local Bootstrap

Run these commands in order against `.env.example`:

```bash
bun run db:migrate
bun run db:generate
bun run db:seed
bun run db:compute-analysis
bun run db:audit
bun run dev
```

Expected outcome:

- Prisma schema is applied.
- Generated Prisma client matches the current schema.
- Historical draw data is present.
- Analysis snapshots are present for analytics, patterns, and calendar heatmaps.
- `db:audit` prints a non-zero draw count, prize count, and snapshot counts.

## Local Refresh After Data Import

If you rerun the historical import or add new CSV data, refresh the derived layers after import:

```bash
bun run db:seed
bun run db:compute-analysis
bun run db:audit
```

`db:seed` defaults to the committed CSV history directory `lottory-histoty`. Pass a path only when importing a different JSON, CSV, or CSV directory.

If you need to refresh one analysis context only:

```bash
bun run db:compute-analysis -- --prizeType=TWO_DIGIT --scope=ALL_TIME
bun run db:audit
```

If you need to refresh one month-scoped analysis context only:

```bash
bun run db:compute-analysis -- --prizeType=FIRST --scope=MONTH --month=5
bun run db:audit
```

## What `db:audit` Verifies

`bun run db:audit` prints:

- draw row count
- prize row count
- latest draw date and source status
- draw source-status distribution
- prediction run count
- analysis snapshot run count and latest `computedAt`
- analysis digit/number/pattern/calendar row counts

Use it after every seed/import or stats recompute step. If counts are unexpectedly zero or the latest draw date is stale, stop and inspect the import or compute step before continuing.

## Production Sequence

Production should use the checked-in `.env.example` script configuration or platform-managed environment variables for deployed runtime secrets. Do not commit real production secrets.

GHCR Docker deploy checklist: [`deploy-ghcr.md`](deploy-ghcr.md).

Recommended sequence:

1. Apply database migrations.
2. Generate the Prisma client in the build or release environment.
3. Import draw data through a trusted operator task or one-off job.
4. Recompute analysis snapshots.
5. Run `db:audit`.
6. Serve the application.

## Production Command Notes

This repo uses one script set for every environment. Edit `.env.example` to point at the intended database before running commands.

Common database commands:

```bash
bun run db:migrate
bun run db:push
bun run db:studio
bun run db:refresh
```

For production data refresh after `.env.example` points at the production database, run:

```bash
bun run db:compute-analysis
bun run db:audit
```


## Deep calculation audits (optional)

Run after changing analytics formulas, heatmap logic, or `analysis-engine-v8`:

```bash
bun run db:audit:calc
```

This writes JSON (and markdown summaries) under `reports/audit/`:

| Command | What it checks |
| --- | --- |
| `db:audit:draw-prizes` | Per-draw prize row counts vs observed profile (sparse early years) |
| `db:audit:analysis` | Metric denominators, heatmap matrix, snapshot coverage |
| `db:audit:scope` | **Full v8 compute matrix**: 11 ALL_TIME + 11×12 MONTH contexts (143 total); live sample vs `analysis_snapshot_runs`; in-memory replay vs `resolveAnalysisSample` |

Use `db:audit` for day-to-day health checks; use `db:audit:calc` when validating compute → snapshot correctness.

Analysis sample (v8):

- **ALL_TIME** — every eligible draw with matching prize types up to now (no draw cap).
- **MONTH** — `EXTRACT(MONTH)` on `drawDate`; month-across-all-years, no year dimension in product/compute.
- **Analysis snapshot metadata** — store `sampleDrawCount` and `samplePrizeCount` directly; no window dimension in the context key or stored rows.
- **Prediction `windowSize`** — training draw count only; not the analysis sample.

Optional static code scan (no database):

```bash
bun scripts/audit-grep-classification.ts --out=reports/audit/grep-classification.json
```

## Failure Handling

If `db:seed` fails:

- inspect the validation error
- fix the importer or source data issue
- rerun seed
- rerun `db:audit`

If `db:compute-analysis` fails:

- rerun with a single `prizeType`, `scope`, and `month` to isolate the problem
- confirm snapshot counts with `db:audit`

If `db:audit` reports stale or zero counts:

- check that the correct `DATABASE_URL` is in use
- confirm migrations were applied to the same database
- confirm seed/import completed against the same database
