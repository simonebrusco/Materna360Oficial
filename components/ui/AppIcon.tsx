'use client';

import * as React from 'react';
import type { LucideProps } from 'lucide-react';
import * as Icons from 'lucide-react';

/**
 * Centralized icon map with stable aliases.
 * Color is controlled entirely by parent via className or variant.
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
  'check-circle': Icons.CheckCircle,
  x: Icons.X,
  books: Icons.BookOpen,
  'book-open': Icons.BookOpen,
  care: Icons.Heart,
  heart: Icons.Heart,
  star: Icons.Star,
  crown: Icons.Crown,
  lock: Icons.Lock,
  edit: Icons.Edit,
  chevron: Icons.ChevronRight,
  leaf: Icons.Leaf,
  sun: Icons.Sun,
  moon: Icons.Moon,
  sparkles: Icons.Sparkles,
  shieldCheck: Icons.ShieldCheck,
  'alert-circle': Icons.AlertCircle,
  info: Icons.Info,
  footprints: Icons.Footprints,
  'hand-heart': Icons.HandHeart,
  palette: Icons.Palette,
  smile: Icons.Smile,
  meh: Icons.Meh,
  frown: Icons.Frown,
  target: Icons.Target,
} as const;

const DEFAULT_ICON = Icons.Info;

export type AppIconName = keyof typeof ICON_MAP;
export type KnownIconName = keyof typeof ICON_MAP;

/**
 * Variant maps to semantic color classes.
 * 'default' = no color class (inherit parent color)
 * 'brand' = primary color (#ff005e)
 * Others are for future use
 */
export type AppIconVariant = 'default' | 'brand' | 'muted' | 'success' | 'warning' | 'danger';

const VARIANT_CLASS: Record<AppIconVariant, string> = {
  default: '',
  brand: 'text-primary',
  muted: 'text-support-3',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
};

export type AppIconProps = Omit<LucideProps, 'color'> & {
  name: AppIconName;
  /** When true (default), hide from AT. When false, requires `label`. */
  decorative?: boolean;
  /** Required when decorative=false */
  label?: string;
  /** Visual variant for color styling */
  variant?: AppIconVariant;
};

export default function AppIcon({
  name,
  decorative = true,
  label,
  variant = 'default',
  className,
  ...rest
}: AppIconProps) {
  const IconComponent = ICON_MAP[name] || Icons.HelpCircle;
  
  // Merge variant class with any custom className
  const variantClass = VARIANT_CLASS[variant];
  const mergedClassName = variantClass && className ? `${variantClass} ${className}` : (variantClass || className);

  const ariaProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': label ?? 'icon' };

  return <IconComponent {...ariaProps} className={mergedClassName} {...rest} />;
}
