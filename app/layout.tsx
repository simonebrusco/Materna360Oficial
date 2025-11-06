import './globals.css'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import Script from 'next/script'
import type { Metadata } from 'next'
import SiteHeader from '@/components/common/SiteHeader'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'Materna360',
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full AppGradient">
      <head>
        <meta charSet="utf-8" />
        <Script
          id="fullstory-fetch-fix"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(${fixFetch.toString()})();`,
          }}
        />
      </head>
      <body className="min-h-screen text-slate-800 antialiased">
        <ToastProvider>
          <SiteHeader />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}

/** Inline helper used by the Script above */
function fixFetch() {
  const nativeFetch = window.fetch;
  // same logic you already had, shortened for brevity:
  window.fetch = function wrappedFetch(input, init) {
    return nativeFetch(input as any, init as any).catch((error: any) => {
      if (error && (String(error).includes('Failed to fetch'))) {
        return new Promise((resolve, reject) => {
          try {
            const xhr = new XMLHttpRequest();
            const url = (input as any)?.url ?? String(input);
            const method = (init?.method || 'GET').toUpperCase();
            xhr.open(method, url, true);
            if (init?.headers) {
              const headers = init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init.headers as any;
              Object.entries(headers).forEach(([k, v]) => { try { xhr.setRequestHeader(k, String(v)); } catch {} });
            }
            xhr.withCredentials = init?.credentials === 'include';
            xhr.onload = () => {
              const ct = xhr.getResponseHeader('content-type') || 'text/plain';
              resolve(new Response((xhr as any).response || xhr.responseText, { status: xhr.status, statusText: xhr.statusText, headers: new Headers({ 'content-type': ct }) }));
            };
            xhr.onerror = () => reject(new TypeError('Network request failed'));
            xhr.ontimeout = () => reject(new TypeError('Request timeout'));
            xhr.send((init?.body as any) || null);
          } catch (e) { reject(e); }
        });
      }
      throw error;
    });
  };
}
