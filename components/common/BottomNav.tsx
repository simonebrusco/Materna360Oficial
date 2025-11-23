'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppIcon from '@/components/ui/AppIcon';
import { track } from '@/app/lib/telemetry';

type Item = {
  href: string;
  label: string;
  icon: 'calendar' | 'heart' | 'user';
  match?: (pathname: string) => boolean;
};

/**
 * 3-item premium floating dock navigation
 * Mobile-first design with floating pill bar style
 */
const ITEMS: Item[] = [
  {
    href: '/meu-dia',
    label: 'Meu Dia',
    icon: 'calendar',
    match: (p: string) => p === '/meu-dia',
  },
  {
    href: '/maternar',
    label: 'Maternar',
    icon: 'heart',
    match: (p: string) => p.startsWith('/maternar'),
  },
  {
    href: '/eu360',
    label: 'Eu360',
    icon: 'user',
    match: (p: string) => p === '/eu360' || p.startsWith('/eu360/'),
  },
];

interface BottomNavProps {
  flags?: any;
  'data-debug-nav'?: string;
  [key: string]: any;
}

export default function BottomNav({
  'data-debug-nav': debugNav,
  ...props
}: BottomNavProps) {
  const pathname = usePathname();

  const getTabFromHref = (href: string): string => {
    return href.split('/')[1] || href;
  };

  const handleNavClick = (href: string) => {
    const tab = getTabFromHref(href);
    track('nav.click', {
      tab,
      dest: href,
    });
  };

  return (
    <nav
      className="
        fixed bottom-4 inset-x-4
        z-50
        bg-white/90 backdrop-blur-xl
        border border-black/5 border-t-2 border-t-[var(--color-soft-strong)]
        rounded-3xl
        shadow-[0_10px_40px_rgba(0,0,0,0.18)]
      "
      role="navigation"
      aria-label="Main navigation"
      data-debug-nav={debugNav ?? 'count:3;floating-dock'}
      {...props}
    >
      <ul className="flex items-center justify-between gap-2 px-4 py-3 max-w-4xl mx-auto">
        {ITEMS.map((item) => {
          const isActive = item.match
            ? item.match(pathname)
            : pathname === item.href;

          return (
            <li key={item.href} className="flex-1 flex justify-center">
              <Link
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`
                  flex flex-col items-center justify-center gap-1
                  px-3 py-2
                  rounded-2xl
                  transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
                  active:scale-95
                  ${
                    isActive
                      ? 'bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/40 shadow-[0_0_18px_rgba(253,37,151,0.35)]'
                      : 'bg-transparent border border-transparent hover:opacity-80'
                  }
                `}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <AppIcon
                  name={item.icon}
                  size={isActive ? 18 : 16}
                  className={
                    isActive
                      ? 'text-[var(--color-brand)] transition-all duration-200'
                      : 'text-[var(--color-text-muted)]/70 transition-all duration-200'
                  }
                  decorative
                />
                <span
                  className={`
                    text-[11px] leading-tight transition-all duration-200
                    ${
                      isActive
                        ? 'font-semibold text-[var(--color-brand)]'
                        : 'font-medium text-[var(--color-text-muted)] opacity-80'
                    }
                  `}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
