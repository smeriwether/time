export interface Heartbeat {
  // Required fields
  tool: 'vscode' | 'claude-code' | 'codex' | 'zed' | string;
  timestamp: number;
  activity_type: 'coding' | 'debugging' | 'prompting' | 'browsing' | 'idle';

  // Optional context
  project?: string;
  file?: string;
  language?: string;
  branch?: string;
  machine_id?: string;

  // Activity details
  is_write?: boolean;
  lines?: number;
  cursor_line?: number;

  // AI-specific
  tokens_in?: number;
  tokens_out?: number;
  session_id?: string;
}

export interface Session {
  id: string;
  user_id: string;
  tool: string;
  project: string;
  start_time: number;
  end_time: number;
  duration: number;
  heartbeat_count: number;
}

export interface StatsResponse {
  total_seconds: number;
  by_tool: Record<string, number>;
  by_project: Record<string, number>;
  by_language: Record<string, number>;
  by_day: Array<{ date: string; seconds: number }>;
}

export interface Config {
  api: {
    endpoint: string;
    key: string;
  };
  privacy: {
    anonymize_file_paths: boolean;
    exclude_projects: string[];
    exclude_file_patterns: string[];
  };
  tracking: {
    idle_timeout_minutes: number;
    heartbeat_interval_seconds: number;
  };
}

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
