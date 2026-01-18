# DevTime Repository Guide

## Project Structure

This is a pnpm monorepo using Turborepo. Packages:

- `packages/shared` - Zod schemas and utilities shared across all packages
- `packages/api` - Cloudflare Workers API (Hono framework)
- `packages/dashboard` - React dashboard (Vite + Tailwind CSS v4)
- `packages/plugins/vscode` - VSCode extension

## Quick Start

```bash
pnpm install
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm dev            # Start dashboard dev server
```

### Package-specific commands

```bash
pnpm --filter @devtime/shared build    # Build shared types
pnpm --filter @devtime/api test        # Test API
pnpm --filter @devtime/dashboard dev   # Start dashboard dev
pnpm --filter devtime-vscode build     # Build VSCode extension
```

## API Development

The API runs on Cloudflare Workers. For local development:

```bash
cd packages/api
pnpm dev            # Uses wrangler dev server
```

Deploy:
```bash
pnpm deploy         # Deploys to Cloudflare
```

## Testing Philosophy

Write tests that provide value:

- **Unit test pure functions** - Functions with clear inputs/outputs (like `aggregateStats`, `groupHeartbeatsIntoSessions`)
- **Integration test layers** - Test how components work together (API routes with request/response cycles)
- **Avoid mock-heavy tests** - Tests like "expect X to have been called" verify implementation, not behavior
- **Test behavior, not implementation** - If the test breaks when refactoring without changing behavior, it's testing the wrong thing

Example of a good test:
```typescript
it('attributes time to the activity that occurred during an interval', () => {
  const heartbeats = [
    { tool: 'vscode', timestamp: 1000, ... },
    { tool: 'claude-code', timestamp: 61000, ... },  // 60s later
  ];
  const stats = aggregateStats(heartbeats);
  expect(stats.by_tool.vscode).toBe(60);  // Time attributed to previous activity
});
```

## Code Style

### Comments

Only add comments to explain *why*, not *what*. The code should be self-explanatory.

Bad:
```typescript
// Loop through heartbeats
for (const heartbeat of heartbeats) {
  // Add to queue
  queue.push(heartbeat);
}
```

Good:
```typescript
// Attribute time to the previous heartbeat since that represents
// the activity that occurred during the interval
for (let i = 1; i < sorted.length; i++) {
  const prev = sorted[i - 1];
  ...
}
```

### Error Handling

- Never interrupt the user - failures should be silent or graceful
- Use bounded queues and timeouts to prevent resource exhaustion
- Log sparingly - suppress repeated errors after a threshold

### API Versioning

All API routes are prefixed with version (e.g., `/v1/heartbeat`). The version is defined in `@devtime/shared`:

```typescript
import { API_VERSION } from '@devtime/shared';
// API_VERSION = 'v1'
```

## Architecture Notes

### Heartbeat Flow

1. Plugin detects activity (file open, edit, save)
2. Plugin debounces and queues heartbeats locally
3. Plugin periodically sends batch to API
4. API validates and stores heartbeats
5. API aggregates into sessions (15-minute gap = new session)

### Session Detection

Heartbeats are grouped into sessions based on:
- Time gap (>15 minutes = new session)
- Context change (different tool or project = new session)

Time is attributed to the *previous* heartbeat since that represents the activity during the interval.
