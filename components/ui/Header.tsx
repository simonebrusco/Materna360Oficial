'use client'

'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import {
  DEFAULT_STICKER_ID,
  STICKERS,
  isProfileStickerId,
  resolveSticker,
} from '@/app/lib/stickers'

interface HeaderProps {
  title: string
  showNotification?: boolean
}

const PROFILE_UPDATED_EVENT = 'materna:profile-updated'

export function Header({ title, showNotification = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [stickerId, setStickerId] = useState<string>(DEFAULT_STICKER_ID)
  const [isLoadingSticker, setIsLoadingSticker] = useState<boolean>(false)
  const [imageSrc, setImageSrc] = useState<string>(STICKERS[DEFAULT_STICKER_ID].asset)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!showNotification) {
      return
    }

    let isMounted = true

    const loadProfile = async () => {
      setIsLoadingSticker(true)
      try {
        const response = await fetch('/api/profile', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Falha ao carregar perfil')
        }

        const data = await response.json()
        if (!isMounted) {
          return
        }

        const nextStickerId = isProfileStickerId(data?.figurinha) ? data.figurinha : DEFAULT_STICKER_ID
        setStickerId(nextStickerId)
      } catch (error) {
        console.error('Não foi possível obter o perfil para a figurinha:', error)
        if (isMounted) {
          setStickerId(DEFAULT_STICKER_ID)
        }
      } finally {
        if (isMounted) {
          setIsLoadingSticker(false)
        }
      }
    }

    const handleProfileUpdated = (event: Event) => {
      if (!isMounted) {
        return
      }

      const customEvent = event as CustomEvent<{ figurinha?: string }>
      const figurinhaId = customEvent.detail?.figurinha
      setStickerId(isProfileStickerId(figurinhaId) ? figurinhaId : DEFAULT_STICKER_ID)
    }

    void loadProfile()

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated)

    return () => {
      isMounted = false
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated)
    }
  }, [showNotification])

  const sticker = useMemo(() => resolveSticker(stickerId), [stickerId])

  useEffect(() => {
    setImageSrc(sticker.asset)
  }, [sticker.asset])

  const handleImageError = () => {
    if (imageSrc !== STICKERS[DEFAULT_STICKER_ID].asset) {
      setImageSrc(STICKERS[DEFAULT_STICKER_ID].asset)
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-gentle backdrop-blur-xl ${
        isScrolled ? 'bg-white/85 shadow-soft' : 'bg-white/40'
      }`}
    >
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-[#ff2f78] to-[#ff7faa] text-lg font-semibold text-white shadow-glow animate-float">
            M
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary/70 animate-fade-down">
              Materna360
            </span>
            <span className="text-lg font-semibold text-support-1 animate-fade-down" style={{ animationDelay: '0.05s' }}>
              {title}
            </span>
          </span>
        </Link>

        {showNotification && (
          <div className="flex items-center gap-3">
            <Link
              href="/eu360"
              prefetch={false}
              className="group relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white/70 text-primary shadow-soft transition-all duration-300 ease-gentle hover:-translate-y-0.5 hover:shadow-elevated"
              aria-label={`Figurinha de perfil: ${sticker.label}`}
            >
              <span className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="absolute inset-0 rounded-full border border-white/60" aria-hidden />
              {isLoadingSticker ? (
                <span className="h-5 w-5 animate-pulse rounded-full bg-primary/30" aria-hidden />
              ) : (
                <Image
                  key={imageSrc}
                  src={imageSrc}
                  alt={sticker.label}
                  width={44}
                  height={44}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                  priority
                  onError={handleImageError}
                />
              )}
            </Link>

            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary shadow-soft">
              {sticker.label}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      </div>
    </header>
  )
}
