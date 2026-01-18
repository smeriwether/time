import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

interface Heartbeat {
  tool: string;
  timestamp: number;
  activity_type: 'coding' | 'debugging' | 'browsing';
  project?: string;
  file?: string;
  language?: string;
  branch?: string;
  machine_id?: string;
  is_write?: boolean;
  lines?: number;
  cursor_line?: number;
}

class DevTimeTracker {
  private statusBarItem: vscode.StatusBarItem;
  private heartbeatQueue: Heartbeat[] = [];
  private lastHeartbeat: number = 0;
  private lastFile: string = '';
  private debounceTimer: NodeJS.Timeout | undefined;
  private sendTimer: NodeJS.Timeout | undefined;
  private todaySeconds: number = 0;
  private isTracking: boolean = true;
  private machineId: string;
  private isDebugging: boolean = false;

  private readonly DEBOUNCE_MS = 50;
  private readonly MIN_HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds minimum between heartbeats for same file

  constructor(private context: vscode.ExtensionContext) {
    this.machineId = this.getMachineId();
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'devtime.showStatus';
    this.statusBarItem.show();
    this.updateStatusBar();

    // Load today's time from storage
    this.loadTodayTime();

    // Start send timer
    this.startSendTimer();
  }

  private getMachineId(): string {
    const stored = this.context.globalState.get<string>('machineId');
    if (stored) return stored;

    const id = crypto.createHash('sha256')
      .update(os.hostname() + os.userInfo().username)
      .digest('hex')
      .substring(0, 16);

    this.context.globalState.update('machineId', id);
    return id;
  }

  private loadTodayTime(): void {
    const today = new Date().toISOString().split('T')[0];
    const stored = this.context.globalState.get<{ date: string; seconds: number }>('todayTime');

    if (stored && stored.date === today) {
      this.todaySeconds = stored.seconds;
    } else {
      this.todaySeconds = 0;
    }
  }

  private saveTodayTime(): void {
    const today = new Date().toISOString().split('T')[0];
    this.context.globalState.update('todayTime', { date: today, seconds: this.todaySeconds });
  }

  private updateStatusBar(): void {
    const hours = Math.floor(this.todaySeconds / 3600);
    const minutes = Math.floor((this.todaySeconds % 3600) / 60);

    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    const icon = this.isTracking ? '$(clock)' : '$(debug-pause)';

    this.statusBarItem.text = `${icon} ${timeStr}`;
    this.statusBarItem.tooltip = this.isTracking
      ? `DevTime: ${timeStr} today (click for details)`
      : 'DevTime: Tracking paused';
  }

  private getConfig() {
    return vscode.workspace.getConfiguration('devtime');
  }

  private isEnabled(): boolean {
    return this.getConfig().get<boolean>('enabled', true) && this.isTracking;
  }

