'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon';
import { trackTelemetry } from '@/app/lib/telemetry';

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
    trackTelemetry('maternar.card_click', {
      card: cardId,
      href,
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
        p-5 sm:p-6
        min-h-[160px] sm:min-h-[180px]
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
        <div className="mb-3 sm:mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <AppIcon
              name={icon}
              size={28}
              variant="brand"
              decorative
            />
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-semibold text-support-1 mb-1 line-clamp-2">
          {title}
        </h3>

        {subtitle && (
          <p className="text-sm text-support-2 line-clamp-2 flex-1">
            {subtitle}
          </p>
        )}

        <div className="mt-auto pt-3 text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
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
