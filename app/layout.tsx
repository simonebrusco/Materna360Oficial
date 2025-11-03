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
              // SafeFetch polyfill - initialize before FullStory loads
              (function() {
                const originalFetch = window.fetch;

                function isFullStoryPresent() {
                  try {
                    return !!(window.__FULLSTORY && typeof window.__FULLSTORY === 'object');
                  } catch {
                    return false;
                  }
                }

                function isInternalRSCRequest(url) {
                  try {
                    const urlObj = new URL(url, window.location.href);
                    const isInternal = !url.startsWith('http') || urlObj.origin === window.location.origin;
                    if (!isInternal) return false;
                    const pathname = urlObj.pathname;
                    return !pathname.match(/\\.(js|css|png|jpg|gif|svg|ico|woff|woff2|ttf|eot)$/i);
                  } catch {
                    return false;
                  }
                }

                function isInternalRequest(url) {
                  try {
                    if (!url.startsWith('http')) return true;
                    const urlObj = new URL(url);
                    return urlObj.origin === window.location.origin;
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
                        const pairs = headerStr.split('\\r\\n');
                        pairs.forEach(header => {
                          const index = header.indexOf(': ');
                          if (index > 0) {
                            headers[header.substring(0, index)] = header.substring(index + 2);
                          }
                        });
                      }
                      resolve(new Response(xhr.responseText, {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        headers: headers
                      }));
                    };
                    xhr.onerror = () => reject(new TypeError('Failed to fetch via XHR'));
                    xhr.ontimeout = () => reject(new TypeError('XHR timeout'));
                    try {
                      xhr.open(init?.method || 'GET', url, true);
                      if (init?.headers) {
                        Object.entries(init.headers).forEach(([key, val]) => {
                          xhr.setRequestHeader(key, val);
                        });
                      }
                      const body = init?.body ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : undefined;
                      xhr.send(body);
                    } catch (error) {
                      reject(error);
                    }
                  });
                }

                window.fetch = async function(input, init) {
                  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
                  if (isFullStoryPresent() && isInternalRSCRequest(url)) {
                    return fetchViaXHR(url, init);
                  }
                  try {
                    return await originalFetch(input, init);
                  } catch (error) {
                    if (isFullStoryPresent() && isInternalRequest(url)) {
                      return fetchViaXHR(url, init);
                    }
                    throw error;
                  }
                };

                // Disable prefetch when FullStory is detected
                if (isFullStoryPresent()) {
                  document.addEventListener('DOMContentLoaded', () => {
                    document.querySelectorAll('link[rel="prefetch"]').forEach(link => {
                      link.rel = '';
                    });
                  });
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
