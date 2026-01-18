import type { StatsResponse } from '@devtime/shared'
import { LANG_COLORS, TOOL_COLORS } from './constants'
import type {
  DayDisplayData,
  ToolDisplayData,
  LanguageDisplayData,
  ProjectDisplayData,
} from './types'

export function getDayLabel(dateStr: string, today: Date = new Date()): string {
  // Parse YYYY-MM-DD as local date (not UTC)
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)

  const dateStart = new Date(date)
  dateStart.setHours(0, 0, 0, 0)

  const diff = Math.floor((todayStart.getTime() - dateStart.getTime()) / (24 * 60 * 60 * 1000))

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'

  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export function transformByDay(
  byDay: StatsResponse['by_day'] | undefined,
  today: Date = new Date()
): DayDisplayData[] {
  return byDay?.map(d => ({
    date: d.date,
    day: getDayLabel(d.date, today),
    seconds: d.seconds,
  })) ?? []
}

export function transformByTool(
  byTool: StatsResponse['by_tool'] | undefined
): ToolDisplayData[] {
  return Object.entries(byTool ?? {})
    .map(([tool, seconds]) => ({
      tool,
      name: TOOL_COLORS[tool]?.name ?? tool,
      seconds,
      color: TOOL_COLORS[tool]?.color ?? '#666',
      icon: TOOL_COLORS[tool]?.icon ?? tool.charAt(0).toUpperCase(),
    }))
    .toSorted((a, b) => b.seconds - a.seconds)
}

export function transformByLanguage(
  byLanguage: StatsResponse['by_language'] | undefined,
  limit: number = 5
): LanguageDisplayData[] {
  return Object.entries(byLanguage ?? {})
    .map(([lang, seconds]) => ({
      name: lang.charAt(0).toUpperCase() + lang.slice(1),
      seconds,
      color: LANG_COLORS[lang.toLowerCase()] ?? '#666',
    }))
    .toSorted((a, b) => b.seconds - a.seconds)
    .slice(0, limit)
}

export function transformByProject(
  byProject: StatsResponse['by_project'] | undefined,
  limit: number = 6
): ProjectDisplayData[] {
  return Object.entries(byProject ?? {})
    .map(([name, seconds]) => ({
      name,
      seconds,
    }))
    .toSorted((a, b) => b.seconds - a.seconds)
    .slice(0, limit)
}

export function calculateDailyAverage(totalSeconds: number, dayCount: number): number {
  return dayCount > 0 ? Math.round(totalSeconds / dayCount) : 0
}
