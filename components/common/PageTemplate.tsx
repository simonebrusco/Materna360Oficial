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
        'relative min-h-[100dvh] pb-24 bg-white',
        className
      )}
    >
      {/* Hero gradient global do Materna360 (topo da página, agora contínuo) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(155,77,150,0.32) 0%, rgba(255,0,94,0.26) 26%, rgba(255,216,230,0.22) 60%, rgba(255,232,242,0.10) 82%, rgba(255,232,242,0) 100%)',
        }}
      />

      <div className="mx-auto max-w-3xl px-4 md:px-6 relative z-10">
        <header className="pt-6 md:pt-8 mb-8 md:mb-10">
          <PageHeader label={label} title={title} subtitle={subtitle} />
          {hero ? <div className="mt-4 md:mt-6">{hero}</div> : null}
        </header>

        <div className="space-y-6 md:space-y-8">{children}</div>
      </div>
    </main>
  );
}
