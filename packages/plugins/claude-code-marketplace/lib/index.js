// src/index.ts
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
var API_VERSION = "v1";
var CONFIG_DIR = path.join(os.homedir(), ".devtime");
var QUEUE_FILE = path.join(CONFIG_DIR, "heartbeat-queue.json");
var CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
var SESSION_FILE = path.join(CONFIG_DIR, "current-session.json");
var MAX_QUEUE_SIZE = 1e3;
var API_BATCH_SIZE = 1e3;
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {
  }
  return null;
}
function loadQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
    }
  } catch {
  }
  return [];
}
function saveQueue(queue) {
  ensureConfigDir();
  const trimmed = queue.slice(-MAX_QUEUE_SIZE);
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(trimmed));
}
function saveSession(session) {
  ensureConfigDir();
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session));
}
function clearSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  } catch {
  }
}
function getProjectFromCwd(cwd) {
  return path.basename(cwd);
}
function getActivityType(toolName) {
  if (!toolName)
    return "prompting";
  switch (toolName) {
    case "Bash":
      return "coding";
    case "Read":
    case "Glob":
    case "Grep":
      return "browsing";
    case "Write":
    case "Edit":
      return "coding";
    case "WebFetch":
    case "WebSearch":
      return "browsing";
    default:
      return "prompting";
  }
}
function getFileFromToolInput(toolInput) {
  if (!toolInput)
    return void 0;
  const filePath = toolInput.file_path;
  if (filePath) {
    return path.basename(filePath);
  }
  return void 0;
}
function getLanguageFromFile(file) {
  if (!file)
    return void 0;
  const ext = path.extname(file).toLowerCase();
  const langMap = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".py": "python",
    ".rs": "rust",
    ".go": "go",
    ".java": "java",
    ".rb": "ruby",
    ".php": "php",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "zsh",
    ".fish": "fish",
    ".md": "markdown",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".xml": "xml",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".sql": "sql"
  };
  return langMap[ext];
}
function createHeartbeat(input) {
  const file = getFileFromToolInput(input.tool_input);
  const isWrite = input.tool_name === "Write" || input.tool_name === "Edit";
  return {
    tool: "claude-code",
    timestamp: Date.now(),
    activity_type: getActivityType(input.tool_name),
    project: getProjectFromCwd(input.cwd),
    file,
    language: getLanguageFromFile(file),
    session_id: input.session_id,
    is_write: isWrite || void 0
  };
}
function queueHeartbeat(heartbeat) {
  const queue = loadQueue();
  queue.push(heartbeat);
  saveQueue(queue);
}
async function flushQueue() {
  const result = { sent: 0, failed: 0, remaining: 0 };
  const config = loadConfig();
  if (!config?.apiEndpoint || !config?.apiKey) {
    result.remaining = loadQueue().length;
    return result;
  }
  let queue = loadQueue();
  while (queue.length > 0) {
    const batch = queue.slice(0, API_BATCH_SIZE);
    const remaining = queue.slice(API_BATCH_SIZE);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1e4);
      const response = await fetch(`${config.apiEndpoint}/${API_VERSION}/heartbeat/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({ heartbeats: batch }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (response.ok) {
        result.sent += batch.length;
        queue = remaining;
        saveQueue(queue);
      } else {
        result.failed += batch.length;
        break;
      }
    } catch {
      result.failed += batch.length;
      break;
    }
  }
  result.remaining = queue.length;
  return result;
}
async function handleHook(input) {
  switch (input.hook_event_name) {
    case "SessionStart": {
      const session = {
        sessionId: input.session_id,
        startTime: Date.now(),
        project: getProjectFromCwd(input.cwd)
      };
      saveSession(session);
      const heartbeat = createHeartbeat(input);
      queueHeartbeat(heartbeat);
      break;
    }
    case "PreToolUse": {
      const heartbeat = createHeartbeat(input);
      queueHeartbeat(heartbeat);
      break;
    }
    case "SessionEnd": {
      const heartbeat = createHeartbeat(input);
      queueHeartbeat(heartbeat);
      clearSession();
      await flushQueue();
      break;
    }
  }
}
function readStdinSync() {
  try {
    return fs.readFileSync("/dev/stdin", "utf-8");
  } catch {
    const chunks = [];
    const BUFSIZE = 256;
    let buffer = Buffer.alloc(BUFSIZE);
    let bytesRead;
    const fd = fs.openSync("/dev/fd/0", "r");
    try {
      while ((bytesRead = fs.readSync(fd, buffer, 0, BUFSIZE, null)) > 0) {
        chunks.push(buffer.slice(0, bytesRead));
        buffer = Buffer.alloc(BUFSIZE);
      }
    } finally {
      fs.closeSync(fd);
    }
    return Buffer.concat(chunks).toString("utf-8");
  }
}
async function processHookInput() {
  try {
    const input = readStdinSync();
    if (!input.trim()) {
      return;
    }
    const hookInput = JSON.parse(input);
    await handleHook(hookInput);
  } catch {
  }
}
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (command === "flush") {
    const result = await flushQueue();
    if (result.sent > 0) {
      console.log(`Sent ${result.sent} heartbeat${result.sent !== 1 ? "s" : ""}`);
    }
    if (result.failed > 0) {
      console.log(`Failed to send ${result.failed} heartbeat${result.failed !== 1 ? "s" : ""}`);
    }
    if (result.remaining > 0) {
      console.log(`${result.remaining} heartbeat${result.remaining !== 1 ? "s" : ""} remaining in queue`);
    }
    if (result.sent === 0 && result.failed === 0 && result.remaining === 0) {
      console.log("Queue is empty");
    }
  } else {
    await processHookInput();
  }
}
main().catch(() => {
});
