import { formatDuration } from '@devtime/shared'
import { BreakdownList } from '../../../components/charts/BreakdownList'
import { Panel } from '../../../components/ui/Panel'
import type { LanguageDisplayData } from '../types'

interface LanguageBreakdownCardProps {
  data: LanguageDisplayData[]
}

export function LanguageBreakdownCard({ data }: LanguageBreakdownCardProps) {
  const items = data.map(lang => ({
    id: lang.name,
    label: lang.name,
    value: lang.seconds,
    color: lang.color,
    leading: (
      <div
        className="w-5 h-5 rounded flex items-center justify-center text-xs font-medium"
        style={{
          backgroundColor: lang.color,
          color: lang.name === 'Javascript' ? '#000' : '#fff',
        }}
      >
        {lang.name.substring(0, 2).toUpperCase()}
      </div>
    ),
  }))

  return (
    <Panel>
      <h3 className="text-base font-semibold mb-5">By Language</h3>
      <BreakdownList
        data={items}
        emptyLabel="No language data"
        formatValue={formatDuration}
        getItemTestId={(item) => `lang-${item.id.toLowerCase()}`}
        testId="by-language"
      />
    </Panel>
  )
}