  private getProjectName(uri: vscode.Uri): string | undefined {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
      return path.basename(workspaceFolder.uri.fsPath);
    }
    return undefined;
  }

  private getLanguage(document: vscode.TextDocument): string {
    return document.languageId;
  }

  private shouldExcludeProject(project: string | undefined): boolean {
    if (!project) return false;
    const excludeProjects = this.getConfig().get<string[]>('excludeProjects', []);
    return excludeProjects.includes(project);
  }

  private shouldExcludeFile(filePath: string): boolean {
    const excludePatterns = ['.env', '.secret', '.key', 'credentials'];
    const fileName = path.basename(filePath).toLowerCase();
    return excludePatterns.some(pattern => fileName.includes(pattern));
  }

  public onActivity(document: vscode.TextDocument, isWrite: boolean = false): void {
    if (!this.isEnabled()) return;
    if (document.uri.scheme !== 'file') return;

    const filePath = document.uri.fsPath;
    const project = this.getProjectName(document.uri);

    if (this.shouldExcludeProject(project)) return;
    if (this.shouldExcludeFile(filePath)) return;

    // Debounce rapid events
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.recordHeartbeat(document, isWrite);
    }, this.DEBOUNCE_MS);
  }

  private recordHeartbeat(document: vscode.TextDocument, isWrite: boolean): void {
    const now = Date.now();
    const filePath = document.uri.fsPath;

    // Don't send heartbeat if same file and within minimum interval (unless it's a write)
    if (!isWrite && filePath === this.lastFile && now - this.lastHeartbeat < this.MIN_HEARTBEAT_INTERVAL_MS) {
      return;
    }

    const project = this.getProjectName(document.uri);
    const editor = vscode.window.activeTextEditor;

    const heartbeat: Heartbeat = {
      tool: 'vscode',
      timestamp: now,
      activity_type: this.isDebugging ? 'debugging' : 'coding',
      project,
      file: path.basename(filePath),
      language: this.getLanguage(document),
      machine_id: this.machineId,
      is_write: isWrite,
      lines: document.lineCount,
      cursor_line: editor?.selection.active.line,
    };

    this.heartbeatQueue.push(heartbeat);
    this.lastHeartbeat = now;
    this.lastFile = filePath;

    // Update local time tracking (estimate ~2 minutes per heartbeat)
    if (this.heartbeatQueue.length === 1 || now - this.lastHeartbeat > 60000) {
      this.todaySeconds += 120;
      this.saveTodayTime();
      this.updateStatusBar();
    }
  }

  private startSendTimer(): void {
    const interval = Math.max(30, this.getConfig().get<number>('heartbeatInterval', 120)) * 1000;

    this.sendTimer = setInterval(() => {
      this.sendHeartbeats();
    }, interval);
  }

  private async sendHeartbeats(): Promise<void> {
    if (this.heartbeatQueue.length === 0) return;

    const apiEndpoint = this.getConfig().get<string>('apiEndpoint', '');
    const apiKey = this.getConfig().get<string>('apiKey', '');

    if (!apiEndpoint || !apiKey) {
      // No API configured, just clear the queue (local tracking only)
      this.heartbeatQueue = [];
      return;
    }

    const heartbeats = [...this.heartbeatQueue];
    this.heartbeatQueue = [];

    try {
      const response = await fetch(`${apiEndpoint}/api/heartbeat/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ heartbeats }),
      });

      if (!response.ok) {
        // Re-queue on failure
        this.heartbeatQueue = [...heartbeats, ...this.heartbeatQueue];
        console.error('DevTime: Failed to send heartbeats', response.status);
      }
    } catch (error) {
      // Re-queue on error
      this.heartbeatQueue = [...heartbeats, ...this.heartbeatQueue];
      console.error('DevTime: Error sending heartbeats', error);
    }
  }

  public onDebugStart(): void {
    this.isDebugging = true;
  }

  public onDebugEnd(): void {
    this.isDebugging = false;
  }

  public toggleTracking(): void {
    this.isTracking = !this.isTracking;
    this.updateStatusBar();
    vscode.window.showInformationMessage(
      `DevTime: Tracking ${this.isTracking ? 'enabled' : 'paused'}`
    );
  }

  public showStatus(): void {
    const hours = Math.floor(this.todaySeconds / 3600);
    const minutes = Math.floor((this.todaySeconds % 3600) / 60);

    const timeStr = hours > 0
      ? `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
      : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

    vscode.window.showInformationMessage(
      `DevTime: You've coded for ${timeStr} today`,
      'Open Dashboard'
    ).then(selection => {
      if (selection === 'Open Dashboard') {
        this.openDashboard();
      }
    });
  }

  public openDashboard(): void {
    const apiEndpoint = this.getConfig().get<string>('apiEndpoint', 'https://devtime.dev');
    const dashboardUrl = apiEndpoint.replace('/api', '').replace('api.', '');
    vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
  }

  public dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.sendTimer) clearInterval(this.sendTimer);
    this.sendHeartbeats(); // Send any remaining heartbeats
    this.statusBarItem.dispose();
  }
}

let tracker: DevTimeTracker | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('DevTime: Extension activated');

  tracker = new DevTimeTracker(context);

  // Register event listeners
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length > 0) {
        tracker?.onActivity(e.document, true);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      tracker?.onActivity(document, false);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      tracker?.onActivity(document, true);
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        tracker?.onActivity(editor.document, false);
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((e) => {
      tracker?.onActivity(e.textEditor.document, false);
    })
  );

  // Debug session tracking
  context.subscriptions.push(
    vscode.debug.onDidStartDebugSession(() => {
      tracker?.onDebugStart();
    })
  );

  context.subscriptions.push(
    vscode.debug.onDidTerminateDebugSession(() => {
      tracker?.onDebugEnd();
    })
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('devtime.showStatus', () => {
      tracker?.showStatus();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('devtime.openDashboard', () => {
      tracker?.openDashboard();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('devtime.toggleTracking', () => {
      tracker?.toggleTracking();
    })
  );
}

export function deactivate() {
  tracker?.dispose();
  tracker = undefined;
}
