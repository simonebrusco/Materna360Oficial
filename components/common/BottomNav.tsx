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
  { href: '/meu-dia', label: 'Meu Dia', icon: 'calendar' },
  { href: '/maternar', label: 'Maternar', icon: 'hand-heart' },
  { href: '/eu360', label: 'Eu360', icon: 'user' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 flex justify-center md:bottom-6 pointer-events-none">
      <div
        className="
        pointer-events-auto w-[92%] max-w-xl rounded-full
        border border-white/70 
        bg-white/85 
        backdrop-blur-2xl 
        shadow-[0_18px_40px_rgba(0,0,0,0.15)]
        px-3 py-2 flex items-center justify-between
      "
      >
        {TABS.map(tab => {
          const isActive =
            pathname === tab.href ||
            pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex justify-center"
            >
              <div
                className={`
                  flex items-center gap-1.5 rounded-full px-4 py-2
                  text-xs md:text-sm font-semibold transition-all duration-200

                  ${
                    isActive
                      ? 'bg-[var(--color-brand)] text-white shadow-[0_8px_22px_rgba(255,20,117,0.45)] scale-[1.02]'
                      : 'text-[#2F3A56] hover:bg-white/95'
                  }
                `}
              >
                <AppIcon
                  name={tab.icon}
                  className={`
                    h-4 w-4 md:h-5 md:w-5 
                    ${isActive ? 'text-white' : 'text-[var(--color-brand)]'}
                  `}
                />

                <span>{tab.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
