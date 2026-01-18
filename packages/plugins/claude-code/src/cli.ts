#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { handleHook, flushQueue, readStdinSync, saveConfig, type HookInput, type Config } from './index.js';

const CLAUDE_SETTINGS_DIR = path.join(os.homedir(), '.claude');
const CLAUDE_SETTINGS_FILE = path.join(CLAUDE_SETTINGS_DIR, 'settings.json');

interface ClaudeSettings {
  hooks?: {
    [event: string]: Array<{
      matcher?: string;
      hooks: Array<{
        type: string;
        command: string;
        timeout?: number;
      }>;
    }>;
  };
  [key: string]: unknown;
}

function loadClaudeSettings(): ClaudeSettings {
  try {
    if (fs.existsSync(CLAUDE_SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(CLAUDE_SETTINGS_FILE, 'utf-8'));
    }
  } catch {
    // Settings don't exist or are invalid
  }
  return {};
}

function saveClaudeSettings(settings: ClaudeSettings): void {
  if (!fs.existsSync(CLAUDE_SETTINGS_DIR)) {
    fs.mkdirSync(CLAUDE_SETTINGS_DIR, { recursive: true });
  }
  fs.writeFileSync(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function addHook(settings: ClaudeSettings, event: string, matcher: string, command: string): void {
  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (!settings.hooks[event]) {
    settings.hooks[event] = [];
  }

  const existingIndex = settings.hooks[event].findIndex(h =>
    h.hooks.some(hook => hook.command.includes('devtime-claude'))
  );

  const hookConfig = {
    matcher,
    hooks: [{
      type: 'command' as const,
      command,
      timeout: 5,
    }],
  };

  if (existingIndex >= 0) {
    settings.hooks[event][existingIndex] = hookConfig;
  } else {
    settings.hooks[event].push(hookConfig);
  }
}

function install(): void {
  console.log('Installing DevTime hooks for Claude Code...\n');

  const command = 'npx devtime-claude';
  const settings = loadClaudeSettings();

  addHook(settings, 'SessionStart', '', command);
  addHook(settings, 'PreToolUse', 'Bash|Read|Write|Edit|Glob|Grep', command);
  addHook(settings, 'SessionEnd', '', command);

  saveClaudeSettings(settings);

  console.log('Hooks installed successfully!\n');
  console.log('Hooks added:');
  console.log('  - SessionStart: Track session start');
  console.log('  - PreToolUse: Track Bash, Read, Write, Edit, Glob, Grep');
  console.log('  - SessionEnd: Track session end and flush queue\n');
  console.log('Next steps:');
  console.log('  1. Configure your API endpoint and key:');
  console.log('     devtime-claude config --endpoint https://api.devtime.dev --key dt_xxx\n');
  console.log('  2. Restart Claude Code to activate the hooks\n');
}

function configure(endpoint: string, key: string): void {
  const config: Config = {
    apiEndpoint: endpoint,
    apiKey: key,
  };
  saveConfig(config);
  console.log('Configuration saved to ~/.devtime/config.json');
}

function uninstall(): void {
  console.log('Removing DevTime hooks from Claude Code...\n');

  const settings = loadClaudeSettings();

  if (settings.hooks) {
    for (const event of Object.keys(settings.hooks)) {
      settings.hooks[event] = settings.hooks[event].filter(h =>
        !h.hooks.some(hook => hook.command.includes('devtime-claude'))
      );
      if (settings.hooks[event].length === 0) {
        delete settings.hooks[event];
      }
    }
    if (Object.keys(settings.hooks).length === 0) {
      delete settings.hooks;
    }
  }

  saveClaudeSettings(settings);
  console.log('Hooks removed successfully!');
}

function showHelp(): void {
  console.log(`DevTime Claude Code Plugin

Usage:
  devtime-claude install              Install hooks into Claude Code
  devtime-claude uninstall            Remove hooks from Claude Code
  devtime-claude config --endpoint URL --key KEY
                                      Configure API endpoint and key
  devtime-claude flush                Manually flush the heartbeat queue
  devtime-claude                      Process hook input from stdin (used by hooks)

Environment:
  Config is stored in ~/.devtime/config.json
  Heartbeat queue is stored in ~/.devtime/heartbeat-queue.json
`);
}

async function processHookInput(): Promise<void> {
  try {
    const input = readStdinSync();
    if (!input.trim()) {
      return;
    }

    const hookInput: HookInput = JSON.parse(input);
    await handleHook(hookInput);
  } catch {
    // Silent failure - never interrupt Claude Code
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'install':
      install();
      break;

    case 'uninstall':
      uninstall();
      break;

    case 'config': {
      const endpointIdx = args.indexOf('--endpoint');
      const keyIdx = args.indexOf('--key');

      if (endpointIdx === -1 || keyIdx === -1) {
        console.error('Usage: devtime-claude config --endpoint URL --key KEY');
        process.exit(1);
      }

      const endpoint = args[endpointIdx + 1];
      const key = args[keyIdx + 1];

      if (!endpoint || !key) {
        console.error('Both --endpoint and --key are required');
        process.exit(1);
      }

      configure(endpoint, key);
      break;
    }

    case 'flush': {
      const result = await flushQueue();
      if (result.sent > 0) {
        console.log(`Sent ${result.sent} heartbeat${result.sent !== 1 ? 's' : ''}`);
      }
      if (result.failed > 0) {
        console.log(`Failed to send ${result.failed} heartbeat${result.failed !== 1 ? 's' : ''}`);
      }
      if (result.remaining > 0) {
        console.log(`${result.remaining} heartbeat${result.remaining !== 1 ? 's' : ''} remaining in queue`);
      }
      if (result.sent === 0 && result.failed === 0 && result.remaining === 0) {
        console.log('Queue is empty');
      }
      break;
    }

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    case undefined:
      // No command - being called as a hook, read from stdin
      await processHookInput();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch(() => {
  // Silent failure for hook mode
});
