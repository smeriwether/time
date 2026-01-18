import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { API_VERSION } from '@devtime/shared';
import { heartbeatRoutes } from './routes/heartbeat';
import { statsRoutes } from './routes/stats';
import { authMiddleware } from './middleware/auth';
import { clearMemoryStore } from './db/heartbeats';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', (c, next) => {
  const origin = c.env?.DASHBOARD_ORIGIN;
  const isDev = c.env?.ENVIRONMENT === 'development';

  return cors({
    origin: isDev || !origin ? '*' : origin,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(c, next);
});
app.use('*', logger());

app.get('/', (c) => {
  return c.json({
    name: 'DevTime API',
    version: API_VERSION,
    docs: `/${API_VERSION}/docs`,
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

app.get(`/${API_VERSION}/docs`, (c) => {
  return c.json({
    version: API_VERSION,
    auth: { header: 'Authorization: Bearer dt_...' },
    endpoints: [
      { method: 'POST', path: `/${API_VERSION}/heartbeat`, description: 'Send a single heartbeat' },
      { method: 'POST', path: `/${API_VERSION}/heartbeat/batch`, description: 'Send multiple heartbeats' },
      { method: 'GET', path: `/${API_VERSION}/stats`, description: 'Get aggregated stats' },
    ],
    stats: { ranges: ['today', 'week', 'month', 'year'] },
  });
});

// Test-only endpoint to reset in-memory store (only available in development)
app.post('/test/reset', (c) => {
  if (c.env?.ENVIRONMENT !== 'development') {
    return c.json({ error: 'Not available in production' }, 403);
  }
  clearMemoryStore();
  return c.json({ ok: true });
});

const v1 = new Hono<{ Bindings: Env }>();

v1.use('*', authMiddleware);
v1.route('/heartbeat', heartbeatRoutes);
v1.route('/stats', statsRoutes);

app.route(`/${API_VERSION}`, v1);

app.notFound((c) => {
  return c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404);
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500);
});

export default app;
