import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-support-1 mb-2">Página não encontrada</p>
        <p className="text-support-2 mb-8">Desculpe, não conseguimos encontrar o que você está procurando.</p>
        <Link href="/" className="inline-block">
          <Button variant="primary">
            Voltar ao Início
          </Button>
        </Link>
      </div>
    </div>
  )
}
