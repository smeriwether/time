import type { ReactNode } from 'react'
import { getMaxValue } from './utils'

export interface BreakdownItem {
  id: string
  label: ReactNode
  value: number
  color?: string
  leading?: ReactNode
}

interface BreakdownListProps {
  data: BreakdownItem[]
  emptyLabel?: string
  formatValue?: (value: number) => ReactNode
  getItemTestId?: (item: BreakdownItem) => string
  testId?: string
  valueClassName?: string
}

export function BreakdownList({
  data,
  emptyLabel = 'No data',
  formatValue,
  getItemTestId,
  testId,
  valueClassName = 'text-sm text-text-secondary',
}: BreakdownListProps) {
  const maxValue = getMaxValue(data, item => item.value)

  return (
    <div className="flex flex-col gap-4" data-testid={testId}>
      {data.length === 0 ? (
        <div className="text-center text-text-secondary">{emptyLabel}</div>
      ) : (
        data.map((item) => (
          <div key={item.id} className="flex flex-col gap-2" data-testid={getItemTestId?.(item)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm">
                {item.leading}
                {item.label}
              </div>
              <div className={valueClassName}>
                {formatValue ? formatValue(item.value) : item.value}
              </div>
            </div>
            <div className="h-2 bg-bg-tertiary rounded overflow-hidden">
              <div
                className="h-full rounded transition-[width] duration-300"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color ?? '#666',
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  )
}
