import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@/app/lib/telemetryServer'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Um ecossistema digital de bem-estar familiar',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
