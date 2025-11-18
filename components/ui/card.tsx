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
        'rounded-[22px]',
        'bg-white',
        'shadow-[0_2px_8px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.05)]',
        'hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]',
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
      className={clsx('p-5 sm:p-6 border-b border-[var(--border-soft-gray)]', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
