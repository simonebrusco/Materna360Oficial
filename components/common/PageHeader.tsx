'use client';

import React from 'react';

export interface PageHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
}

export function PageHeader({ label, title, subtitle }: PageHeaderProps) {
  return (
    <div className="space-y-2 md:space-y-3">
      
      {label && (
        <span className="inline-flex items-center rounded-full border border-white/45 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
          {label}
        </span>
      )}

      {/* TITULO – mesmo tamanho do Maternar */}
      <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
        {title}
      </h1>

      {/* SUBTITULO – mesmo estilo das 3 abas */}
      {subtitle && (
        <p className="text-sm md:text-base text-white/85 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
