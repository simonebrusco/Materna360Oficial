'use client';

import React from 'react';
import clsx from 'clsx';

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border border-white/60 bg-[#ffd8e6]/60 text-[#ff005e] font-medium text-[12px] leading-[16px] px-3 py-1',
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
