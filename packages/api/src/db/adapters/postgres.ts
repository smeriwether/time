import type { Heartbeat } from '@devtime/shared';
import type { DatabaseAdapter, HeartbeatFilters } from './types';

interface PostgresClient {
  query<T>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
  end(): Promise<void>;
}

type PostgresClientFactory = (connectionString: string) => PostgresClient;

let clientFactory: PostgresClientFactory | null = null;

export function setPostgresClientFactory(factory: PostgresClientFactory): void {
  clientFactory = factory;
}

export function createPostgresAdapter(connectionString: string): DatabaseAdapter {
  if (!clientFactory) {
    throw new Error(
      'PostgreSQL client factory not set. Call setPostgresClientFactory() before creating a PostgreSQL adapter.'
    );
  }

  const client = clientFactory(connectionString);

  return {
    dialect: 'postgres',

    async storeHeartbeats(heartbeats: Heartbeat[], userId: string): Promise<void> {
      if (heartbeats.length === 0) return;

      const values: unknown[] = [];
      const placeholders: string[] = [];

      heartbeats.forEach((hb, idx) => {
        const offset = idx * 15;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, ` +
            `$${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, ` +
            `$${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15})`
        );
        values.push(
          userId,
          hb.tool,
          hb.timestamp,
          hb.activity_type,
          hb.project ?? null,
          hb.file ?? null,
          hb.language ?? null,
          hb.branch ?? null,
          hb.machine_id ?? null,
          hb.is_write ?? false,
          hb.lines ?? null,
          hb.cursor_line ?? null,
          hb.tokens_in ?? null,
          hb.tokens_out ?? null,
          hb.session_id ?? null
        );
      });

      const query = `
        INSERT INTO heartbeats (
          user_id, tool, timestamp, activity_type, project, file, language,
          branch, machine_id, is_write, lines, cursor_line, tokens_in, tokens_out, session_id
        ) VALUES ${placeholders.join(', ')}
      `;

      await client.query(query, values);
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
        WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
      `;

      const params: (string | number)[] = [userId, startTime, endTime];
      let paramIndex = 4;

      if (filters?.project) {
        query += ` AND project = $${paramIndex++}`;
        params.push(filters.project);
      }

      if (filters?.tool) {
        query += ` AND tool = $${paramIndex++}`;
        params.push(filters.tool);
      }

      query += ' ORDER BY timestamp ASC';

      const result = await client.query<Record<string, unknown>>(query, params);

      return result.rows.map((row) => ({
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
