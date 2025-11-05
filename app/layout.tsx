// Temporarily disabled to diagnose compilation issue
// import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'

import '@/app/lib/telemetryServer'
import { inter } from './fonts'
import FetchPolyfill from '@/app/lib/FetchPolyfill'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Cuidado e bem-estar para mães',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <Script
          id="safe-fetch-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                let originalFetch = window.fetch;
                let isSafeFetchInitialized = false;
                
                function isFullStoryPresent() {
                  return !!(window.FS);
                }
                
                function fetchViaXHR(input, init) {
                  return new Promise((resolve, reject) => {
                    try {
                      const xhr = new XMLHttpRequest();
                      const url = input instanceof Request ? input.url : String(input);
                      const method = (init?.method || 'GET').toUpperCase();
                      
                      xhr.open(method, url, true);
                      
                      if (init?.headers) {
                        const headers = init.headers instanceof Headers
                          ? Object.fromEntries(init.headers.entries())
                          : (init.headers || {});
                        Object.entries(headers).forEach(([key, val]) => {
                          xhr.setRequestHeader(key, val);
                        });
                      }
                      
                      xhr.onload = () => {
                        const contentType = xhr.getResponseHeader('content-type') || 'application/octet-stream';
                        const response = new Response(xhr.responseText || xhr.response, {
                          status: xhr.status,
                          statusText: xhr.statusText,
                          headers: new Headers({
                            'content-type': contentType,
                          }),
                        });
                        resolve(response);
                      };
                      
                      xhr.onerror = () => reject(new TypeError('XMLHttpRequest failed'));
                      xhr.ontimeout = () => reject(new TypeError('XMLHttpRequest timeout'));
                      xhr.withCredentials = init?.credentials === 'include';
                      
                      xhr.send(init?.body ? String(init.body) : null);
                    } catch (error) {
                      reject(error);
                    }
                  });
                }
                
                window.fetch = function safeFetch(input, init) {
                  if (isFullStoryPresent()) {
                    return fetchViaXHR(input, init);
                  }
                  
                  return new Promise((resolve, reject) => {
                    originalFetch.call(window, input, init)
                      .then(resolve)
                      .catch((error) => {
                        if (error?.message?.includes('Failed to fetch')) {
                          fetchViaXHR(input, init).then(resolve).catch(reject);
                        } else {
                          reject(error);
                        }
                      });
                  });
                };
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-[#FFF9FB] text-support-1 antialiased`}>
        <FetchPolyfill />
        {children}
      </body>
    </html>
  )
}
