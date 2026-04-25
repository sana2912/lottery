# Security Workflow

## Environment Files

This project uses dotenvx for encrypted environment management.

- `.env.development`: development environment values
- `.env.production`: production environment values
- `.env.keys`: private dotenvx keys, ignored by git
- `.env.example`: safe placeholders only

## Commands

```bash
bun run env:encrypt:dev
bun run env:encrypt:prod
bun run env:decrypt:dev
bun run env:decrypt:prod
```

Runtime commands decrypt their target env file automatically:

```bash
bun run dev
bun run build
bun run start
```

## Pre-Commit

Husky runs lint-staged before commit:

```bash
bunx --bun lint-staged
```

lint-staged runs Biome for TypeScript, JavaScript, JSON, Markdown, YAML, and ESLint fixes for JavaScript files.
