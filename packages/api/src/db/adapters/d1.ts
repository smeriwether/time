import type { Heartbeat } from '@devtime/shared';
import type { DatabaseAdapter, HeartbeatFilters } from './types';

const BATCH_SIZE = 50;

export function createD1Adapter(db: D1Database): DatabaseAdapter {
  return {
    dialect: 'd1',

    async storeHeartbeats(heartbeats: Heartbeat[], userId: string): Promise<void> {
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

      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        await db.batch(batch.slice(i, i + BATCH_SIZE));
      }
    },

    async getHeartbeats(
      userId: string,
      startTime: number,
      endTime: number,
      filters?: HeartbeatFilters
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

      return (result.results as Record<string, unknown>[]).map((row) => ({
        tool: row.tool as Heartbeat['tool'],
        timestamp: row.timestamp as number,
        activity_type: row.activity_type as Heartbeat['activity_type'],
        project: row.project as string | undefined,
        file: row.file as string | undefined,
        language: row.language as string | undefined,
        branch: row.branch as string | undefined,
        machine_id: row.machine_id as string | undefined,
        is_write: Boolean(row.is_write),
        lines: row.lines as number | undefined,
        cursor_line: row.cursor_line as number | undefined,
        tokens_in: row.tokens_in as number | undefined,
        tokens_out: row.tokens_out as number | undefined,
        session_id: row.session_id as string | undefined,
      }));
    },
  };
}
