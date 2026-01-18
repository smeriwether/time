# DevTime

Open-source developer activity tracking across VSCode, Claude Code, Codex, Zed, and more.

![DevTime Dashboard](docs/screenshots/dashboard.svg)

## Why?

Track how much time you spend coding across different tools and projects. Like WakaTime, but open-source and self-hostable.

## Features

- **Multi-tool tracking**: VSCode, Claude Code, Codex CLI, Zed
- **Self-hostable**: Deploy on Cloudflare Workers + PlanetScale for ~$0/month
- **Privacy-first**: Your data stays on your infrastructure
- **Simple dashboard**: Daily/weekly/monthly breakdowns by tool, project, and language
- **Offline support**: Heartbeats are queued and sent when connection is restored

## Screenshots

### Dashboard Overview
The dashboard shows your coding activity at a glance:
- **Total time** tracked this week/month
- **Daily activity** bar chart
- **Breakdown by tool** (VS Code, Claude Code, Zed, Codex)
- **Breakdown by language** (TypeScript, Python, Rust, Go, etc.)
- **Recent activity** feed
- **Top projects** with time spent

![DevTime Dashboard](docs/screenshots/dashboard.svg)

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

## Plugins

### VSCode Extension

The VSCode extension tracks your coding activity automatically:

- Tracks file opens, edits, and saves
- Detects programming language automatically
- Tracks debugging sessions separately
- Shows time in status bar
- Batches heartbeats to reduce network usage

**Installation:**
```bash
# From source
cd packages/plugins/vscode
pnpm install
pnpm build
# Then install the .vsix file
```

**Configuration:**
```json
{
  "devtime.enabled": true,
  "devtime.apiEndpoint": "https://your-api.example.com",
  "devtime.apiKey": "your-api-key",
  "devtime.heartbeatInterval": 120
}
```

### Claude Code (Coming Soon)

Uses Claude Code's hook system to track AI coding sessions:
- SessionStart/SessionEnd hooks for session duration
- Token usage tracking
- Project and file context

### Codex CLI (Coming Soon)

Wraps Codex CLI to track AI-assisted coding:
- Uses OpenTelemetry integration
- Tracks session duration and commands

### Zed (Coming Soon)

Language server approach for Zed editor:
- Registers as LSP to receive edit events
- Similar to WakaTime's approach

## Project Structure

```
packages/
├── shared/           # Shared TypeScript types
├── dashboard/        # React dashboard (Vite)
└── plugins/
    └── vscode/       # VSCode extension
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm --filter @devtime/dashboard build
pnpm --filter devtime-vscode build

# Run dashboard locally
pnpm --filter @devtime/dashboard dev

# Preview dashboard build
pnpm --filter @devtime/dashboard preview
```

## Hosting

### Recommended Stack (Free Tier)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Cloudflare Workers** | API | 100K req/day |
| **PlanetScale** | Database | 1B row reads/mo |
| **Cloudflare Pages** | Dashboard | Unlimited |

**Total cost: $0/month** for personal use

## Configuration

All plugins read from `~/.devtime/config.toml`:

```toml
[api]
endpoint = "https://api.devtime.dev"
key = "dt_xxxxxxxxxxxxxxxxxxxx"

[privacy]
anonymize_file_paths = false
exclude_projects = ["secret-work"]
exclude_file_patterns = ["*.env", "*.secret"]

[tracking]
idle_timeout_minutes = 15
heartbeat_interval_seconds = 120
```

## Privacy

- **No code content** is ever sent, only metadata (filename, language, line count)
- **File paths** can be anonymized/hashed
- **Exclude patterns** for sensitive projects
- **Self-hosted** option keeps all data on your infrastructure

## Contributing

Contributions are welcome! Please read the [PLAN.md](PLAN.md) for the implementation roadmap.

## License

MIT
