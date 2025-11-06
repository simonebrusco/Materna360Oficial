'use client'

import { useEffect } from 'react'
import { initSafeFetch } from './safeFetch'

/**
 * FetchPolyfill: Handles FullStory's broken fetch wrapper.
 * Initializes SafeFetch as early as possible to wrap window.fetch.
 */
export default function FetchPolyfill() {
  // Initialize immediately during render (synchronously) to wrap fetch before FullStory
  if (typeof window !== 'undefined') {
    initSafeFetch()
  }

  useEffect(() => {
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
