import { useState } from 'react'
import type { StatsQuery } from '@devtime/shared'
import { useStats } from './useStats'
import { Header } from './components/Header'
import { PeriodSelector } from './components/PeriodSelector'
import { StatsGrid } from './components/StatsGrid'
import { ActivityChart } from './components/ActivityChart'
import { ToolBreakdown } from './components/ToolBreakdown'
import { LanguageBreakdown } from './components/LanguageBreakdown'
import { ProjectList } from './components/ProjectList'
import { Footer } from './components/Footer'
import { Settings } from './components/Settings'
import {
  transformByDay,
  transformByTool,
  transformByLanguage,
  transformByProject,
  calculateDailyAverage,
} from './utils'

type Period = StatsQuery['range']

function App() {
  const [period, setPeriod] = useState<Period>('week')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('devtime_api_key') || 'dt_dev_key')
  const [showSettings, setShowSettings] = useState(false)

  const { data, loading, error } = useStats({ apiKey, range: period })

  const byDay = transformByDay(data?.by_day)
  const byTool = transformByTool(data?.by_tool)
  const byLanguage = transformByLanguage(data?.by_language)
  const byProject = transformByProject(data?.by_project)

  const totalSeconds = data?.total_seconds ?? 0
  const dailyAverage = calculateDailyAverage(totalSeconds, byDay.length)

  return (
    <div className="min-h-screen">
      <Header onSettingsClick={() => setShowSettings(true)} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <PeriodSelector period={period} onChange={setPeriod} />

        {loading && (
          <div className="text-center py-12 text-text-secondary">Loading stats...</div>
        )}

        {error && (
          <div className="text-center py-12 text-red-400">
            Failed to load stats: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <StatsGrid
              totalSeconds={totalSeconds}
              dailyAverage={dailyAverage}
              toolCount={byTool.length}
              projectCount={byProject.length}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <ActivityChart data={byDay} />
              <ToolBreakdown data={byTool} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <LanguageBreakdown data={byLanguage} />
              <ProjectList data={byProject} />
            </div>
          </>
        )}
      </main>

      <Footer />

      {showSettings && (
        <Settings
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App
