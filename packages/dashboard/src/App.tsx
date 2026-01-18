import { useState } from 'react'

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

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

type Period = 'today' | 'week' | 'month' | 'year'

function App() {
  const [period, setPeriod] = useState<Period>('week')

  const maxDaySeconds = Math.max(...mockData.byDay.map(d => d.seconds))
  const maxToolSeconds = Math.max(...mockData.byTool.map(t => t.seconds))
  const maxLangSeconds = Math.max(...mockData.byLanguage.map(l => l.seconds))

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span>DevTime</span>
        </div>
        <nav className="nav">
          <a href="#" className="nav-link active">Dashboard</a>
          <a href="#" className="nav-link">Projects</a>
          <a href="#" className="nav-link">Goals</a>
          <a href="#" className="nav-link">Settings</a>
        </nav>
      </header>

      <main className="main">
        <div className="period-selector">
          {(['today', 'week', 'month', 'year'] as Period[]).map(p => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Time</div>
            <div className="stat-value">{formatDuration(mockData.totalSeconds)}</div>
            <div className="stat-change">+{mockData.weeklyChange}% from last week</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Daily Average</div>
            <div className="stat-value">{formatDuration(mockData.dailyAverage)}</div>
            <div className="stat-change">+8% from last week</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Current Streak</div>
            <div className="stat-value">{mockData.streak} days</div>
            <div className="stat-change">Personal best!</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Projects Active</div>
            <div className="stat-value">{mockData.byProject.length}</div>
            <div className="stat-change">2 new this week</div>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-title">Activity This Week</div>
            <div className="bar-chart">
              {mockData.byDay.map((day, i) => (
                <div key={i} className="bar-container">
                  <div
                    className="bar"
                    style={{ height: `${(day.seconds / maxDaySeconds) * 100}%` }}
                  >
                    <div className="bar-tooltip">{formatDuration(day.seconds)}</div>
                  </div>
                  <div className="bar-label">{day.day}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">By Tool</div>
            <div className="breakdown-list">
              {mockData.byTool.map((tool, i) => (
                <div key={i} className="breakdown-item">
                  <div className="breakdown-header">
                    <div className="breakdown-name">
                      <div className="breakdown-icon" style={{ backgroundColor: tool.color }}>
                        {tool.icon}
                      </div>
                      {tool.name}
                    </div>
                    <div className="breakdown-value">{formatDuration(tool.seconds)}</div>
                  </div>
                  <div className="breakdown-bar-bg">
                    <div
                      className="breakdown-bar-fill"
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

        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-title">By Language</div>
            <div className="breakdown-list">
              {mockData.byLanguage.map((lang, i) => (
                <div key={i} className="breakdown-item">
                  <div className="breakdown-header">
                    <div className="breakdown-name">
                      <div className="breakdown-icon" style={{ backgroundColor: lang.color }}>
                        {lang.name.substring(0, 2).toUpperCase()}
                      </div>
                      {lang.name}
                    </div>
                    <div className="breakdown-value">{formatDuration(lang.seconds)}</div>
                  </div>
                  <div className="breakdown-bar-bg">
                    <div
                      className="breakdown-bar-fill"
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

          <div className="chart-card">
            <div className="chart-title">Recent Activity</div>
            <div className="activity-list">
              {mockData.recentActivity.map((activity, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-time">{activity.time}</div>
                  <div className="activity-icon" style={{ backgroundColor: activity.color }}>
                    {activity.tool === 'VS Code' ? 'VS' : activity.tool === 'Claude Code' ? 'CC' : activity.tool.charAt(0)}
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">{activity.file}</div>
                    <div className="activity-subtitle">{activity.project}</div>
                  </div>
                  <div className="activity-duration">{formatDuration(activity.duration)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Top Projects</div>
          <div className="projects-grid">
            {mockData.byProject.map((project, i) => (
              <div key={i} className="project-card">
                <div className="project-name">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  {project.name}
                </div>
                <div className="project-time">{formatDuration(project.seconds)}</div>
                <div className="project-meta">
                  <span>{project.languages.join(', ')}</span>
                  <span>Last active: {project.lastActive}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>
          DevTime is open source. <a href="https://github.com/devtime/devtime">View on GitHub</a>
        </p>
      </footer>
    </div>
  )
}

export default App
