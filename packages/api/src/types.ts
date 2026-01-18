export interface Env {
  ENVIRONMENT?: string;
  DASHBOARD_ORIGIN?: string;
  DB?: D1Database;
  HEARTBEATS?: KVNamespace;
  API_KEYS?: KVNamespace;
}

export interface AuthContext {
  userId: string;
  apiKey: string;
}
