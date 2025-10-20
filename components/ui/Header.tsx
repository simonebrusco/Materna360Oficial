'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface HeaderProps {
  title: string
  showNotification?: boolean
}

export function Header({ title, showNotification = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          <button
            className="group relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white/70 text-xl text-primary shadow-soft transition-all duration-300 ease-gentle hover:-translate-y-0.5 hover:shadow-elevated"
            aria-label="Notificações"
          >
            <span className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <span className="relative">🔔</span>
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      </div>
    </header>
  )
}
