'use client';

import clsx from 'clsx';
import React from 'react';

export interface SoftCardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  children: React.ReactNode;
}

export function SoftCard({
  as: As = 'div',
  className,
  children,
  ...rest
}: SoftCardProps) {
  const Component = As;

  return (
    <Component
      className={clsx(
        'rounded-[22px] md:rounded-[22px] sm:rounded-[26px]',
        'bg-white',
        'shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08),0_12px_36px_rgba(0,0,0,0.08)]',
        'hover:shadow-[0_6px_16px_rgba(0,0,0,0.07),0_10px_28px_rgba(0,0,0,0.1),0_14px_40px_rgba(0,0,0,0.1)]',
        'hover:translate-y-[-2px]',
        'filter drop-shadow-[0_12px_24px_rgba(255,0,94,0.05)]',
        'p-6',
        'transition-all duration-150 ease-out',
        'sm:mb-7',
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

// Backward compatibility alias
export const Card = SoftCard;
export default SoftCard;

export function SoftCardContent({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('p-5 sm:p-6', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SoftCardHeader({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('p-5 sm:p-6 border-b border-[var(--border-soft-gray)]', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
