import type { Heartbeat } from '@devtime/shared';
import type { DatabaseAdapter, HeartbeatFilters } from './types';

interface StoredHeartbeat extends Heartbeat {
  user_id: string;
  id: string;
}

const store = new Map<string, StoredHeartbeat[]>();

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function clearMemoryStore(): void {
  store.clear();
}

export function getMemoryAdapter(): DatabaseAdapter {
  return memoryAdapter;
}

const memoryAdapter: DatabaseAdapter = {
  dialect: 'memory',

  async storeHeartbeats(heartbeats: Heartbeat[], userId: string): Promise<void> {
    const key = `heartbeats:${userId}`;
    const existing = store.get(key) ?? [];

    const newHeartbeats: StoredHeartbeat[] = heartbeats.map((hb, i) => ({
      ...hb,
      user_id: userId,
      id: `${userId}-${hb.timestamp}-${i}`,
    }));

    const combined = [...existing, ...newHeartbeats];

    const oneWeekAgo = Date.now() - ONE_WEEK_MS;
    const filtered = combined.filter((hb) => hb.timestamp > oneWeekAgo);

    store.set(key, filtered);
  },

  async getHeartbeats(
    userId: string,
    startTime: number,
    endTime: number,
    filters?: HeartbeatFilters
  ): Promise<Heartbeat[]> {
    const key = `heartbeats:${userId}`;
    const heartbeats = store.get(key) ?? [];

    return heartbeats.filter((hb) => {
      if (hb.timestamp < startTime || hb.timestamp > endTime) return false;
      if (filters?.project && hb.project !== filters.project) return false;
      if (filters?.tool && hb.tool !== filters.tool) return false;
      return true;
    });
  },
};
