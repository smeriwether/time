# DevTime

Open-source developer activity tracking across VSCode, Claude Code, Codex, Zed, and more.

## Why?

Track how much time you spend coding across different tools and projects. Like WakaTime, but open-source and self-hostable.

## Features (Planned)

- **Multi-tool tracking**: VSCode, Claude Code, Codex CLI, Zed
- **Self-hostable**: Deploy on Cloudflare Workers + PlanetScale for ~$0/month
- **Privacy-first**: Your data stays on your infrastructure
- **Simple dashboard**: Daily/weekly/monthly breakdowns by tool, project, and language

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Plugins                              │
│  VSCode  │  Claude Code  │  Codex CLI  │  Zed            │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼ Heartbeats (HTTPS)
┌──────────────────────────────────────────────────────────┐
│              API (Cloudflare Workers)                     │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│              Database (PlanetScale)                       │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│              Dashboard (Cloudflare Pages)                 │
└──────────────────────────────────────────────────────────┘
```

## Project Structure

```
packages/
├── api/              # Cloudflare Worker API
├── dashboard/        # React dashboard
├── shared/           # Shared types
└── plugins/
    ├── vscode/       # VSCode extension
    ├── claude-code/  # Claude Code hooks
    ├── codex/        # Codex CLI wrapper
    └── zed/          # Zed language server
```

## Development

```bash
# Install dependencies
pnpm install

# Run API locally
pnpm --filter api dev

# Run dashboard locally
pnpm --filter dashboard dev
```

## License

MIT
