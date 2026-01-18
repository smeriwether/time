import { describe, it, expect } from 'vitest'
import {
  getDayLabel,
  transformByDay,
  transformByTool,
  transformByLanguage,
  transformByProject,
  calculateDailyAverage,
  TOOL_COLORS,
  LANG_COLORS,
} from './utils'

describe('getDayLabel', () => {
  it('returns "Today" for today\'s date', () => {
    const today = new Date(2024, 0, 15) // Jan 15, 2024 local time
    expect(getDayLabel('2024-01-15', today)).toBe('Today')
  })

  it('returns "Yesterday" for yesterday\'s date', () => {
    const today = new Date(2024, 0, 15)
    expect(getDayLabel('2024-01-14', today)).toBe('Yesterday')
  })

  it('returns weekday name for older dates', () => {
    const today = new Date(2024, 0, 15) // Monday
    expect(getDayLabel('2024-01-13', today)).toBe('Sat')
    expect(getDayLabel('2024-01-12', today)).toBe('Fri')
  })
})

describe('transformByDay', () => {
  const today = new Date(2024, 0, 15) // Jan 15, 2024 local time

  it('returns empty array for undefined input', () => {
    expect(transformByDay(undefined, today)).toEqual([])
  })

  it('transforms day data with labels', () => {
    const input = [
      { date: '2024-01-15', seconds: 3600 },
      { date: '2024-01-14', seconds: 1800 },
    ]
    const result = transformByDay(input, today)

    expect(result).toEqual([
      { date: '2024-01-15', day: 'Today', seconds: 3600 },
      { date: '2024-01-14', day: 'Yesterday', seconds: 1800 },
    ])
  })

  it('preserves order from input', () => {
    const input = [
      { date: '2024-01-13', seconds: 100 },
      { date: '2024-01-15', seconds: 200 },
      { date: '2024-01-14', seconds: 300 },
    ]
    const result = transformByDay(input, today)

    expect(result.map(d => d.date)).toEqual(['2024-01-13', '2024-01-15', '2024-01-14'])
  })
})

describe('transformByTool', () => {
  it('returns empty array for undefined input', () => {
    expect(transformByTool(undefined)).toEqual([])
  })

  it('transforms known tools with correct colors and names', () => {
    const input = { vscode: 3600, 'claude-code': 1800 }
    const result = transformByTool(input)

    expect(result).toContainEqual({
      tool: 'vscode',
      name: 'VS Code',
      seconds: 3600,
      color: '#007ACC',
      icon: 'VS',
    })
    expect(result).toContainEqual({
      tool: 'claude-code',
      name: 'Claude Code',
      seconds: 1800,
      color: '#D97757',
      icon: 'CC',
    })
  })

  it('uses fallback values for unknown tools', () => {
    const input = { 'unknown-tool': 500 }
    const result = transformByTool(input)

    expect(result[0]).toEqual({
      tool: 'unknown-tool',
      name: 'unknown-tool',
      seconds: 500,
      color: '#666',
      icon: 'U',
    })
  })

  it('sorts by seconds descending', () => {
    const input = { vscode: 100, 'claude-code': 300, zed: 200 }
    const result = transformByTool(input)

    expect(result.map(t => t.tool)).toEqual(['claude-code', 'zed', 'vscode'])
  })
})

describe('transformByLanguage', () => {
  it('returns empty array for undefined input', () => {
    expect(transformByLanguage(undefined)).toEqual([])
  })

  it('transforms languages with correct colors and capitalized names', () => {
    const input = { typescript: 3600, python: 1800 }
    const result = transformByLanguage(input)

    expect(result).toContainEqual({
      name: 'Typescript',
      seconds: 3600,
      color: '#3178c6',
    })
    expect(result).toContainEqual({
      name: 'Python',
      seconds: 1800,
      color: '#3776ab',
    })
  })

  it('uses fallback color for unknown languages', () => {
    const input = { cobol: 500 }
    const result = transformByLanguage(input)

    expect(result[0]).toEqual({
      name: 'Cobol',
      seconds: 500,
      color: '#666',
    })
  })

  it('sorts by seconds descending', () => {
    const input = { typescript: 100, python: 300, rust: 200 }
    const result = transformByLanguage(input)

    expect(result.map(l => l.name)).toEqual(['Python', 'Rust', 'Typescript'])
  })

  it('limits results to specified count', () => {
    const input = {
      typescript: 100,
      python: 200,
      rust: 300,
      go: 400,
      javascript: 500,
      java: 600,
    }
    const result = transformByLanguage(input, 3)

    expect(result).toHaveLength(3)
    expect(result.map(l => l.name)).toEqual(['Java', 'Javascript', 'Go'])
  })

  it('defaults to limit of 5', () => {
    const input = {
      a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7,
    }
    const result = transformByLanguage(input)

    expect(result).toHaveLength(5)
  })
})

describe('transformByProject', () => {
  it('returns empty array for undefined input', () => {
    expect(transformByProject(undefined)).toEqual([])
  })

  it('transforms project data', () => {
    const input = { 'my-project': 3600, 'other-project': 1800 }
    const result = transformByProject(input)

    expect(result).toContainEqual({ name: 'my-project', seconds: 3600 })
    expect(result).toContainEqual({ name: 'other-project', seconds: 1800 })
  })

  it('sorts by seconds descending', () => {
    const input = { a: 100, b: 300, c: 200 }
    const result = transformByProject(input)

    expect(result.map(p => p.name)).toEqual(['b', 'c', 'a'])
  })

  it('limits results to specified count', () => {
    const input = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 }
    const result = transformByProject(input, 4)

    expect(result).toHaveLength(4)
  })

  it('defaults to limit of 6', () => {
    const input = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 }
    const result = transformByProject(input)

    expect(result).toHaveLength(6)
  })
})

describe('calculateDailyAverage', () => {
  it('returns 0 when day count is 0', () => {
    expect(calculateDailyAverage(3600, 0)).toBe(0)
  })

  it('calculates average correctly', () => {
    expect(calculateDailyAverage(3600, 2)).toBe(1800)
    expect(calculateDailyAverage(7200, 3)).toBe(2400)
  })

  it('rounds to nearest integer', () => {
    expect(calculateDailyAverage(100, 3)).toBe(33)
    expect(calculateDailyAverage(200, 3)).toBe(67)
  })
})

describe('TOOL_COLORS', () => {
  it('has entries for all supported tools', () => {
    expect(TOOL_COLORS).toHaveProperty('vscode')
    expect(TOOL_COLORS).toHaveProperty('claude-code')
    expect(TOOL_COLORS).toHaveProperty('zed')
    expect(TOOL_COLORS).toHaveProperty('codex')
  })

  it('each tool has color, icon, and name', () => {
    for (const tool of Object.values(TOOL_COLORS)) {
      expect(tool).toHaveProperty('color')
      expect(tool).toHaveProperty('icon')
      expect(tool).toHaveProperty('name')
    }
  })
})

describe('LANG_COLORS', () => {
  it('has entries for common languages', () => {
    expect(LANG_COLORS).toHaveProperty('typescript')
    expect(LANG_COLORS).toHaveProperty('python')
    expect(LANG_COLORS).toHaveProperty('javascript')
    expect(LANG_COLORS).toHaveProperty('rust')
    expect(LANG_COLORS).toHaveProperty('go')
  })
})
