import type { Metadata } from 'next'

import './globals.css'
import type { Metadata } from 'next'

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
      <body>{children}</body>
    </html>
  )
}
