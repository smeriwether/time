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
