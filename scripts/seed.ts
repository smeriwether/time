#!/usr/bin/env npx tsx

/**
 * Seed script to populate the API with sample heartbeat data.
 *
 * Usage:
 *   # Start the API first
 *   pnpm --filter @devtime/api dev
 *
 *   # Run the seed script
 *   npx tsx scripts/seed.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:8787';
const API_KEY = process.env.API_KEY || 'dt_dev_key';

interface Heartbeat {
  tool: string;
  timestamp: number;
  activity_type: string;
  project?: string;
  file?: string;
  language?: string;
  branch?: string;
  is_write?: boolean;
}

const TOOLS = ['vscode', 'claude-code', 'zed'] as const;
const ACTIVITY_TYPES = ['coding', 'debugging', 'prompting'] as const;

const PROJECTS = [
  { name: 'devtime', weight: 3 },
  { name: 'api-server', weight: 2 },
  { name: 'mobile-app', weight: 2 },
  { name: 'landing-page', weight: 1 },
  { name: 'cli-tools', weight: 1 },
];

const FILES: Record<string, { file: string; language: string }[]> = {
  devtime: [
    { file: 'index.ts', language: 'typescript' },
    { file: 'App.tsx', language: 'typescriptreact' },
    { file: 'heartbeats.ts', language: 'typescript' },
    { file: 'stats.ts', language: 'typescript' },
    { file: 'README.md', language: 'markdown' },
  ],
  'api-server': [
    { file: 'main.go', language: 'go' },
    { file: 'handlers.go', language: 'go' },
    { file: 'middleware.go', language: 'go' },
    { file: 'config.yaml', language: 'yaml' },
  ],
  'mobile-app': [
    { file: 'App.swift', language: 'swift' },
    { file: 'ContentView.swift', language: 'swift' },
    { file: 'NetworkManager.swift', language: 'swift' },
    { file: 'Models.swift', language: 'swift' },
  ],
  'landing-page': [
    { file: 'index.html', language: 'html' },
    { file: 'styles.css', language: 'css' },
    { file: 'main.js', language: 'javascript' },
  ],
  'cli-tools': [
    { file: 'main.rs', language: 'rust' },
    { file: 'commands.rs', language: 'rust' },
    { file: 'config.rs', language: 'rust' },
    { file: 'Cargo.toml', language: 'toml' },
  ],
};

const BRANCHES = ['main', 'feature/auth', 'fix/bug-123', 'develop'];

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }

  return items[0];
}

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateWorkSession(startTime: number): Heartbeat[] {
  const heartbeats: Heartbeat[] = [];
  const sessionDuration = 30 + Math.random() * 150; // 30-180 minutes
  const project = weightedRandom(PROJECTS).name;
  const tool = randomElement(TOOLS);
  const branch = randomElement(BRANCHES);

  let currentTime = startTime;
  const endTime = startTime + sessionDuration * 60 * 1000;

  while (currentTime < endTime) {
    const fileInfo = randomElement(FILES[project] || FILES.devtime);
    const activityType = tool === 'claude-code' ? 'prompting' : randomElement(ACTIVITY_TYPES);

    heartbeats.push({
      tool,
      timestamp: Math.floor(currentTime),
      activity_type: activityType,
      project,
      file: fileInfo.file,
      language: fileInfo.language,
      branch,
      is_write: Math.random() > 0.3,
    });

    // Next heartbeat in 30-180 seconds
    currentTime += Math.floor((30 + Math.random() * 150) * 1000);
  }

  return heartbeats;
}

function generateDayHeartbeats(date: Date): Heartbeat[] {
  const heartbeats: Heartbeat[] = [];
  const dayOfWeek = date.getDay();

  // Less activity on weekends
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const numSessions = isWeekend
    ? Math.floor(Math.random() * 3) // 0-2 sessions
    : 2 + Math.floor(Math.random() * 4); // 2-5 sessions

  // Work hours: 8am - 8pm with some variation
  const workStartHour = 8 + Math.floor(Math.random() * 2);
  const workEndHour = 18 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numSessions; i++) {
    const sessionHour = workStartHour + Math.random() * (workEndHour - workStartHour - 2);
    const sessionStart = new Date(date);
    sessionStart.setHours(Math.floor(sessionHour), Math.floor(Math.random() * 60), 0, 0);

    heartbeats.push(...generateWorkSession(sessionStart.getTime()));
  }

  return heartbeats;
}

async function sendHeartbeats(heartbeats: Heartbeat[]): Promise<void> {
  const batchSize = 100;

  for (let i = 0; i < heartbeats.length; i += batchSize) {
    const batch = heartbeats.slice(i, i + batchSize);

    const response = await fetch(`${API_URL}/v1/heartbeat/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ heartbeats: batch }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to send heartbeats: ${response.status} ${text}`);
    }

    process.stdout.write('.');
  }
}

async function main(): Promise<void> {
  console.log('Generating sample heartbeat data...\n');

  const allHeartbeats: Heartbeat[] = [];
  const today = new Date();

  // Generate data for the past 30 days
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    const dayHeartbeats = generateDayHeartbeats(date);
    allHeartbeats.push(...dayHeartbeats);
  }

  // Sort by timestamp
  allHeartbeats.sort((a, b) => a.timestamp - b.timestamp);

  console.log(`Generated ${allHeartbeats.length} heartbeats over 30 days`);
  console.log(`Sending to ${API_URL}...`);

  try {
    await sendHeartbeats(allHeartbeats);
    console.log('\n\nDone! Open the dashboard to see the data.');
  } catch (error) {
    console.error('\n\nError:', error);
    console.error('\nMake sure the API is running: pnpm --filter @devtime/api dev');
    process.exit(1);
  }
}

main();
