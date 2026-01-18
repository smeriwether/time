export interface Env {
  ENVIRONMENT: string;
  DB?: D1Database;
  HEARTBEATS?: KVNamespace;
  API_KEYS?: KVNamespace;
}

export interface AuthContext {
  userId: string;
  apiKey: string;
}
