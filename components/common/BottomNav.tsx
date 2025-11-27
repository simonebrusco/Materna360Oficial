'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppIcon from '@/components/ui/AppIcon';

type Tab = {
  id: 'meu-dia' | 'maternar' | 'eu360';
  href: string;
  label: string;
  icon: 'calendar' | 'hand-heart' | 'user';
};

const TABS: Tab[] = [
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
    icon: 'hand-heart',
  },
  {
    id: 'eu360',
    href: '/eu360',
    label: 'Eu360',
    icon: 'user',
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/meu-dia') return pathname.startsWith('/meu-dia');
  if (href === '/maternar') return pathname.startsWith('/maternar');
  if (href === '/eu360') return pathname.startsWith('/eu360');
  return false;
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-3 z-[999] flex justify-center px-4 md:px-0">
      <div className="pointer-events-auto w-full max-w-3xl">
        {/* Pílula externa */}
        <div className="relative mx-auto flex items-center justify-center rounded-[999px] border border-white/70 bg-white/90 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),rgba(255,212,234,0.9))] shadow-[0_22px_55px_rgba(0,0,0,0.22)] backdrop-blur-2xl px-2 py-2 md:px-4">
          {/* Glow suave */}
          <div className="pointer-events-none absolute inset-0 rounded-[999px] opacity-70">
            <div className="absolute -left-8 top-0 h-14 w-14 rounded-full bg-[rgba(255,20,117,0.18)] blur-2xl" />
            <div className="absolute -right-10 bottom-0 h-16 w-16 rounded-full bg-[rgba(155,77,150,0.18)] blur-3xl" />
          </div>

          {/* Tabs */}
          <div className="relative z-10 grid w-full grid-cols-3 gap-2">
            {TABS.map(tab => {
              const active = isActive(pathname, tab.href);

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`
                    group inline-flex items-center justify-center gap-2 rounded-[999px] px-4 py-2
                    text-xs md:text-sm font-semibold transition-all duration-150
                    ${active
                      ? 'bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(255,20,117,0.55)]'
                      : 'bg-transparent text-[var(--color-text-main)] hover:bg-white/90 hover:shadow-[0_8px_20px_rgba(0,0,0,0.10)]'}
                  `}
                  aria-label={tab.label}
                >
                  <AppIcon
                    name={tab.icon}
                    className={`
                      h-4 w-4 md:h-5 md:w-5
                      ${active ? 'text-white' : 'text-[var(--color-brand)] group-hover:text-[var(--color-brand-deep)]'}
                    `}
                    decorative
                  />
                  <span
                    className={`
                      leading-none
                      ${active ? 'text-white' : 'text-[var(--color-text-main)] group-hover:text-[var(--color-brand-deep)]'}
                    `}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
