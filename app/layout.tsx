export const dynamic = 'force-dynamic';
export const revalidate = 0;

import './globals.css';
import Script from 'next/script';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Materna360' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <Script
          id="fullstory-fetch-fix"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const nativeFetch = window.fetch;
                window.fetch = function wrappedFetch(input, init) {
                  return nativeFetch.call(window, input, init).catch(error => {
                    if (error && (error.message === 'Failed to fetch' || error.toString().includes('Failed to fetch'))) {
                      return new Promise((resolve, reject) => {
                        try {
                          const xhr = new XMLHttpRequest();
                          const url = input instanceof Request ? input.url : String(input);
                          const method = (init?.method || 'GET').toUpperCase();
                          xhr.open(method, url, true);
                          if (init?.headers) {
                            const headers = init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init.headers;
                            Object.entries(headers || {}).forEach(([k, v]) => { try { xhr.setRequestHeader(k, String(v)); } catch (e) {} });
                          }
                          xhr.withCredentials = init?.credentials === 'include';
                          xhr.onload = () => {
                            const ct = xhr.getResponseHeader('content-type') || 'text/plain';
                            resolve(new Response(xhr.response || xhr.responseText, { status: xhr.status, statusText: xhr.statusText, headers: new Headers({ 'content-type': ct }) }));
                          };
                          xhr.onerror = () => reject(new TypeError('Network request failed'));
                          xhr.ontimeout = () => reject(new TypeError('Request timeout'));
                          xhr.send(init?.body || null);
                        } catch (e) { reject(e); }
                      });
                    }
                    throw error;
                  });
                };
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-[linear-gradient(180deg,#ffe9f0_0%,#ffffff_80%)] text-slate-800 antialiased">
        <div className="mx-auto max-w-screen-md px-3 pt-4 pb-24">
          {children}
        </div>
      </body>
    </html>
  );
}
