# Prisma + PostgreSQL

This project uses Prisma ORM v7 style configuration:

- Database provider is declared in `prisma/schema.prisma`.
- `DATABASE_URL` is configured in root `prisma.config.ts`.
- Prisma Client is generated to `src/generated/prisma`.
- Prisma Client generator targets Bun with `runtime = "bun"`.
- Generated IDs use UUID v7 with `@default(uuid(7))`.
- PostgreSQL UUID primary keys are currently mapped to `_id` with `@map("_id")` to preserve the earlier model contract.

The generated Prisma Client directory is ignored by git. Run `bun run db:migrate` and `bun run db:generate` after schema changes.
