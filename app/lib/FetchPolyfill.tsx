'use client'

import { useEffect } from 'react'
import { initSafeFetch } from './SafeFetch'

/**
 * FetchPolyfill: Handles FullStory's broken fetch wrapper.
 * Initializes SafeFetch as early as possible to wrap window.fetch.
 */
export default function FetchPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize safe fetch wrapper immediately
    initSafeFetch()

    // Detect and disable prefetching if FullStory is present
    // FullStory breaks RSC prefetch, causing navigation failures
    if ((window as any).FS && (window as any).FS.identify) {
      // FullStory is loaded, disable automatic prefetching
      const style = document.createElement('style')
      style.textContent = `
        /* Disable prefetch links when FullStory is detected */
        link[rel="prefetch"],
        link[rel="preload"] {
          display: none !important;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return null
}
