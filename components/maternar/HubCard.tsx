'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon';
import { track } from '@/app/lib/telemetry';

export interface HubCardProps {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  href: string;
  gated?: boolean;
  cardId: string;
}

export default function HubCard({
  icon,
  title,
  subtitle,
  href,
  gated = false,
  cardId,
}: HubCardProps) {
  const handleClick = () => {
    track('nav.click', {
      tab: 'maternar',
      card: cardId,
      dest: href,
    });
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="
        group relative block rounded-2xl overflow-hidden
        border border-white/60 bg-white/80 backdrop-blur-sm
        shadow-[0_4px_24px_rgba(47,58,86,0.08)]
        hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)]
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
        p-3 md:p-5
        min-h-[140px] md:min-h-[160px]
        ui-press ui-ring
      "
      aria-label={subtitle ? `${title}: ${subtitle}` : title}
    >
      {gated && (
        <div className="absolute inset-0 backdrop-blur-sm bg-white/40 rounded-2xl z-10 flex items-center justify-center">
          <div className="bg-white rounded-xl p-3 shadow-lg text-center max-w-xs">
            <p className="text-xs font-semibold text-support-1 mb-1">
              Recurso Premium
            </p>
            <p className="text-[10px] text-support-2">
              Conheça os planos
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full relative z-0">
        <div className="mb-2 md:mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <AppIcon
              name={icon}
              size={28}
              variant="brand"
              decorative
            />
          </div>
        </div>

        <h3 className="text-base md:text-lg font-semibold text-support-1 mb-1 line-clamp-2 leading-tight">
          {title}
        </h3>

        {subtitle && (
          <p className="text-xs md:text-sm text-support-2 line-clamp-2 flex-1 leading-tight">
            {subtitle}
          </p>
        )}

        <div className="mt-auto pt-2 md:pt-3 text-primary text-xs md:text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Acessar →
          <AppIcon
            name="chevron"
            size={16}
            variant="brand"
            decorative
          />
        </div>
      </div>
    </Link>
  );
}
