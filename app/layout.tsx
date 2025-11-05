import './globals.css'
import RuntimeFlagBanner from '@/components/dev/RuntimeFlagBanner'

export const metadata = { title: 'Materna360' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isProduction = process.env.NODE_ENV === 'production'
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_72%)] pb-24 antialiased">
        {!isProduction && <RuntimeFlagBanner />}
        {children}
      </body>
    </html>
  )
}
