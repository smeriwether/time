import type { ReactNode } from 'react'
import { getMaxValue } from './utils'

export interface BarChartDatum {
  id: string
  label: string
  value: number
}

interface BarChartProps {
  data: BarChartDatum[]
  emptyLabel?: string
  testId?: string
  barClassName?: string
  heightClassName?: string
  minBarHeightPx?: number
  getItemTestId?: (datum: BarChartDatum) => string
  renderTooltip?: (datum: BarChartDatum) => ReactNode
}

export function BarChart({
  data,
  emptyLabel = 'No data',
  testId,
  barClassName = 'bar-gradient',
  heightClassName = 'h-48',
  minBarHeightPx = 4,
  getItemTestId,
  renderTooltip,
}: BarChartProps) {
  const maxValue = getMaxValue(data, item => item.value)
  const barClasses = ['w-full max-w-10 rounded-t hover:opacity-80 transition-opacity relative group', barClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`flex gap-2 ${heightClassName}`} data-testid={testId}>
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-secondary">{emptyLabel}</div>
      ) : (
        data.map((item) => (
          <div
            key={item.id}
            className="flex-1 flex flex-col items-center"
            data-testid={getItemTestId?.(item)}
          >
            <div className="flex-1 flex items-end justify-center w-full">
              <div
                className={barClasses}
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  minHeight: item.value > 0 ? `${minBarHeightPx}px` : '0',
                }}
              >
                {renderTooltip && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-tertiary px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {renderTooltip(item)}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-text-secondary">{item.label}</div>
          </div>
        ))
      )}
    </div>
  )
}
