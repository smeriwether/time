# DevTime Configuration

Configure the DevTime API endpoint and authentication for tracking your Claude Code development time.

## Instructions

When the user runs `/devtime-config`, help them configure DevTime by:

1. **Check current configuration**:
   - Read `~/.devtime/config.json` if it exists
   - Show current endpoint and whether a key is set (mask the actual key)

2. **Update configuration**:
   - If the user provides `endpoint=URL` and/or `key=KEY` arguments, update the config
   - Write the updated config to `~/.devtime/config.json`
   - Create the `~/.devtime` directory if it doesn't exist

3. **Configuration format**:
   ```json
   {
     "apiEndpoint": "https://api.devtime.dev",
     "apiKey": "dt_xxx"
   }
   ```

## Example Usage

- `/devtime-config` - Show current configuration
- `/devtime-config endpoint=https://api.devtime.dev key=dt_xxx` - Set both endpoint and key
- `/devtime-config key=dt_newkey` - Update just the API key

## Notes

- The API key should start with `dt_`
- The endpoint should not include a trailing slash
- Configuration is stored in `~/.devtime/config.json`
- Heartbeat queue is stored in `~/.devtime/heartbeat-queue.json`
