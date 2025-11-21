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
        className
      )}
    >
      {/* Very subtle hero gradient - only at top, low opacity */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(253, 190, 215, 0.02) 0%, transparent 40%)',
        }}
      />

      <div className="mx-auto max-w-[1040px] px-4 md:px-6 relative z-10">
        <header className="pt-6 md:pt-8 mb-8 md:mb-10">
          <PageHeader label={label} title={title} subtitle={subtitle} />
          {hero ? <div className="mt-4 md:mt-6">{hero}</div> : null}
        </header>
        <div className="space-y-6 md:space-y-8">{children}</div>
      </div>
    </main>
  );
}
