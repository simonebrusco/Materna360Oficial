// import './globals.css' // TEMPORARILY DISABLED - causing Tailwind compilation hang

export const metadata = { title: 'Materna360' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_72%)] pb-24 antialiased">
        {children}
      </body>
    </html>
  )
}
