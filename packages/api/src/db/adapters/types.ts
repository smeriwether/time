import type { Heartbeat } from '@devtime/shared';

export interface HeartbeatFilters {
  project?: string;
  tool?: string;
}

export interface DatabaseAdapter {
  readonly dialect: 'd1' | 'postgres' | 'memory';

  storeHeartbeats(heartbeats: Heartbeat[], userId: string): Promise<void>;

  getHeartbeats(
    userId: string,
    startTime: number,
    endTime: number,
    filters?: HeartbeatFilters
  ): Promise<Heartbeat[]>;
}
