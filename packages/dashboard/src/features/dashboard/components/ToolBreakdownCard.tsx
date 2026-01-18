import { formatDuration } from '@devtime/shared'
import { BreakdownList } from '../../../components/charts/BreakdownList'
import { Panel } from '../../../components/ui/Panel'
import type { ToolDisplayData } from '../types'

interface ToolBreakdownCardProps {
  data: ToolDisplayData[]
}

export function ToolBreakdownCard({ data }: ToolBreakdownCardProps) {
  const items = data.map(tool => ({
    id: tool.tool,
    label: tool.name,
    value: tool.seconds,
    color: tool.color,
    leading: (
      <div
        className="w-5 h-5 rounded flex items-center justify-center text-xs text-white"
        style={{ backgroundColor: tool.color }}
      >
        {tool.icon}
      </div>
    ),
  }))

  return (
    <Panel>
      <h3 className="text-base font-semibold mb-5">By Tool</h3>
      <BreakdownList
        data={items}
        emptyLabel="No tool data"
        formatValue={formatDuration}
        getItemTestId={(item) => `tool-${item.id}`}
        testId="by-tool"
      />
    </Panel>
  )
}
