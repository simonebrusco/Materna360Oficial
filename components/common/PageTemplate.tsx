'use client';

import React from 'react';
import clsx from 'clsx';
import { PageHeader } from '@/components/common/PageHeader';

export interface PageTemplateProps {
  label?: string;
  title: string;
  subtitle?: string;
  hero?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageTemplate({
  label,
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
        'min-h-[100dvh] pb-24',
        'bg-[var(--color-page-bg)]',
        'bg-gradient-to-b from-[var(--color-page-bg)] to-[var(--color-page-bg)]',
        className
      )}
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(253, 190, 215, 0.04) 0%, transparent 15%)',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="mx-auto max-w-[1040px] px-4 md:px-6">
        <header className="pt-6 md:pt-8 mb-4 md:mb-6">
          <PageHeader label={label} title={title} subtitle={subtitle} />
          {hero ? <div className="mt-3 md:mt-4">{hero}</div> : null}
        </header>
        <div className="space-y-4 md:space-y-5">{children}</div>
      </div>
    </main>
  );
}
