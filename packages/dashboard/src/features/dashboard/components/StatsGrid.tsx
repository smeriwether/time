import { formatDuration } from '@devtime/shared'
import { StatCard } from '../../../components/ui/StatCard'
import type { DashboardSummary } from '../types'

interface StatsGridProps {
  summary: DashboardSummary
}

export function StatsGrid({ summary }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Total Time"
        value={formatDuration(summary.totalSeconds)}
        testId="total-time"
      />
      <StatCard
        label="Daily Average"
        value={formatDuration(summary.dailyAverage)}
        testId="daily-average"
      />
      <StatCard label="Tools Used" value={summary.toolCount} testId="tools-count" />
      <StatCard label="Projects Active" value={summary.projectCount} testId="projects-count" />
    </div>
  )
}
