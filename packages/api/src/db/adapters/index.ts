import type { Env } from '../../types';
import type { DatabaseAdapter, HeartbeatFilters } from './types';
import { createD1Adapter } from './d1';
import { createPostgresAdapter } from './postgres';
import { getMemoryAdapter } from './memory';

export type { DatabaseAdapter, HeartbeatFilters };
export { clearMemoryStore } from './memory';
export { setPostgresClientFactory } from './postgres';

export function createAdapter(env?: Env): DatabaseAdapter {
  if (env?.DB) {
    return createD1Adapter(env.DB);
  }

  if (env?.DATABASE_URL) {
    return createPostgresAdapter(env.DATABASE_URL);
  }

  return getMemoryAdapter();
}
