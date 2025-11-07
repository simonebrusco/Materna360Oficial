'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppIcon from '@/components/ui/AppIcon';
import { isEnabled } from '@/app/lib/flags';

type Item = { href: string; label: string; icon: 'star' | 'care' | 'books' | 'crown' | 'home'; center?: boolean };

const ITEMS_WITHOUT_HUB: Item[] = [
  { href: '/meu-dia',    label: 'Meu Dia',   icon: 'star'  },
  { href: '/cuidar',     label: 'Cuidar',    icon: 'care'  },
  { href: '/descobrir',  label: 'Descobrir', icon: 'books' },
  { href: '/eu360',      label: 'Eu360',     icon: 'crown' },
];

const ITEMS_WITH_HUB: Item[] = [
  { href: '/meu-dia',    label: 'Meu Dia',   icon: 'star'  },
  { href: '/cuidar',     label: 'Cuidar',    icon: 'care'  },
  { href: '/maternar',   label: 'Maternar',  icon: 'home', center: true },
  { href: '/descobrir',  label: 'Descobrir', icon: 'books' },
  { href: '/eu360',      label: 'Eu360',     icon: 'crown' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const showHub = isEnabled('FF_MATERNAR_HUB');
  const items = showHub ? ITEMS_WITH_HUB : ITEMS_WITHOUT_HUB;

  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-50
        border-t bg-white/90 backdrop-blur
        shadow-[0_-2px_16px_rgba(47,58,86,0.06)]
      "
      role="navigation" aria-label="Main"
    >
      <ul className={`mx-auto grid max-w-screen-md ${showHub ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== '/' && pathname?.startsWith(it.href));
          const isCenter = it.center ?? false;

          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`
                  flex flex-col items-center justify-center gap-1
                  text-[11px] sm:text-xs
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60
                  transition-all duration-200
                  ${isCenter ? 'h-16 -mt-2' : 'h-14'}
                `}
                aria-label={it.label}
                aria-current={active ? 'page' : undefined}
              >
                <AppIcon
                  name={it.icon}
                  size={isCenter ? 32 : 24}
                  className={
                    isCenter
                      ? 'text-primary'
                      : active ? 'text-primary' : 'text-support-2'
                  }
                  decorative
                />
                <span className={
                  isCenter
                    ? 'text-primary font-semibold'
                    : active ? 'text-pink-600' : 'text-slate-500'
                }>
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
