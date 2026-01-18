import { formatDuration } from '@devtime/shared'

interface LanguageData {
  name: string
  seconds: number
  color: string
}

interface LanguageBreakdownProps {
  data: LanguageData[]
}

export function LanguageBreakdown({ data }: LanguageBreakdownProps) {
  const maxSeconds = Math.max(...data.map(l => l.seconds), 1)

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-6">
      <h3 className="text-base font-semibold mb-5">By Language</h3>
      <div className="flex flex-col gap-4" data-testid="by-language">
        {data.length === 0 ? (
          <div className="text-center text-text-secondary">No language data</div>
        ) : (
          data.map((lang, i) => (
            <div key={i} className="flex flex-col gap-2" data-testid={`lang-${lang.name.toLowerCase()}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-medium"
                    style={{
                      backgroundColor: lang.color,
                      color: lang.name === 'Javascript' ? '#000' : '#fff'
                    }}
                  >
                    {lang.name.substring(0, 2).toUpperCase()}
                  </div>
                  {lang.name}
                </div>
                <div className="text-sm text-text-secondary">{formatDuration(lang.seconds)}</div>
              </div>
              <div className="h-2 bg-bg-tertiary rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-300"
                  style={{
                    width: `${(lang.seconds / maxSeconds) * 100}%`,
                    backgroundColor: lang.color,
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
