import { useState } from 'react'
import type { StatsQuery } from '@devtime/shared'
import { Header } from './components/Header'
import { PeriodSelector } from './components/PeriodSelector'
import { Footer } from './components/Footer'
import { Settings } from './components/Settings'
import { ActivityCard } from './features/dashboard/components/ActivityCard'
import { LanguageBreakdownCard } from './features/dashboard/components/LanguageBreakdownCard'
import { ProjectListCard } from './features/dashboard/components/ProjectListCard'
import { StatsGrid } from './features/dashboard/components/StatsGrid'
import { ToolBreakdownCard } from './features/dashboard/components/ToolBreakdownCard'
import { useDashboardViewModel } from './features/dashboard/hooks/useDashboardViewModel'
import { getStorageItem } from './lib/storage'

type Period = StatsQuery['range']

function App() {
  const [period, setPeriod] = useState<Period>('week')
  const [apiKey, setApiKey] = useState(() => getStorageItem('devtime_api_key', 'dt_dev_key'))
  const [showSettings, setShowSettings] = useState(false)

  const {
    loading,
    error,
    summary,
    activity,
    tools,
    languages,
    projects,
  } = useDashboardViewModel({ apiKey, range: period })

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
            <StatsGrid summary={summary} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <ActivityCard data={activity} />
              <ToolBreakdownCard data={tools} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <LanguageBreakdownCard data={languages} />
              <ProjectListCard data={projects} />
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
