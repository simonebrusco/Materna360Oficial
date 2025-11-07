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
    <main
      data-layout="page-template-v1"
      className={clsx(
        'bg-soft-page min-h-[100dvh] pb-24',
        className
      )}
    >
      <div className="mx-auto max-w-[1040px] px-4 md:px-6">
        <header className="pt-6 md:pt-8 mb-4 md:mb-6">
          <PageHeader title={title} subtitle={subtitle} />
          {hero ? <div className="mt-3 md:mt-4">{hero}</div> : null}
        </header>
        <div className="space-y-4 md:space-y-5">{children}</div>
      </div>
    </main>
  );
}
