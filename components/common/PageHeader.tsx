'use client';

import clsx from 'clsx';
import { PageH1 } from './Headings';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <header className={clsx('mb-4 md:mb-6', className)}>
      <PageH1>{title}</PageH1>
      {subtitle && (
        <p className="mt-1 text-[12px] text-[#545454] line-clamp-2">
          {subtitle}
        </p>
      )}
    </header>
  );
}
