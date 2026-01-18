import { formatDuration } from '@devtime/shared'
import { getMaxSeconds } from '../utils'

interface DayData {
  date: string
  day: string
  seconds: number
}

interface ActivityChartProps {
  data: DayData[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const maxSeconds = getMaxSeconds(data)

  return (
    <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-xl p-6">
      <h3 className="text-base font-semibold mb-5">Activity</h3>
      <div className="flex gap-2 h-48" data-testid="activity-chart">
        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary">No activity data</div>
        ) : (
          data.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center" data-testid={`day-${day.date}`}>
              <div className="flex-1 flex items-end justify-center w-full">
                <div
                  className="w-full max-w-10 bar-gradient rounded-t hover:opacity-80 transition-opacity relative group"
                  style={{ height: `${(day.seconds / maxSeconds) * 100}%`, minHeight: day.seconds > 0 ? '4px' : '0' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-tertiary px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {formatDuration(day.seconds)}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-text-secondary">{day.day}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
