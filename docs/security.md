# Security Workflow

## Environment Files

This project uses plaintext local development environment files and platform-managed production environment variables.

- `.env.development`: local development values
- `.env.example`: safe placeholders and required variable names
- `.env.local`: optional developer-local overrides, ignored by git

There is no encrypted dotenvx workflow. Do not add `.env.keys`, `.env.production`, or real production secrets to the repository.

## Commands

Local development commands load `.env.development` when runtime environment values are needed:

```bash
bun run dev
bun run start
bun run db:push
bun run db:migrate
bun run db:studio
```

Docker Compose local commands pass `.env.development` through Compose:

```bash
bun run docker:local
bun run docker:local:up
bun run docker:local:logs
bun run docker:local:down
```

Production deployments should provide required values, especially `DATABASE_URL`, through the deployment platform environment configuration.

## Pre-Commit

Husky runs lint-staged before commit:

```bash
bunx --bun lint-staged
```

lint-staged runs Biome for TypeScript, JavaScript, JSON, Markdown, YAML, and ESLint fixes for JavaScript files.
