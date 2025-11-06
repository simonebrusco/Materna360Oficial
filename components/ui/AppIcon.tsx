'use client';

import * as React from 'react';
import type { LucideProps } from 'lucide-react';
import * as Icons from 'lucide-react';

/**
 * Centralized icon map with stable aliases.
 * Color is controlled entirely by parent via className.
 * No variant-based color classes added here.
 */
const ICON_MAP = {
  search: Icons.Search,
  filters: Icons.SlidersHorizontal,
  filter: Icons.SlidersHorizontal,
  time: Icons.Timer,
  idea: Icons.Lightbulb,
  calendar: Icons.Calendar,
  camera: Icons.Camera,
  place: Icons.MapPin,
  home: Icons.Home,
  play: Icons.Play,
  share: Icons.Share2,
  download: Icons.Download,
  check: Icons.Check,
  x: Icons.X,
  books: Icons.BookOpen,
  care: Icons.Heart,
  star: Icons.Star,
  crown: Icons.Crown,
  lock: Icons.Lock,
  chevron: Icons.ChevronRight,
  // fallback helper is HelpCircle
} as const;

type IconName = keyof typeof ICON_MAP;

export type AppIconProps = LucideProps & {
  name: IconName;
  /** When true (default), hide from AT. When false, requires `label`. */
  decorative?: boolean;
  /** Required when decorative=false */
  label?: string;
};

export default function AppIcon({
  name,
  decorative = true,
  label,
  ...rest
}: AppIconProps) {
  const IconComponent = ICON_MAP[name] || Icons.HelpCircle;

  const ariaProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': label ?? 'icon' };

  return <IconComponent {...ariaProps} {...rest} />;
}
