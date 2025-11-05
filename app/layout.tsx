import './globals.css'
import Script from 'next/script'
import RuntimeFlagBanner from '@/components/dev/RuntimeFlagBanner'

export const metadata = { title: 'Materna360' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isProduction = process.env.NODE_ENV === 'production'
  return (
    <html lang="pt-BR">
      <head>
        <Script
          id="fetch-wrapper"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const originalFetch = window.fetch.bind(window);
                const state = { isFullStoryDetected: false, checkCount: 0 };

                function isFullStoryLoaded() {
                  // Check if FullStory is initialized
                  if (typeof window !== 'undefined') {
                    if (window.FS && typeof window.FS.identify === 'function') {
                      return true;
                    }
                  }
                  return false;
                }

                function fetchViaXHR(url, method, headers, body, credentials) {
                  return new Promise((resolve, reject) => {
                    try {
                      const xhr = new XMLHttpRequest();
                      xhr.open(method, url, true);

                      // Set headers
                      if (headers) {
                        Object.entries(headers).forEach(([key, val]) => {
                          xhr.setRequestHeader(key, String(val));
                        });
                      }

                      xhr.withCredentials = credentials === 'include';

                      xhr.onload = () => {
                        const contentType = xhr.getResponseHeader('content-type') || 'text/plain';
                        const response = new Response(xhr.response, {
                          status: xhr.status,
                          statusText: xhr.statusText,
                          headers: new Headers({ 'content-type': contentType })
                        });
                        resolve(response);
                      };

                      xhr.onerror = () => {
                        reject(new TypeError('Network request failed'));
                      };

                      xhr.ontimeout = () => {
                        reject(new TypeError('Network timeout'));
                      };

                      xhr.send(body || null);
                    } catch (error) {
                      reject(error);
                    }
                  });
                }

                window.fetch = function safeFetch(input, init) {
                  const url = input instanceof Request ? input.url : String(input);
                  const method = (init?.method || 'GET').toUpperCase();
                  const headers = {};
                  const credentials = init?.credentials || 'omit';

                  // Parse headers
                  if (init?.headers) {
                    if (init.headers instanceof Headers) {
                      init.headers.forEach((val, key) => {
                        headers[key] = val;
                      });
                    } else if (Array.isArray(init.headers)) {
                      init.headers.forEach(([key, val]) => {
                        headers[key] = val;
                      });
                    } else {
                      Object.assign(headers, init.headers);
                    }
                  }

                  // Check if FullStory is loaded
                  if (isFullStoryLoaded()) {
                    state.isFullStoryDetected = true;
                    return fetchViaXHR(url, method, headers, init?.body, credentials);
                  }

                  // Use original fetch
                  return originalFetch(input, init).catch(error => {
                    // If native fetch fails with "Failed to fetch", it might be FullStory interference
                    if (error && error.message && error.message.includes('Failed to fetch')) {
                      return fetchViaXHR(url, method, headers, init?.body, credentials);
                    }
                    throw error;
                  });
                };
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_72%)] pb-24 antialiased">
        {!isProduction && <RuntimeFlagBanner />}
        {children}
      </body>
    </html>
  )
}
