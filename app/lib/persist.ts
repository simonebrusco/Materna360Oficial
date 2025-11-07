'use client'

const PREFIX = 'm360:'

/**
 * Safe date utilities for persistence keys
 */
export function getCurrentDateKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export function getCurrentWeekKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const firstDay = new Date(year, 0, 1)
  const pastDaysOfYear = (now.getTime() - firstDay.getTime()) / 86400000
  const week = Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/**
 * Save a value to localStorage with m360: prefix
 * @param key - Key name (e.g., "planner:2024-W01", "diary:2024-01-15")
 * @param value - Value to save (any JSON-serializable type)
 */
export function save(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined') return
    const prefixedKey = `${PREFIX}${key}`
    const jsonValue = JSON.stringify(value)
    window.localStorage.setItem(prefixedKey, jsonValue)
  } catch (error) {
    console.error(`Failed to save localStorage key "${key}":`, error)
  }
}

/**
 * Load a value from localStorage with m360: prefix
 * @param key - Key name
 * @param defaultValue - Value to return if key not found or JSON parse fails
 * @returns Parsed value or defaultValue
 */
export function load<T = unknown>(key: string, defaultValue?: T): T | undefined {
  try {
    if (typeof window === 'undefined') return defaultValue
    const prefixedKey = `${PREFIX}${key}`
    const item = window.localStorage.getItem(prefixedKey)
    if (!item) return defaultValue
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Failed to load localStorage key "${key}":`, error)
    return defaultValue
  }
}

/**
 * Remove a key from localStorage with m360: prefix
 * @param key - Key name
 */
export function remove(key: string): void {
  try {
    if (typeof window === 'undefined') return
    const prefixedKey = `${PREFIX}${key}`
    window.localStorage.removeItem(prefixedKey)
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error)
  }
}

/**
 * Clear all m360: prefixed keys from localStorage
 */
export function clearAll(): void {
  try {
    if (typeof window === 'undefined') return
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key))
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

/**
 * Export all m360: prefixed data as an object
 * Useful for debugging or data export
 */
export function exportData(): Record<string, unknown> {
  try {
    if (typeof window === 'undefined') return {}
    const data: Record<string, unknown> = {}
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(PREFIX)) {
        const cleanKey = key.slice(PREFIX.length)
        try {
          data[cleanKey] = JSON.parse(window.localStorage.getItem(key) || '{}')
        } catch {
          // Keep invalid JSON as string
          data[cleanKey] = window.localStorage.getItem(key)
        }
      }
    }
    return data
  } catch (error) {
    console.error('Failed to export localStorage data:', error)
    return {}
  }
}

/**
 * Convenience: Save an array item (append to list)
 * @param key - List key
 * @param item - Item to append
 */
export function appendItem<T>(key: string, item: T): void {
  try {
    const list = load<T[]>(key, []) ?? []
    list.push(item)
    save(key, list)
  } catch (error) {
    console.error(`Failed to append item to "${key}":`, error)
  }
}

/**
 * Convenience: Load an array of items
 * @param key - List key
 * @returns Array of items or empty array
 */
export function loadItems<T>(key: string): T[] {
  return load<T[]>(key, []) ?? []
}

/**
 * Convenience: Save a timestamped entry (e.g., diary entries)
 * @param key - Key prefix
 * @param entry - Entry object (will add timestamp if not present)
 */
export function saveEntry<T extends Record<string, unknown>>(
  key: string,
  entry: T
): void {
  try {
    const withTimestamp = {
      ...entry,
      ts: entry.ts || Date.now(),
    }
    save(key, withTimestamp)
  } catch (error) {
    console.error(`Failed to save entry to "${key}":`, error)
  }
}

/**
 * Convenience: Get entries for a date range
 * @param prefix - Key prefix (e.g., "diary" for keys like "diary:2024-01-15")
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Object mapping dates to entries
 */
export function getEntriesByDateRange(
  prefix: string,
  startDate: string,
  endDate: string
): Record<string, unknown> {
  try {
    if (typeof window === 'undefined') return {}
    const result: Record<string, unknown> = {}
    const fullPrefix = `${PREFIX}${prefix}:`
    const startTime = new Date(startDate).getTime()
    const endTime = new Date(endDate).getTime()

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(fullPrefix)) {
        const dateStr = key.slice(fullPrefix.length)
        const dateTime = new Date(dateStr).getTime()
        if (dateTime >= startTime && dateTime <= endTime) {
          try {
            result[dateStr] = JSON.parse(window.localStorage.getItem(key) || '{}')
          } catch {
            result[dateStr] = window.localStorage.getItem(key)
          }
        }
      }
    }
    return result
  } catch (error) {
    console.error('Failed to get entries by date range:', error)
    return {}
  }
}
