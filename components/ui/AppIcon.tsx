'use client';

import * as React from 'react';
import * as Lucide from 'lucide-react';

type Variant = 'neutral' | 'brand';

export default function AppIcon({
  name,
  size = 20,
  variant = 'neutral',
  strokeWidth = 1.75,
  className,
  ...rest
}: {
  name:
    | 'place' | 'books' | 'star' | 'care' | 'crown'
    | 'sparkles' | 'search';
  size?: number;
  variant?: Variant;
  strokeWidth?: number;
} & React.SVGProps<SVGSVGElement>) {
  const map: Record<string, React.ComponentType<any>> = {
    place: Lucide.Home,
    books: Lucide.BookOpen,
    star: Lucide.Star,
    care: Lucide.Heart,
    crown: Lucide.Crown,
    sparkles: Lucide.Sparkles,
    search: Lucide.Search,
  };
  const Icon = map[name] ?? Lucide.HelpCircle;
  const color = variant === 'brand' ? '#ff005e' : '#2f3a56';
  return (
    <Icon
      width={size}
      height={size}
      stroke={color}
      strokeWidth={strokeWidth}
      aria-hidden
      className={className}
      {...rest}
    />
  );
}
