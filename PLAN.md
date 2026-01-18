# DevTime: Open-Source Developer Activity Tracker

## Overview

An open-source alternative to WakaTime for tracking development time across multiple tools. Designed for self-hosting with minimal cost.

## Research Summary: Plugin Mechanisms

### VSCode
- **Extension Type**: Node.js/TypeScript
- **Events Available**:
  - `onDidChangeTextDocument` - Text edits (every keystroke)
  - `onDidOpenTextDocument` / `onDidCloseTextDocument` - File lifecycle
  - `onDidSaveTextDocument` - Saves
  - `onDidChangeActiveTextEditor` - File focus changes
  - `onDidChangeWindowState` - Window focus/blur
  - `onDidStartDebugSession` / `onDidTerminateDebugSession` - Debug tracking
- **Key Insight**: Events are NOT rate-limited, must implement debouncing (50-500ms)
- **Activation**: Use `onStartupFinished` to avoid slowing VS Code startup
- **Distribution**: VS Code Marketplace

### Claude Code
- **Extension Type**: Shell command hooks (receives JSON via stdin)
- **Hooks Available**:
  - `SessionStart` - Session begins, resumes, or clears
  - `SessionEnd` - Session terminates
  - `UserPromptSubmit` - User submits a prompt
  - `PreToolUse` / `PostToolUse` - Tool execution lifecycle
  - `Stop` / `SubagentStop` - Agent completion
- **Key Insight**: Full session transcripts available at `transcript_path` (JSONL format)
- **Configuration**: `~/.claude/settings.json` or `.claude/settings.json`
- **Data Available**: Session ID, working directory, token usage, tool calls

### Codex CLI
- **Extension Type**: Limited native support
- **Available**:
  - `notify` config - Triggers external program on `agent-turn-complete`
  - OpenTelemetry export (enterprise-grade)
  - JSON event stream with `--json` flag
  - MCP server support
- **Key Insight**: No blocking hooks, limited compared to Claude Code
- **Best Approach**: Use OpenTelemetry or wrap commands

### Zed Editor
- **Extension Type**: Rust compiled to WebAssembly
- **Events Available**: **NONE directly** (major limitation)
- **Workaround**: Register as a Language Server (LSP) to receive edit events
- **Limitation**: Only tracks edits, not passive file viewing
- **How WakaTime Does It**: Ships `wakatime-ls` language server
- **Distribution**: PR to zed-industries/extensions repo

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PLUGINS (Clients)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  VSCode Extension  │  Claude Code Hook  │  Codex Wrapper  │  Zed LSP       │
│  (TypeScript)      │  (Shell/Python)    │  (Shell/OTEL)   │  (Rust/WASM)   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼ HTTPS (Heartbeats)
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API (Cloudflare Workers)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  POST /api/heartbeat     - Receive heartbeats from plugins                  │
│  POST /api/heartbeat/batch - Receive batched heartbeats                     │
│  GET  /api/stats         - Get aggregated stats for dashboard               │
│  GET  /api/sessions      - Get session list                                 │
│  POST /api/auth/token    - Generate API key                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Database (PlanetScale)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  heartbeats: id, user_id, tool, project, file, language, timestamp,        │
│              activity_type, branch, machine_id, editor_version             │
│  users: id, email, api_key_hash, created_at                                │
│  sessions: id, user_id, tool, project, start_time, end_time, duration      │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Dashboard (Cloudflare Pages)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  React/Preact SPA with:                                                     │
│  - Daily/weekly/monthly time breakdown                                      │
│  - Time by tool (VSCode, Claude, Codex, Zed)                               │
│  - Time by project                                                          │
│  - Time by language                                                         │
│  - Session timeline view                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Heartbeat (core tracking unit)
```typescript
interface Heartbeat {
  // Required
  tool: string;           // "vscode" | "claude-code" | "codex" | "zed"
  timestamp: number;      // Unix timestamp (ms)
  activity_type: string;  // "coding" | "debugging" | "prompting" | "idle"

  // Optional context
  project?: string;       // Git repo name or directory
  file?: string;          // Current file path (hashed or anonymized)
  language?: string;      // Programming language
  branch?: string;        // Git branch
  machine_id?: string;    // For multi-machine tracking

  // Tool-specific
  is_write?: boolean;     // Was this a write/edit event
  lines?: number;         // Lines in file
  cursor_line?: number;   // Current line number

  // AI-specific (Claude/Codex)
  tokens_in?: number;     // Input tokens used
  tokens_out?: number;    // Output tokens generated
  session_id?: string;    // AI session ID
}
```

### Session (aggregated from heartbeats)
```typescript
interface Session {
  id: string;
  user_id: string;
  tool: string;
  project: string;
  start_time: number;
  end_time: number;
  duration: number;       // Calculated in seconds
  heartbeat_count: number;
}
```

### Session Detection Algorithm
Two heartbeats belong to the same session if:
1. Same tool AND project
2. Time gap < 15 minutes (configurable timeout)

---

## Hosting Cost Estimate

| Service | Free Tier | Paid Estimate |
|---------|-----------|---------------|
| **Cloudflare Workers** | 100K req/day | $5/mo for 10M req |
| **Cloudflare Pages** | Unlimited sites | Free |
| **PlanetScale** | 1B row reads/mo, 10M row writes/mo | ~$29/mo for more |
| **Total** | **$0/mo** for personal use | ~$35/mo for teams |

---

## Implementation Plan

