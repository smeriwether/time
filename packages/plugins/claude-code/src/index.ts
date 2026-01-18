import { type Heartbeat, API_VERSION } from '@devtime/shared';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const CONFIG_DIR = path.join(os.homedir(), '.devtime');
const QUEUE_FILE = path.join(CONFIG_DIR, 'heartbeat-queue.json');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const SESSION_FILE = path.join(CONFIG_DIR, 'current-session.json');

const MAX_QUEUE_SIZE = 1000;
const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 30000;

export interface Config {
  apiEndpoint: string;
  apiKey: string;
}

export interface SessionInfo {
  sessionId: string;
  startTime: number;
  project: string;
}

export interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: Record<string, unknown>;
  reason?: string;
  source?: string;
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {
    // Config doesn't exist or is invalid
  }
  return null;
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadQueue(): Heartbeat[] {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
    }
  } catch {
    // Queue doesn't exist or is corrupted
  }
  return [];
}

function saveQueue(queue: Heartbeat[]): void {
  ensureConfigDir();
  const trimmed = queue.slice(-MAX_QUEUE_SIZE);
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(trimmed));
}

export function loadSession(): SessionInfo | null {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
    }
  } catch {
    // Session doesn't exist
  }
  return null;
}

export function saveSession(session: SessionInfo): void {
  ensureConfigDir();
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session));
}

export function clearSession(): void {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  } catch {
    // Ignore
  }
}

function getProjectFromCwd(cwd: string): string {
  return path.basename(cwd);
}

function getActivityType(toolName?: string): 'coding' | 'debugging' | 'prompting' | 'browsing' {
  if (!toolName) return 'prompting';

  switch (toolName) {
    case 'Bash':
      return 'coding';
    case 'Read':
    case 'Glob':
    case 'Grep':
      return 'browsing';
    case 'Write':
    case 'Edit':
      return 'coding';
    case 'WebFetch':
    case 'WebSearch':
      return 'browsing';
    default:
      return 'prompting';
  }
}

function getFileFromToolInput(toolInput?: Record<string, unknown>): string | undefined {
  if (!toolInput) return undefined;

  const filePath = toolInput.file_path as string | undefined;
  if (filePath) {
    return path.basename(filePath);
  }
  return undefined;
}

function getLanguageFromFile(file?: string): string | undefined {
  if (!file) return undefined;

  const ext = path.extname(file).toLowerCase();
  const langMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.rs': 'rust',
    '.go': 'go',
    '.java': 'java',
    '.rb': 'ruby',
    '.php': 'php',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'zsh',
    '.fish': 'fish',
    '.md': 'markdown',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.xml': 'xml',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.sql': 'sql',
  };

  return langMap[ext];
}

export function createHeartbeat(input: HookInput): Heartbeat {
  const file = getFileFromToolInput(input.tool_input);
  const isWrite = input.tool_name === 'Write' || input.tool_name === 'Edit';

  return {
    tool: 'claude-code',
    timestamp: Date.now(),
    activity_type: getActivityType(input.tool_name),
    project: getProjectFromCwd(input.cwd),
    file,
    language: getLanguageFromFile(file),
    session_id: input.session_id,
    is_write: isWrite || undefined,
  };
}

export function queueHeartbeat(heartbeat: Heartbeat): void {
  const queue = loadQueue();
  queue.push(heartbeat);
  saveQueue(queue);
}

export async function flushQueue(): Promise<void> {
  const config = loadConfig();
  if (!config?.apiEndpoint || !config?.apiKey) {
    return;
  }

  const queue = loadQueue();
  if (queue.length === 0) {
    return;
  }

  const batch = queue.slice(0, BATCH_SIZE);
  const remaining = queue.slice(BATCH_SIZE);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${config.apiEndpoint}/${API_VERSION}/heartbeat/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ heartbeats: batch }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      saveQueue(remaining);
    }
  } catch {
    // Network error - keep queue for retry
  }
}

export async function handleHook(input: HookInput): Promise<void> {
  switch (input.hook_event_name) {
    case 'SessionStart': {
      const session: SessionInfo = {
        sessionId: input.session_id,
        startTime: Date.now(),
        project: getProjectFromCwd(input.cwd),
      };
      saveSession(session);

      const heartbeat = createHeartbeat(input);
      queueHeartbeat(heartbeat);
      break;
    }

    case 'PreToolUse': {
      const heartbeat = createHeartbeat(input);
      queueHeartbeat(heartbeat);
      break;
    }

    case 'SessionEnd': {
      const heartbeat = createHeartbeat(input);
      queueHeartbeat(heartbeat);
      clearSession();

      // Flush on session end
      await flushQueue();
      break;
    }
  }
}

export function readStdinSync(): string {
  // Use /dev/stdin on Unix, or read from fd 0 directly
  try {
    return fs.readFileSync('/dev/stdin', 'utf-8');
  } catch {
    // Fallback for platforms without /dev/stdin
    const chunks: Buffer[] = [];
    const BUFSIZE = 256;
    let buffer = Buffer.alloc(BUFSIZE);
    let bytesRead: number;

    const fd = fs.openSync('/dev/fd/0', 'r');

    try {
      while ((bytesRead = fs.readSync(fd, buffer, 0, BUFSIZE, null)) > 0) {
        chunks.push(buffer.slice(0, bytesRead));
        buffer = Buffer.alloc(BUFSIZE);
      }
    } finally {
      fs.closeSync(fd);
    }

    return Buffer.concat(chunks).toString('utf-8');
  }
}
