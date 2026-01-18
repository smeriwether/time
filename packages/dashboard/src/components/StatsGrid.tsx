import { formatDuration } from '@devtime/shared'

interface StatsGridProps {
  totalSeconds: number
  dailyAverage: number
  toolCount: number
  projectCount: number
}

export function StatsGrid({ totalSeconds, dailyAverage, toolCount, projectCount }: StatsGridProps) {
  return (
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
          {toolCount}
        </div>
      </div>
      <div className="bg-bg-secondary border border-border rounded-xl p-5">
        <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">Projects Active</div>
        <div className="text-3xl font-semibold" data-testid="projects-count">
          {projectCount}
        </div>
      </div>
    </div>
  )
}
