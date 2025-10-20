'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const Navigation: React.FC = () => {
  const pathname = usePathname()

  const links = [
    { href: '/meu-dia', label: 'Meu Dia', emoji: '🏡' },
    { href: '/cuidar', label: 'Cuidar', emoji: '🌿' },
    { href: '/descobrir', label: 'Descobrir', emoji: '🎨' },
    { href: '/eu360', label: 'Eu360', emoji: '💛' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary px-4 py-3">
      <div className="max-w-2xl mx-auto flex justify-around">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              pathname === link.href
                ? 'text-primary'
                : 'text-support-2 hover:text-primary'
            }`}
          >
            <span className="text-xl">{link.emoji}</span>
            <span className="text-xs font-semibold">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
