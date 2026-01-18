import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { API_VERSION } from '@devtime/shared';
import { heartbeatRoutes } from './routes/heartbeat';
import { statsRoutes } from './routes/stats';
import { authMiddleware } from './middleware/auth';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());
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
