# DevTime Packages

This monorepo contains several packages that make up the DevTime system.

## Core Packages

### [@devtime/shared](./shared)
Shared TypeScript types, Zod schemas, and utility functions used across all packages.

- Heartbeat and stats schemas
- Time aggregation utilities
- API version constants

### [@devtime/api](./api)
Cloudflare Workers API built with Hono. Receives heartbeats from plugins and serves aggregated stats to the dashboard.

- REST API endpoints (`/v1/heartbeat`, `/v1/stats`)
- Authentication via API keys
- Storage in Cloudflare D1 (SQLite) or KV

### [@devtime/dashboard](./dashboard)
React dashboard built with Vite and Tailwind CSS. Displays coding activity visualizations.

- Daily/weekly/monthly time breakdowns
- Charts by tool, project, and language
- Activity timeline

## Plugins

### [plugins/](./plugins)
Editor and tool plugins that track coding activity. See [plugins/README.md](./plugins/README.md) for details.

- **vscode** - VSCode extension
- **claude-code** - Claude Code hooks

## Package Dependencies

```
shared (types & utils)
   ↑
   ├── api (uses schemas for validation)
   ├── dashboard (uses types for API responses)
   └── plugins/* (uses schemas for heartbeats)
```

## Development

From the repo root:

```bash
# Build all packages
pnpm build

# Build a specific package
pnpm --filter @devtime/shared build
pnpm --filter @devtime/api build
pnpm --filter @devtime/dashboard build

# Run tests
pnpm test
```
