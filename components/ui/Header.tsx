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
  const [isLoadingSticker, setIsLoadingSticker] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>(STICKERS[DEFAULT_STICKER_ID].asset)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!showNotification) {
      return undefined
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
    setImageSrc(STICKERS[DEFAULT_STICKER_ID].asset)
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-gentle backdrop-blur-xl ${
        isScrolled ? 'bg-white/85 shadow-soft' : 'bg-white/40'
      }`}
    >
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          aria-label="Ir para a página inicial"
          className="flex shrink-0 items-center"
          prefetch={false}
        >
          <Image
            src="https://cdn.builder.io/api/v1/image/assets/7d9c3331dcd74ab1a9d29c625c41f24c/9c5c687deb494038abfe036af2f531dc"
            alt="Materna360"
            width={200}
            height={48}
            priority
            sizes="(max-width: 360px) 120px, (max-width: 768px) 160px, 180px"
            style={{ width: 'clamp(120px, 18vw, 180px)', height: 'auto' }}
            className="flex-shrink-0"
          />
        </Link>

        <h1 className="absolute left-1/2 hidden -translate-x-1/2 text-sm font-semibold text-support-2/80 sm:block">
          {title}
        </h1>

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
