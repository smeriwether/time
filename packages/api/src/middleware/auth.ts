import { createMiddleware } from 'hono/factory';
import type { Env, AuthContext } from '../types';

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

export const authMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ error: 'Missing Authorization header', code: 'UNAUTHORIZED' }, 401);
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return c.json({ error: 'Invalid Authorization header format', code: 'UNAUTHORIZED' }, 401);
  }

  if (!token.startsWith('dt_')) {
    return c.json({ error: 'Invalid API key format', code: 'UNAUTHORIZED' }, 401);
  }

  const userId = await validateApiKey(token, c.env);
  if (!userId) {
    return c.json({ error: 'Invalid API key', code: 'UNAUTHORIZED' }, 401);
  }

  c.set('auth', { userId, apiKey: token });

  await next();
});

async function validateApiKey(apiKey: string, env?: Env): Promise<string | null> {
  // Check KV store for API key
  if (env?.API_KEYS) {
    const userId = await env.API_KEYS.get(apiKey);
    if (userId) return userId;
  }

  // Dev key only works when ENVIRONMENT is explicitly set to 'development'
  // This prevents accidental exposure in misconfigured production deployments
  if (env?.ENVIRONMENT === 'development' && apiKey === 'dt_dev_key') {
    return 'dev-user';
  }

  return null;
}
