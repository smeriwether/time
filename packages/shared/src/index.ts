import { z } from 'zod';

export const API_VERSION = 'v1';

export const TOOLS = ['vscode', 'claude-code', 'codex', 'zed'] as const;
export const ACTIVITY_TYPES = ['coding', 'debugging', 'prompting', 'browsing'] as const;

export const HeartbeatSchema = z.object({
  tool: z.string().min(1),
  timestamp: z.number().int().positive(),
  activity_type: z.enum(ACTIVITY_TYPES),

  project: z.string().optional(),
  file: z.string().optional(),
  language: z.string().optional(),
  branch: z.string().optional(),
  machine_id: z.string().optional(),

  is_write: z.boolean().optional(),
  lines: z.number().int().nonnegative().optional(),
  cursor_line: z.number().int().nonnegative().optional(),

  tokens_in: z.number().int().nonnegative().optional(),
  tokens_out: z.number().int().nonnegative().optional(),
  session_id: z.string().optional(),
});

export type Heartbeat = z.infer<typeof HeartbeatSchema>;

export const HeartbeatBatchRequestSchema = z.object({
  heartbeats: z.array(HeartbeatSchema).min(1).max(1000),
});

export type HeartbeatBatchRequest = z.infer<typeof HeartbeatBatchRequestSchema>;

export const HeartbeatResponseSchema = z.object({
  ok: z.boolean(),
  received: z.number().int().nonnegative(),
});

export type HeartbeatResponse = z.infer<typeof HeartbeatResponseSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  tool: z.string(),
  project: z.string().nullable(),
  start_time: z.number().int().positive(),
  end_time: z.number().int().positive(),
  duration: z.number().int().nonnegative(),
  heartbeat_count: z.number().int().positive(),
});

export type Session = z.infer<typeof SessionSchema>;

export const StatsQuerySchema = z.object({
  range: z.enum(['today', 'week', 'month', 'year']).default('week'),
  project: z.string().optional(),
  tool: z.string().optional(),
});

export type StatsQuery = z.infer<typeof StatsQuerySchema>;

export const DayStatsSchema = z.object({
  date: z.string(),
  seconds: z.number().int().nonnegative(),
});

export const StatsResponseSchema = z.object({
  total_seconds: z.number().int().nonnegative(),
  by_tool: z.record(z.string(), z.number().int().nonnegative()),
  by_project: z.record(z.string(), z.number().int().nonnegative()),
  by_language: z.record(z.string(), z.number().int().nonnegative()),
  by_day: z.array(DayStatsSchema),
});

export type StatsResponse = z.infer<typeof StatsResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const ConfigSchema = z.object({
  api: z.object({
    endpoint: z.string().url(),
    key: z.string(),
  }),
  privacy: z.object({
    anonymize_file_paths: z.boolean(),
    exclude_projects: z.array(z.string()),
    exclude_file_patterns: z.array(z.string()),
  }),
  tracking: z.object({
    idle_timeout_minutes: z.number().int().positive(),
    heartbeat_interval_seconds: z.number().int().positive(),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export const DEFAULT_CONFIG: Config = {
  api: {
    endpoint: 'https://api.devtime.dev',
    key: '',
  },
  privacy: {
    anonymize_file_paths: false,
    exclude_projects: [],
    exclude_file_patterns: ['*.env', '*.secret', '*.key'],
  },
  tracking: {
    idle_timeout_minutes: 15,
    heartbeat_interval_seconds: 120,
  },
};

export const SESSION_GAP_MS = 15 * 60 * 1000;

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatDurationLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

export function groupHeartbeatsIntoSessions(
  heartbeats: Heartbeat[],
  userId: string,
  gapMs: number = SESSION_GAP_MS
): Session[] {
  if (heartbeats.length === 0) return [];

  const sorted = [...heartbeats].sort((a, b) => a.timestamp - b.timestamp);
  const sessions: Session[] = [];

  let sessionStart = sorted[0].timestamp;
  let sessionEnd = sorted[0].timestamp;
  let sessionTool = sorted[0].tool;
  let sessionProject = sorted[0].project ?? null;
  let heartbeatCount = 1;

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const gap = current.timestamp - sessionEnd;
    const sameContext = current.tool === sessionTool &&
                        (current.project ?? null) === sessionProject;

    if (gap > gapMs || !sameContext) {
      sessions.push({
        id: `${userId}-${sessionStart}`,
        user_id: userId,
        tool: sessionTool,
        project: sessionProject,
        start_time: sessionStart,
        end_time: sessionEnd,
        duration: Math.round((sessionEnd - sessionStart) / 1000),
        heartbeat_count: heartbeatCount,
      });

      sessionStart = current.timestamp;
      sessionTool = current.tool;
      sessionProject = current.project ?? null;
      heartbeatCount = 0;
    }

    sessionEnd = current.timestamp;
    heartbeatCount++;
  }

  sessions.push({
    id: `${userId}-${sessionStart}`,
    user_id: userId,
    tool: sessionTool,
    project: sessionProject,
    start_time: sessionStart,
    end_time: sessionEnd,
    duration: Math.round((sessionEnd - sessionStart) / 1000),
    heartbeat_count: heartbeatCount,
  });

  return sessions;
}

export function aggregateStats(heartbeats: Heartbeat[]): Omit<StatsResponse, 'by_day'> {
  const byTool: Record<string, number> = {};
  const byProject: Record<string, number> = {};
  const byLanguage: Record<string, number> = {};

  const sorted = [...heartbeats].sort((a, b) => a.timestamp - b.timestamp);
  let totalSeconds = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const gap = curr.timestamp - prev.timestamp;

    if (gap < SESSION_GAP_MS) {
      const seconds = Math.round(gap / 1000);
      totalSeconds += seconds;

      byTool[prev.tool] = (byTool[prev.tool] ?? 0) + seconds;
      if (prev.project) {
        byProject[prev.project] = (byProject[prev.project] ?? 0) + seconds;
      }
      if (prev.language) {
        byLanguage[prev.language] = (byLanguage[prev.language] ?? 0) + seconds;
      }
    }
  }

  return { total_seconds: totalSeconds, by_tool: byTool, by_project: byProject, by_language: byLanguage };
}
