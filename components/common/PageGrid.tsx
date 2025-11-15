'use client';

import clsx from 'clsx';
import React from 'react';

export interface PageGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3;
  children: React.ReactNode;
}

export function PageGrid({
  cols = 3,
  className,
  children,
  ...rest
}: PageGridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  }[cols];

  return (
    <div
      className={clsx(
        'grid',
        colsClass,
        'gap-4 md:gap-5',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
