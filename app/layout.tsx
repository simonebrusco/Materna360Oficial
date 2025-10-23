import './globals.css'
import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Cuidado e bem-estar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-pink-50/60 to-white text-support-1 antialiased">
        {children}
      </body>
    </html>
  )
}
