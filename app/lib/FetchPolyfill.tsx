'use client'

import { useEffect } from 'react'

export default function FetchPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch
    let attempts = 0
    const MAX_RETRIES = 2

    window.fetch = function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      attempts = 0

      const attemptFetch = (): Promise<Response> => {
        return originalFetch.call(window, input, init).catch((error: Error) => {
          // If FullStory's wrapper fails with "Failed to fetch", retry
          if (attempts < MAX_RETRIES && error?.message?.includes('Failed to fetch')) {
            attempts++
            // Wait a tiny bit before retrying
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(attemptFetch())
              }, 10)
            })
          }
          throw error
        })
      }

      return attemptFetch()
    }
  }, [])

  return null
}
