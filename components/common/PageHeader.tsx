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
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70 mb-2">
          {label}
        </p>
      )}
      <PageH1>{title}</PageH1>
      {subtitle && (
        <p className="mt-4 md:mt-5 text-sm text-neutral-600">
          {subtitle}
        </p>
      )}
    </header>
  );
}
