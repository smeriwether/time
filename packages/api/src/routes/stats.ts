import { Hono } from 'hono';
import {
  StatsQuerySchema,
  aggregateStats,
  type StatsResponse,
} from '@devtime/shared';
import type { Env } from '../types';
import { getHeartbeats } from '../db/heartbeats';

export const statsRoutes = new Hono<{ Bindings: Env }>();

statsRoutes.get('/', async (c) => {
  const query = StatsQuerySchema.safeParse({
    range: c.req.query('range'),
    project: c.req.query('project'),
    tool: c.req.query('tool'),
  });

  if (!query.success) {
    return c.json({
      error: 'Invalid query parameters',
      code: 'VALIDATION_ERROR',
      details: query.error.flatten(),
    }, 400);
  }

  const auth = c.get('auth');
  const { startTime, endTime } = getTimeRange(query.data.range);

  const heartbeats = await getHeartbeats(auth.userId, startTime, endTime, c.env, {
    project: query.data.project,
    tool: query.data.tool,
  });

  const baseStats = aggregateStats(heartbeats);
  const byDay = aggregateByDay(heartbeats, startTime, endTime);

  const response: StatsResponse = {
    ...baseStats,
    by_day: byDay,
  };

  return c.json(response);
});

function getTimeRange(range: string): { startTime: number; endTime: number } {
  const now = Date.now();
  const endTime = now;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  switch (range) {
    case 'today':
      return { startTime: startOfDay.getTime(), endTime };
    case 'week':
      return { startTime: now - 7 * 24 * 60 * 60 * 1000, endTime };
    case 'month':
      return { startTime: now - 30 * 24 * 60 * 60 * 1000, endTime };
    case 'year':
      return { startTime: now - 365 * 24 * 60 * 60 * 1000, endTime };
    default:
      return { startTime: now - 7 * 24 * 60 * 60 * 1000, endTime };
  }
}

function aggregateByDay(
  heartbeats: { timestamp: number }[],
  startTime: number,
  endTime: number
): Array<{ date: string; seconds: number }> {
  const dayMap = new Map<string, number>();

  let current = new Date(startTime);
  current.setHours(0, 0, 0, 0);

  while (current.getTime() <= endTime) {
    dayMap.set(current.toISOString().split('T')[0], 0);
    current.setDate(current.getDate() + 1);
  }

  const sorted = [...heartbeats].sort((a, b) => a.timestamp - b.timestamp);
  let prevTimestamp: number | null = null;

  for (const hb of sorted) {
    if (prevTimestamp !== null) {
      const gap = hb.timestamp - prevTimestamp;
      if (gap < 15 * 60 * 1000) {
        const date = new Date(hb.timestamp).toISOString().split('T')[0];
        const seconds = Math.round(gap / 1000);
        dayMap.set(date, (dayMap.get(date) ?? 0) + seconds);
      }
    }
    prevTimestamp = hb.timestamp;
  }

  return Array.from(dayMap.entries())
    .map(([date, seconds]) => ({ date, seconds }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
