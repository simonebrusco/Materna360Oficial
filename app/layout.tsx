import './globals.css'
import type { Metadata } from 'next'
// import { ToastHost } from '@/components/ui/toast/ToastHost'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Soft Luxury Materna360',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-dvh bg-soft-page text-[#2f3a56] antialiased">
        {children}
        {/* <ToastHost /> */}
      </body>
    </html>
  )
}
