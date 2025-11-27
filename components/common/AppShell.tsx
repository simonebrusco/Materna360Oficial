'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon';

type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: KnownIconName;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: 'meu-dia',
    href: '/meu-dia',
    label: 'Meu Dia',
    icon: 'calendar',
  },
  {
    id: 'maternar',
    href: '/maternar',
    label: 'Maternar',
    icon: 'heart',
  },
  {
    id: 'eu360',
    href: '/eu360',
    label: 'Eu360',
    icon: 'user',
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center">
      <div className="pointer-events-auto mx-auto mb-4 w-[min(460px,100%-32px)] rounded-full border border-white/85 bg-white/95 bg-[radial-gradient(circle_at_top_left,#FFE8F2_0,#FFFFFF_45%,#FFE0F0_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.22)] px-3 py-2 flex items-center justify-between">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-1 items-center justify-center"
            >
              <button
                type="button"
                className={[
                  'flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2 text-xs md:text-sm font-semibold transition-all duration-150',
                  active
                    ? 'bg-[radial-gradient(circle_at_top,#FF4B9A_0,#FF1475_40%,#E6005F_100%)] text-white shadow-[0_10px_26px_rgba(255,20,117,0.55)] -translate-y-[2px]'
                    : 'bg-transparent text-[var(--color-text-main)]/85 hover:text-[var(--color-brand)]',
                ].join(' ')}
              >
                <AppIcon
                  name={item.icon}
                  className={
                    active
                      ? 'h-4 w-4 md:h-5 md:w-5 text-white'
                      : 'h-4 w-4 md:h-5 md:w-5 text-[var(--color-brand)]/80'
                  }
                />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
