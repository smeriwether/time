export function getMaxValue<T>(items: T[], getValue: (item: T) => number, defaultValue = 1): number {
  if (items.length === 0) return defaultValue
  let max = getValue(items[0])
  for (let i = 1; i < items.length; i++) {
    const value = getValue(items[i])
    if (value > max) {
      max = value
    }
  }
  return max || defaultValue
}
