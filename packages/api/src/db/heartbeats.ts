import type { Heartbeat } from '@devtime/shared';
import type { Env } from '../types';
import { createAdapter, clearMemoryStore as clearAdapter, type HeartbeatFilters } from './adapters';

export { clearAdapter as clearMemoryStore };

export async function storeHeartbeats(
  heartbeats: Heartbeat[],
  userId: string,
  env?: Env
): Promise<void> {
  return createAdapter(env).storeHeartbeats(heartbeats, userId);
}

export async function getHeartbeats(
  userId: string,
  startTime: number,
  endTime: number,
  env?: Env,
  filters?: HeartbeatFilters
): Promise<Heartbeat[]> {
  return createAdapter(env).getHeartbeats(userId, startTime, endTime, filters);
}
