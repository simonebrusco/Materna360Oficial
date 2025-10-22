'use client'

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/meu-dia', label: 'Meu Dia', emoji: '🏡' },
  { href: '/cuidar', label: 'Cuidar', emoji: '🌿' },
  { href: '/descobrir', label: 'Descobrir', emoji: '🧸' },
  { href: '/eu360', label: 'Eu360', emoji: '💛' },
]

export function TabBar() {
  const pathname = usePathname()
  const activePath = pathname ?? ''

  return (
    <nav className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2.5rem)] max-w-xl -translate-x-1/2">
      <div className="glass-panel flex items-center justify-between gap-1 rounded-full px-2 py-2 shadow-soft backdrop-blur-2xl">
        {tabs.map((tab) => {
          const isActive = activePath.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-3 py-2 text-[11px] font-semibold transition-all duration-300 ease-gentle ${
                isActive ? 'text-primary' : 'text-support-2/80 hover:text-support-1'
              }`}
            >
              <span
                className={`text-2xl transition-transform duration-500 ease-gentle ${
                  isActive ? 'animate-scale-in' : 'group-hover:-translate-y-1'
                }`}
              >
                {tab.emoji}
              </span>
              <span className="tracking-wide uppercase">{tab.label}</span>
              <span
                className={`absolute inset-x-3 bottom-1 h-1 rounded-full bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] opacity-0 transition-opacity duration-500 blur-md ${
                  isActive ? 'opacity-80' : 'group-hover:opacity-60'
                }`}
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
