'use client';

import clsx from 'clsx';

export interface StatTileProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatTile({ value, label, icon, className }: StatTileProps) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-card)] md:rounded-[var(--radius-card-lg)]',
        'border border-[var(--border-soft-gray)] bg-white/90 backdrop-blur-sm',
        'p-5 sm:p-6 text-center',
        'shadow-[var(--shadow-press)] transition-shadow duration-200 hover:shadow-[var(--shadow-card)]',
        className
      )}
    >
      {icon && <div className="mb-2 flex justify-center">{icon}</div>}
      <div className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] mb-1">
        {value}
      </div>
      <div className="text-xs sm:text-sm text-[var(--color-ink-2)] font-medium">
        {label}
      </div>
    </div>
  );
}
