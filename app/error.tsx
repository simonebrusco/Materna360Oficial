'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-page-bg)]">
      <div className="rounded-2xl bg-white border border-white/60 shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-8 max-w-md text-center">
        <h2 className="text-2xl font-semibold text-support-1">Parece que algo não funcionou como esperado.</h2>
        <p className="mt-3 text-sm text-support-2">Tente novamente ou volte para a página anterior.</p>
        <Button
          onClick={() => reset()}
          variant="primary"
          className="mt-6 w-full"
        >
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
