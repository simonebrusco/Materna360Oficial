import '@/app/globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { ToastHost } from '@/components/ui/toast/ToastHost'
import { inter, poppins } from '@/app/fonts'

export const metadata: Metadata = {
  title: 'Materna360',
  description:
    'Uma plataforma acolhedora para apoiar você em cada etapa da maternidade',
  icons: {
    icon: '/images/favicon-materna.png',
    shortcut: '/images/favicon-materna.png',
    apple: '/images/favicon-materna.png',
  },
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${poppins.variable} ${inter.variable}`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#FD2597" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Materna360" />
        <link rel="manifest" href="/manifest.json" />

        {/* Service Worker registration for PWA
            - PROD: registra normalmente
            - DEV: desregistra SWs existentes para evitar interceptação/redirect (Safari em especial)
        */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            (function () {
              try {
                var isProd = ${process.env.NODE_ENV === 'production' ? 'true' : 'false'};
                if (!('serviceWorker' in navigator)) return;

                // Em DEV, remove SWs antigos para evitar interceptações e erros de navegação
                if (!isProd) {
                  navigator.serviceWorker
                    .getRegistrations()
                    .then(function (regs) {
                      regs.forEach(function (r) {
                        r.unregister();
                      });
                    })
                    .catch(function () {});
                  return;
                }

                // Em PROD, registra SW normalmente
                navigator.serviceWorker.register('/sw.js').catch(function (err) {
                  console.log('Service Worker registration failed:', err);
                });
              } catch (e) {}
            })();
          `}
        </Script>

        {/* FullStory fetch interception fix */}
        <Script id="fullstory-fetch-fix" strategy="beforeInteractive">
          {`
            (function() {
              const nativeFetch = window.fetch;
              let fsDetected = false;

              window.fetch = function(...args) {
                if (!fsDetected && typeof window.FS !== 'undefined') {
                  fsDetected = true;
                }

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

                return nativeFetch.apply(this, args).catch(err => {
                  if (err instanceof TypeError && err.message === 'Failed to fetch' && !fsDetected) {
                    fsDetected = true;
                    return window.fetch.apply(this, args);
                  }
                  throw err;
                });
              };

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

      {/* IMPORTANTE: body vira "casca" neutra; fundo único fica no layer fixo abaixo */}
      <body className="relative min-h-[100dvh] bg-transparent">
        {/* FUNDO ÚNICO GLOBAL — usar EXATAMENTE o “clima” do Eu360 */}
        <div
          aria-hidden="true"
          className="
            fixed inset-0 -z-10
            bg-[#ffe1f1]
            bg-[linear-gradient(180deg,#b8236b_0%,#fd2597_42%,#ffe1f1_80%,#fdbed7_100%)]
            bg-no-repeat bg-cover
          "
        />

        {/* overlays premium sutis (opcional, mas consistente) */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none fixed inset-0 -z-10
            bg-[radial-gradient(920px_520px_at_18%_10%,rgba(255,216,230,0.22)_0%,rgba(255,216,230,0)_60%)]
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none fixed inset-0 -z-10
            bg-[radial-gradient(820px_520px_at_78%_22%,rgba(253,37,151,0.14)_0%,rgba(253,37,151,0)_62%)]
          "
        />

        {children}

        <ToastHost />
      </body>
    </html>
  )
}
