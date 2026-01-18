# DevTime Claude Code Plugin

Track your development time in Claude Code sessions with DevTime.

## Installation

Install directly from the Claude Code marketplace:

```
/plugin install smeriwether/devtime-claude-plugin
```

Or install from a local path for development:

```
/plugin install /path/to/devtime-claude-plugin
```

## Configuration

After installation, configure your DevTime API credentials:

```
/devtime-config endpoint=https://api.devtime.dev key=dt_your_api_key
```

Or configure each setting individually:

```
/devtime-config endpoint=https://api.devtime.dev
/devtime-config key=dt_your_api_key
```

To view current configuration:

```
/devtime-config
```

## How It Works

The plugin automatically tracks your Claude Code activity:

1. **Session Start** - Records when you start a Claude Code session
2. **Tool Usage** - Tracks Bash, Read, Write, Edit, Glob, and Grep operations
3. **Session End** - Records when the session ends and flushes data to the API

Activity is queued locally in `~/.devtime/heartbeat-queue.json` and sent to the DevTime API when your session ends.

## Data Collected

- Tool: `claude-code`
- Activity type: `coding`, `browsing`, or `prompting`
- Project name (from current working directory)
- File names (when using file-related tools)
- Language (detected from file extensions)
- Session ID

## Files

Configuration and data are stored in `~/.devtime/`:

- `config.json` - API endpoint and key
- `heartbeat-queue.json` - Queued heartbeats
- `current-session.json` - Current session info

## Development

To build the plugin from source:

```bash
npm install
npm run build
```

The bundled JavaScript is output to `lib/index.js`.

## License

MIT
