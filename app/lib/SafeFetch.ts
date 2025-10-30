'use client'

/**
 * SafeFetch: Wraps window.fetch to handle FullStory's broken wrapper.
 * FullStory intercepts fetch and throws errors even when the request should succeed.
 * This provides a fallback using XMLHttpRequest.
 */

let isSafeFetchInitialized = false

export function initSafeFetch() {
  if (isSafeFetchInitialized || typeof window === 'undefined') return
  isSafeFetchInitialized = true

  const originalFetch = window.fetch

  window.fetch = function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      // Attempt 1: Try native fetch
      originalFetch
        .call(window, input, init)
        .then(resolve)
        .catch((error: Error) => {
          // Only fallback on FullStory's "Failed to fetch" error
          if (error?.message?.includes('Failed to fetch')) {
            // Use XMLHttpRequest as fallback
            try {
              const xhr = new XMLHttpRequest()
              const url = input instanceof Request ? input.url : String(input)
              const method = (init?.method || 'GET').toUpperCase()

              xhr.open(method, url, true)

              // Set headers
              if (init?.headers) {
                const headersObj = init.headers as Record<string, string>
                Object.entries(headersObj).forEach(([key, val]) => {
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
            } catch (xhrError) {
              reject(xhrError)
            }
          } else {
            reject(error)
          }
        })
    })
  }
}
