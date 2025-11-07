'use client';

import React from 'react';
import clsx from 'clsx';
import { PageHeader } from '@/components/common/PageHeader';

export interface PageTemplateProps {
  title: string;
  subtitle?: string;
  hero?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageTemplate({
  title,
  subtitle,
  hero,
  children,
  className,
}: PageTemplateProps) {
  return (
    <div
      className={clsx(
        'px-4 md:px-6 max-w-[1040px] mx-auto pb-24',
        className
      )}
    >
      <PageHeader title={title} subtitle={subtitle} />
      {hero && <div className="mb-4 md:mb-6">{hero}</div>}
      <div className="mt-4 md:mt-6">{children}</div>
    </div>
  );
}
