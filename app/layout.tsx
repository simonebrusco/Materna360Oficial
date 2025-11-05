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
                const originalFetch = window.fetch;
                let fetchInitialized = false;

                window.fetch = function wrappedFetch(input, init) {
                  if (!fetchInitialized) {
                    // Store original to avoid double-wrapping
                    if (window.fetch !== wrappedFetch) {
                      return window.fetch(input, init);
                    }
                    fetchInitialized = true;
                  }

                  // Check if FullStory is present (loads async)
                  if (typeof window !== 'undefined' && window.FS) {
                    return new Promise((resolve, reject) => {
                      // Use XMLHttpRequest as fallback when FullStory is detected
                      try {
                        const xhr = new XMLHttpRequest();
                        const url = input instanceof Request ? input.url : String(input);
                        const method = (init?.method || 'GET').toUpperCase();

                        xhr.open(method, url, true);

                        // Set headers from init
                        if (init?.headers) {
                          const headerObj = init.headers instanceof Headers
                            ? Object.fromEntries(init.headers.entries())
                            : init.headers;
                          Object.entries(headerObj || {}).forEach(([key, val]) => {
                            xhr.setRequestHeader(key, String(val));
                          });
                        }

                        xhr.onload = () => {
                          const contentType = xhr.getResponseHeader('content-type') || 'application/octet-stream';
                          const response = new Response(xhr.responseText || xhr.response, {
                            status: xhr.status,
                            statusText: xhr.statusText,
                            headers: new Headers({ 'content-type': contentType })
                          });
                          resolve(response);
                        };

                        xhr.onerror = () => reject(new TypeError('Failed to fetch'));
                        xhr.ontimeout = () => reject(new TypeError('Request timeout'));
                        xhr.withCredentials = init?.credentials === 'include';

                        xhr.send(init?.body ? String(init.body) : null);
                      } catch (e) {
                        reject(e);
                      }
                    });
                  }

                  // FullStory not detected, use original fetch
                  if (!originalFetch) {
                    return Promise.reject(new TypeError('Fetch not available'));
                  }
                  return originalFetch.call(window, input, init);
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
