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
                // Capture the original fetch before anything else can wrap it
                const nativeFetch = window.fetch;
                let fetchInterceptionActive = false;

                function isFullStoryPresent() {
                  try {
                    return !!(window.FS && typeof window.FS.identify === 'function');
                  } catch {
                    return false;
                  }
                }

                function fetchWithXHR(url, method, headers, body, credentials) {
                  return new Promise((resolve, reject) => {
                    try {
                      const xhr = new XMLHttpRequest();
                      xhr.open(method, url, true);
                      xhr.withCredentials = credentials === 'include';

                      // Set all headers
                      Object.entries(headers || {}).forEach(([key, val]) => {
                        try {
                          xhr.setRequestHeader(key, String(val));
                        } catch (e) {
                          // Ignore header errors
                        }
                      });

                      xhr.onload = () => {
                        try {
                          const contentType = xhr.getResponseHeader('content-type') || 'text/plain';
                          const response = new Response(xhr.response || xhr.responseText, {
                            status: xhr.status,
                            statusText: xhr.statusText,
                            headers: new Headers({ 'content-type': contentType })
                          });
                          resolve(response);
                        } catch (e) {
                          reject(e);
                        }
                      };

                      xhr.onerror = () => {
                        reject(new TypeError('Network request failed'));
                      };

                      xhr.ontimeout = () => {
                        reject(new TypeError('Network timeout'));
                      };

                      xhr.timeout = 30000;
                      xhr.send(body || null);
                    } catch (e) {
                      reject(e);
                    }
                  });
                }

                // Wrap native fetch to detect and handle FullStory
                window.fetch = function wrappedFetch(input, init) {
                  if (fetchInterceptionActive) {
                    return nativeFetch.call(window, input, init);
                  }

                  fetchInterceptionActive = true;

                  try {
                    const url = input instanceof Request ? input.url : String(input);
                    const method = (init?.method || 'GET').toUpperCase();
                    const headers = {};
                    const credentials = init?.credentials || 'omit';

                    // Normalize headers
                    if (init?.headers) {
                      if (init.headers instanceof Headers) {
                        init.headers.forEach((val, key) => {
                          headers[key] = val;
                        });
                      } else if (Array.isArray(init.headers)) {
                        init.headers.forEach(([key, val]) => {
                          headers[key] = val;
                        });
                      } else if (typeof init.headers === 'object') {
                        Object.assign(headers, init.headers);
                      }
                    }

                    // If FullStory is loaded, use XHR to avoid its broken fetch wrapper
                    if (isFullStoryPresent()) {
                      return fetchWithXHR(url, method, headers, init?.body, credentials);
                    }

                    // Otherwise use native fetch with error handling
                    return nativeFetch
                      .call(window, input, init)
                      .catch(error => {
                        // If we get "Failed to fetch", it might be from FullStory after all
                        if (
                          error &&
                          (error.message === 'Failed to fetch' ||
                           error.toString().includes('Failed to fetch'))
                        ) {
                          return fetchWithXHR(url, method, headers, init?.body, credentials);
                        }
                        throw error;
                      });
                  } finally {
                    fetchInterceptionActive = false;
                  }
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
