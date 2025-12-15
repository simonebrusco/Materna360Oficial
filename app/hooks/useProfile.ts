'use client'

import { useEffect, useState } from 'react'
import { resolveSticker, isProfileStickerId, DEFAULT_STICKER_ID } from '@/app/lib/stickers'

export interface ProfileData {
  name: string
  /**
   * Agora, avatar guarda o ID da vibe/sticker (ex: "mae-leve"),
   * não mais a URL de imagem.
   */
  avatar?: string
  children: string[]
}

/**
 * Hook to safely fetch mother's name, avatar (sticker id), and children names from profile.
 * Uses guards to avoid hydration errors.
 */
export function useProfile(): ProfileData & { isLoading: boolean } {
  const [profile, setProfile] = useState<ProfileData>({ name: '', children: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let isMounted = true

    const loadProfile = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort(new DOMException('Request timeout', 'TimeoutError'))
        }, 5000)

        const response = await fetch('/api/profile', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok && isMounted) {
          const data = await response.json()

          // Resolução robusta do nome:
          let savedName = ''

          if (typeof data?.motherName === 'string' && data.motherName.trim()) {
            savedName = data.motherName
          } else if (typeof data?.nomeMae === 'string' && data.nomeMae.trim()) {
            savedName = data.nomeMae
          } else if (typeof data?.name === 'string' && data.name.trim()) {
            // compat com rotas que salvam "name"
            savedName = data.name
          } else if (
            data?.eu360 &&
            typeof (data.eu360 as any).name === 'string' &&
            (data.eu360 as any).name.trim()
          ) {
            // compat com estrutura aninhada do Eu360
            savedName = (data.eu360 as any).name
          }

          const children = Array.isArray(data?.children) ? data.children : []

          // figurinha/vibe: aceita somente ids válidos
          const figurinhaId = data?.figurinha
          const validStickerId = isProfileStickerId(figurinhaId)
            ? figurinhaId
            : DEFAULT_STICKER_ID

          // Garante fallback robusto (e valida que existe no mapa),
          // mesmo que o retorno não seja usado diretamente aqui.
          resolveSticker(validStickerId)

          setProfile({
            name: savedName.trim(),
            // avatar agora é o ID (ex.: "mae-leve"), usado pela UI para resolver o ícone.
            avatar: validStickerId,
            children,
          })
        } else if (isMounted) {
          // API returned error status, keep default profile
          console.debug('[useProfile] API returned status:', response.status)
        }
      } catch (error) {
        if (isMounted) {
          console.debug('[useProfile] Failed to load profile:', error)
          // Keep default empty profile on error
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    ...profile,
    isLoading,
  }
}
