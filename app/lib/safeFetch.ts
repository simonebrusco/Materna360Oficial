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

function fetchViaXHR(input: RequestInfo | URL, init?: RequestInit, timeoutMs?: number): Promise<Response> {
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

      // Handle abort signal
      let abortHandler: (() => void) | null = null
      if (init?.signal) {
        abortHandler = () => {
          xhr.abort()
        }
        init.signal.addEventListener('abort', abortHandler)
      }

      // Set timeout if provided
      if (timeoutMs) {
        xhr.timeout = timeoutMs
      }

      // Handle response
      xhr.onload = () => {
        if (abortHandler && init?.signal) {
          init.signal.removeEventListener('abort', abortHandler)
        }
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
        if (abortHandler && init?.signal) {
          init.signal.removeEventListener('abort', abortHandler)
        }
        reject(new TypeError('XMLHttpRequest failed'))
      }

      xhr.ontimeout = () => {
        if (abortHandler && init?.signal) {
          init.signal.removeEventListener('abort', abortHandler)
        }
        reject(new DOMException('XMLHttpRequest timeout', 'TimeoutError'))
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
    // Always use original fetch if available (do not use FullStory's broken wrapper)
    // If original fetch is not available, fall back to XMLHttpRequest
    if (originalFetch) {
      return (originalFetch as typeof fetch).call(window, input, init)
    }

    // Fallback to XMLHttpRequest if original fetch is unavailable
    return fetchViaXHR(input, init)
  }
}

export async function safeFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8000
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(input, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}
