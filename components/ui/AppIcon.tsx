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
  | 'x';

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
    ? { 'aria-hidden': 'true' }
    : { role: 'img', 'aria-label': label ?? 'icon' };

  return (
    <IconComponent
      {...ariaProps}
      className={mergedClassName}
      {...rest}
    />
  );
}

export default AppIcon;
