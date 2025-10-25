'use client'

'use client'

import { useEffect } from 'react'

import { Card } from '@/components/ui/card'

type GreetingProps = {
  greeting: string
}

export default function DailyMessageCard({ greeting }: GreetingProps) {
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0)
    const timeoutId = window.setTimeout(() => window.location.reload(), delay)

    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <Card data-testid="message-of-day" className="relative overflow-hidden bg-gradient-to-br from-secondary/80 via-white/95 to-white">
      <div className="flex flex-col gap-3 md:gap-4">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">✨ Mensagem de Hoje</h2>
        <p className="text-sm italic leading-relaxed text-support-1/90 md:text-base">“{greeting}”</p>
        <span className="text-xs text-support-2/70 md:text-sm">Atualizada automaticamente a cada novo dia.</span>
      </div>
      <span className="pointer-events-none absolute -right-6 bottom-4 h-24 w-24 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute -left-8 top-2 h-16 w-16 rounded-3xl bg-white/60 blur-2xl" aria-hidden />
    </Card>
  )
}
