# Manual Test E2E

This document is the manual verification checklist for real UI flows backed by the live API and database. Use it after each phase that changes UI, API read behavior, or seed/import behavior.

## Preconditions

- Database migrations are applied.
- Historical seed data is loaded.
- Run `bun run db:compute-stats` if you want to verify the analytics materialized-cache path for canonical windows.
- Run `bun run db:compute-stats -- --prizeType=TWO_DIGIT --windowSize=120` if you want to refresh one canonical context without recomputing the full snapshot set.
- Run `bun run db:compute-stats -- --startDate=2026-04-01 --endDate=2026-04-30` if you want to refresh canonical contexts affected by a known import date range.
- App is running locally.
- API routes are reachable from the app runtime.

## Seed And Data Baseline

1. Run the historical seed command against the CSV directory.
2. Confirm the seed completes without validation or Prisma errors.
3. Confirm the database contains draw and prize rows.

Expected:
- Seed completes successfully.
- No mock data is required for draw history to appear.

## Results List

### Ready State

1. Open `/results`.
2. Apply a search query or prize-type filter through the URL-driven controls.
3. Confirm the page renders draw cards from the database.
4. Confirm the stat cards show:
- latest draw date
- draw record count
- prize record count
5. Confirm each draw card shows:
- draw date
- draw number
- status badge
- coverage badge
- prize groups

Expected:
- Draw records come from `/api/draws`.
- The page note states the page is rendering from the API/database contract.
- No mock draw rows are rendered.
- Reloading the same URL preserves the same query state.

### Empty State

1. Make `/api/draws` return an empty result set for the current query, or use an empty database.
2. Reload `/results`.

Expected:
- The page shows the empty state.
- No fake draw rows appear.
- The note explains that the current query returned no draws.

### Error State

1. Make `/api/draws` fail, or break the database connection temporarily.
2. Reload `/results`.

Expected:
- The page shows the error state.
- No fake draw rows appear.
- The note explains that live draw data could not be loaded.

## Results Detail

### Ready State

1. Open `/results/<valid-draw-id>` from a draw card link.
2. Confirm the page shows:
- draw date
- draw number
- status badge
- coverage badge
- lottery type
- contract fields
- prize table

Expected:
- Detail data comes from `/api/draws/:id`.
- Prize rows match the selected draw.

### Not Found State

1. Open `/results/<invalid-draw-id>`.

Expected:
- The page shows "Draw not found".
- The page does not render mock detail data.

### Error State

1. Make `/api/draws/:id` fail without returning 404.
2. Open a valid detail URL.

Expected:
- The page shows "Draw detail unavailable".
- The page does not render mock detail data.

## Analytics

### Ready State

1. Open `/analytics`.
2. Change `windowSize` or `prizeType` through the URL-based filter links.
3. Confirm the page renders:
- draw count
- source metric
- digit groups
- number groups
- pattern count
- generated date
- number frequency chart
- digit heatmap
- top number table
- top digit list

Expected:
- Data comes from `/api/analytics`.
- Source is `api`.
- No fallback mock analytics payload is rendered.
- Reloading the same URL preserves the same filter state.

### Empty State

1. Make `/api/analytics` return a valid response with empty stats arrays.
2. Reload `/analytics`.

Expected:
- The page shows the empty state.
- Charts and tables do not pretend to contain data.

### Error State

1. Make `/api/analytics` fail or return invalid payload.
2. Reload `/analytics`.

Expected:
- The page shows the error state.
- No fallback mock analytics payload is rendered.

## Calendar

### Ready State

1. Open `/calendar`.
2. Confirm the page renders:
- next draw card
- source badge
- schedule rows
- monthly insight cards when available

Expected:
- Data comes from `/api/calendar`.
- A future persisted draw is shown as the next draw when one exists.
- Past rows do not incorrectly include the future persisted next draw as a past record.

### Empty State

1. Make `/api/calendar` return a valid response with no schedule rows and no monthly insights.
2. Reload `/calendar`.

Expected:
- The schedule section shows an empty state.
- Monthly insights show their own empty state.

### Error State

1. Make `/api/calendar` fail or return invalid payload.
2. Reload `/calendar`.

Expected:
- The schedule section shows an error state.
- The page does not render fake calendar schedule rows in place of live data.

## Dashboard

### Ready State

1. Open `/dashboard`.
2. Confirm the page renders:
- latest draw summary
- metrics from live analytics
- signal cards
- prediction availability summary
3. If a persisted prediction run exists, confirm the dashboard shows its latest candidates.

Expected:
- Data comes from `/api/dashboard`.
- Latest draw links point to a real results detail page.
- Signal cards reflect live analytics rather than the old mock fixture.
- Prediction summary reflects the latest persisted prediction run when one exists.

### Empty State

1. Use a database with no persisted draw rows.
2. Reload `/dashboard`.

Expected:
- The dashboard shows an empty state for the signal board.
- The latest draw card does not link to a fake detail record.
- Metrics fall back to safe zero or placeholder values.

### Error State

1. Make `/api/dashboard` fail or return invalid payload.
2. Reload `/dashboard`.

Expected:
- The dashboard shows an error state for the signal board.
- No fake dashboard signals are rendered in place of live data.
- Prediction summary explains that live dashboard data is unavailable.

