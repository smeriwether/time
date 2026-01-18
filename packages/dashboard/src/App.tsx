import { useState } from 'react'
import { formatDuration, type StatsQuery } from '@devtime/shared'
import { useStats } from './useStats'

type Period = StatsQuery['range']

// Tool colors for display
const TOOL_COLORS: Record<string, { color: string; icon: string; name: string }> = {
  'vscode': { color: '#007ACC', icon: 'VS', name: 'VS Code' },
  'claude-code': { color: '#D97757', icon: 'CC', name: 'Claude Code' },
  'zed': { color: '#F5A623', icon: 'Z', name: 'Zed' },
  'codex': { color: '#10a37f', icon: 'CX', name: 'Codex' },
}

// Language colors
const LANG_COLORS: Record<string, string> = {
  'typescript': '#3178c6',
  'python': '#3776ab',
  'rust': '#dea584',
  'go': '#00ADD8',
  'javascript': '#f7df1e',
  'java': '#b07219',
  'c': '#555555',
  'cpp': '#f34b7d',
  'csharp': '#178600',
  'ruby': '#701516',
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diff = Math.floor((today.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'

  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function App() {
  const [period, setPeriod] = useState<Period>('week')
  const [apiKey] = useState(() => localStorage.getItem('devtime_api_key') || 'dt_dev_key')

  const { data, loading, error } = useStats({ apiKey, range: period })

  // Transform API data for display
  const byDay = data?.by_day?.map(d => ({
    date: d.date,
    day: getDayLabel(d.date),
    seconds: d.seconds,
  })) ?? []

  const byTool = Object.entries(data?.by_tool ?? {}).map(([tool, seconds]) => ({
    tool,
    name: TOOL_COLORS[tool]?.name ?? tool,
    seconds,
    color: TOOL_COLORS[tool]?.color ?? '#666',
    icon: TOOL_COLORS[tool]?.icon ?? tool.charAt(0).toUpperCase(),
  })).sort((a, b) => b.seconds - a.seconds)

  const byLanguage = Object.entries(data?.by_language ?? {}).map(([lang, seconds]) => ({
    name: lang.charAt(0).toUpperCase() + lang.slice(1),
    seconds,
    color: LANG_COLORS[lang.toLowerCase()] ?? '#666',
  })).sort((a, b) => b.seconds - a.seconds).slice(0, 5)

  const byProject = Object.entries(data?.by_project ?? {}).map(([name, seconds]) => ({
    name,
    seconds,
  })).sort((a, b) => b.seconds - a.seconds).slice(0, 6)

  const maxDaySeconds = Math.max(...byDay.map(d => d.seconds), 1)
  const maxToolSeconds = Math.max(...byTool.map(t => t.seconds), 1)
  const maxLangSeconds = Math.max(...byLanguage.map(l => l.seconds), 1)

  const totalSeconds = data?.total_seconds ?? 0
  const dailyAverage = byDay.length > 0 ? Math.round(totalSeconds / byDay.length) : 0

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

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 text-text-secondary">Loading stats...</div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12 text-red-400">
            Failed to load stats: {error}
          </div>
        )}

        {/* Stats Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-bg-secondary border border-border rounded-xl p-5">
                <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">Total Time</div>
                <div className="text-3xl font-semibold" data-testid="total-time">
                  {formatDuration(totalSeconds)}
                </div>
              </div>
              <div className="bg-bg-secondary border border-border rounded-xl p-5">
                <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">Daily Average</div>
                <div className="text-3xl font-semibold" data-testid="daily-average">
                  {formatDuration(dailyAverage)}
                </div>
              </div>
              <div className="bg-bg-secondary border border-border rounded-xl p-5">
                <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">Tools Used</div>
                <div className="text-3xl font-semibold" data-testid="tools-count">
                  {byTool.length}
                </div>
              </div>
              <div className="bg-bg-secondary border border-border rounded-xl p-5">
                <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">Projects Active</div>
                <div className="text-3xl font-semibold" data-testid="projects-count">
                  {byProject.length}
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Activity Chart */}
              <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-xl p-6">
                <h3 className="text-base font-semibold mb-5">Activity</h3>
                <div className="flex items-end gap-2 h-48 pt-5" data-testid="activity-chart">
                  {byDay.length === 0 ? (
                    <div className="flex-1 text-center text-text-secondary">No activity data</div>
                  ) : (
                    byDay.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center h-full" data-testid={`day-${day.date}`}>
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
                    ))
                  )}
                </div>
              </div>

              {/* By Tool */}
              <div className="bg-bg-secondary border border-border rounded-xl p-6">
                <h3 className="text-base font-semibold mb-5">By Tool</h3>
                <div className="flex flex-col gap-4" data-testid="by-tool">
                  {byTool.length === 0 ? (
                    <div className="text-center text-text-secondary">No tool data</div>
                  ) : (
                    byTool.map((tool, i) => (
                      <div key={i} className="flex flex-col gap-2" data-testid={`tool-${tool.tool}`}>
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
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* By Language */}
              <div className="bg-bg-secondary border border-border rounded-xl p-6">
                <h3 className="text-base font-semibold mb-5">By Language</h3>
                <div className="flex flex-col gap-4" data-testid="by-language">
                  {byLanguage.length === 0 ? (
                    <div className="text-center text-text-secondary">No language data</div>
                  ) : (
                    byLanguage.map((lang, i) => (
                      <div key={i} className="flex flex-col gap-2" data-testid={`lang-${lang.name.toLowerCase()}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm">
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center text-xs font-medium"
                              style={{
                                backgroundColor: lang.color,
                                color: lang.name === 'Javascript' ? '#000' : '#fff'
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
                    ))
                  )}
                </div>
              </div>

              {/* Top Projects */}
              <div className="bg-bg-secondary border border-border rounded-xl p-6">
                <h3 className="text-base font-semibold mb-5">Top Projects</h3>
                <div className="flex flex-col gap-4" data-testid="by-project">
                  {byProject.length === 0 ? (
                    <div className="text-center text-text-secondary">No project data</div>
                  ) : (
                    byProject.map((project, i) => (
                      <div key={i} className="flex justify-between items-center" data-testid={`project-${project.name}`}>
                        <div className="flex items-center gap-2 text-sm">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                          {project.name}
                        </div>
                        <div className="text-sm font-medium text-accent-blue">{formatDuration(project.seconds)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
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
