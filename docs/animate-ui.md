# Animate UI

Animate UI components are installed through the shadcn registry workflow.

## Sources Checked

- Components: https://animate-ui.com/docs/components
- Primitives: https://animate-ui.com/docs/primitives
- Installation: https://animate-ui.com/docs/installation
- MCP: https://animate-ui.com/docs/mcp

## Project Convention

- Keep app-specific composed UI in `src/frontend/components`.
- Keep low-level local UI primitives in `src/frontend/primitives`.
- Install Animate UI registry output under `src/frontend/components/animate-ui`.
- Import generated Animate UI pieces from `@/frontend/components/animate-ui/...`.
- Keep D3-specific chart primitives in `src/frontend/chart-primitives`.

## Bun Commands

Initialize shadcn/ui if the project needs the interactive setup again:

```bash
bunx --bun shadcn@latest init
```

Add an Animate UI primitive or component:

```bash
bunx --bun shadcn@latest add @animate-ui/primitives-texts-sliding-number
```

## MCP

Animate UI documents MCP through the shadcn MCP server. The shadcn MCP server reads registries from this project's `components.json`.

This repo includes a project-level `.mcp.json` using Bun for clients that support project-local MCP config:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "bunx",
      "args": ["--bun", "shadcn@latest", "mcp"]
    }
  }
}
```

The shadcn docs show the generic command as `npx shadcn@latest mcp`; this scaffold uses `bunx --bun` to match the project runtime.

## Codex MCP

The shadcn docs note that the CLI cannot automatically update `~/.codex/config.toml`. To enable this MCP server in Codex, add the config manually and restart Codex:

```toml
[mcp_servers.shadcn]
command = "bunx"
args = ["--bun", "shadcn@latest", "mcp"]
```

If you prefer the exact shadcn docs command, use:

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```
