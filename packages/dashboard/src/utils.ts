import type { StatsResponse } from '@devtime/shared'

const STORAGE_VERSION = 'v1'

export function getStorageItem(key: string, defaultValue: string): string {
  try {
    return localStorage.getItem(`${key}:${STORAGE_VERSION}`) ?? defaultValue
  } catch {
    return defaultValue
  }
}

export function setStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(`${key}:${STORAGE_VERSION}`, value)
  } catch {
    // Silently fail - storage may be unavailable in incognito mode
  }
}

export const TOOL_COLORS: Record<string, { color: string; icon: string; name: string }> = {
  'vscode': { color: '#007ACC', icon: 'VS', name: 'VS Code' },
  'claude-code': { color: '#D97757', icon: 'CC', name: 'Claude Code' },
  'zed': { color: '#F5A623', icon: 'Z', name: 'Zed' },
  'codex': { color: '#10a37f', icon: 'CX', name: 'Codex' },
}

export const LANG_COLORS: Record<string, string> = {
  'typescript': '#3178c6',
  'python': '#3776ab',
  'rust': '#dea584',
  'go': '#00ADD8',
  'javascript': '#f7df1e',
  'java': '#b07219',
  'c': '#555555',
  'cpp': '#f34b7d',
  'csharp': '#178600',
  'ruby': '#701516',
}

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

export interface DayDisplayData {
  date: string
  day: string
  seconds: number
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

export interface ToolDisplayData {
  tool: string
  name: string
  seconds: number
  color: string
  icon: string
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

export interface LanguageDisplayData {
  name: string
  seconds: number
  color: string
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

export interface ProjectDisplayData {
  name: string
  seconds: number
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

export function getMaxSeconds<T extends { seconds: number }>(items: T[], defaultValue = 1): number {
  if (items.length === 0) return defaultValue
  let max = items[0].seconds
  for (let i = 1; i < items.length; i++) {
    if (items[i].seconds > max) {
      max = items[i].seconds
    }
  }
  return max || defaultValue
}
