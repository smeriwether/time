import type { StatsQuery } from '@devtime/shared'

type Period = StatsQuery['range']

interface PeriodSelectorProps {
  period: Period
  onChange: (period: Period) => void
}

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  const periods: Period[] = ['today', 'week']

  return (
    <div className="flex gap-2 mb-6">
      {periods.map(p => (
        <button
          key={p}
          className={`px-4 py-2 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary ${
            period === p
              ? 'bg-accent-blue text-white border border-accent-blue'
              : 'bg-bg-secondary text-text-secondary border border-border hover:border-text-secondary'
          }`}
          onClick={() => onChange(p)}
        >
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  )
}
