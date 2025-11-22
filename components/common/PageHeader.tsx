'use client';

import clsx from 'clsx';
import { PageH1 } from './Headings';

export interface PageHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ label, title, subtitle, className }: PageHeaderProps) {
  return (
    <header className={clsx('mb-4 md:mb-6', className)}>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-brand)] mb-2 font-poppins">
          {label}
        </p>
      )}
      <PageH1>{title}</PageH1>
      {subtitle && (
        <p className="mt-4 md:mt-5 text-base text-[var(--color-text-muted)] font-poppins">
          {subtitle}
        </p>
      )}
    </header>
  );
}