## Prediction Lab

### Ready State

1. Open `/prediction-lab`.
2. If a persisted prediction run exists, confirm the page loads it automatically.
3. Generate a new prediction run.
4. Open `/dashboard` after generation.

Expected:
- The page reads the latest persisted run from `/api/predictions`.
- Generating a new run updates the current result view from the live API.
- Saving a candidate to watchlist still works.
- The dashboard prediction summary reflects the newly persisted run.

### No Run State

1. Use a database with no persisted prediction runs.
2. Open `/prediction-lab`.

Expected:
- The page shows the "No prediction run yet" state.
- No fake prediction candidates are rendered.

### No Candidates State

1. Generate or load a run where the API returns `results: []`.

Expected:
- The page shows a dedicated empty state for "No candidates in latest run".
- The page does not pretend a run failed if the API response itself is valid.

### Error State

1. Make `/api/predictions` fail or return invalid payload.
2. Open `/prediction-lab` or trigger a generation request.

Expected:
- The page shows an error state instead of fake prediction results.
- Existing watchlist save errors remain separate from prediction load or generate errors.

## Backtest

### Ready State

1. Open `/backtest`.
2. Confirm the page loads the latest persisted run automatically when one exists.
3. Confirm the page renders:
- run summary metrics
- hit sequence chart
- run details
- recent history table
- results table
4. Run a new backtest from the toolbar.

Expected:
- The page reads history from `/api/backtests`.
- The latest persisted run is loaded from `/api/backtests/:id`.
- Running a new backtest updates the current view from the live API response.
- The current run badge says `Live API`.

### Empty State

1. Use a database with no persisted backtest runs.
2. Open `/backtest`.

Expected:
- The page shows `No backtest run yet`.
- The results section shows an empty state instead of sample outcomes.
- The history section shows no stored runs.

### Error State

1. Make `/api/backtests` fail or return invalid payload.
2. Open `/backtest`.

Expected:
- The page shows a backtest unavailable state.
- No sample run is rendered in place of the API.
- The history section shows an unavailable state.

### Run Failure State

1. Load the page with an existing persisted run.
2. Make `POST /api/backtests` fail temporarily.
3. Trigger a new backtest run.

Expected:
- The page shows the run error message.
- The previously loaded live run remains visible.
- The page does not revert to a sample run.

## Compare

### Ready State

1. Open `/compare`.
2. Enter one or more candidate numbers.
3. Run compare.
4. Reload or share the same `/compare?...` URL.

Expected:
- The page renders results from `POST /api/compare`.
- The current run badge says `Live API`.
- The chart, ranking panel, and results table all reflect the returned API payload.
- Reloading the same URL preserves the compare form state.

### Empty State

1. Open `/compare` before running the form.
2. Or submit a valid compare request that returns zero candidates.

Expected:
- The page shows an empty state instead of a sample set.
- The results table area shows an empty state instead of fake rows.

### Error State

1. Make `POST /api/compare` fail or return invalid payload.
2. Trigger compare.

Expected:
- The page shows a compare unavailable state.
- No sample set is rendered in place of the API.
- If a previous live compare result exists, it remains visible after the failed request.

## Watchlist

### Enriched Read State

1. Open the watchlist flow or hit `/api/watchlist` through your normal app workflow.
2. Confirm watchlist items still render the base fields:
- number
- note
- source
- tags
3. Confirm items with matching historical stats now include enrichment data:
- `hitCount`
- `frequencyPercent`
- `missingDrawCount`
- `lastSeenDrawDate`
- `prizeType`

Expected:
- Watchlist data still comes from `/api/watchlist`.
- Enrichment reflects live analytics/stat data rather than hardcoded values.
- Six-digit watchlist numbers can resolve against `FIRST` or `PRIZE2-5` contexts.
- The watchlist UI renders stat summary blocks when `item.stats` exists, and a graceful fallback note when it does not.

## Search

### Grouped Search Results

1. Open `/search?q=09`.
2. Confirm the page renders grouped results for:
- draws
- prizes
- stats
- watchlist

Expected:
- Empty `q` returns empty groups, not an error.
- Numeric `q` can surface stat hits from canonical analytics contexts.
- Draw and prize hits reflect persisted DB records.
- Watchlist hits reflect live watchlist rows and tags.
- Reloading the same `/search?q=...` URL preserves the same result set.

## API Behavior Checks Through UI

### Future Draw Handling

1. Keep a future draw row in the database.
2. Open `/results` and `/analytics`.
3. Open the calendar page when that UI is converted to real data.

Expected:
- Analytics does not use future draws when no explicit `endDate` is supplied.
- Results still shows the seeded records returned by the draw API.
- Calendar uses a future persisted draw as `nextDraw` once that page is wired fully to live data.

### Historical Window Integrity

1. Use analytics with a known window size.
2. Compare the reported draw count with the expected distinct draw count from the database.

Expected:
- Analytics windowing is based on draw count, not raw prize row count.

### Prediction With Sparse Data

1. Trigger prediction with a prize type or number length that has little or no history.

Expected:
- If there are no candidates, the UI or debug output shows an empty result set.
- If there are fewer candidates than requested, only available candidates are returned.

## Notes For Future Phases

- Add any later compare history or persistence checks if a read endpoint is introduced.
