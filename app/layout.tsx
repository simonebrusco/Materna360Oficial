import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { inter } from './fonts'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Bem-vinda ao Materna360',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter?.variable ?? ''}>
      <body className={`${inter?.className ?? ''} bg-[#FFF9FB] text-support-1 antialiased`}>
        {children}
      </body>
    </html>
  )
}
