'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

type CuidarErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CuidarError({ error, reset }: CuidarErrorProps) {
  useEffect(() => {
    console.error('Erro na página Cuide-se:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold text-support-1">Ops! Algo saiu diferente do esperado.</h2>
      <p className="max-w-md text-sm text-support-2">
        Tente novamente em instantes. Se o problema persistir, atualize a página ou volte mais tarde.
      </p>
      <Button type="button" variant="secondary" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  )
}
