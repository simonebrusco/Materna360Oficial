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
        'bg-white hover:bg-[#FFD3E6]/30',
        active
          ? 'border-[#FF1475] bg-[#FFD3E6]/50 text-[#3A3A3A]'
          : 'border-[#FFE8F2] text-[#6A6A6A]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1475]/50',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
