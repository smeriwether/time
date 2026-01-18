import { useState } from 'react'
import { formatDuration, type StatsQuery } from '@devtime/shared'

// Mock data for demonstration
const mockData = {
  totalSeconds: 127800, // 35.5 hours
  weeklyChange: 12, // +12%
  dailyAverage: 18257, // ~5 hours
  streak: 14, // days

  byDay: [
    { date: '2025-01-12', day: 'Sun', seconds: 10800 },
    { date: '2025-01-13', day: 'Mon', seconds: 25200 },
    { date: '2025-01-14', day: 'Tue', seconds: 28800 },
    { date: '2025-01-15', day: 'Wed', seconds: 21600 },
    { date: '2025-01-16', day: 'Thu', seconds: 18000 },
    { date: '2025-01-17', day: 'Fri', seconds: 14400 },
    { date: '2025-01-18', day: 'Today', seconds: 9000 },
  ],

  byTool: [
    { name: 'VS Code', seconds: 72000, color: '#007ACC', icon: 'VS' },
    { name: 'Claude Code', seconds: 36000, color: '#D97757', icon: 'CC' },
    { name: 'Zed', seconds: 14400, color: '#F5A623', icon: 'Z' },
    { name: 'Codex', seconds: 5400, color: '#10a37f', icon: 'CX' },
  ],

  byLanguage: [
    { name: 'TypeScript', seconds: 54000, color: '#3178c6' },
    { name: 'Python', seconds: 28800, color: '#3776ab' },
    { name: 'Rust', seconds: 21600, color: '#dea584' },
    { name: 'Go', seconds: 14400, color: '#00ADD8' },
    { name: 'JavaScript', seconds: 9000, color: '#f7df1e' },
  ],

  byProject: [
    { name: 'devtime', seconds: 43200, languages: ['TypeScript', 'CSS'], lastActive: '2 hours ago' },
    { name: 'api-server', seconds: 28800, languages: ['Rust', 'SQL'], lastActive: '1 day ago' },
    { name: 'ml-pipeline', seconds: 25200, languages: ['Python'], lastActive: '3 hours ago' },
    { name: 'docs-site', seconds: 18000, languages: ['TypeScript', 'MDX'], lastActive: '5 hours ago' },
    { name: 'cli-tools', seconds: 12600, languages: ['Go'], lastActive: '2 days ago' },
  ],

  recentActivity: [
    { time: '2:30 PM', tool: 'VS Code', project: 'devtime', file: 'App.tsx', duration: 1800, color: '#007ACC' },
    { time: '1:00 PM', tool: 'Claude Code', project: 'devtime', file: 'extension.ts', duration: 2700, color: '#D97757' },
    { time: '11:30 AM', tool: 'VS Code', project: 'api-server', file: 'main.rs', duration: 3600, color: '#007ACC' },
    { time: '10:00 AM', tool: 'Zed', project: 'ml-pipeline', file: 'train.py', duration: 2400, color: '#F5A623' },
  ],
}

type Period = StatsQuery['range']

