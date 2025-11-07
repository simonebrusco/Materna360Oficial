'use client';

import clsx from 'clsx';
import React from 'react';

export interface FilterPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

export function FilterPill({
  active = false,
  children,
  className,
  ...rest
}: FilterPillProps) {
  return (
    <button
      className={clsx(
        'px-3 py-1.5 rounded-[var(--radius-pill)] border text-sm font-medium',
        'transition-all duration-200',
        'bg-white hover:bg-[var(--color-primary-weak)]/40',
        active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-weak)]/60 text-[var(--color-ink-1)]'
          : 'border-[var(--border-soft-gray)] text-[var(--color-ink-2)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/60',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
