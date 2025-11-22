'use client';

import * as React from 'react';

export default function AppMark({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  // Simple rounded mark using Materna360 brand colors
  return (
    <div
      className={`rounded-full border border-white/60 bg-[var(--color-soft-strong)] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
