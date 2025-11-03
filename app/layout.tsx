import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'

import { inter } from './fonts'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Cuidado e bem-estar para mães',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <Script
          id="safe-fetch-polyfill"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // SafeFetch polyfill - bypass FullStory for internal RSC requests
              (function() {
                const nativeFetch = window.fetch;
                let isInitialized = false;

                function isInternalRSCRequest(url) {
                  try {
                    const urlObj = new URL(url, window.location.href);
                    const isInternal = !url.startsWith('http') || urlObj.origin === window.location.origin;
                    if (!isInternal) return false;
                    const pathname = urlObj.pathname;
                    // RSC requests have no extension or .rsc extension
                    return !pathname.match(/\\.(js|css|png|jpg|gif|svg|ico|woff|woff2|ttf|eot)$/i);
                  } catch {
                    return false;
                  }
                }

                function fetchViaXHR(url, init) {
                  return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.onload = () => {
                      const headers = {};
                      const headerStr = xhr.getAllResponseHeaders();
                      if (headerStr) {
                        const lines = headerStr.trim().split(/[\\r\\n]+/);
                        lines.forEach(line => {
                          const parts = line.split(': ');
                          if (parts.length === 2) {
                            headers[parts[0].trim()] = parts[1].trim();
                          }
                        });
                      }
                      try {
                        resolve(new Response(xhr.responseText || xhr.response, {
                          status: xhr.status,
                          statusText: xhr.statusText,
                          headers: headers
                        }));
                      } catch (e) {
                        reject(e);
                      }
                    };

                    xhr.onerror = () => reject(new TypeError('Failed to fetch'));
                    xhr.ontimeout = () => reject(new TypeError('Request timeout'));

                    try {
                      xhr.open(init?.method || 'GET', url, true);
                      xhr.timeout = 30000;

                      if (init?.headers && typeof init.headers === 'object') {
                        Object.entries(init.headers).forEach(([key, val]) => {
                          xhr.setRequestHeader(key, String(val));
                        });
                      }

                      const body = init?.body;
                      xhr.send(body || undefined);
                    } catch (error) {
                      reject(error);
                    }
                  });
                }

                function initSafeFetch() {
                  if (isInitialized) return;
                  isInitialized = true;

                  window.fetch = function safeFetch(input, init) {
                    const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);

                    // Use XHR for internal RSC requests to bypass FullStory
                    if (isInternalRSCRequest(url)) {
                      return fetchViaXHR(url, init);
                    }

                    // Use native fetch for everything else
                    return nativeFetch.call(this, input, init);
                  };
                }

                // Initialize immediately
                initSafeFetch();

                // Also initialize if page becomes interactive
                if (document.readyState === 'interactive' || document.readyState === 'complete') {
                  initSafeFetch();
                } else {
                  document.addEventListener('DOMContentLoaded', initSafeFetch);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-[#FFF9FB] text-support-1 antialiased`}>{children}</body>
    </html>
  )
}
