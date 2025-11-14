'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppIcon from '@/components/ui/AppIcon';
import { track } from '@/app/lib/telemetry';

type Item = {
  href: string;
  label: string;
  icon: 'star' | 'care' | 'books' | 'crown' | 'home';
  center?: boolean;
  match?: (pathname: string) => boolean;
};

/**
 * 5-item bottom navigation with active state, telemetry, and accessibility
 * Center Maternar tab always visible and highlighted
 */
const ITEMS_FORCED: Item[] = [
  {
    href: '/meu-dia',
    label: 'Meu Dia',
    icon: 'star',
    match: (p: string) => p === '/meu-dia',
  },
  {
    href: '/cuidar',
    label: 'Cuidar',
    icon: 'care',
    match: (p: string) => p === '/cuidar',
  },
  {
    href: '/maternar',
    label: 'Maternar',
    icon: 'home',
    center: true,
    match: (p: string) => p.startsWith('/maternar'),
  },
  {
    href: '/descobrir',
    label: 'Descobrir',
    icon: 'books',
    match: (p: string) => p.startsWith('/descobrir'),
  },
  {
    href: '/eu360',
    label: 'Eu360',
    icon: 'crown',
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
  const items = ITEMS_FORCED; // Always 5 items, always center-highlighted

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
      data-debug-nav={debugNav ?? 'count:5;forced:yes'}
    >
      <ul className="mx-auto grid max-w-screen-md grid-cols-5 gap-1">
        {items.map((it) => {
          // Determine active state using custom match function or equality
          const isActive = it.match
            ? it.match(pathname)
            : pathname === it.href;
          const isCenter = it.center ?? false;

          return (
            <li key={it.href} className="flex">
              <Link
                href={it.href}
                onClick={() => handleNavClick(it.href)}
                className={`
                  flex flex-col items-center justify-center
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
                  transition-all duration-200
                  flex-1
                  ${isCenter ? 'py-1 -mt-2 h-16' : 'py-1.5 h-14'}
                  ${
                    isActive
                      ? 'rounded-full bg-white/90 shadow-sm px-3 py-1'
                      : ''
                  }
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
                <span className={`block mt-0.5 text-xs font-medium leading-tight ${
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
