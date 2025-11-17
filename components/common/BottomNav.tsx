'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppIcon from '@/components/ui/AppIcon';
import { track } from '@/app/lib/telemetry';

type Item = {
  href: string;
  label: string;
  icon: 'calendar' | 'heart' | 'user';
  center?: boolean;
  match?: (pathname: string) => boolean;
};

/**
 * 3-item bottom navigation with active state, telemetry, and accessibility
 * Center Maternar tab always visible and highlighted
 */
const ITEMS_FORCED: Item[] = [
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
    center: true,
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
  flags?: any; // Ignored; kept for backward compat with layout
  'data-debug-nav'?: string;
  [key: string]: any;
}

export default function BottomNav({
  'data-debug-nav': debugNav,
  ...props
}: BottomNavProps) {
  const pathname = usePathname();
  const items = ITEMS_FORCED; // Always 3 items, always center-highlighted

  const getTabFromHref = (href: string): string => {
    // Map href to tab name (e.g., '/meu-dia' -> 'meu-dia')
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
        fixed inset-x-0 bottom-0 z-50
        bg-white/95 backdrop-blur-md
        border-t border-neutral-200/60
        shadow-[0_-4px_12px_rgba(0,0,0,0.04)]
        safe-area pb-[env(safe-area-inset-bottom,0.75rem)]
      "
      role="navigation"
      aria-label="Main"
      data-debug-nav={debugNav ?? 'count:3;forced:yes'}
    >
      <ul className="mx-auto grid max-w-screen-md grid-cols-3 gap-1">
        {items.map((it) => {
          // Determine active state using custom match function or equality
          const isActive = it.match
            ? it.match(pathname)
            : pathname === it.href;
          const isMaternar = it.href === '/maternar';

          // Maternar tab styling (floating pill hub)
          if (isMaternar) {
            return (
              <li key={it.href} className="flex items-end justify-center">
                <Link
                  href={it.href}
                  onClick={() => handleNavClick(it.href)}
                  className={`
                    flex flex-col items-center justify-center gap-0.5
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
                    transition-all duration-200
                    rounded-full
                    h-14 px-6 -mt-4
                    ${
                      isActive
                        ? 'bg-gradient-to-t from-[#ff005e] to-[#ff7ba8] shadow-lg text-white'
                        : 'bg-white border border-pink-100 shadow-md'
                    }
                  `}
                  aria-label={it.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <AppIcon
                    name={it.icon}
                    size={24}
                    className={isActive ? 'text-white' : 'text-neutral-500'}
                    decorative
                  />
                  <span className={`text-xs font-semibold leading-tight ${
                    isActive ? 'text-white tracking-wide' : 'text-[11px] text-neutral-600 font-medium'
                  }`}>
                    {it.label}
                  </span>
                </Link>
              </li>
            );
          }

          // Other tabs (Meu Dia, Eu360)
          return (
            <li key={it.href} className="flex">
              <Link
                href={it.href}
                onClick={() => handleNavClick(it.href)}
                className={`
                  flex flex-col items-center justify-center gap-0.5
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
                  transition-all duration-200
                  flex-1
                  h-12 px-2
                `}
                aria-label={it.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <AppIcon
                  name={it.icon}
                  size={24}
                  className={
                    isActive
                      ? 'text-[#ff005e]'
                      : 'text-neutral-400'
                  }
                  decorative
                />
                <span className={`text-[11px] font-medium leading-tight ${
                  isActive ? 'text-[#ff005e]' : 'text-neutral-500'
                }`}>
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
