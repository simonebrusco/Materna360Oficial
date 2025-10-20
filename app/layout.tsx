import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Materna360",
  description: "Um ecossistema digital de bem-estar, organização familiar e desenvolvimento infantil",
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
