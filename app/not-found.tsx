import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-soft-page">
      <div className="rounded-2xl bg-white border border-white/60 shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-8 max-w-md text-center">
        <h2 className="text-2xl font-semibold text-support-1">Não encontramos esta página.</h2>
        <p className="mt-3 text-sm text-support-2">Volte e continue sua jornada.</p>
        <Link href="/" className="mt-6 block">
          <Button variant="primary" className="w-full">
            Voltar para o início
          </Button>
        </Link>
      </div>
    </div>
  )
}
