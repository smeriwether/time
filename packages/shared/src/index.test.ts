import { describe, it, expect } from 'vitest';
import {
  HeartbeatSchema,
  HeartbeatBatchRequestSchema,
  formatDuration,
  formatDurationLong,
  groupHeartbeatsIntoSessions,
  aggregateStats,
  aggregateByDay,
  type Heartbeat,
} from './index';

describe('HeartbeatSchema', () => {
  it('validates a minimal heartbeat', () => {
    const result = HeartbeatSchema.safeParse({
      tool: 'vscode',
      timestamp: 1705600000000,
      activity_type: 'coding',
    });
    expect(result.success).toBe(true);
  });

  it('validates a complete heartbeat', () => {
    const result = HeartbeatSchema.safeParse({
      tool: 'claude-code',
      timestamp: 1705600000000,
      activity_type: 'prompting',
      project: 'my-project',
      file: 'index.ts',
      language: 'typescript',
      branch: 'main',
      machine_id: 'abc123',
      is_write: true,
      lines: 100,
      cursor_line: 50,
      tokens_in: 1000,
      tokens_out: 500,
      session_id: 'session-123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid activity_type', () => {
    const result = HeartbeatSchema.safeParse({
      tool: 'vscode',
      timestamp: 1705600000000,
      activity_type: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = HeartbeatSchema.safeParse({
      tool: 'vscode',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative timestamp', () => {
    const result = HeartbeatSchema.safeParse({
      tool: 'vscode',
      timestamp: -1,
      activity_type: 'coding',
    });
    expect(result.success).toBe(false);
  });
});

describe('HeartbeatBatchRequestSchema', () => {
  it('validates a batch of heartbeats', () => {
    const result = HeartbeatBatchRequestSchema.safeParse({
      heartbeats: [
        { tool: 'vscode', timestamp: 1705600000000, activity_type: 'coding' },
        { tool: 'vscode', timestamp: 1705600060000, activity_type: 'coding' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty batch', () => {
    const result = HeartbeatBatchRequestSchema.safeParse({
      heartbeats: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(300)).toBe('5m');
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(59 * 60)).toBe('59m');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(7200 + 1800)).toBe('2h 30m');
  });
});

describe('formatDurationLong', () => {
  it('formats with full words', () => {
    expect(formatDurationLong(60)).toBe('1 minute');
    expect(formatDurationLong(120)).toBe('2 minutes');
    expect(formatDurationLong(3600)).toBe('1 hour 0 mins');
    expect(formatDurationLong(7260)).toBe('2 hours 1 min');
  });
});

describe('groupHeartbeatsIntoSessions', () => {
  const baseHeartbeat = (timestamp: number, overrides: Partial<Heartbeat> = {}): Heartbeat => ({
    tool: 'vscode',
    timestamp,
    activity_type: 'coding',
    project: 'test-project',
    ...overrides,
  });

  it('returns empty array for no heartbeats', () => {
    expect(groupHeartbeatsIntoSessions([], 'user-1')).toEqual([]);
  });

  it('groups continuous heartbeats into one session', () => {
    const heartbeats = [
      baseHeartbeat(1000000),
      baseHeartbeat(1060000),
      baseHeartbeat(1120000),
    ];

    const sessions = groupHeartbeatsIntoSessions(heartbeats, 'user-1');

    expect(sessions).toHaveLength(1);
    expect(sessions[0].heartbeat_count).toBe(3);
    expect(sessions[0].start_time).toBe(1000000);
    expect(sessions[0].end_time).toBe(1120000);
  });

  it('splits sessions on time gap', () => {
    const gapMs = 5 * 60 * 1000;
    const heartbeats = [
      baseHeartbeat(1000000),
      baseHeartbeat(1060000),
      baseHeartbeat(1060000 + gapMs + 1000),
    ];

    const sessions = groupHeartbeatsIntoSessions(heartbeats, 'user-1', gapMs);

    expect(sessions).toHaveLength(2);
    expect(sessions[0].heartbeat_count).toBe(2);
    expect(sessions[1].heartbeat_count).toBe(1);
  });

  it('splits sessions on tool change', () => {
    const heartbeats = [
      baseHeartbeat(1000000, { tool: 'vscode' }),
      baseHeartbeat(1060000, { tool: 'claude-code' }),
    ];

    const sessions = groupHeartbeatsIntoSessions(heartbeats, 'user-1');

    expect(sessions).toHaveLength(2);
    expect(sessions[0].tool).toBe('vscode');
    expect(sessions[1].tool).toBe('claude-code');
  });

  it('splits sessions on project change', () => {
    const heartbeats = [
      baseHeartbeat(1000000, { project: 'project-a' }),
      baseHeartbeat(1060000, { project: 'project-b' }),
    ];

    const sessions = groupHeartbeatsIntoSessions(heartbeats, 'user-1');

    expect(sessions).toHaveLength(2);
    expect(sessions[0].project).toBe('project-a');
    expect(sessions[1].project).toBe('project-b');
  });

  it('handles unsorted heartbeats', () => {
    const heartbeats = [
      baseHeartbeat(1120000),
      baseHeartbeat(1000000),
      baseHeartbeat(1060000),
    ];

    const sessions = groupHeartbeatsIntoSessions(heartbeats, 'user-1');

    expect(sessions).toHaveLength(1);
    expect(sessions[0].start_time).toBe(1000000);
    expect(sessions[0].end_time).toBe(1120000);
  });
});

describe('aggregateStats', () => {
  const baseHeartbeat = (timestamp: number, overrides: Partial<Heartbeat> = {}): Heartbeat => ({
    tool: 'vscode',
    timestamp,
    activity_type: 'coding',
    ...overrides,
  });

  it('returns zeros for empty heartbeats', () => {
    const stats = aggregateStats([]);
    expect(stats.total_seconds).toBe(0);
    expect(stats.by_tool).toEqual({});
  });

  it('calculates time between heartbeats', () => {
    const heartbeats = [
      baseHeartbeat(1000000),
      baseHeartbeat(1060000),
      baseHeartbeat(1120000),
    ];

    const stats = aggregateStats(heartbeats);

    expect(stats.total_seconds).toBe(120);
  });

  it('ignores gaps larger than session threshold', () => {
    const heartbeats = [
      baseHeartbeat(1000000),
      baseHeartbeat(1000000 + 20 * 60 * 1000),
    ];

    const stats = aggregateStats(heartbeats);

    expect(stats.total_seconds).toBe(0);
  });

  it('aggregates by tool', () => {
    const heartbeats = [
      baseHeartbeat(1000000, { tool: 'vscode' }),
      baseHeartbeat(1060000, { tool: 'vscode' }),
      baseHeartbeat(1120000, { tool: 'claude-code' }),
      baseHeartbeat(1180000, { tool: 'claude-code' }),
    ];

    const stats = aggregateStats(heartbeats);

    expect(stats.by_tool['vscode']).toBe(120);
    expect(stats.by_tool['claude-code']).toBe(60);
  });

  it('aggregates by project', () => {
    const heartbeats = [
      baseHeartbeat(1000000, { project: 'project-a' }),
      baseHeartbeat(1060000, { project: 'project-a' }),
      baseHeartbeat(1120000, { project: 'project-b' }),
      baseHeartbeat(1180000, { project: 'project-b' }),
    ];

    const stats = aggregateStats(heartbeats);

    expect(stats.by_project['project-a']).toBe(120);
    expect(stats.by_project['project-b']).toBe(60);
  });

  it('aggregates by language', () => {
    const heartbeats = [
      baseHeartbeat(1000000, { language: 'typescript' }),
      baseHeartbeat(1060000, { language: 'typescript' }),
      baseHeartbeat(1120000, { language: 'python' }),
      baseHeartbeat(1180000, { language: 'python' }),
    ];

    const stats = aggregateStats(heartbeats);

    expect(stats.by_language['typescript']).toBe(120);
    expect(stats.by_language['python']).toBe(60);
  });
});

describe('aggregateByDay', () => {
  it('returns zeros for empty heartbeats', () => {
    const startTime = new Date('2025-01-15').getTime();
    const endTime = new Date('2025-01-17').getTime();

    const result = aggregateByDay([], startTime, endTime);

    expect(result).toHaveLength(3);
    expect(result.every(d => d.seconds === 0)).toBe(true);
  });

  it('attributes time to previous heartbeat day (when activity occurred)', () => {
    // Heartbeat at 11:59 PM on Jan 15, next heartbeat at 12:01 AM on Jan 16
    // The 2 minutes of work happened on Jan 15 (before the second heartbeat)
    const jan15_2359 = new Date('2025-01-15T23:59:00Z').getTime();
    const jan16_0001 = new Date('2025-01-16T00:01:00Z').getTime();

    const heartbeats = [
      { timestamp: jan15_2359 },
      { timestamp: jan16_0001 },
    ];

    const startTime = new Date('2025-01-15').getTime();
    const endTime = new Date('2025-01-16').getTime();

    const result = aggregateByDay(heartbeats, startTime, endTime);

    const jan15 = result.find(d => d.date === '2025-01-15');
    const jan16 = result.find(d => d.date === '2025-01-16');

    // Time should be attributed to Jan 15 (when activity occurred)
    expect(jan15?.seconds).toBe(120);
    expect(jan16?.seconds).toBe(0);
  });

  it('calculates time between heartbeats within same day', () => {
    const jan15_1000 = new Date('2025-01-15T10:00:00Z').getTime();
    const jan15_1001 = new Date('2025-01-15T10:01:00Z').getTime();
    const jan15_1002 = new Date('2025-01-15T10:02:00Z').getTime();

    const heartbeats = [
      { timestamp: jan15_1000 },
      { timestamp: jan15_1001 },
      { timestamp: jan15_1002 },
    ];

    const result = aggregateByDay(heartbeats, jan15_1000, jan15_1002);

    const jan15 = result.find(d => d.date === '2025-01-15');
    expect(jan15?.seconds).toBe(120);
  });

  it('ignores gaps larger than session threshold', () => {
    const jan15_1000 = new Date('2025-01-15T10:00:00Z').getTime();
    const jan15_1100 = new Date('2025-01-15T11:00:00Z').getTime(); // 1 hour gap

    const heartbeats = [
      { timestamp: jan15_1000 },
      { timestamp: jan15_1100 },
    ];

    const result = aggregateByDay(heartbeats, jan15_1000, jan15_1100);

    const jan15 = result.find(d => d.date === '2025-01-15');
    expect(jan15?.seconds).toBe(0);
  });

  it('total by_day matches aggregateStats total_seconds', () => {
    const heartbeats: Heartbeat[] = [
      { tool: 'vscode', timestamp: 1000000, activity_type: 'coding' },
      { tool: 'vscode', timestamp: 1060000, activity_type: 'coding' },
      { tool: 'vscode', timestamp: 1120000, activity_type: 'coding' },
    ];

    const stats = aggregateStats(heartbeats);
    const byDay = aggregateByDay(heartbeats, 1000000, 1120000);
    const byDayTotal = byDay.reduce((sum, d) => sum + d.seconds, 0);

    expect(byDayTotal).toBe(stats.total_seconds);
  });
});