### Phase 1: Core Infrastructure
- [ ] Set up monorepo structure
- [ ] Create database schema (PlanetScale)
- [ ] Build API with Cloudflare Workers
  - [ ] POST /api/heartbeat
  - [ ] POST /api/heartbeat/batch
  - [ ] GET /api/stats
  - [ ] Simple API key auth
- [ ] Add basic test coverage

### Phase 2: VSCode Plugin (highest value, most users)
- [ ] Scaffold extension with `yo code`
- [ ] Implement event listeners with debouncing
- [ ] Add configuration for API endpoint and key
- [ ] Implement heartbeat batching (send every 2 min)
- [ ] Add status bar indicator
- [ ] Test and publish to marketplace

### Phase 3: Claude Code Plugin
- [ ] Create hook scripts (Python or shell)
- [ ] Track SessionStart/SessionEnd for session duration
- [ ] Track UserPromptSubmit for prompt count
- [ ] Parse transcript JSONL for token usage
- [ ] Create installer script for easy setup
- [ ] Document configuration

### Phase 4: Dashboard
- [ ] Build React/Preact SPA
- [ ] Charts: daily/weekly/monthly views
- [ ] Breakdown by: tool, project, language
- [ ] Session timeline visualization
- [ ] Deploy to Cloudflare Pages

### Phase 5: Additional Plugins
- [ ] Codex CLI wrapper/hook
- [ ] Zed language server (wakatime-ls approach)

### Phase 6: Polish
- [ ] Data export (JSON, CSV)
- [ ] Privacy controls (file path hashing)
- [ ] Goals/targets feature
- [ ] Public profile/badge embeds

---

## Directory Structure

```
devtime/
├── README.md
├── PLAN.md
├── packages/
│   ├── api/                    # Cloudflare Worker
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── heartbeat.ts
│   │   │   │   ├── stats.ts
│   │   │   │   └── auth.ts
│   │   │   ├── db/
│   │   │   │   └── schema.sql
│   │   │   └── utils/
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   ├── dashboard/              # React SPA
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── shared/                 # Shared types/utilities
│   │   ├── src/
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   └── plugins/
│       ├── vscode/             # VSCode Extension
│       │   ├── src/
│       │   │   ├── extension.ts
│       │   │   ├── heartbeat.ts
│       │   │   └── config.ts
│       │   ├── package.json
│       │   └── tsconfig.json
│       │
│       ├── claude-code/        # Claude Code Hooks
│       │   ├── hooks/
│       │   │   ├── session_start.py
│       │   │   ├── session_end.py
│       │   │   └── prompt_submit.py
│       │   ├── install.sh
│       │   └── README.md
│       │
│       ├── codex/              # Codex CLI wrapper
│       │   ├── wrapper.sh
│       │   └── README.md
│       │
│       └── zed/                # Zed LSP Extension
│           ├── src/
│           │   └── lib.rs
│           ├── extension.toml
│           ├── Cargo.toml
│           └── README.md
│
├── package.json                # Monorepo root
├── pnpm-workspace.yaml
└── turbo.json                  # Turborepo config
```

---

## API Specification

### POST /api/heartbeat
Single heartbeat from a plugin.

**Request:**
```json
{
  "tool": "vscode",
  "timestamp": 1705600000000,
  "activity_type": "coding",
  "project": "my-app",
  "file": "src/index.ts",
  "language": "typescript",
  "is_write": true
}
```

**Response:**
```json
{ "ok": true }
```

### POST /api/heartbeat/batch
Multiple heartbeats (reduces network calls).

**Request:**
```json
{
  "heartbeats": [
    { "tool": "vscode", "timestamp": 1705600000000, ... },
    { "tool": "vscode", "timestamp": 1705600120000, ... }
  ]
}
```

### GET /api/stats?range=week
Aggregated statistics.

**Response:**
```json
{
  "total_seconds": 28800,
  "by_tool": {
    "vscode": 21600,
    "claude-code": 7200
  },
  "by_project": {
    "my-app": 18000,
    "other-project": 10800
  },
  "by_language": {
    "typescript": 14400,
    "python": 7200,
    "rust": 7200
  },
  "by_day": [
    { "date": "2025-01-15", "seconds": 7200 },
    { "date": "2025-01-16", "seconds": 10800 },
    ...
  ]
}
```

---

## Security Considerations

1. **API Keys**: Hashed with bcrypt, never stored in plain text
2. **File Paths**: Option to hash file paths for privacy
3. **HTTPS Only**: All API communication over TLS
4. **Rate Limiting**: Prevent abuse (100 heartbeats/min per user)
5. **No Code Content**: Never send actual code, only metadata

---

## Configuration (Plugin Side)

All plugins will read from a shared config file `~/.devtime/config.toml`:

```toml
[api]
endpoint = "https://api.devtime.dev"  # or self-hosted URL
key = "dt_xxxxxxxxxxxxxxxxxxxx"

[privacy]
anonymize_file_paths = false
exclude_projects = ["secret-work"]
exclude_file_patterns = ["*.env", "*.secret"]

[tracking]
idle_timeout_minutes = 15
heartbeat_interval_seconds = 120
```

---

## Next Steps

1. Initialize the monorepo with pnpm + turborepo
2. Create the database schema in PlanetScale
3. Build the Cloudflare Worker API
4. Start with VSCode plugin (largest user base)
5. Add Claude Code hooks
6. Build the dashboard

---

## Open Questions

1. **Authentication**: Simple API key or OAuth (GitHub/Google)?
2. **Team features**: Should we support organizations/teams from the start?
3. **Data retention**: How long to keep detailed heartbeats vs. aggregated data?
4. **Offline support**: Queue heartbeats locally when offline?
