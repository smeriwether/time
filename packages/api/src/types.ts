export interface Env {
  ENVIRONMENT?: string;
  DASHBOARD_ORIGIN?: string;
  DB?: D1Database;
  DATABASE_URL?: string;
  API_KEYS?: KVNamespace;
}

export interface AuthContext {
  userId: string;
  apiKey: string;
}
