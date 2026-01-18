import { serve } from '@hono/node-server';
import { Client } from 'pg';
import app from './index';
import { setPostgresClientFactory } from './db/adapters';

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  setPostgresClientFactory((connectionString: string) => {
    const client = new Client({ connectionString });
    client.connect();
    return {
      async query<T>(text: string, values?: unknown[]): Promise<{ rows: T[] }> {
        const result = await client.query(text, values);
        return { rows: result.rows as T[] };
      },
      async end(): Promise<void> {
        await client.end();
      },
    };
  });
}

const env = {
  ENVIRONMENT: 'development',
  DATABASE_URL,
};

console.log(`Starting DevTime API on port ${PORT}`);
console.log(`Database: ${DATABASE_URL ? 'PostgreSQL' : 'In-memory'}`);

serve({
  fetch: (request) => app.fetch(request, env),
  port: PORT,
});
