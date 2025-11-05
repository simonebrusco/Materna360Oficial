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
                const nativeFetch = window.fetch;
                let isInitialized = false;
                let useXHRForAllRequests = false;

                function isFullStoryPresent() {
                  try {
                    return !!(window.FS && typeof window.FS.identify === 'function');
                  } catch {
                    return false;
                  }
                }

                function fetchWithXHR(url, method, headers, body, credentials) {
                  return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open(method, url, true);
                    xhr.withCredentials = credentials === 'include';

                    Object.entries(headers || {}).forEach(([key, val]) => {
                      try {
                        xhr.setRequestHeader(key, String(val));
                      } catch (e) {
                        /* ignore header errors */
                      }
                    });

                    xhr.onload = () => {
                      const contentType = xhr.getResponseHeader('content-type') || 'text/plain';
                      const response = new Response(xhr.response || xhr.responseText, {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        headers: new Headers({ 'content-type': contentType })
                      });
                      resolve(response);
                    };

                    xhr.onerror = () => reject(new TypeError('Network request failed'));
                    xhr.ontimeout = () => reject(new TypeError('Network timeout'));
                    xhr.timeout = 30000;
                    xhr.send(body || null);
                  });
                }

                function handleFetch(input, init) {
                  const url = input instanceof Request ? input.url : String(input);
                  const method = (init?.method || 'GET').toUpperCase();
                  const headers = {};
                  const credentials = init?.credentials || 'omit';

                  if (init?.headers) {
                    if (init.headers instanceof Headers) {
                      init.headers.forEach((val, key) => { headers[key] = val; });
                    } else if (Array.isArray(init.headers)) {
                      init.headers.forEach(([key, val]) => { headers[key] = val; });
                    } else if (typeof init.headers === 'object') {
                      Object.assign(headers, init.headers);
                    }
                  }

                  if (useXHRForAllRequests || isFullStoryPresent()) {
                    useXHRForAllRequests = true;
                    return fetchWithXHR(url, method, headers, init?.body, credentials);
                  }

                  return nativeFetch.call(window, input, init).catch(error => {
                    if (error && (error.message === 'Failed to fetch' || error.toString().includes('Failed to fetch'))) {
                      useXHRForAllRequests = true;
                      return fetchWithXHR(url, method, headers, init?.body, credentials);
                    }
                    throw error;
                  });
                }

                window.fetch = handleFetch;

                // Monitor for FullStory initialization
                const observer = new MutationObserver(() => {
                  if (isFullStoryPresent()) {
                    useXHRForAllRequests = true;
                  }
                });

                observer.observe(document.documentElement, {
                  attributes: true,
                  subtree: true,
                  attributeFilter: ['data-fs-loaded']
                });
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
