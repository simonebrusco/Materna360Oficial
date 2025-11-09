'use client';

import clsx from 'clsx';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <header className={clsx('mb-4 md:mb-6', className)}>
      <h1 className="text-[22px] md:text-[28px] leading-[28px] md:leading-[34px] font-semibold tracking-[-0.01em] text-[var(--color-ink-1)]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-[14px] text-[var(--color-ink-2)] line-clamp-2">
          {subtitle}
        </p>
      )}
    </header>
  );
}
