import Link from 'next/link'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-2 text-xl text-support-1">Página não encontrada</p>
        <p className="mb-8 text-support-2">Desculpe, não conseguimos encontrar o que você está procurando.</p>
        <Link href="/" className="inline-block">
          <Button variant="primary">Voltar ao Início</Button>
        </Link>
      </div>
    </div>
  )
}
