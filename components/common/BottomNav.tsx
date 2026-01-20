'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AppIcon from '@/components/ui/AppIcon'

type NavItem = {
  href: string
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/meu-dia', label: 'Meu Dia', icon: 'calendar' },
  { href: '/maternar', label: 'Maternar', icon: 'hand-heart' },
  { href: '/cuidar', label: 'Cuidar', icon: 'sparkles' },
  { href: '/descobrir', label: 'Descobrir', icon: 'compass' },
  { href: '/eu360', label: 'Eu360', icon: 'user' },
]

function isActivePath(pathname: string, href: string) {
  if (!pathname) return false
  if (href === '/') return pathname === '/'
  if (pathname === href) return true
  // ativa também em subrotas, ex: /maternar/meu-filho
  return pathname.startsWith(href + '/')
}

export default function BottomNav() {
  const pathname = usePathname() || ''

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        border-t border-white/60
        bg-white/80 backdrop-blur-xl
        shadow-[0_-10px_30px_rgba(0,0,0,0.10)]
      "
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-xl items-center justify-between px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="
                flex flex-1 flex-col items-center justify-center
                gap-1 rounded-2xl px-2 py-2
                transition
              "
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={[
                  'inline-flex h-9 w-9 items-center justify-center rounded-2xl transition',
                  active ? 'bg-[#ffd8e6] text-[#ff005e]' : 'bg-white/0 text-[#2f3a56]',
                ].join(' ')}
              >
                <AppIcon name={item.icon as any} size={20} />
              </span>

              <span
                className={[
                  'text-[11px] font-semibold transition',
                  active ? 'text-[#ff005e]' : 'text-[#2f3a56]',
                ].join(' ')}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
