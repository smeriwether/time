import type { ReactNode } from 'react'
import { Panel } from './Panel'

interface StatCardProps {
  label: string
  value: ReactNode
  testId?: string
}

export function StatCard({ label, value, testId }: StatCardProps) {
  return (
    <Panel padding="sm">
      <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">{label}</div>
      <div className="text-3xl font-semibold" data-testid={testId}>
        {value}
      </div>
    </Panel>
  )
}
