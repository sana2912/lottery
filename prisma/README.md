# Prisma + MongoDB

This project uses Prisma ORM v7 style configuration:

- Database provider is declared in `prisma/schema.prisma`.
- `DATABASE_URL` is configured in root `prisma.config.ts`.
- Prisma Client is generated to `src/generated/prisma`.
- Prisma Client generator targets Bun with `runtime = "bun"`.
- Generated IDs use UUID v7 with `@default(uuid(7))`.
- MongoDB primary keys are mapped to `_id` with `@map("_id")`.

The generated Prisma Client directory is ignored by git. Run `bun run db:generate` after installing dependencies and after each schema change.
