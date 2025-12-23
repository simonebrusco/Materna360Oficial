import type { Metadata } from 'next'
import MinhaJornadaClient from './Client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Minha Jornada | Materna360',
  description: 'Um olhar leve sobre seus pequenos passos, conquistas e presença ao longo do tempo.',
}

export default function MinhaJornadaPage() {
  return <MinhaJornadaClient />
}
