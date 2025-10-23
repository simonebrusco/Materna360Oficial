import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Cuidado e bem-estar para mães',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-pink-50/60 to-white antialiased">
        {children}
      </body>
    </html>
  )
}
