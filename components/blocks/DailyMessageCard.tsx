'use client'

import { useEffect } from 'react'

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
    <>
      <h2 className="m360-card-title mb-3">Mensagem de Hoje</h2>
      <p className="text-neutral-600 text-sm italic leading-relaxed" data-testid="message-of-day">"{greeting}"</p>
      <span className="text-neutral-400 text-xs mt-2 block">Atualizada automaticamente a cada novo dia.</span>
    </>
  )
}
