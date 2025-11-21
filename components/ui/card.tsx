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
        'rounded-3xl md:rounded-3xl',
        'bg-[var(--color-page-bg)]',
        'border border-[var(--color-border-soft)]',
        'shadow-[var(--shadow-card-base)]',
        'hover:shadow-[var(--shadow-card-hover-neutral)]',
        'hover:translate-y-[-1px]',
        'p-6',
        'transition-all duration-150 ease-out',
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
      className={clsx('p-5 sm:p-6 border-b border-[var(--color-border-soft)]', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
