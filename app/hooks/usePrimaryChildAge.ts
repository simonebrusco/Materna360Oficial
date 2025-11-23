'use client'

import { useEffect, useState } from 'react'

export type AgeRangeKey = '0-1' | '1-3' | '3-6' | '6-8' | '8+'

type HookResult = {
  ageMonths: number | null
  ageRange: AgeRangeKey | null
  isLoading: boolean
}

/**
 * Lê a idade principal do filho a partir de /api/eu360/profile.
 * - Usa age_months quando existir
 * - Caso não exista, tenta pegar children[0].idadeMeses
 * - Sempre falha de forma suave (null) para não quebrar layout
 */
export function usePrimaryChildAge(): HookResult {
  const [ageMonths, setAgeMonths] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let isMounted = true

    const load = async () => {
      try {
        const res = await fetch('/api/eu360/profile', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!res.ok || !isMounted) {
          return
        }

        const data = await res.json()

        let resolvedAge: number | null = null

        // 1) Tenta usar age_months direto
        if (
          typeof data?.age_months === 'number' &&
          Number.isFinite(data.age_months) &&
          data.age_months >= 0
        ) {
          resolvedAge = Math.floor(data.age_months)
        } else if (Array.isArray(data?.children) && data.children.length > 0) {
          // 2) Fallback: tenta 1º filho da lista
          const firstChild = data.children[0] as any
          const childAge = firstChild?.idadeMeses

          if (
            typeof childAge === 'number' &&
            Number.isFinite(childAge) &&
            childAge >= 0
          ) {
            resolvedAge = Math.floor(childAge)
          }
        }

        if (isMounted) {
          setAgeMonths(resolvedAge)
        }
      } catch (error) {
        if (isMounted) {
          console.debug('[usePrimaryChildAge] Failed to load age:', error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [])

  const ageRange: AgeRangeKey | null =
    ageMonths === null
      ? null
      : ageMonths < 12
      ? '0-1'
      : ageMonths < 36
      ? '1-3'
      : ageMonths < 72
      ? '3-6'
      : ageMonths < 96
      ? '6-8'
      : '8+'

  return {
    ageMonths,
    ageRange,
    isLoading,
  }
}
