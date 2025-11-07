'use client';

import clsx from 'clsx';
import React from 'react';
import AppIcon from '@/components/ui/AppIcon';

export interface EmptyStateProps {
  title: string;
  text?: string;
  icon?: any;
  cta?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  text,
  icon = 'inbox',
  cta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'text-center rounded-[var(--radius-card)] md:rounded-[var(--radius-card-lg)]',
        'border border-[var(--border-soft-gray)] bg-white/80',
        'p-8 md:p-12',
        className
      )}
    >
      <div className="mx-auto mb-4 w-12 h-12 md:w-16 md:h-16 rounded-full bg-[var(--color-primary-weak)]/40 flex items-center justify-center">
        <AppIcon name={icon} size={24} decorative />
      </div>
      <h3 className="text-base md:text-lg font-semibold text-[var(--color-ink-1)]">
        {title}
      </h3>
      {text && (
        <p className="mt-2 text-sm md:text-base text-[var(--color-ink-2)]">
          {text}
        </p>
      )}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}
