'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const tabs = [
  { href: '/meu-dia', label: 'Meu Dia', emoji: '🏡' },
  { href: '/cuidar', label: 'Cuidar', emoji: '🌿' },
  { href: '/descobrir', label: 'Descobrir', emoji: '🧸' },
  { href: '/eu360', label: 'Eu360', emoji: '💛' },
]

export function TabBar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary z-50">
      <div className="max-w-4xl mx-auto px-2 flex justify-around items-stretch">
        {tabs.map((tab) => {
          const active = mounted && isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 md:py-4 px-2 border-t-2 transition-colors ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-support-2 hover:text-primary'
              }`}
              aria-label={tab.label}
            >
              <span className="text-2xl md:text-xl">{tab.emoji}</span>
              <span className="text-xs md:text-sm font-semibold mt-1">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
