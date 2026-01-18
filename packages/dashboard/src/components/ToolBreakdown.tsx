import { formatDuration } from '@devtime/shared'

interface ToolData {
  tool: string
  name: string
  seconds: number
  color: string
  icon: string
}

interface ToolBreakdownProps {
  data: ToolData[]
}

export function ToolBreakdown({ data }: ToolBreakdownProps) {
  const maxSeconds = Math.max(...data.map(t => t.seconds), 1)

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-6">
      <h3 className="text-base font-semibold mb-5">By Tool</h3>
      <div className="flex flex-col gap-4" data-testid="by-tool">
        {data.length === 0 ? (
          <div className="text-center text-text-secondary">No tool data</div>
        ) : (
          data.map((tool, i) => (
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
                    width: `${(tool.seconds / maxSeconds) * 100}%`,
                    backgroundColor: tool.color,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
