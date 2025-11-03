'use client'

/**
 * SafeFetch: Handles FullStory's broken fetch wrapper by using XMLHttpRequest
 * when FullStory is detected, or native fetch otherwise.
 *
 * Key insight: Check for FullStory at CALL TIME, not initialization time,
 * because FullStory may load asynchronously after our initialization.
 */

let isSafeFetchInitialized = false
let originalFetch: typeof fetch | null = null

function isFullStoryPresent(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).FS
}

function fetchViaXHR(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest()
      const url = input instanceof Request ? input.url : String(input)
      const method = (init?.method || 'GET').toUpperCase()

      xhr.open(method, url, true)

      // Set headers
      if (init?.headers) {
        const headers = init.headers instanceof Headers
          ? Object.fromEntries(init.headers.entries())
          : (init.headers as Record<string, string>)

        Object.entries(headers).forEach(([key, val]) => {
          xhr.setRequestHeader(key, val)
        })
      }

      // Handle response
      xhr.onload = () => {
        const contentType = xhr.getResponseHeader('content-type') || 'application/octet-stream'
        const response = new Response(xhr.responseText || xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers({
            'content-type': contentType,
          }),
        })
        resolve(response)
      }

      xhr.onerror = () => {
        reject(new TypeError('XMLHttpRequest failed'))
      }

      xhr.ontimeout = () => {
        reject(new TypeError('XMLHttpRequest timeout'))
      }

      xhr.withCredentials = init?.credentials === 'include'

      // Send request
      xhr.send(init?.body ? String(init.body) : null)
    } catch (error) {
      reject(error)
    }
  })
}

export function initSafeFetch() {
  if (isSafeFetchInitialized || typeof window === 'undefined') return
  isSafeFetchInitialized = true

  // Store the original fetch at initialization
  originalFetch = window.fetch

  window.fetch = function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Check for FullStory at CALL TIME (not initialization time)
    // because it may load asynchronously
    if (isFullStoryPresent()) {
      return fetchViaXHR(input, init)
    }

    // Use original fetch if FullStory is not present
    if (!originalFetch) {
      return Promise.reject(new TypeError('Fetch is not available'))
    }

    return new Promise((resolve, reject) => {
      (originalFetch as typeof fetch)
        .call(window, input, init)
        .then(resolve)
        .catch((error: Error) => {
          // If fetch fails unexpectedly, try XMLHttpRequest as fallback
          if (error?.message?.includes('Failed to fetch')) {
            fetchViaXHR(input, init).then(resolve).catch(reject)
          } else {
            reject(error)
          }
        })
    })
  }
}
