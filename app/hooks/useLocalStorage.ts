'use client'

import { useState, useEffect } from 'react'

const PREFIX = 'm360:'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const prefixedKey = `${PREFIX}${key}`
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(prefixedKey)
        if (item) {
          setStoredValue(JSON.parse(item))
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${prefixedKey}":`, error)
    }
    setIsLoaded(true)
  }, [prefixedKey])

  // Save to localStorage when value changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(prefixedKey, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${prefixedKey}":`, error)
    }
  }

  return [storedValue, setValue, isLoaded] as const
}

export function clearLocalStorageKey(key: string) {
  const prefixedKey = `${PREFIX}${key}`
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(prefixedKey)
  }
}

export function getAllLocalStorageByPrefix(searchPrefix: string) {
  const fullPrefix = `${PREFIX}${searchPrefix}`
  const results: Record<string, unknown> = {}
  if (typeof window !== 'undefined') {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(fullPrefix)) {
        try {
          results[key] = JSON.parse(window.localStorage.getItem(key) || '{}')
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
  return results
}
