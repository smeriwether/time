import { formatDuration } from '@devtime/shared'
import { BarChart } from '../../../components/charts/BarChart'
import { Panel } from '../../../components/ui/Panel'
import type { DayDisplayData } from '../types'

interface ActivityCardProps {
  data: DayDisplayData[]
}

export function ActivityCard({ data }: ActivityCardProps) {
  const items = data.map(day => ({
    id: day.date,
    label: day.day,
    value: day.seconds,
  }))

  return (
    <Panel className="lg:col-span-2">
      <h3 className="text-base font-semibold mb-5">Activity</h3>
      <BarChart
        data={items}
        emptyLabel="No activity data"
        testId="activity-chart"
        getItemTestId={(item) => `day-${item.id}`}
        renderTooltip={(item) => formatDuration(item.value)}
      />
    </Panel>
  )
}
