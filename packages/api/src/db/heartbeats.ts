import type { Heartbeat } from '@devtime/shared';
import type { Env } from '../types';

interface StoredHeartbeat extends Heartbeat {
  user_id: string;
  id: string;
}

const D1_BATCH_SIZE = 50;

// In-memory storage for development/testing when no DB or KV is configured
const memoryStore = new Map<string, StoredHeartbeat[]>();

export function clearMemoryStore(): void {
  memoryStore.clear();
}

export async function storeHeartbeats(
  heartbeats: Heartbeat[],
  userId: string,
  env?: Env
): Promise<void> {
  if (env?.DB) {
    await storeInD1(heartbeats, userId, env.DB);
  } else if (env?.HEARTBEATS) {
    await storeInKV(heartbeats, userId, env.HEARTBEATS);
  } else {
    storeInMemory(heartbeats, userId);
  }
}

export async function getHeartbeats(
  userId: string,
  startTime: number,
  endTime: number,
  env?: Env,
  filters?: { project?: string; tool?: string }
): Promise<Heartbeat[]> {
  if (env?.DB) {
    return getFromD1(userId, startTime, endTime, env.DB, filters);
  } else if (env?.HEARTBEATS) {
    return getFromKV(userId, startTime, endTime, env.HEARTBEATS, filters);
  }

  return getFromMemory(userId, startTime, endTime, filters);
}

async function storeInD1(
  heartbeats: Heartbeat[],
  userId: string,
  db: D1Database
): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO heartbeats (
      user_id, tool, timestamp, activity_type, project, file, language,
      branch, machine_id, is_write, lines, cursor_line, tokens_in, tokens_out, session_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batch = heartbeats.map((hb) =>
    stmt.bind(
      userId,
      hb.tool,
      hb.timestamp,
      hb.activity_type,
      hb.project ?? null,
      hb.file ?? null,
      hb.language ?? null,
      hb.branch ?? null,
      hb.machine_id ?? null,
      hb.is_write ? 1 : 0,
      hb.lines ?? null,
      hb.cursor_line ?? null,
      hb.tokens_in ?? null,
      hb.tokens_out ?? null,
      hb.session_id ?? null
    )
  );

  for (let i = 0; i < batch.length; i += D1_BATCH_SIZE) {
    await db.batch(batch.slice(i, i + D1_BATCH_SIZE));
  }
}

async function getFromD1(
  userId: string,
  startTime: number,
  endTime: number,
  db: D1Database,
  filters?: { project?: string; tool?: string }
): Promise<Heartbeat[]> {
  let query = `
    SELECT tool, timestamp, activity_type, project, file, language,
           branch, machine_id, is_write, lines, cursor_line, tokens_in, tokens_out, session_id
    FROM heartbeats
    WHERE user_id = ? AND timestamp >= ? AND timestamp <= ?
  `;

  const params: (string | number)[] = [userId, startTime, endTime];

  if (filters?.project) {
    query += ' AND project = ?';
    params.push(filters.project);
  }

  if (filters?.tool) {
    query += ' AND tool = ?';
    params.push(filters.tool);
  }

  query += ' ORDER BY timestamp ASC';

  const result = await db.prepare(query).bind(...params).all();

  return (result.results as any[]).map((row) => ({
    tool: row.tool,
    timestamp: row.timestamp,
    activity_type: row.activity_type,
    project: row.project,
    file: row.file,
    language: row.language,
    branch: row.branch,
    machine_id: row.machine_id,
    is_write: Boolean(row.is_write),
    lines: row.lines,
    cursor_line: row.cursor_line,
    tokens_in: row.tokens_in,
    tokens_out: row.tokens_out,
    session_id: row.session_id,
  }));
}

async function storeInKV(
  heartbeats: Heartbeat[],
  userId: string,
  kv: KVNamespace
): Promise<void> {
  const key = `heartbeats:${userId}`;
  const existing = await kv.get<StoredHeartbeat[]>(key, 'json') ?? [];

  const newHeartbeats: StoredHeartbeat[] = heartbeats.map((hb, i) => ({
    ...hb,
    user_id: userId,
    id: `${userId}-${hb.timestamp}-${i}`,
  }));

  const combined = [...existing, ...newHeartbeats];

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filtered = combined.filter((hb) => hb.timestamp > oneWeekAgo);

  await kv.put(key, JSON.stringify(filtered));
}

async function getFromKV(
  userId: string,
  startTime: number,
  endTime: number,
  kv: KVNamespace,
  filters?: { project?: string; tool?: string }
): Promise<Heartbeat[]> {
  const key = `heartbeats:${userId}`;
  const heartbeats = await kv.get<StoredHeartbeat[]>(key, 'json') ?? [];

  return heartbeats.filter((hb) => {
    if (hb.timestamp < startTime || hb.timestamp > endTime) return false;
    if (filters?.project && hb.project !== filters.project) return false;
    if (filters?.tool && hb.tool !== filters.tool) return false;
    return true;
  });
}

function storeInMemory(heartbeats: Heartbeat[], userId: string): void {
  const key = `heartbeats:${userId}`;
  const existing = memoryStore.get(key) ?? [];

  const newHeartbeats: StoredHeartbeat[] = heartbeats.map((hb, i) => ({
    ...hb,
    user_id: userId,
    id: `${userId}-${hb.timestamp}-${i}`,
  }));

  const combined = [...existing, ...newHeartbeats];

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filtered = combined.filter((hb) => hb.timestamp > oneWeekAgo);

  memoryStore.set(key, filtered);
}

function getFromMemory(
  userId: string,
  startTime: number,
  endTime: number,
  filters?: { project?: string; tool?: string }
): Heartbeat[] {
  const key = `heartbeats:${userId}`;
  const heartbeats = memoryStore.get(key) ?? [];

  return heartbeats.filter((hb) => {
    if (hb.timestamp < startTime || hb.timestamp > endTime) return false;
    if (filters?.project && hb.project !== filters.project) return false;
    if (filters?.tool && hb.tool !== filters.tool) return false;
    return true;
  });
}
