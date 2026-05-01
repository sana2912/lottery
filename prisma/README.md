# Prisma + PostgreSQL

This project uses Prisma ORM v7 style configuration:

- Database provider is declared in `prisma/schema.prisma`.
- `DATABASE_URL` is configured in root `prisma.config.ts`.
- Prisma Client is generated to `src/generated/prisma`.
- Prisma Client generator targets Bun with `runtime = "bun"`.
- Generated IDs use UUID v7 with `@default(uuid(7))`.
- PostgreSQL UUID primary keys are currently mapped to `_id` with `@map("_id")` to preserve the earlier model contract.

The generated Prisma Client directory is ignored by git. Run `bun run db:migrate` and `bun run db:generate` after schema changes.

## Draw Seeds

Real draw imports can be normalized JSON at `prisma/seed/draws.json`, a single CSV file, or a directory of CSV history files.

```bash
bun run db:seed
```

The seed command validates draw and prize shape, preserves numbers as strings, upserts draws by `lotteryType + drawDate`, and replaces prize rows for each imported draw in a transaction. See `prisma/seed/README.md` for the JSON contract.
