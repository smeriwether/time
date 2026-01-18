import { Hono } from 'hono';
import {
  HeartbeatSchema,
  HeartbeatBatchRequestSchema,
  type HeartbeatResponse,
} from '@devtime/shared';
import type { Env } from '../types';
import { storeHeartbeats } from '../db/heartbeats';

export const heartbeatRoutes = new Hono<{ Bindings: Env }>();

heartbeatRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, 400);
  }

  const result = HeartbeatSchema.safeParse(body);

  if (!result.success) {
    return c.json({
      error: 'Invalid heartbeat data',
      code: 'VALIDATION_ERROR',
      details: result.error.flatten(),
    }, 400);
  }

  const auth = c.get('auth');
  const storePromise = storeHeartbeats([result.data], auth.userId, c.env);

  // Store asynchronously when possible - don't block the response
  try {
    c.executionCtx.waitUntil(storePromise);
  } catch {
    // Test environment - fall back to sync
    await storePromise;
  }

  const response: HeartbeatResponse = { ok: true, received: 1 };
  return c.json(response);
});

heartbeatRoutes.post('/batch', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, 400);
  }

  const result = HeartbeatBatchRequestSchema.safeParse(body);

  if (!result.success) {
    return c.json({
      error: 'Invalid heartbeat batch data',
      code: 'VALIDATION_ERROR',
      details: result.error.flatten(),
    }, 400);
  }

  const auth = c.get('auth');
  const storePromise = storeHeartbeats(result.data.heartbeats, auth.userId, c.env);

  // Store asynchronously when possible - don't block the response
  try {
    c.executionCtx.waitUntil(storePromise);
  } catch {
    // Test environment - fall back to sync
    await storePromise;
  }

  const response: HeartbeatResponse = { ok: true, received: result.data.heartbeats.length };
  return c.json(response);
});
