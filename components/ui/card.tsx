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
        'rounded-3xl',
        'bg-white',
        'border border-[#FFE8F2]',
        'shadow-sm',
        'hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]',
        'hover:translate-y-[-1px]',
        'p-6',
        'transition-all duration-200 ease-out',
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
      className={clsx(
        'p-5 sm:p-6',
        'border-b border-[#FFE8F2]',
        'bg-white',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
