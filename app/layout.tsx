import './styles/_base.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Poppins, Quicksand } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
})

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-quicksand',
})

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
    <html lang="pt-BR" className={`${poppins.variable} ${quicksand.variable}`}>
      <body>{children}</body>
    </html>
  )
}
