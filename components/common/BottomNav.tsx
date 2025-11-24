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
 * 3-item premium dock navigation
 * Agora em versão mais estática (não flutuante pela tela)
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
        w-full
        bg-white/92 backdrop-blur-2xl
        border-t border-[#FFD8E6]
        shadow-[0_-10px_30px_rgba(0,0,0,0.14)]
      "
      role="navigation"
      aria-label="Main navigation"
      data-debug-nav={debugNav ?? 'count:3;premium-dock-static'}
      {...props}
    >
      <ul className="flex items-center justify-between gap-2 px-4 py-3 max-w-3xl mx-auto">
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
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1475]/60
                  active:scale-95
                  ${
                    isActive
                      ? 'bg-[#FF1475]/10 border border-[#FF1475]/40 shadow-[0_0_18px_rgba(253,37,151,0.35)]'
                      : 'bg-transparent border border-transparent hover:opacity-85'
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
                      ? 'text-[#FF1475] transition-all duration-200'
                      : 'text-[#545454]/70 transition-all duration-200'
                  }
                  decorative
                />
                <span
                  className={`
                    text-[11px] leading-tight transition-all duration-200
                    ${
                      isActive
                        ? 'font-semibold text-[#FF1475]'
                        : 'font-medium text-[#545454] opacity-80'
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
