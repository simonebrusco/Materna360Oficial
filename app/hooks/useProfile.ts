'use client'

'use client'

import { useEffect, useState } from 'react'
import { resolveSticker, isProfileStickerId, DEFAULT_STICKER_ID } from '@/app/lib/stickers'

export interface ProfileData {
  name: string
  avatar?: string
  children: string[]
}

/**
 * Hook to safely fetch mother's name, avatar, and children names from profile.
 * Uses guards to avoid hydration errors.
 */
export function useProfile(): ProfileData & { isLoading: boolean } {
  const [profile, setProfile] = useState<ProfileData>({ name: '', children: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

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
          const savedName =
            typeof data?.motherName === 'string'
              ? data.motherName
              : typeof data?.nomeMae === 'string'
                ? data.nomeMae
                : ''

          const children = Array.isArray(data?.children) ? data.children : []

          const figurinhaId = data?.figurinha
          const validStickerIdId = isProfileStickerId(figurinhaId) ? figurinhaId : DEFAULT_STICKER_ID
          const sticker = resolveSticker(validStickerIdId)

          setProfile({
            name: savedName.trim(),
            avatar: sticker.asset,
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
        if (isMounted) {
          setIsLoading(false)
        }
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
