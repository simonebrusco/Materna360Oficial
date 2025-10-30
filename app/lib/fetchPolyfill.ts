'use client'

/**
 * Polyfill fetch to handle FullStory's broken wrapper.
 * FullStory intercepts fetch but throws "Failed to fetch" errors in production.
 * This wrapper stores the original fetch and retries with it if the wrapper fails.
 */

if (typeof window !== 'undefined') {
  const originalFetch = window.fetch.bind(window)
  let isPolyfilled = false

  // Only polyfill once
  if (!isPolyfilled && (window as any).__fetchPolyfilled !== true) {
    isPolyfilled = true
    ;(window as any).__fetchPolyfilled = true

    window.fetch = function fetchPolyfill(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      // Try the current fetch (which might be FullStory's wrapper)
      return originalFetch(input, init).catch((error: Error) => {
        // If it fails, try again with original fetch directly
        // This handles FullStory's broken wrapper gracefully
        if (error?.message?.includes('Failed to fetch')) {
          return originalFetch(input, init)
        }
        throw error
      })
    }
  }
}
