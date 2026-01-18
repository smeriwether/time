import { useMemo } from 'react'
import type { StatsQuery } from '@devtime/shared'
import { useStats } from '../../../useStats'
import {
  calculateDailyAverage,
  transformByDay,
  transformByLanguage,
  transformByProject,
  transformByTool,
} from '../transformers'
import type { DashboardSummary, DayDisplayData, LanguageDisplayData, ProjectDisplayData, ToolDisplayData } from '../types'

interface UseDashboardViewModelOptions {
  apiKey: string
  range: StatsQuery['range']
}

interface DashboardViewModel {
  loading: boolean
  error: string | null
  summary: DashboardSummary
  activity: DayDisplayData[]
  tools: ToolDisplayData[]
  languages: LanguageDisplayData[]
  projects: ProjectDisplayData[]
}

export function useDashboardViewModel({ apiKey, range }: UseDashboardViewModelOptions): DashboardViewModel {
  const { data, loading, error } = useStats({ apiKey, range })

  const activity = useMemo(() => transformByDay(data?.by_day), [data?.by_day])
  const tools = useMemo(() => transformByTool(data?.by_tool), [data?.by_tool])
  const languages = useMemo(() => transformByLanguage(data?.by_language), [data?.by_language])
  const projects = useMemo(() => transformByProject(data?.by_project), [data?.by_project])

  const totalSeconds = data?.total_seconds ?? 0
  const dailyAverage = useMemo(
    () => calculateDailyAverage(totalSeconds, activity.length),
    [totalSeconds, activity.length]
  )

  return {
    loading,
    error,
    summary: {
      totalSeconds,
      dailyAverage,
      toolCount: tools.length,
      projectCount: projects.length,
    },
    activity,
    tools,
    languages,
    projects,
  }
}
