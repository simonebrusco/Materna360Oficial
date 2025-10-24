import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Cuidado e acolhimento para a maternidade.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
