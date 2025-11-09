import '@/app/globals.css'
import type { Metadata } from 'next'
import { ToastHost } from '@/components/ui/toast/ToastHost'

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Soft luxury experience for conscious parenting',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        {/* Page content */}
        {children}

        {/* Global, non-blocking toasts */}
        <ToastHost />
      </body>
    </html>
  )
}
