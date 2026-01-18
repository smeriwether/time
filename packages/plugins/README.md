# DevTime Plugins

Editor and tool plugins that track coding activity and send heartbeats to the DevTime API.

## Available Plugins

| Plugin | Status | Description |
|--------|--------|-------------|
| [VSCode](./vscode) | Ready | Tracks file edits, debugging sessions |
| [Claude Code](./claude-code) | Ready | Tracks AI coding sessions via hooks |
| Codex CLI | Coming Soon | OpenTelemetry-based tracking |
| Zed | Coming Soon | LSP-based tracking |

## VSCode Extension

Tracks coding activity automatically in Visual Studio Code.

**Features:**
- Tracks file opens, edits, and saves
- Detects programming language automatically
- Tracks debugging sessions separately
- Shows time in status bar
- Batches heartbeats to reduce network usage

**Installation:**
```bash
cd packages/plugins/vscode
pnpm install
pnpm build
# Install the generated .vsix file in VSCode
```

**Configuration** (VSCode settings):
```json
{
  "devtime.enabled": true,
  "devtime.apiEndpoint": "https://your-api.example.com",
  "devtime.apiKey": "your-api-key",
  "devtime.heartbeatInterval": 120
}
```

## Claude Code Plugin

Uses Claude Code's hook system to track AI coding sessions.

**Features:**
- SessionStart/SessionEnd for session duration
- Tool usage tracking (Bash, Read, Write, Edit, Glob, Grep)
- Project context from working directory
- File and language detection

**Installation:**
```bash
cd packages/plugins/claude-code
pnpm install
pnpm build

# Install hooks into Claude Code
node dist/cli.js install

# Configure API endpoint
node dist/cli.js config --endpoint https://api.devtime.dev --key dt_xxx
```

**How it works:**
1. Hooks are added to `~/.claude/settings.json`
2. Each tool use triggers a heartbeat
3. Heartbeats are queued locally in `~/.devtime/heartbeat-queue.json`
4. Queue is flushed to API on session end (or manually with `flush` command)

**Commands:**
```bash
devtime-claude install     # Install hooks
devtime-claude uninstall   # Remove hooks
devtime-claude config      # Configure API
devtime-claude flush       # Manually flush queue
```

## Codex CLI (Coming Soon)

Wraps Codex CLI to track AI-assisted coding:
- Uses OpenTelemetry integration
- Tracks session duration and commands

## Zed (Coming Soon)

Language server approach for Zed editor:
- Registers as LSP to receive edit events
- Similar to WakaTime's approach

## Building a New Plugin

Plugins send heartbeats to the DevTime API. A heartbeat includes:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tool` | string | Yes | Tool identifier (`vscode`, `claude-code`, etc.) |
| `timestamp` | number | Yes | Unix timestamp in milliseconds |
| `activity_type` | string | Yes | Activity type (`coding`, `debugging`, `prompting`) |
| `project` | string | No | Project/workspace name |
| `file` | string | No | File name (not full path) |
| `language` | string | No | Programming language |

See `@devtime/shared` for Zod schemas and TypeScript types.
