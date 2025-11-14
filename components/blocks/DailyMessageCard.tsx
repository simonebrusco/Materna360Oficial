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
    <Card data-testid="message-of-day" className="rounded-2xl bg-white shadow-sm border border-neutral-200/40 p-5">
      <div className="flex flex-col gap-3">
        <h2 className="text-neutral-900 text-base font-semibold">Mensagem de Hoje</h2>
        <p className="text-neutral-600 text-sm italic leading-relaxed">"{greeting}"</p>
        <span className="text-neutral-400 text-xs mt-2">Atualizada automaticamente a cada novo dia.</span>
      </div>
    </Card>
  )
}
