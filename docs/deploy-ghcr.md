# Deploy checklist (GHCR + Postgres)

Use this after merging to `main` (triggers [`.github/workflows/build-image.yml`](../.github/workflows/build-image.yml)).

## 1. Pre-merge (developer)

```bash
bun run check
bun test
```

Open a PR to `dev` or `main` and confirm [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) passes. SonarQube requires `SONAR_TOKEN` in repository secrets.

## 2. Image

After merge to `main`, pull:

`ghcr.io/<owner>/<repo>:latest` (also tagged with commit SHA)

Container runtime env:

| Variable | Required |
| --- | --- |
| `DATABASE_URL` | Yes |
| `NODE_ENV` | `production` (set in Dockerfile) |
| `PORT` | `3000` (default in Dockerfile) |
| `HOSTNAME` | `0.0.0.0` (set in Dockerfile) |

Do not rely on `bun run start` in production; the image runs `bun server.js` from Next standalone output.

## 3. Production database bootstrap (operator)

Use `.env.production` locally or platform secrets — never commit it.

```bash
bun run db:migrate:prod
bun run db:seed:prod lottory-histoty
bun run db:compute-analysis:prod
bun run db:audit:prod
```

Optional deep verification:

```bash
bun run db:audit:calc
```

(with production env via `scripts/run-with-env.ts` for analysis/scope audits)

`db:compute-analysis:prod` processes the full v8 matrix (`11 + 11×12 = 143` contexts) and may take a long time.

## 4. Smoke test

| URL | Expect |
| --- | --- |
| `GET /api` | `status: "ok"`, `engineVersion: "analysis-engine-v8"` |
| `/dashboard` | Latest draw and metrics from live API |
| `/calendar` | Heatmap with varied cell tones per prize row |

## 5. Optional post-deploy

- Delete legacy `analysis_snapshot_runs` rows where `engineVersion` is not `analysis-engine-v8`
- Re-run seed + compute after new historical CSV imports

See also [`production-data-ops.md`](production-data-ops.md).
