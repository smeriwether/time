import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8787';
const DEV_API_KEY = 'dt_dev_key';

async function resetTestData(): Promise<void> {
  await fetch(`${API_URL}/test/reset`, { method: 'POST' });
}

interface Heartbeat {
  tool: 'vscode' | 'claude-code' | 'codex' | 'zed';
  timestamp: number;
  activity_type: 'coding' | 'debugging' | 'prompting' | 'browsing';
  project?: string;
  language?: string;
  file?: string;
}

async function sendHeartbeats(heartbeats: Heartbeat[]): Promise<void> {
  const response = await fetch(`${API_URL}/v1/heartbeat/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEV_API_KEY}`,
    },
    body: JSON.stringify({ heartbeats }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send heartbeats: ${response.status}`);
  }
}

test.describe('Heartbeats to UI', () => {
  test.beforeEach(async () => {
    await resetTestData();
  });

  test('shows correct total time for sent heartbeats', async ({ page }) => {
    // Generate heartbeats with known time gaps
    const now = Date.now();
    const heartbeats: Heartbeat[] = [
      {
        tool: 'vscode',
        timestamp: now - 3600000, // 1 hour ago
        activity_type: 'coding',
        project: 'test-project',
        language: 'typescript',
        file: 'index.ts',
      },
      {
        tool: 'vscode',
        timestamp: now - 3540000, // 59 minutes ago (1 min of coding)
        activity_type: 'coding',
        project: 'test-project',
        language: 'typescript',
        file: 'index.ts',
      },
      {
        tool: 'claude-code',
        timestamp: now - 3480000, // 58 minutes ago (1 min of prompting)
        activity_type: 'prompting',
        project: 'test-project',
        language: 'typescript',
        file: 'app.ts',
      },
      {
        tool: 'claude-code',
        timestamp: now - 3300000, // 55 minutes ago (3 min gap - within session)
        activity_type: 'prompting',
        project: 'test-project',
        language: 'typescript',
        file: 'app.ts',
      },
    ];

    // Send heartbeats to API
    await sendHeartbeats(heartbeats);

    // Navigate to dashboard
    await page.goto('/');

    // Wait for loading to complete
    await expect(page.getByText('Loading stats...')).not.toBeVisible({ timeout: 10000 });

    // Verify total time is displayed (should be ~4 minutes)
    const totalTime = page.getByTestId('total-time');
    await expect(totalTime).toBeVisible();
    const totalTimeText = await totalTime.textContent();
    expect(totalTimeText).toBeTruthy();

    // Verify tools count shows 2 (vscode and claude-code)
    const toolsCount = page.getByTestId('tools-count');
    await expect(toolsCount).toHaveText('2');

    // Verify project count shows 1
    const projectsCount = page.getByTestId('projects-count');
    await expect(projectsCount).toHaveText('1');

    // Verify tool breakdown shows both tools
    await expect(page.getByTestId('tool-vscode')).toBeVisible();
    await expect(page.getByTestId('tool-claude-code')).toBeVisible();

    // Verify project shows in the list
    await expect(page.getByTestId('project-test-project')).toBeVisible();

    // Verify language shows in the list
    await expect(page.getByTestId('lang-typescript')).toBeVisible();
  });

  test('shows correct breakdown by tool', async ({ page }) => {
    const now = Date.now();

    // Create heartbeats with specific tool distribution using separate sessions
    // (15+ min gap between tools to create separate sessions)
    // Time is attributed to the previous heartbeat, so:
    // - vscode heartbeat at T-25min
    // - vscode heartbeat at T-20min → 5 min attributed to first vscode = 5m vscode
    // - claude-code at T-3min (new session, 17+ min gap)
    // - claude-code at T-1min → 2 min attributed to first claude = 2m claude-code
    const heartbeats: Heartbeat[] = [
      // VS Code session (5 min gap)
      { tool: 'vscode', timestamp: now - 1500000, activity_type: 'coding', project: 'my-app', language: 'python' }, // 25 min ago
      { tool: 'vscode', timestamp: now - 1200000, activity_type: 'coding', project: 'my-app', language: 'python' }, // 20 min ago

      // Claude Code session (2 min gap) - separate session due to >15min gap
      { tool: 'claude-code', timestamp: now - 180000, activity_type: 'prompting', project: 'my-app' }, // 3 min ago
      { tool: 'claude-code', timestamp: now - 60000, activity_type: 'prompting', project: 'my-app' }, // 1 min ago
    ];

    await sendHeartbeats(heartbeats);
    await page.goto('/');

    await expect(page.getByText('Loading stats...')).not.toBeVisible({ timeout: 10000 });

    // Verify both tools are displayed
    const vscodeTool = page.getByTestId('tool-vscode');
    const claudeTool = page.getByTestId('tool-claude-code');

    await expect(vscodeTool).toBeVisible();
    await expect(claudeTool).toBeVisible();

    // VS Code should show 5m (from 25min ago to 20min ago)
    await expect(vscodeTool).toContainText('5m');

    // Claude Code should show 2m (from 3min ago to 1min ago)
    await expect(claudeTool).toContainText('2m');
  });

  test('switches between time periods', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Loading stats...')).not.toBeVisible({ timeout: 10000 });

    // Click "Today" button
    await page.getByRole('button', { name: 'Today' }).click();

    // Should reload and show today's stats
    await expect(page.getByText('Loading stats...')).not.toBeVisible({ timeout: 10000 });

    // Click "Month" button
    await page.getByRole('button', { name: 'Month' }).click();

    // Should reload with month stats
    await expect(page.getByText('Loading stats...')).not.toBeVisible({ timeout: 10000 });

    // The buttons should have correct active state
    const monthButton = page.getByRole('button', { name: 'Month' });
    await expect(monthButton).toHaveClass(/bg-accent-blue/);
  });

  test('displays empty state when no heartbeats', async ({ page }) => {
    // Navigate with a unique user (in production this would use a different API key)
    await page.goto('/');

    await expect(page.getByText('Loading stats...')).not.toBeVisible({ timeout: 10000 });

    // Should show zero total time or empty state
    const totalTime = page.getByTestId('total-time');
    await expect(totalTime).toBeVisible();
    const totalTimeText = await totalTime.textContent();
    // 0m is acceptable for no data
    expect(['0m', '0h 0m']).toContain(totalTimeText);
  });

  test('shows correct project breakdown', async ({ page }) => {
    const now = Date.now();

    // Create heartbeats for multiple projects
    const heartbeats: Heartbeat[] = [
      // Project A: 3 minutes
      { tool: 'vscode', timestamp: now - 500000, activity_type: 'coding', project: 'project-alpha', language: 'go' },
      { tool: 'vscode', timestamp: now - 320000, activity_type: 'coding', project: 'project-alpha', language: 'go' },

      // Project B: 2 minutes
      { tool: 'vscode', timestamp: now - 300000, activity_type: 'coding', project: 'project-beta', language: 'rust' },
      { tool: 'vscode', timestamp: now - 180000, activity_type: 'coding', project: 'project-beta', language: 'rust' },
    ];

    await sendHeartbeats(heartbeats);
    await page.goto('/');

    await expect(page.getByText('Loading stats...')).not.toBeVisible({ timeout: 10000 });

    // Verify project count
    await expect(page.getByTestId('projects-count')).toHaveText('2');

    // Verify both projects are listed
    await expect(page.getByTestId('project-project-alpha')).toBeVisible();
    await expect(page.getByTestId('project-project-beta')).toBeVisible();

    // Project alpha should show 3m
    await expect(page.getByTestId('project-project-alpha')).toContainText('3m');

    // Project beta should show 2m
    await expect(page.getByTestId('project-project-beta')).toContainText('2m');
  });
});
