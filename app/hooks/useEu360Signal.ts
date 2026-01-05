'use client'

import { useEffect, useState } from 'react'
import { getEu360Signal, type Eu360Signal } from '@/app/lib/eu360Signals.client'

/**
 * Hook único para sincronizar o sinal do Eu360 com o app inteiro.
 * - compatível com eventos antigos e novos
 * - não decide UI: apenas fornece sinal de ritmo/tom
 */
export function useEu360Signal(): Eu360Signal {
  const [signal, setSignal] = useState<Eu360Signal>(() => getEu360Signal())

  useEffect(() => {
    const refresh = () => {
      try {
        setSignal(getEu360Signal())
      } catch {
        // nunca quebra UI
      }
    }

    const onStorage = (_e: StorageEvent) => refresh()
    const onPrefs = () => refresh()
    const onLegacy = () => refresh()

    try {
      window.addEventListener('storage', onStorage)
      window.addEventListener('eu360:prefs-updated', onPrefs as EventListener)
      window.addEventListener('eu360:persona-updated', onLegacy as EventListener) // compat
    } catch {}

    return () => {
      try {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('eu360:prefs-updated', onPrefs as EventListener)
        window.removeEventListener('eu360:persona-updated', onLegacy as EventListener)
      } catch {}
    }
  }, [])

  return signal
}
