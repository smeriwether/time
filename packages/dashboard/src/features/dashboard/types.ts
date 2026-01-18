export interface DayDisplayData {
  date: string
  day: string
  seconds: number
}

export interface ToolDisplayData {
  tool: string
  name: string
  seconds: number
  color: string
  icon: string
}

export interface LanguageDisplayData {
  name: string
  seconds: number
  color: string
}

export interface ProjectDisplayData {
  name: string
  seconds: number
}

export interface DashboardSummary {
  totalSeconds: number
  dailyAverage: number
  toolCount: number
  projectCount: number
}
