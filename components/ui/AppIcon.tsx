
'use client';

import * as React from 'react';
import type { LucideProps } from 'lucide-react';
import * as Icons from 'lucide-react';

/**
 * Centralized icon map with stable aliases.
 * Only classes control color (currentColor). No inline colors here.
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
  /** Visual tone hint; parent classes should provide the actual color tokens */
  variant?: 'neutral' | 'brand';
  /** When true (default), hide from AT. When false, requires `label`. */
  decorative?: boolean;
  /** Required when decorative=false */
  label?: string;
};

export default function AppIcon({
  name,
  variant = 'neutral',
  decorative = true,
  label,
  className,
  ...rest
}: AppIconProps) {
  const IconComponent = ICON_MAP[name] || Icons.HelpCircle;
  const variantClass = variant === 'brand' ? 'text-primary' : undefined;
  const mergedClassName = [variantClass, className].filter(Boolean).join(' ');

  const ariaProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': label ?? 'icon' };

  return <IconComponent {...ariaProps} className={mergedClassName} {...rest} />;
}
<<<<<<< HEAD

export default AppIcon;

'use client'

import { forwardRef } from 'react'
import type { SVGProps } from 'react'
import {
  Search, SlidersHorizontal, Timer, Lightbulb, MapPin,
  ToyBrick, BookOpen, Heart, Star, Crown, Lock, ChevronRight
} from 'lucide-react'

const map = {
  search: Search,
  filters: SlidersHorizontal,
  time: Timer,
  idea: Lightbulb,
  place: MapPin,
  play: ToyBrick,
  books: BookOpen,
  care: Heart,
  star: Star,
  crown: Crown,
  lock: Lock,
  chevron: ChevronRight,
} as const

type IconName = keyof typeof map
type Props = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  name: IconName
  size?: number
  variant?: 'neutral' | 'brand'
  'aria-label'?: string
}

export const AppIcon = forwardRef<SVGSVGElement, Props>(function AppIcon(
  { name, size = 20, variant = 'neutral', className, ...rest }, ref
) {
  const Cmp = map[name]
  const color = variant === 'brand' ? '#ff005e' : '#2f3a56'
  return (
    <Cmp
      ref={ref}
      width={size}
      height={size}
      stroke={color}
      strokeWidth={1.75}
      aria-hidden={rest['aria-label'] ? undefined : true}
      className={['inline-block align-middle', className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
})

export default AppIcon

=======
>>>>>>> 0852f54 (Replace AppIcon.tsx with canonical single-export version)