function App() {
  const [period, setPeriod] = useState<Period>('week')

  const maxDaySeconds = Math.max(...mockData.byDay.map(d => d.seconds))
  const maxToolSeconds = Math.max(...mockData.byTool.map(t => t.seconds))
  const maxLangSeconds = Math.max(...mockData.byLanguage.map(l => l.seconds))

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 logo-gradient rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span className="text-xl font-semibold">DevTime</span>
        </div>
        <nav className="flex gap-6">
          <a href="#" className="text-sm text-text-primary hover:text-text-primary transition-colors">Dashboard</a>
          <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Projects</a>
          <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Goals</a>
          <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Settings</a>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {(['today', 'week', 'month', 'year'] as Period[]).map(p => (
            <button
              key={p}
              className={`px-4 py-2 rounded-md text-sm transition-all ${
                period === p
                  ? 'bg-accent-blue text-white border border-accent-blue'
                  : 'bg-bg-secondary text-text-secondary border border-border hover:border-text-secondary'
              }`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-bg-secondary border border-border rounded-xl p-5">
            <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">Total Time</div>
            <div className="text-3xl font-semibold">{formatDuration(mockData.totalSeconds)}</div>
            <div className="text-xs text-accent-green mt-1">+{mockData.weeklyChange}% from last week</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-5">
            <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">Daily Average</div>
            <div className="text-3xl font-semibold">{formatDuration(mockData.dailyAverage)}</div>
            <div className="text-xs text-accent-green mt-1">+8% from last week</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-5">
            <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">Current Streak</div>
            <div className="text-3xl font-semibold">{mockData.streak} days</div>
            <div className="text-xs text-accent-green mt-1">Personal best!</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-5">
            <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">Projects Active</div>
            <div className="text-3xl font-semibold">{mockData.byProject.length}</div>
            <div className="text-xs text-accent-green mt-1">2 new this week</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-xl p-6">
            <h3 className="text-base font-semibold mb-5">Activity This Week</h3>
            <div className="flex items-end gap-2 h-48 pt-5">
              {mockData.byDay.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full">
                  <div
                    className="w-full max-w-10 bar-gradient rounded-t hover:opacity-80 transition-opacity relative group"
                    style={{ height: `${(day.seconds / maxDaySeconds) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-tertiary px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {formatDuration(day.seconds)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-text-secondary">{day.day}</div>
                </div>
              ))}
            </div>
          </div>

          {/* By Tool */}
          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <h3 className="text-base font-semibold mb-5">By Tool</h3>
            <div className="flex flex-col gap-4">
              {mockData.byTool.map((tool, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-xs text-white"
                        style={{ backgroundColor: tool.color }}
                      >
                        {tool.icon}
                      </div>
                      {tool.name}
                    </div>
                    <div className="text-sm text-text-secondary">{formatDuration(tool.seconds)}</div>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-300"
                      style={{
                        width: `${(tool.seconds / maxToolSeconds) * 100}%`,
                        backgroundColor: tool.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* By Language */}
          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <h3 className="text-base font-semibold mb-5">By Language</h3>
            <div className="flex flex-col gap-4">
              {mockData.byLanguage.map((lang, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-xs font-medium"
                        style={{
                          backgroundColor: lang.color,
                          color: lang.name === 'JavaScript' ? '#000' : '#fff'
                        }}
                      >
                        {lang.name.substring(0, 2).toUpperCase()}
                      </div>
                      {lang.name}
                    </div>
                    <div className="text-sm text-text-secondary">{formatDuration(lang.seconds)}</div>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-300"
                      style={{
                        width: `${(lang.seconds / maxLangSeconds) * 100}%`,
                        backgroundColor: lang.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <h3 className="text-base font-semibold mb-5">Recent Activity</h3>
            <div className="flex flex-col">
              {mockData.recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 py-4 ${
                    i !== mockData.recentActivity.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="text-xs text-text-secondary min-w-[60px]">{activity.time}</div>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white"
                    style={{ backgroundColor: activity.color }}
                  >
                    {activity.tool === 'VS Code' ? 'VS' : activity.tool === 'Claude Code' ? 'CC' : activity.tool.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.file}</div>
                    <div className="text-xs text-text-secondary">{activity.project}</div>
                  </div>
                  <div className="text-sm font-medium text-accent-green">{formatDuration(activity.duration)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Projects */}
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <h3 className="text-base font-semibold mb-5">Top Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockData.byProject.map((project, i) => (
              <div key={i} className="bg-bg-primary border border-border rounded-xl p-5 flex flex-col gap-3">
                <div className="text-base font-semibold flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  {project.name}
                </div>
                <div className="text-2xl font-semibold text-accent-blue">{formatDuration(project.seconds)}</div>
                <div className="flex gap-4 text-xs text-text-secondary">
                  <span>{project.languages.join(', ')}</span>
                  <span>Last active: {project.lastActive}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-text-secondary">
        <p>
          DevTime is open source.{' '}
          <a href="https://github.com/devtime/devtime" className="text-accent-blue hover:underline">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
