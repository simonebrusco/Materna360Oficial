
'use client';
import * as React from 'react';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export type AppIconName =
  | 'place'
  | 'books'
  | 'star'
  | 'care'
  | 'crown'
  | 'sparkles'
  | 'search'
  | 'filters'
  | 'idea'
  | 'time'
  | 'camera'
  | 'calendar'
  | 'play'
  | 'share'
  | 'download'
  | 'check'
  | 'x'
  | 'edit'
  | 'heart'
  | 'leaf'
  | 'sun'
  | 'moon'
  | 'shieldCheck';

const ICON_MAP: Record<AppIconName, React.ComponentType<LucideProps>> = {
  place: Icons.MapPin,
  books: Icons.BookOpen,
  star: Icons.Star,
  care: Icons.Heart,
  crown: Icons.Crown,
  sparkles: Icons.Sparkles,
  search: Icons.Search,
  filters: Icons.Sliders,
  idea: Icons.Lightbulb,
  time: Icons.Clock,
  camera: Icons.Camera,
  calendar: Icons.Calendar,
  play: Icons.Play,
  share: Icons.Share2,
  download: Icons.Download,
  check: Icons.Check,
  x: Icons.X,
  edit: Icons.Edit,
  heart: Icons.Heart,
  leaf: Icons.Leaf,
  sun: Icons.Sun,
  moon: Icons.Moon,
  shieldCheck: Icons.ShieldCheck,
};

export type AppIconProps = Omit<LucideProps, 'children'> & {
  /** Icon name from the ICON_MAP */
  name?: AppIconName;
  /** Visual variant: 'neutral' (default) or 'brand' */
  variant?: 'neutral' | 'brand';
  /** When true (default), the icon is decorative and must be hidden from AT. */
  decorative?: boolean;
  /** Required when decorative=false */
  label?: string;
};

export function AppIcon({
  name = 'star',
  variant = 'neutral',
  decorative = true,
  label,
  className,
  ...rest
}: AppIconProps) {
  const IconComponent = ICON_MAP[name] || Icons.HelpCircle;
  
  // Determine color based on variant
  const colorClass = variant === 'brand' ? 'text-primary' : 'text-support-2';
  const mergedClassName = `${colorClass} ${className || ''}`.trim();

  const ariaProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': label ?? 'icon' };

  return (
    <IconComponent
      {...ariaProps}
      className={mergedClassName}
      {...rest}
    />
  );
}

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

