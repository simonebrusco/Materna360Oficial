'use client';
import * as React from 'react';
import type { LucideProps } from 'lucide-react';

export type AppIconProps = LucideProps & {
  /** When true (default), the icon is decorative and must be hidden from AT. */
  decorative?: boolean;
  /** Required when decorative=false */
  label?: string;
};

export function AppIcon({ decorative = true, label, ...rest }: AppIconProps) {
  const ariaProps = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': label ?? 'icon' };
  return <svg {...ariaProps} {...rest} />;
}

export default AppIcon;
