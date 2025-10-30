'use client'

import { useEffect } from 'react'

/**
 * FetchPolyfill: Initializes window.fetch early before FullStory loads.
 * This ensures we have a reference to the native fetch before FullStory
 * wraps it and potentially breaks it.
 */
export default function FetchPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Store the native fetch implementation before any external scripts wrap it
    if (!('__nativeFetch' in window)) {
      ;(window as any).__nativeFetch = window.fetch.bind(window)
    }
  }, [])

  return null
}
