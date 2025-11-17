import '@/app/globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { ToastHost } from '@/components/ui/toast/ToastHost'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Uma plataforma acolhedora para apoiar você em cada etapa da maternidade',
  icons: { icon: '/favicon.ico' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Materna360',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        {/* FullStory fetch interception fix: capture native fetch before FullStory wraps it */}
        <Script id="fullstory-fetch-fix" strategy="beforeInteractive">
          {`
            (function() {
              const nativeFetch = window.fetch;
              let fsDetected = false;

              window.fetch = function(...args) {
                // Detect FullStory presence at call time
                if (!fsDetected && typeof window.FS !== 'undefined') {
                  fsDetected = true;
                }

                // If FullStory is present, use XMLHttpRequest instead
                if (fsDetected) {
                  const url = args[0];
                  const init = args[1] || {};

                  return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    const method = init.method || 'GET';

                    xhr.open(method, url);

                    if (init.headers) {
                      Object.entries(init.headers).forEach(([key, value]) => {
                        xhr.setRequestHeader(key, value);
                      });
                    }

                    xhr.onload = () => {
                      resolve(new Response(xhr.responseText, {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        headers: new Headers(),
                      }));
                    };

                    xhr.onerror = () => {
                      reject(new TypeError('Failed to fetch'));
                    };

                    xhr.send(init.body || undefined);
                  });
                }

                // Try native fetch first
                return nativeFetch.apply(this, args).catch(err => {
                  // If we get "Failed to fetch" from FullStory, switch to XHR
                  if (err instanceof TypeError && err.message === 'Failed to fetch' && !fsDetected) {
                    fsDetected = true;
                    return window.fetch.apply(this, args);
                  }
                  throw err;
                });
              };

              // Disable prefetch links that may trigger FullStory issues
              if (typeof window.FS !== 'undefined') {
                document.addEventListener('mouseover', (e) => {
                  const link = e.target.closest('a[rel~="prefetch"]');
                  if (link) link.removeAttribute('rel');
                }, true);
              }
            })();
          `}
        </Script>
      </head>
      <body>
        {/* Page content */}
        {children}

        {/* Global, non-blocking toasts */}
        <ToastHost />
      </body>
    </html>
  )
}
