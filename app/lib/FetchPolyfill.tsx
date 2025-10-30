'use client'

import { useEffect } from 'react'

export default function FetchPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch

    window.fetch = function fetchWithFallback(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      // Try native fetch first
      return originalFetch
        .call(window, input, init)
        .catch((error: Error) => {
          // If fetch fails, use XMLHttpRequest as fallback
          if (error?.message?.includes('Failed to fetch')) {
            return new Promise<Response>((resolve, reject) => {
              const xhr = new XMLHttpRequest()
              const url = input instanceof Request ? input.url : String(input)
              const method = (init?.method || 'GET').toUpperCase()

              // Set up request
              xhr.open(method, url, true)

              // Copy headers
              if (init?.headers) {
                const headers = init.headers as Record<string, string>
                Object.entries(headers).forEach(([key, value]) => {
                  xhr.setRequestHeader(key, value)
                })
              }

              // Handle response
              xhr.onload = () => {
                const response = new Response(xhr.responseText, {
                  status: xhr.status,
                  statusText: xhr.statusText,
                  headers: new Headers({
                    'content-type': xhr.getResponseHeader('content-type') || 'text/plain',
                  }),
                })
                resolve(response)
              }

              xhr.onerror = () => {
                reject(new TypeError('Failed to fetch via XMLHttpRequest'))
              }

              xhr.ontimeout = () => {
                reject(new TypeError('Request timeout'))
              }

              // Send request with body if present
              if (init?.body) {
                xhr.send(init.body)
              } else {
                xhr.send()
              }
            })
          }
          throw error
        })
    }
  }, [])

  return null
}
