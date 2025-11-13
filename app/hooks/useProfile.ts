'use client'

import { useEffect, useState } from 'react'

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
        const response = await fetch('/api/profile', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.ok && isMounted) {
          const data = await response.json()
          const savedName =
            typeof data?.motherName === 'string'
              ? data.motherName
              : typeof data?.nomeMae === 'string'
                ? data.nomeMae
                : ''

          const children = Array.isArray(data?.children) ? data.children : []

          setProfile({
            name: savedName.trim(),
            avatar: data?.avatar || undefined,
            children,
          })
        }
      } catch (error) {
        if (isMounted) {
          console.debug('[useProfile] Failed to load profile:', error)
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
