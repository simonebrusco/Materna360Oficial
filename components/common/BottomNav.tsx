'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon';

type Tab = {
  href: string;
  label: string;
  icon: KnownIconName;
};

const TABS: Tab[] = [
  {
    href: '/meu-dia',
    label: 'Meu Dia',
    icon: 'calendar',
  },
  {
    href: '/maternar',
    label: 'Maternar',
    icon: 'hand-heart',
  },
  {
    href: '/eu360',
    label: 'Eu360',
    icon: 'user',
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 flex justify-center md:bottom-6 pointer-events-none">
      <div className="pointer-events-auto w-[92%] max-w-xl rounded-full border border-white/80 bg-white/70 px-2.5 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-1.5">
          {TABS.map(tab => {
            const isActive =
              pathname === tab.href || pathname.startsWith(`${tab.href}/`);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1"
              >
                <div
                  className={`relative flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs md:text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(255,20,117,0.45)]'
                      : 'text-[var(--color-text-main)] hover:bg-white/90'
                  }`}
                >
                  <AppIcon
                    name={tab.icon}
                    className={`h-4 w-4 md:h-5 md:w-5 ${
                      isActive
                        ? 'text-white'
                        : 'text-[var(--color-brand)]'
                    }`}
                  />
                  <span>{tab.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
