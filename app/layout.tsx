import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Bem-vinda à Materna360',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
