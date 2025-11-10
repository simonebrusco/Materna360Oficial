'use client';

import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function Badge({
  children,
  className,
  variant = 'primary',
  ...rest
}: BadgeProps) {
  const variantStyles = {
    primary: 'inline-flex items-center rounded-full border border-white/60 bg-[#ffd8e6]/60 text-[#ff005e] font-medium text-[12px] leading-[16px] px-3 py-1',
    secondary: 'inline-flex items-center rounded-full border border-[#e9ecf2] bg-[#f8f9fa] text-[#2f3a56] font-medium text-[12px] leading-[16px] px-3 py-1',
    outline: 'inline-flex items-center rounded-full border border-[#ff005e]/30 bg-transparent text-[#ff005e] font-medium text-[12px] leading-[16px] px-3 py-1',
  };

  return (
    <span
      className={clsx(
        'transition-colors duration-200',
        variantStyles[variant],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

export default Badge;
