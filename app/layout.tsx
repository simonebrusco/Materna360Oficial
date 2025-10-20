import type { Metadata, Viewport } from "next"
import type { Metadata, Viewport } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Um ecossistema digital de bem-estar, organização familiar e desenvolvimento infantil',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="bg-transparent">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative min-h-screen font-sans antialiased text-support-1">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-[-35%] -z-10 h-[420px] bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,0,94,0.18),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-[-30%] -z-10 h-[420px] bg-[radial-gradient(55%_55%_at_50%_50%,rgba(255,216,230,0.55),transparent)]"
        />
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
