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
        'rounded-[var(--radius-card)] md:rounded-[var(--radius-card-lg)]',
        'border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
        'border-[var(--border-soft-gray)] bg-white/90 backdrop-blur-sm',
        'transition-shadow duration-200',
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
